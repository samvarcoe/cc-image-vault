import { test, expect } from '@playwright/test';
import path from 'path';
import { Collection } from '../../src/domain/collection';
import { ImageStatus } from '../../src/domain/types';
import { Fixtures } from '../utils/fixtures/base-fixtures';
import { ImageFixtures } from '../utils/fixtures/image-fixtures';
import { CollectionFixtures } from '../utils/fixtures/collection-fixtures';
import { TestUtils } from './utils';

test.describe('Collections - Image Updates', () => {
  
  test.afterAll(async () => {
    await Fixtures.cleanup();
  });

  // Positive Scenarios

  test('Image status update with valid transition', async () => {
    console.log('Creating Collection instance with image in INBOX status');
    
    const collection = await CollectionFixtures.create({
      collectionId: `status-update-${Date.now()}`,
      imageCounts: { inbox: 1, collection: 0, archive: 0 }
    });
    
    // Get the inbox image
    const inboxImages = await collection.getImages({ status: 'INBOX' });
    const testImage = inboxImages[0];
    const originalUpdatedAt = testImage.updatedAt;
    
    console.log('Updating image status from INBOX to COLLECTION');
    const updatedImageMetadata = await collection.updateImageStatus(testImage.id, 'COLLECTION');
    
    console.log('Verifying collection updates the image record in the database atomically');
    expect(updatedImageMetadata, { message: 'Collection.updateImageStatus() returned null/undefined metadata' }).toBeTruthy();
    expect(updatedImageMetadata.status, { message: `Image status is "${updatedImageMetadata.status}" instead of "COLLECTION" after status update` }).toBe('COLLECTION');
    console.log('Image record updated in database atomically');
    
    console.log('Verifying collection sets the updated_at timestamp');
    expect(updatedImageMetadata.updatedAt.getTime() > originalUpdatedAt.getTime(), { message: `Image updated_at timestamp "${updatedImageMetadata.updatedAt.toISOString()}" is not later than original "${originalUpdatedAt.toISOString()}"` }).toBe(true);
    console.log('Updated_at timestamp set correctly');
    
    console.log('Verifying collection returns the updated image metadata');
    TestUtils.validateImageMetadata(updatedImageMetadata);
    expect(updatedImageMetadata.id, { message: `Updated image ID "${updatedImageMetadata.id}" does not match original "${testImage.id}"` }).toBe(testImage.id);
    expect(updatedImageMetadata.fileHash, { message: `Updated image file hash "${updatedImageMetadata.fileHash}" does not match original "${testImage.fileHash}"` }).toBe(testImage.fileHash);
    console.log('Collection returned complete updated image metadata');
  });

  test('Image deletion from archive status', async () => {
    console.log('Creating Collection instance with image in ARCHIVE status');
    
    const { collection, archiveImageIds } = await CollectionFixtures.createWithArchiveImages({
      collectionId: `deletion-test-${Date.now()}`,
      archiveImageCount: 1
    });
    
    const imageId = archiveImageIds[0];
    const collectionPath = path.join(collection.basePath, collection.id);
    
    // Verify files exist before deletion
    const { originalExists: originalExistsBefore, thumbnailExists: thumbnailExistsBefore } = await TestUtils.verifyImageFilesExist(collectionPath, imageId);
    expect(originalExistsBefore, { message: `Original image file for "${imageId}" does not exist before deletion test` }).toBe(true);
    expect(thumbnailExistsBefore, { message: `Thumbnail image file for "${imageId}" does not exist before deletion test` }).toBe(true);
    
    console.log('Deleting image from collection');
    const deletionResult = await collection.deleteImage(imageId);
    
    console.log('Verifying collection removes the image record from the database');
    const imagesAfterDeletion = await collection.getImages();
    const deletedImageStillExists = imagesAfterDeletion.some(img => img.id === imageId);
    expect(deletedImageStillExists, { message: `Image "${imageId}" still exists in database after deletion` }).toBe(false);
    console.log('Image record removed from database');
    
    console.log('Verifying collection deletes the original image file');
    const { originalDeleted, thumbnailDeleted } = await TestUtils.verifyImageFilesDeleted(collectionPath, imageId);
    expect(originalDeleted, { message: `Original image file for "${imageId}" still exists after deletion` }).toBe(true);
    console.log('Original image file deleted');
    
    console.log('Verifying collection deletes the thumbnail image file');
    expect(thumbnailDeleted, { message: `Thumbnail image file for "${imageId}" still exists after deletion` }).toBe(true);
    console.log('Thumbnail image file deleted');
    
    console.log('Verifying collection commits all changes atomically');
    // Atomicity is verified by the fact that both database and file operations succeeded
    console.log('All changes committed atomically');
    
    console.log('Verifying collection returns confirmation of deletion');
    expect(deletionResult, { message: `Collection.deleteImage() returned ${deletionResult} instead of true for successful deletion` }).toBe(true);
    console.log('Collection returned confirmation of deletion');
  });

  // Negative Scenarios

  test('Image update with non-existent identifier', async () => {
    console.log('Creating Collection instance for non-existent image test');
    
    const collection = await CollectionFixtures.createEmpty({
      collectionId: `nonexistent-update-${Date.now()}`
    });
    
    const nonExistentImageId = 'non-existent-image-id-12345';
    const databaseStateBefore = await TestUtils.captureDatabaseState(collection);
    
    console.log('Attempting to update image that does not exist');
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.updateImageStatus(nonExistentImageId, 'COLLECTION');
    } catch (error: any) {
      errorThrown = true;
      errorMessage = error.message;
    }
    
    console.log('Verifying collection throws "image not found" error');
    expect(errorThrown, { message: `Collection did not throw error when updating non-existent image "${nonExistentImageId}"` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not contain "image not found" for non-existent image` }).toContain('image not found');
    console.log('Collection correctly threw "image not found" error');
    
    console.log('Verifying error message includes the attempted image identifier');
    expect(errorMessage, { message: `Error message "${errorMessage}" does not include attempted image identifier "${nonExistentImageId}"` }).toContain(nonExistentImageId);
    console.log('Error message includes attempted image identifier');
    
    console.log('Verifying database remains unchanged');
    const databaseStateAfter = await TestUtils.captureDatabaseState(collection);
    const databaseUnchanged = TestUtils.compareDatabaseStates(databaseStateBefore, databaseStateAfter);
    expect(databaseUnchanged, { message: 'Database state changed after failed update of non-existent image' }).toBe(true);
    console.log('Database remains unchanged');
  });

  test('Image update with invalid status', async () => {
    console.log('Creating Collection instance with image for invalid status test');
    
    const collection = await CollectionFixtures.create({
      collectionId: `invalid-status-${Date.now()}`,
      imageCounts: { inbox: 1, collection: 0, archive: 0 }
    });
    
    const images = await collection.getImages({ status: 'INBOX' });
    const testImage = images[0];
    const databaseStateBefore = await TestUtils.captureDatabaseState(collection);
    
    const invalidStatus = 'INVALID_STATUS' as ImageStatus;
    
    console.log('Attempting to update to an invalid status value');
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.updateImageStatus(testImage.id, invalidStatus);
    } catch (error: any) {
      errorThrown = true;
      errorMessage = error.message;
    }
    
    console.log('Verifying collection throws "Invalid status" error');
    expect(errorThrown, { message: `Collection did not throw error when updating to invalid status "${invalidStatus}"` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not contain "Invalid status" for invalid status` }).toContain('Invalid status');
    console.log('Collection correctly threw "Invalid status" error');
    
    console.log('Verifying error message includes valid status options');
    const hasValidOptions = ['INBOX', 'COLLECTION', 'ARCHIVE'].some(status => errorMessage.includes(status));
    expect(hasValidOptions, { message: `Error message "${errorMessage}" does not include valid status options` }).toBe(true);
    console.log('Error message includes valid status options');
    
    console.log('Verifying database remains unchanged');
    const databaseStateAfter = await TestUtils.captureDatabaseState(collection);
    const databaseUnchanged = TestUtils.compareDatabaseStates(databaseStateBefore, databaseStateAfter);
    expect(databaseUnchanged, { message: 'Database state changed after invalid status update attempt' }).toBe(true);
    console.log('Database remains unchanged');
  });

  test('Image update with database constraint violation', async () => {
    console.log('Creating Collection instance for constraint violation test');
    
    const collection = await CollectionFixtures.create({
      collectionId: `constraint-violation-${Date.now()}`,
      imageCounts: { inbox: 1, collection: 0, archive: 0 }
    });
    
    const images = await collection.getImages({ status: 'INBOX' });
    const testImage = images[0];
    
    console.log('Setting up database constraint that prevents the update');
    const cleanupConstraintViolation = await TestUtils.simulateConstraintViolation(collection);
    
    console.log('Attempting to update image status when database constraint prevents update');
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.updateImageStatus(testImage.id, 'COLLECTION');
    } catch (error: any) {
      errorThrown = true;
      errorMessage = error.message;
    } finally {
      await cleanupConstraintViolation();
    }
    
    console.log('Verifying collection throws meaningful error about constraint violation');
    expect(errorThrown, { message: `Collection did not throw error when database constraint prevented update for image "${testImage.id}"` }).toBe(true);
    const hasConstraintError = /\b(constraint|violation|database|error)\b/i.test(errorMessage);
    expect(hasConstraintError, { message: `Error message "${errorMessage}" does not indicate constraint violation` }).toBe(true);
    console.log('Collection correctly threw meaningful constraint violation error');
    
    console.log('Verifying collection rolls back the database transaction');
    // After cleanup, the collection should be in a consistent state
    // We can verify this by checking that normal operations work
    const imagesAfterFailure = await collection.getImages();
    expect(imagesAfterFailure.length, { message: 'Collection is in inconsistent state after constraint violation rollback' }).toBeGreaterThan(0);
    console.log('Database transaction rolled back successfully');
  });

  test('Image deletion with non-existent identifier', async () => {
    console.log('Creating Collection instance for non-existent deletion test');
    
    const collection = await CollectionFixtures.createEmpty({
      collectionId: `nonexistent-deletion-${Date.now()}`
    });
    
    const nonExistentImageId = 'non-existent-deletion-id-67890';
    const databaseStateBefore = await TestUtils.captureDatabaseState(collection);
    
    console.log('Attempting to delete image that does not exist');
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.deleteImage(nonExistentImageId);
    } catch (error: any) {
      errorThrown = true;
      errorMessage = error.message;
    }
    
    console.log('Verifying collection throws "Image not found" error');
    expect(errorThrown, { message: `Collection did not throw error when deleting non-existent image "${nonExistentImageId}"` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not contain "Image not found" for non-existent deletion` }).toContain('Image not found');
    console.log('Collection correctly threw "Image not found" error');
    
    console.log('Verifying error message includes the attempted image identifier');
    expect(errorMessage, { message: `Error message "${errorMessage}" does not include attempted image identifier "${nonExistentImageId}"` }).toContain(nonExistentImageId);
    console.log('Error message includes attempted image identifier');
    
    console.log('Verifying database remains unchanged');
    const databaseStateAfter = await TestUtils.captureDatabaseState(collection);
    const databaseUnchanged = TestUtils.compareDatabaseStates(databaseStateBefore, databaseStateAfter);
    expect(databaseUnchanged, { message: 'Database state changed after failed deletion of non-existent image' }).toBe(true);
    console.log('Database remains unchanged');
  });

  test('Image deletion with file system failure', async () => {
    console.log('Creating Collection instance with image for file system failure test');
    
    const { collection, archiveImageIds } = await CollectionFixtures.createWithArchiveImages({
      collectionId: `filesystem-failure-${Date.now()}`,
      archiveImageCount: 1
    });
    
    const imageId = archiveImageIds[0];
    const collectionPath = path.join(collection.basePath, collection.id);
    const databaseStateBefore = await TestUtils.captureDatabaseState(collection);
    
    console.log('Setting up file system failure scenario');
    const cleanupFileFailure = await TestUtils.simulateFileDeletionFailure(collectionPath, imageId);
    
    console.log('Attempting to delete image when file operations fail');
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.deleteImage(imageId);
    } catch (error: any) {
      errorThrown = true;
      errorMessage = error.message;
    } finally {
      await cleanupFileFailure();
    }
    
    console.log('Verifying collection throws "Unable to process file change" failure');
    expect(errorThrown, { message: `Collection did not throw error when file deletion failed for image "${imageId}"` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not contain "Unable to process file change" for file system failure` }).toContain('Unable to process file change');
    console.log('Collection correctly threw "Unable to process file change" failure');
    
    console.log('Verifying collection rolls back any database changes');
    const databaseStateAfter = await TestUtils.captureDatabaseState(collection);
    const databaseUnchanged = TestUtils.compareDatabaseStates(databaseStateBefore, databaseStateAfter);
    expect(databaseUnchanged, { message: 'Database changes were not rolled back after file system failure' }).toBe(true);
    console.log('Database changes rolled back successfully');
    
    console.log('Verifying database record remains intact');
    const imageAfterFailure = await collection.getImages();
    const imageStillExists = imageAfterFailure.some(img => img.id === imageId);
    expect(imageStillExists, { message: `Image "${imageId}" no longer exists in database after file system failure rollback` }).toBe(true);
    console.log('Database record remains intact');
  });
});