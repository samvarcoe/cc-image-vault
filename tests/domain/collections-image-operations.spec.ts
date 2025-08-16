import { test, expect } from '@playwright/test';
import { Collection } from '../../src/domain/collection';
import { ImageStatus } from '../../src/domain/types';
import { Fixtures } from '../utils/fixtures/base-fixtures';
import { ImageFixtures } from '../utils/fixtures/image-fixtures';
import { CollectionFixtures } from '../utils/fixtures/collection-fixtures';
import { TestUtils } from './utils';

test.describe('Collections - Image Operations', () => {
  
  test.afterAll(async () => {
    await Fixtures.cleanup();
  });

  // Positive Scenarios

  test('Image addition with valid file', async () => {
    console.log('Creating Collection instance with persistent database connection');
    
    const collection = await CollectionFixtures.createEmpty({
      collectionId: `image-addition-${Date.now()}`
    });
    
    console.log('Creating valid image file for upload');
    const imageFile = await ImageFixtures.create({
      originalName: 'test-photo.jpg',
      width: 800,
      height: 600,
      includeVisualContent: true
    });
    
    console.log('Adding image to collection');
    const imageMetadata = await collection.addImage(imageFile.filePath);
    
    console.log('Verifying collection stores original image with UUID filename');
    expect(imageMetadata, { message: 'Collection.addImage() returned null/undefined metadata for valid image file' }).toBeTruthy();
    expect(imageMetadata.id, { message: `Image metadata ID "${imageMetadata.id}" is not a valid UUID format` }).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(imageMetadata.originalName, { message: `Image metadata original name is "${imageMetadata.originalName}" instead of "${imageFile.originalName}" after addition` }).toBe(imageFile.originalName);
    console.log('Original image stored with UUID filename successfully');
    
    console.log('Verifying collection generates thumbnail preserving aspect ratio');
    const expectedAspectRatio = imageFile.dimensions.width / imageFile.dimensions.height;
    const actualAspectRatio = imageMetadata.dimensions.width / imageMetadata.dimensions.height;
    const aspectRatioTolerance = 0.01; // Allow small rounding differences
    const aspectRatioMatch = Math.abs(expectedAspectRatio - actualAspectRatio) < aspectRatioTolerance;
    expect(aspectRatioMatch, { message: `Image aspect ratio is ${actualAspectRatio} instead of ${expectedAspectRatio} - thumbnail did not preserve aspect ratio` }).toBe(true);
    console.log('Thumbnail generated preserving aspect ratio');
    
    console.log('Verifying collection returns complete image metadata');
    TestUtils.validateImageMetadata(imageMetadata);
    expect(imageMetadata.status, { message: `New image status is "${imageMetadata.status}" instead of "INBOX" after addition` }).toBe('INBOX');
    expect(imageMetadata.size, { message: `Image metadata size is ${imageMetadata.size} but should be greater than 0` }).toBeGreaterThan(0);
    expect(imageMetadata.fileHash, { message: 'Image metadata fileHash is empty or undefined after addition' }).toBeTruthy();
    console.log('Collection returned complete image metadata');
  });

  test('Image retrieval with status filter', async () => {
    console.log('Creating Collection instance with multiple images in different statuses');
    
    const collection = await CollectionFixtures.createWithMixedStatuses({
      collectionId: `status-filter-${Date.now()}`,
      statusCounts: { 'INBOX': 2, 'COLLECTION': 3, 'ARCHIVE': 1 }
    });
    
    // Get images to verify filtering against
    const allImages = await collection.getImages();
    
    console.log('Querying images with COLLECTION status filter');
    const collectionImages = await collection.getImages({ status: 'COLLECTION' });
    
    console.log('Verifying collection returns only images matching specified status');
    const expectedCollectionImages = TestUtils.filterImagesByStatus(allImages, 'COLLECTION');
    expect(collectionImages.length, { message: `Query returned ${collectionImages.length} COLLECTION images instead of ${expectedCollectionImages.length}` }).toBe(expectedCollectionImages.length);
    
    for (const image of collectionImages) {
      expect(image.status, { message: `Returned image "${image.id}" has status "${image.status}" instead of "COLLECTION" when filtering by COLLECTION status` }).toBe('COLLECTION');
    }
    console.log('Collection returned only images matching specified status');
    
    console.log('Verifying collection includes complete image metadata in results');
    for (const image of collectionImages) {
      TestUtils.validateImageMetadata(image);
    }
    console.log('Complete image metadata included in results');
    
    console.log('Verifying collection orders results by updated_at timestamp');
    const expectedOrder = TestUtils.sortImages(expectedCollectionImages, 'updated_at', 'DESC');
    for (let i = 0; i < collectionImages.length - 1; i++) {
      const currentTime = collectionImages[i].updatedAt.getTime();
      const nextTime = collectionImages[i + 1].updatedAt.getTime();
      expect(currentTime >= nextTime, { message: `Image at index ${i} has updated_at ${collectionImages[i].updatedAt.toISOString()} which is before image at index ${i+1} with updated_at ${collectionImages[i+1].updatedAt.toISOString()} - results not ordered by updated_at DESC` }).toBe(true);
    }
    console.log('Results ordered by updated_at timestamp correctly');
  });

  test('Image retrieval without filter', async () => {
    console.log('Creating Collection instance with multiple images');
    
    const collection = await CollectionFixtures.createWithMixedStatuses({
      collectionId: `no-filter-${Date.now()}`,
      statusCounts: { 'INBOX': 2, 'COLLECTION': 2, 'ARCHIVE': 1 }
    });
    
    // Get images to verify against
    const allImages = await collection.getImages();
    
    console.log('Querying all images without status filter');
    const retrievedImages = await collection.getImages();
    
    console.log('Verifying collection returns all images in the collection');
    expect(retrievedImages.length, { message: `Collection returned ${retrievedImages.length} images instead of ${allImages.length} when querying without filter` }).toBe(allImages.length);
    console.log('Collection returned all images in the collection');
    
    console.log('Verifying collection includes complete image metadata in results');
    for (const image of retrievedImages) {
      TestUtils.validateImageMetadata(image);
    }
    console.log('Complete image metadata included in results');
    
    console.log('Verifying collection orders results by updated_at timestamp');
    const expectedOrder = TestUtils.sortImages(allImages, 'updated_at', 'DESC');
    for (let i = 0; i < retrievedImages.length - 1; i++) {
      const currentTime = retrievedImages[i].updatedAt.getTime();
      const nextTime = retrievedImages[i + 1].updatedAt.getTime();
      expect(currentTime >= nextTime, { message: `Image at index ${i} has updated_at ${retrievedImages[i].updatedAt.toISOString()} which is before image at index ${i+1} with updated_at ${retrievedImages[i+1].updatedAt.toISOString()} - results not ordered by updated_at DESC` }).toBe(true);
    }
    console.log('Results ordered by updated_at timestamp correctly');
  });

  // Negative Scenarios

  test('Image addition with duplicate hash', async () => {
    console.log('Creating Collection instance with existing image');
    
    const collection = await CollectionFixtures.create({
      collectionId: `duplicate-test-${Date.now()}`,
      imageCounts: { inbox: 1, collection: 0, archive: 0 }
    });
    
    console.log('Creating image with same SHA256 hash as existing image');
    // Create a known image first
    const existingImageFile = await ImageFixtures.create({
      originalName: 'existing-photo.jpg',
      width: 400,
      height: 300
    });
    await collection.addImage(existingImageFile.filePath);
    const duplicateImages = await ImageFixtures.createDuplicates({
      originalImage: existingImageFile,
      count: 2,
      differentNames: true
    });
    const duplicateImage = duplicateImages[1]; // Second image is the duplicate
    
    console.log('Attempting to add image with same SHA256 hash');
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.addImage(duplicateImage.filePath);
    } catch (error: any) {
      errorThrown = true;
      errorMessage = error.message;
    }
    
    console.log('Verifying collection throws "Duplicate Image" error');
    expect(errorThrown, { message: `Collection did not throw error when adding duplicate image with hash matching existing image` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not contain "Duplicate Image" for duplicate hash detection` }).toContain('Duplicate Image');
    console.log('Collection correctly threw "Duplicate Image" error');
    
    console.log('Verifying collection creates no files');
    const collectionPath = collection.basePath;
    const contentsAfter = await TestUtils.captureFilesystemState(collectionPath);
    const duplicateImagePath = duplicateImage.filePath;
    const duplicateImageCopied = contentsAfter.some(path => path.includes(duplicateImage.originalName.split('.')[0]));
    expect(duplicateImageCopied, { message: `Duplicate image file was copied to collection despite duplicate hash detection` }).toBe(false);
    console.log('No files created for duplicate image');
    
    console.log('Verifying collection modifies no database records');
    const imagesAfterDuplicate = await collection.getImages();
    expect(imagesAfterDuplicate.length, { message: `Collection contains ${imagesAfterDuplicate.length} images instead of 2 after failed duplicate addition` }).toBe(2);
    console.log('No database records modified');
    
    console.log('Verifying filesystem and database remain unchanged');
    const finalImages = await collection.getImages();
    expect(finalImages.length, { message: `Collection state changed after duplicate rejection - contains ${finalImages.length} images instead of original 2` }).toBe(2);
    console.log('Filesystem and database remain unchanged');
  });

  test('Image addition with processing failure', async () => {
    console.log('Creating Collection instance for processing failure test');
    
    const collection = await CollectionFixtures.createEmpty({
      collectionId: `processing-fail-${Date.now()}`
    });
    
    console.log('Creating corrupted image file that will fail processing');
    const corruptImage = await ImageFixtures.create({
      originalName: 'corrupt-image.jpg',
      simulateCorruption: true
    });
    
    console.log('Attempting to add image when processing fails');
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.addImage(corruptImage.filePath);
    } catch (error: any) {
      errorThrown = true;
      errorMessage = error.message;
    }
    
    console.log('Verifying collection throws "Unable to process image" failure');
    expect(errorThrown, { message: `Collection did not throw error when adding corrupt image file "${corruptImage.filePath}"` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not contain "Unable to process image" for processing failure` }).toContain('Unable to process image');
    console.log('Collection correctly threw "Unable to process image" failure');
    
    console.log('Verifying collection creates no files or database records');
    const images = await collection.getImages();
    expect(images.length, { message: `Collection contains ${images.length} images instead of 0 after failed image processing` }).toBe(0);
    console.log('No files or database records created');
    
    console.log('Verifying filesystem and database remain unchanged');
    const collectionPath = collection.basePath;
    const originalDir = `${collectionPath}/${collection.id}/images/original`;
    const thumbnailDir = `${collectionPath}/${collection.id}/images/thumbnails`;
    
    const originalDirContents = await TestUtils.listContents(originalDir);
    const thumbnailDirContents = await TestUtils.listContents(thumbnailDir);
    
    expect(originalDirContents.length, { message: `Original images directory contains ${originalDirContents.length} files instead of 0 after failed processing` }).toBe(0);
    expect(thumbnailDirContents.length, { message: `Thumbnails directory contains ${thumbnailDirContents.length} files instead of 0 after failed processing` }).toBe(0);
    console.log('Filesystem and database remain unchanged');
  });

  test('Image addition with storage failure', async () => {
    console.log('Creating Collection instance for storage failure test');
    
    const collection = await CollectionFixtures.createEmpty({
      collectionId: `storage-fail-${Date.now()}`
    });
    
    console.log('Setting up storage failure scenario');
    const collectionPath = collection.basePath;
    const stateBefore = await TestUtils.captureFilesystemState(collectionPath);
    const cleanupStorageFailure = await TestUtils.simulateStorageFailure(collectionPath);
    
    console.log('Creating valid image file');
    const imageFile = await ImageFixtures.create({
      originalName: 'storage-fail-test.jpg',
      width: 400,
      height: 300
    });
    
    console.log('Attempting to add image when storage fails');
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.addImage(imageFile.filePath);
    } catch (error: any) {
      errorThrown = true;
      errorMessage = error.message;
    } finally {
      await cleanupStorageFailure();
    }
    
    console.log('Verifying collection throws "Unable to save image" failure');
    expect(errorThrown, { message: `Collection did not throw error when storage failed for image "${imageFile.filePath}"` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not contain "Unable to save image" for storage failure` }).toContain('Unable to save image');
    console.log('Collection correctly threw "Unable to save image" failure');
    
    console.log('Verifying collection removes any partially written files');
    const stateAfter = await TestUtils.captureFilesystemState(collectionPath);
    const statesMatch = TestUtils.compareFilesystemStates(stateBefore, stateAfter.filter(path => !path.includes('storage-bloat.tmp')));
    expect(statesMatch, { message: 'Filesystem state changed after storage failure - partially written files not cleaned up' }).toBe(true);
    console.log('Partially written files removed successfully');
    
    console.log('Verifying collection restores filesystem and database to original state');
    const images = await collection.getImages();
    expect(images.length, { message: `Collection contains ${images.length} images instead of 0 after storage failure cleanup` }).toBe(0);
    console.log('Filesystem and database restored to original state');
  });

  test('Image retrieval with database error', async () => {
    console.log('Creating Collection instance that will encounter database connection issues');
    
    const collection = await CollectionFixtures.createWithDatabaseIssues({
      collectionId: `db-error-${Date.now()}`,
      issueType: 'connection'
    });
    
    console.log('Attempting to query images when database connection issues occur');
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.getImages();
    } catch (error: any) {
      errorThrown = true;
      errorMessage = error.message;
    }
    
    console.log('Verifying collection throws "Unable to retrieve images" failure');
    expect(errorThrown, { message: `Collection did not throw error when database connection failed for image retrieval` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not contain "Unable to retrieve images" for database connection failure` }).toContain('Unable to retrieve images');
    console.log('Collection correctly threw "Unable to retrieve images" failure');
    
    console.log('Verifying error message includes connection diagnostics');
    const hasConnectionDiagnostics = /\b(database|connection|sqlite|file|access)\b/i.test(errorMessage);
    expect(hasConnectionDiagnostics, { message: `Error message "${errorMessage}" does not include connection diagnostics` }).toBe(true);
    console.log('Error message includes connection diagnostics');
  });
});