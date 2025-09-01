import { test, expect } from '@playwright/test';
import { CollectionsAPI, ErrorResponse } from '../../utils/collections-api-model';
import { BinaryResponseUtils } from '../../utils/binary-response-utils';
import { Fixtures, CollectionFixtures } from '@/utils';
import { CONFIG } from '@/config';
import { promises as fs } from 'fs';
import path from 'path';

test.describe('Image Serving API Endpoints', { tag: '@sequential' }, () => {
  let api: CollectionsAPI;

  test.beforeAll(async () => {
    await CollectionFixtures.clearDirectory();
    api = new CollectionsAPI(CONFIG.API_BASE_URL);
  });

  test.afterEach(async () => {
    await Fixtures.cleanup();
  });

  test('Original image serving with valid collection and image IDs', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: 'valid-collection',
      imageCounts: { inbox: 0, collection: 1, archive: 0 },
      imageFormats: ['jpeg']
    });

    const images = await collection.getImages();
    const testImage = images[0];
    expect(testImage).toBeDefined();

    const response = await api['/api/images/:collectionId/:imageId'].get({
      pathParams: {
        collectionId: collection.id,
        imageId: testImage!.id
      }
    });

    expect(response.raw.status, {
      message: `Original image serving returned HTTP ${response.raw.status} instead of 200 for image ${testImage!.id} in collection ${collection.id}`
    }).toBe(200);

    expect(response.raw.ok, {
      message: `Original image serving failed (HTTP ${response.raw.status}) for valid image ${testImage!.id} in collection ${collection.id}`
    }).toBe(true);

    const originalPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, collection.id, 'images', 'original', `${testImage!.id}${testImage!.extension}`);
    const responseBuffer = await BinaryResponseUtils.validateImageResponse(response.raw, {
      expectedContentType: testImage!.mimeType,
      expectedContentLength: testImage!.size.toString(),
      expectedCacheControl: 'max-age=31536000',
      shouldMatchSourceFile: originalPath
    });

    // Validate image format using the already-read buffer
    if (responseBuffer) {
      BinaryResponseUtils.validateImageFormatFromBuffer(responseBuffer, 'jpeg', '/api/images/' + collection.id + '/' + testImage!.id);
    }

    console.log(`✓ Original image ${testImage!.id} served successfully with correct headers and content`);
  });

  test('Thumbnail image serving with valid collection and image IDs', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: 'valid-collection-thumb',
      imageCounts: { inbox: 0, collection: 1, archive: 0 },
      imageFormats: ['png']
    });

    const images = await collection.getImages();
    const testImage = images[0];
    expect(testImage).toBeDefined();
    // Note: Thumbnails are created automatically by the domain layer

    const response = await api['/api/images/:collectionId/:imageId/thumbnail'].get({
      pathParams: {
        collectionId: collection.id,
        imageId: testImage!.id
      }
    });

    expect(response.raw.status, {
      message: `Thumbnail serving returned HTTP ${response.raw.status} instead of 200 for image ${testImage!.id} in collection ${collection.id}`
    }).toBe(200);

    expect(response.raw.ok, {
      message: `Thumbnail serving failed (HTTP ${response.raw.status}) for valid image ${testImage!.id} with existing thumbnail`
    }).toBe(true);

    // Construct thumbnail path based on collection structure
    const thumbnailPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, collection.id, 'images', 'thumbnails', `${testImage!.id}.jpg`);
    const thumbnailStats = await fs.stat(thumbnailPath);

    const responseBuffer = await BinaryResponseUtils.validateImageResponse(response.raw, {
      expectedContentType: 'image/jpeg',
      expectedContentLength: thumbnailStats.size.toString(),
      expectedCacheControl: 'max-age=31536000',
      shouldMatchSourceFile: thumbnailPath
    });

    // Validate image format using the already-read buffer
    if (responseBuffer) {
      BinaryResponseUtils.validateImageFormatFromBuffer(responseBuffer, 'webp', '/api/images/' + collection.id + '/' + testImage!.id + '/thumbnail');
    }

    console.log(`✓ Thumbnail for image ${testImage!.id} served successfully as WEBP with correct headers`);
  });

  test('Image serving with non-existent collection', async () => {
    const nonExistentCollectionId = 'non-existent-collection';
    const fakeImageId = 'fake-image-id';

    const response = await api['/api/images/:collectionId/:imageId'].get({
      pathParams: {
        collectionId: nonExistentCollectionId,
        imageId: fakeImageId
      }
    });

    expect(response.raw.status, {
      message: `Image serving returned HTTP ${response.raw.status} instead of 404 for non-existent collection "${nonExistentCollectionId}"`
    }).toBe(404);

    expect(response.raw.ok, {
      message: `Image serving succeeded unexpectedly for non-existent collection "${nonExistentCollectionId}" with image "${fakeImageId}"`
    }).toBe(false);

    if (response.body) {
      const errorBody = response.body as unknown as ErrorResponse;
      expect(errorBody, {
        message: `Error response missing 'error' field for non-existent collection "${nonExistentCollectionId}"`
      }).toHaveProperty('error');
      
      expect(errorBody, {
        message: `Error response missing 'message' field for non-existent collection "${nonExistentCollectionId}"`
      }).toHaveProperty('message');
      
      expect(errorBody.message.toLowerCase(), {
        message: `Error message "${errorBody.message}" does not indicate collection not found for collection "${nonExistentCollectionId}"`
      }).toContain('collection not found');
    }

    console.log(`✓ Non-existent collection "${nonExistentCollectionId}" correctly returns 404 with proper error message`);
  });

  test('Image serving with non-existent image', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: 'valid-collection-no-image',
      imageCounts: { inbox: 0, collection: 1, archive: 0 }
    });

    const nonExistentImageId = 'non-existent-image-id';

    const response = await api['/api/images/:collectionId/:imageId'].get({
      pathParams: {
        collectionId: collection.id,
        imageId: nonExistentImageId
      }
    });

    expect(response.raw.status, {
      message: `Image serving returned HTTP ${response.raw.status} instead of 404 for non-existent image "${nonExistentImageId}" in valid collection "${collection.id}"`
    }).toBe(404);

    expect(response.raw.ok, {
      message: `Image serving succeeded unexpectedly for non-existent image "${nonExistentImageId}" in collection "${collection.id}"`
    }).toBe(false);

    if (response.body) {
      const errorBody = response.body as unknown as ErrorResponse;
      expect(errorBody, {
        message: `Error response missing 'error' field for non-existent image "${nonExistentImageId}" in collection "${collection.id}"`
      }).toHaveProperty('error');
      
      expect(errorBody, {
        message: `Error response missing 'message' field for non-existent image "${nonExistentImageId}" in collection "${collection.id}"`
      }).toHaveProperty('message');
      
      expect(errorBody.message.toLowerCase(), {
        message: `Error message "${errorBody.message}" does not indicate image not found for image "${nonExistentImageId}"`
      }).toContain('image not found');
    }

    console.log(`✓ Non-existent image "${nonExistentImageId}" in valid collection correctly returns 404 with proper error message`);
  });

  test('Thumbnail serving with missing thumbnail file', async () => {
    const collection = await CollectionFixtures.create({
      collectionId: 'missing-thumbnail-collection',
      imageCounts: { inbox: 0, collection: 2, archive: 0 }
    });

    // Get an image and manually remove its thumbnail to simulate missing thumbnail scenario
    const images = await collection.getImages();
    const testImage = images[0]!;
    
    // Remove the thumbnail file to simulate missing thumbnail
    const thumbnailPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, collection.id, 'images', 'thumbnails', `${testImage.id}.jpg`);
    try {
      await fs.unlink(thumbnailPath);
    } catch {
      // Thumbnail might not exist yet, which is what we want
    }

    const response = await api['/api/images/:collectionId/:imageId/thumbnail'].get({
      pathParams: {
        collectionId: collection.id,
        imageId: testImage.id
      }
    });

    expect(response.raw.status, {
      message: `Thumbnail serving returned HTTP ${response.raw.status} instead of 404 for image "${testImage.id}" with missing thumbnail file`
    }).toBe(404);

    expect(response.raw.ok, {
      message: `Thumbnail serving succeeded unexpectedly for image "${testImage.id}" despite missing thumbnail file`
    }).toBe(false);

    if (response.body) {
      const errorBody = response.body as unknown as ErrorResponse;
      expect(errorBody, {
        message: `Error response missing 'error' field for missing thumbnail of image "${testImage.id}"`
      }).toHaveProperty('error');
      
      expect(errorBody, {
        message: `Error response missing 'message' field for missing thumbnail of image "${testImage.id}"`
      }).toHaveProperty('message');
      
      expect(errorBody.message.toLowerCase(), {
        message: `Error message "${errorBody.message}" does not indicate thumbnail not found for image "${testImage.id}"`
      }).toContain('thumbnail not found');
    }

    console.log(`✓ Missing thumbnail for image "${testImage.id}" correctly returns 404 with proper error message`);
  });
});