import { test, expect } from '@playwright/test';
import { Fixtures } from '../../utils/fixtures/base-fixtures';
import { ImageFixtures } from '../../utils/fixtures/image-fixtures';
import { CollectionFixtures } from '../../utils/fixtures/collection-fixtures';
import { TestUtils } from '../utils';
import fs from 'fs/promises';

test.describe('Collections - Image Operations', () => {
  
  test.afterAll(async () => {
    await Fixtures.cleanup();
  });

  // Positive Scenarios

  test('Image addition with valid file', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: `image-addition-${Date.now()}`
    });
    
    const imageFile = await ImageFixtures.create({
      originalName: 'test-photo',
      width: 800,
      height: 600,
      includeVisualContent: true
    });
    
    const imageMetadata = await collection.addImage(imageFile.filePath);
    
    expect(imageMetadata, { message: `Collection returned null metadata instead of valid image metadata for file "${imageFile.originalName}"` }).toBeTruthy();
    expect(imageMetadata.id, { message: `Image metadata contains ID "${imageMetadata.id}" which is not a valid UUID format` }).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(imageMetadata.originalName, { message: `Image metadata contains original name "${imageMetadata.originalName}" instead of expected "${imageFile.originalName}"` }).toBe(imageFile.originalName);
    console.log(`✓ Image ${imageMetadata.id} stored with UUID filename and correct original name`);
    
    const expectedAspectRatio = imageFile.dimensions.width / imageFile.dimensions.height;
    const actualAspectRatio = imageMetadata.dimensions.width / imageMetadata.dimensions.height;
    const aspectRatioTolerance = 0.01; // Allow small rounding differences
    const aspectRatioMatch = Math.abs(expectedAspectRatio - actualAspectRatio) < aspectRatioTolerance;
    expect(aspectRatioMatch, { message: `Image ${imageMetadata.id} has aspect ratio ${actualAspectRatio} instead of preserving original aspect ratio ${expectedAspectRatio}` }).toBe(true);
    console.log(`✓ Image ${imageMetadata.id} thumbnail preserves aspect ratio`);
    
    TestUtils.shouldHaveValidMetadata(imageMetadata);
    expect(imageMetadata.status, { message: `Image ${imageMetadata.id} has status "${imageMetadata.status}" instead of "INBOX" upon addition` }).toBe('INBOX');
    expect(imageMetadata.size, { message: `Image ${imageMetadata.id} has size ${imageMetadata.size} bytes which is not greater than 0` }).toBeGreaterThan(0);
    expect(imageMetadata.fileHash, { message: `Image ${imageMetadata.id} has empty fileHash after processing` }).toBeTruthy();
    console.log(`✓ Image ${imageMetadata.id} added with complete metadata and INBOX status`);
  });

  test('Image retrieval with status filter', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: `status-filter-${Date.now()}`,
      imageCounts: { 'inbox': 2, 'collection': 3, 'archive': 1 }
    });
    
    // Get images to verify filtering against
    const allImages = await collection.getImages();
    
    const collectionImages = await collection.getImages({ status: 'COLLECTION' });
    
    const expectedCollectionImages = TestUtils.filterImagesByStatus(allImages, 'COLLECTION');
    expect(collectionImages.length, { message: `Status filter query returned ${collectionImages.length} images instead of expected ${expectedCollectionImages.length} COLLECTION status images` }).toBe(expectedCollectionImages.length);
    
    for (const image of collectionImages) {
      expect(image.status, { message: `Image ${image.id} has status "${image.status}" instead of "COLLECTION" in COLLECTION status filtered results` }).toBe('COLLECTION');
    }
    console.log(`✓ Status filter returned ${collectionImages.length} images with COLLECTION status only`);
    
    for (const image of collectionImages) {
      TestUtils.shouldHaveValidMetadata(image);
    }
    console.log(`✓ All ${collectionImages.length} filtered images have complete metadata`);
    
    // Expected order for comparison
    TestUtils.sortImages(expectedCollectionImages, 'updated_at', 'DESC');
    for (let i = 0; i < collectionImages.length - 1; i++) {
      const current = collectionImages[i];
      const next = collectionImages[i + 1];
      if (!current || !next) continue;
      
      const currentTime = current.updatedAt.getTime();
      const nextTime = next.updatedAt.getTime();
      expect(currentTime >= nextTime, { message: `Image ${current.id} at position ${i} has updated_at ${current.updatedAt.toISOString()} which is earlier than image ${next.id} at position ${i+1} with updated_at ${next.updatedAt.toISOString()}` }).toBe(true);
    }
    console.log(`✓ ${collectionImages.length} filtered images ordered by updated_at DESC`);
  });

  test('Image retrieval without filter', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: `no-filter-${Date.now()}`,
      imageCounts: { 'inbox': 2, 'collection': 2, 'archive': 1 }
    });
    
    // Get images to verify against
    const allImages = await collection.getImages();
    
    const retrievedImages = await collection.getImages();
    
    expect(retrievedImages.length, { message: `Unfiltered query returned ${retrievedImages.length} images instead of all ${allImages.length} images in collection` }).toBe(allImages.length);
    console.log(`✓ Unfiltered query returned all ${retrievedImages.length} images in collection`);
    
    for (const image of retrievedImages) {
      TestUtils.shouldHaveValidMetadata(image);
    }
    console.log(`✓ All ${retrievedImages.length} unfiltered images have complete metadata`);
    
    // Expected order for comparison
    TestUtils.sortImages(allImages, 'updated_at', 'DESC');
    for (let i = 0; i < retrievedImages.length - 1; i++) {
      const current = retrievedImages[i];
      const next = retrievedImages[i + 1];
      if (!current || !next) continue;
      
      const currentTime = current.updatedAt.getTime();
      const nextTime = next.updatedAt.getTime();
      expect(currentTime >= nextTime, { message: `Image ${current.id} at position ${i} has updated_at ${current.updatedAt.toISOString()} which is earlier than image ${next.id} at position ${i+1} with updated_at ${next.updatedAt.toISOString()}` }).toBe(true);
    }
    console.log(`✓ ${retrievedImages.length} unfiltered images ordered by updated_at DESC`);
  });

  // Negative Scenarios

  test('Image addition with duplicate hash', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: `duplicate-test-${Date.now()}`,
      imageCounts: { inbox: 1, collection: 0, archive: 0 }
    });
    
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
    
    if (!duplicateImage) {
      throw new Error('Failed to create duplicate image for testing');
    }
    
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.addImage(duplicateImage.filePath);
    } catch (error: unknown) {
      errorThrown = true;
      errorMessage = (error as Error).message;
    }
    
    expect(errorThrown, { message: `Collection did not reject duplicate image "${duplicateImage.originalName}" with matching hash` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not indicate "Duplicate Image" for hash collision` }).toContain('Duplicate Image');
    console.log(`✓ Collection rejected duplicate image "${duplicateImage.originalName}" with appropriate error`);
    
    const collectionPath = collection.basePath;
    const contentsAfter = await TestUtils.captureFilesystemState(collectionPath);
    // Reference to duplicate image path for context - ensuring we have access to the path
    void duplicateImage.filePath;
    const imageBaseName = duplicateImage.originalName.split('.')[0];
    const duplicateImageCopied = imageBaseName ? contentsAfter.some(path => path.includes(imageBaseName)) : false;
    expect(duplicateImageCopied, { message: `Duplicate image "${duplicateImage.originalName}" was copied to collection filesystem despite hash collision detection` }).toBe(false);
    console.log(`✓ No files created for rejected duplicate image "${duplicateImage.originalName}"`);
    
    const imagesAfterDuplicate = await collection.getImages();
    expect(imagesAfterDuplicate.length, { message: `Collection contains ${imagesAfterDuplicate.length} images instead of expected 2 after duplicate rejection` }).toBe(2);
    console.log(`✓ Collection database unchanged after duplicate rejection - contains ${imagesAfterDuplicate.length} images`);
    
    const finalImages = await collection.getImages();
    expect(finalImages.length, { message: `Collection image count is ${finalImages.length} instead of original 2 after duplicate handling` }).toBe(2);
    console.log(`✓ Collection state preserved after duplicate image rejection`);
  });

  test('Image addition with processing failure', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: `processing-fail-${Date.now()}`
    });
    
    const corruptImage = await ImageFixtures.create({
      originalName: 'corrupt-image.jpg',
      simulateCorruption: true
    });
    
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.addImage(corruptImage.filePath);
    } catch (error: unknown) {
      errorThrown = true;
      errorMessage = (error as Error).message;
    }
    
    expect(errorThrown, { message: `Collection did not reject corrupt image file "${corruptImage.originalName}" during processing` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not indicate "Unable to process image" for corrupt file handling` }).toContain('Unable to process image');
    console.log(`✓ Collection rejected corrupt image "${corruptImage.originalName}" with processing error`);
    
    const images = await collection.getImages();
    expect(images.length, { message: `Collection database contains ${images.length} images instead of 0 after failed corrupt image processing` }).toBe(0);
    console.log(`✓ No database records created for failed corrupt image processing`);
    
    const collectionPath = collection.basePath;
    const originalDir = `${collectionPath}/${collection.id}/images/original`;
    const thumbnailDir = `${collectionPath}/${collection.id}/images/thumbnails`;
    
    const originalDirContents = await TestUtils.listContents(originalDir);
    const thumbnailDirContents = await TestUtils.listContents(thumbnailDir);
    
    expect(originalDirContents.length, { message: `Original images directory contains ${originalDirContents.length} files instead of 0 after corrupt image processing failure` }).toBe(0);
    expect(thumbnailDirContents.length, { message: `Thumbnails directory contains ${thumbnailDirContents.length} files instead of 0 after corrupt image processing failure` }).toBe(0);
    console.log(`✓ Collection filesystem clean after corrupt image processing failure`);
  });

  test('Image addition with storage failure', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: `storage-fail-${Date.now()}`,
      useTmpDir: true
    });
    
    const collectionPath = collection.basePath;
    const stateBefore = await TestUtils.captureFilesystemState(collectionPath);
    const cleanupStorageFailure = await TestUtils.simulateStorageFailure(collectionPath);
    
    const imageFile = await ImageFixtures.create({
      originalName: 'storage-fail-test.jpg',
      width: 400,
      height: 300
    });
    
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.addImage(imageFile.filePath);
    } catch (error: unknown) {
      errorThrown = true;
      errorMessage = (error as Error).message;
    } finally {
      await cleanupStorageFailure();
    }
    
    expect(errorThrown, { message: `Collection did not handle storage failure for image "${imageFile.originalName}" when filesystem is blocked` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not indicate "Unable to save image" for storage operation failure` }).toContain('Unable to save image');
    console.log(`✓ Collection rejected image "${imageFile.originalName}" due to storage failure`);
    
    const stateAfter = await TestUtils.captureFilesystemState(collectionPath);
    const statesMatch = TestUtils.compareFilesystemStates(stateBefore, stateAfter.filter(path => !path.includes('storage-bloat.tmp')));
    expect(statesMatch, { message: `Filesystem contains partial files after storage failure for image "${imageFile.originalName}" - cleanup incomplete` }).toBe(true);
    console.log(`✓ Collection filesystem restored after storage failure cleanup`);
    
    const images = await collection.getImages();
    expect(images.length, { message: `Collection database contains ${images.length} images instead of 0 after storage failure rollback` }).toBe(0);
    console.log(`✓ Collection database clean after storage failure rollback`);
  });

  test('Image retrieval with database error', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: `db-error-${Date.now()}`,
    });

    // Simulate database connection failure by corrupting the database file
    const databasePath = `${collection.basePath}/${collection.id}/collection.db`;
    await fs.writeFile(databasePath, 'CORRUPTED_DATABASE_DATA');
    
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await collection.getImages();
    } catch (error: unknown) {
      errorThrown = true;
      errorMessage = (error as Error).message;
    }
    
    expect(errorThrown, { message: `Collection did not handle database connection failure during image retrieval operation` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not indicate "Unable to retrieve images" for database access failure` }).toContain('Unable to retrieve images');
    console.log(`✓ Collection reported database connection failure for image retrieval`);
    
    const hasConnectionDiagnostics = /\b(database|connection|sqlite|file|access)\b/i.test(errorMessage);
    expect(hasConnectionDiagnostics, { message: `Error message "${errorMessage}" lacks database connection diagnostic information` }).toBe(true);
    console.log(`✓ Database error message includes connection diagnostics`);
  });
});