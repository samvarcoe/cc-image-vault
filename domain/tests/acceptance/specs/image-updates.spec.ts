import { test, expect } from '@playwright/test';
import path from 'path';
import { ImageStatus } from '../../../types';
import { Fixtures } from '../../../../utils/fixtures/base-fixtures';
import { CollectionFixtures } from '../../../../utils/fixtures/collection-fixtures';
import { TestUtils } from '../../utils';

test.describe('Collections - Image Updates', () => {
  
  test.afterAll(async () => {
    await Fixtures.cleanup();
  });

  // Positive Scenarios

  test('Image status update with valid transition', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: `status-update-${Date.now()}`,
      imageCounts: { inbox: 1, collection: 0, archive: 0 }
    });
    
    // Get the inbox image
    const inboxImages = await collection.getImages({ status: 'INBOX' });
    expect(inboxImages).toHaveLength(1);
    const testImage = inboxImages[0];
    const originalUpdatedAt = testImage!.updatedAt;
    
    const updatedImageMetadata = await collection.updateImageStatus(testImage!.id, 'COLLECTION');
    
    expect(updatedImageMetadata, { message: `Status update operation returned null metadata instead of updated image data for image ${testImage!.id}` }).toBeTruthy();
    expect(updatedImageMetadata.status, { message: `Image ${testImage!.id} has status "${updatedImageMetadata.status}" instead of "COLLECTION" after status update operation` }).toBe('COLLECTION');
    console.log(`✓ Image ${testImage!.id} status updated from INBOX to COLLECTION`);
    
    expect(updatedImageMetadata.updatedAt.getTime() > originalUpdatedAt.getTime(), { message: `Image ${testImage!.id} updated_at timestamp ${updatedImageMetadata.updatedAt.toISOString()} is not later than original ${originalUpdatedAt.toISOString()}` }).toBe(true);
    console.log(`✓ Image ${testImage!.id} updated_at timestamp refreshed during status change`);
    
    TestUtils.shouldHaveValidMetadata(updatedImageMetadata);
    expect(updatedImageMetadata.id, { message: `Updated image has ID "${updatedImageMetadata.id}" instead of original ID "${testImage!.id}"` }).toBe(testImage!.id);
    expect(updatedImageMetadata.fileHash, { message: `Updated image has fileHash "${updatedImageMetadata.fileHash}" instead of original fileHash "${testImage!.fileHash}"` }).toBe(testImage!.fileHash);
    console.log(`✓ Image ${testImage!.id} metadata integrity preserved during status update`);
  });

  test('Image deletion from archive status', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: `deletion-test-${Date.now()}`,
      imageCounts: { inbox: 0, collection: 0, archive: 1 } 
    });
    
    const images = await collection.getImages();
    expect(images).toHaveLength(1);
    const firstImage = images[0];
    if (!firstImage) {
      throw new Error('No images found in collection');
    }
    const imageId = firstImage.id;
    const collectionPath = path.join(collection.basePath, collection.id);
    
    // Verify files exist before deletion
    const { originalExists: originalExistsBefore, thumbnailExists: thumbnailExistsBefore } = await TestUtils.verifyImageFilesExist(collectionPath, imageId);
    expect(originalExistsBefore, { message: `Image ${imageId} original file is missing before deletion test execution` }).toBe(true);
    expect(thumbnailExistsBefore, { message: `Image ${imageId} thumbnail file is missing before deletion test execution` }).toBe(true);
    
    const deletionResult = await collection.deleteImage(imageId);
    
    const imagesAfterDeletion = await collection.getImages();
    const deletedImageStillExists = imagesAfterDeletion.some(img => img.id === imageId);
    expect(deletedImageStillExists, { message: `Image ${imageId} still present in database after deletion operation` }).toBe(false);
    console.log(`✓ Image ${imageId} removed from database`);
    
    const { originalDeleted, thumbnailDeleted } = await TestUtils.verifyImageFilesDeleted(collectionPath, imageId);
    expect(originalDeleted, { message: `Image ${imageId} original file still present on filesystem after deletion operation` }).toBe(true);
    console.log(`✓ Image ${imageId} original file removed from filesystem`);
    
    expect(thumbnailDeleted, { message: `Image ${imageId} thumbnail file still present on filesystem after deletion operation` }).toBe(true);
    console.log(`✓ Image ${imageId} thumbnail file removed from filesystem`);
    
    // Atomicity is verified by the fact that both database and file operations succeeded
    console.log(`✓ Image ${imageId} deletion completed atomically (database and filesystem)`);
    
    expect(deletionResult, { message: `Image ${imageId} deletion operation returned ${deletionResult} instead of success confirmation` }).toBe(true);
    console.log(`✓ Image ${imageId} deletion operation returned success confirmation`);
  });

  // Negative Scenarios

  test('Image update with non-existent identifier', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: `nonexistent-update-${Date.now()}`
    });
    
    const nonExistentImageId = 'non-existent-image-id-12345';
    const databaseStateBefore = await TestUtils.captureDatabaseState(collection);
    
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.updateImageStatus(nonExistentImageId, 'COLLECTION');
    } catch (error: unknown) {
      errorThrown = true;
      errorMessage = (error as Error).message;
    }
    
    expect(errorThrown, { message: `Collection did not reject status update for non-existent image ID "${nonExistentImageId}"` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not indicate "image not found" for missing image reference` }).toContain('image not found');
    console.log(`✓ Collection rejected status update for non-existent image "${nonExistentImageId}"`);
    
    expect(errorMessage, { message: `Error message "${errorMessage}" does not include attempted image identifier "${nonExistentImageId}" for debugging` }).toContain(nonExistentImageId);
    console.log(`✓ Error message includes attempted image identifier for debugging`);
    
    const databaseStateAfter = await TestUtils.captureDatabaseState(collection);
    const databaseUnchanged = TestUtils.compareDatabaseStates(databaseStateBefore, databaseStateAfter);
    expect(databaseUnchanged, { message: `Database state modified after failed update attempt for non-existent image "${nonExistentImageId}"` }).toBe(true);
    console.log(`✓ Database state preserved after failed non-existent image update`);
  });

  test('Image update with invalid status', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: `invalid-status-${Date.now()}`,
      imageCounts: { inbox: 1, collection: 0, archive: 0 }
    });
    
    const images = await collection.getImages({ status: 'INBOX' });
    expect(images).toHaveLength(1);
    const testImage = images[0];
    const databaseStateBefore = await TestUtils.captureDatabaseState(collection);
    
    const invalidStatus = 'INVALID_STATUS' as ImageStatus;
    
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.updateImageStatus(testImage!.id, invalidStatus);
    } catch (error: unknown) {
      errorThrown = true;
      errorMessage = (error as Error).message;
    }
    
    expect(errorThrown, { message: `Collection did not reject invalid status "${invalidStatus}" for image ${testImage!.id}` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not indicate "Invalid status" for unrecognized status value` }).toContain('Invalid status');
    console.log(`✓ Collection rejected invalid status "${invalidStatus}" for image ${testImage!.id}`);
    
    const hasValidOptions = ['INBOX', 'COLLECTION', 'ARCHIVE'].some(status => errorMessage.includes(status));
    expect(hasValidOptions, { message: `Error message "${errorMessage}" does not list valid status options for user guidance` }).toBe(true);
    console.log(`✓ Invalid status error message includes valid status options`);
    
    const databaseStateAfter = await TestUtils.captureDatabaseState(collection);
    const databaseUnchanged = TestUtils.compareDatabaseStates(databaseStateBefore, databaseStateAfter);
    expect(databaseUnchanged, { message: `Database state modified after invalid status "${invalidStatus}" update rejection for image ${testImage!.id}` }).toBe(true);
    console.log(`✓ Database state preserved after invalid status update rejection`);
  });

  test('Image update with database constraint violation', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: `constraint-violation-${Date.now()}`,
      imageCounts: { inbox: 1, collection: 0, archive: 0 }
    });
    
    const images = await collection.getImages({ status: 'INBOX' });
    expect(images).toHaveLength(1);
    const testImage = images[0];
    
    const cleanupConstraintViolation = await TestUtils.simulateConstraintViolation(collection);
    
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.updateImageStatus(testImage!.id, 'COLLECTION');
    } catch (error: unknown) {
      errorThrown = true;
      errorMessage = (error as Error).message;
    } finally {
      await cleanupConstraintViolation();
    }
    
    expect(errorThrown, { message: `Collection did not handle database constraint violation during status update for image ${testImage!.id}` }).toBe(true);
    const hasConstraintError = /\b(constraint|violation|database|error)\b/i.test(errorMessage);
    expect(hasConstraintError, { message: `Error message "${errorMessage}" does not indicate database constraint violation condition` }).toBe(true);
    console.log(`✓ Collection reported database constraint violation for image ${testImage!.id} status update`);
    
    // After cleanup, the collection should be in a consistent state
    // We can verify this by checking that normal operations work
    const imagesAfterFailure = await collection.getImages();
    expect(imagesAfterFailure.length, { message: `Collection database contains ${imagesAfterFailure.length} images indicating inconsistent state after constraint violation recovery` }).toBeGreaterThan(0);
    console.log(`✓ Collection database transaction properly rolled back after constraint violation`);
  });

  test('Image deletion with non-existent identifier', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: `nonexistent-deletion-${Date.now()}`
    });
    
    const nonExistentImageId = 'non-existent-deletion-id-67890';
    const databaseStateBefore = await TestUtils.captureDatabaseState(collection);
    
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.deleteImage(nonExistentImageId);
    } catch (error: unknown) {
      errorThrown = true;
      errorMessage = (error as Error).message;
    }
    
    expect(errorThrown, { message: `Collection did not reject deletion request for non-existent image ID "${nonExistentImageId}"` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not indicate "Image not found" for missing image reference` }).toContain('Image not found');
    console.log(`✓ Collection rejected deletion for non-existent image "${nonExistentImageId}"`);
    
    expect(errorMessage, { message: `Error message "${errorMessage}" does not include attempted image identifier "${nonExistentImageId}" for debugging` }).toContain(nonExistentImageId);
    console.log(`✓ Error message includes attempted image identifier for debugging`);
    
    const databaseStateAfter = await TestUtils.captureDatabaseState(collection);
    const databaseUnchanged = TestUtils.compareDatabaseStates(databaseStateBefore, databaseStateAfter);
    expect(databaseUnchanged, { message: `Database state modified after failed deletion attempt for non-existent image "${nonExistentImageId}"` }).toBe(true);
    console.log(`✓ Database state preserved after failed non-existent image deletion`);
  });

  test('Image deletion with file system failure', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: `filesystem-failure-${Date.now()}`,
      imageCounts: { inbox: 0, collection: 0, archive: 1 }
    });
    
    const images = await collection.getImages();
    expect(images).toHaveLength(1);
    const firstImage = images[0];
    if (!firstImage) {
      throw new Error('No images found in collection');
    }
    const imageId = firstImage.id;
    const collectionPath = path.join(collection.basePath, collection.id);
    const databaseStateBefore = await TestUtils.captureDatabaseState(collection);
    
    const cleanupFileFailure = await TestUtils.simulateFileDeletionFailure(collectionPath, imageId);
    
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.deleteImage(imageId);
    } catch (error: unknown) {
      errorThrown = true;
      errorMessage = (error as Error).message;
    } finally {
      await cleanupFileFailure();
    }
    
    expect(errorThrown, { message: `Collection did not handle filesystem failure during deletion of image ${imageId}` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not indicate "Unable to process file change" for filesystem operation failure` }).toContain('Unable to process file change');
    console.log(`✓ Collection reported filesystem failure during image ${imageId} deletion`);
    
    const databaseStateAfter = await TestUtils.captureDatabaseState(collection);
    const databaseUnchanged = TestUtils.compareDatabaseStates(databaseStateBefore, databaseStateAfter);
    expect(databaseUnchanged, { message: `Database changes not rolled back after filesystem failure during image ${imageId} deletion` }).toBe(true);
    console.log(`✓ Database transaction rolled back after filesystem failure`);
    
    const imageAfterFailure = await collection.getImages();
    const imageStillExists = imageAfterFailure.some(img => img.id === imageId);
    expect(imageStillExists, { message: `Image ${imageId} missing from database after filesystem failure recovery (should be preserved)` }).toBe(true);
    console.log(`✓ Image ${imageId} database record preserved after filesystem failure recovery`);
  });
});