import { test, expect } from '@playwright/test';
import { CollectionsAPI, ErrorResponse } from '../../utils/collections-api-model';
import { ImageServingFixtures } from '../../utils/image-serving-fixtures';
import { BinaryResponseUtils } from '../../utils/binary-response-utils';
import { Fixtures, CollectionFixtures } from '@/utils';
import { CONFIG } from '@/config';

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
    const collection = await ImageServingFixtures.create({
      collectionId: 'valid-collection',
      imageCount: 1,
      includeAllThumbnails: true,
      imageFormats: ['jpeg']
    });

    const testImage = collection.images[0];
    expect(testImage).toBeDefined();

    const response = await api['/api/images/:collectionId/:imageId'].get({
      pathParams: {
        collectionId: collection.collectionId,
        imageId: testImage!.id
      }
    });

    expect(response.raw.status, {
      message: `Original image serving returned HTTP ${response.raw.status} instead of 200 for image ${testImage!.id} in collection ${collection.collectionId}`
    }).toBe(200);

    expect(response.raw.ok, {
      message: `Original image serving failed (HTTP ${response.raw.status}) for valid image ${testImage!.id} in collection ${collection.collectionId}`
    }).toBe(true);

    const responseBuffer = await BinaryResponseUtils.validateImageResponse(response.raw, {
      expectedContentType: testImage!.metadata.mimeType,
      expectedContentLength: testImage!.metadata.size.toString(),
      expectedCacheControl: 'max-age=31536000',
      shouldMatchSourceFile: testImage!.originalPath
    });

    // Validate image format using the already-read buffer
    if (responseBuffer) {
      BinaryResponseUtils.validateImageFormatFromBuffer(responseBuffer, 'jpeg', '/api/images/' + collection.collectionId + '/' + testImage!.id);
    }

    console.log(`✓ Original image ${testImage!.id} served successfully with correct headers and content`);
  });

  test('Thumbnail image serving with valid collection and image IDs', async () => {
    const collection = await ImageServingFixtures.create({
      collectionId: 'valid-collection-thumb',
      imageCount: 1,
      includeAllThumbnails: true,
      imageFormats: ['png']
    });

    const testImage = collection.images[0];
    expect(testImage).toBeDefined();
    expect(testImage!.thumbnailPath, {
      message: `Test image ${testImage!.id} missing thumbnail file during fixture setup`
    }).toBeDefined();

    const response = await api['/api/images/:collectionId/:imageId/thumbnail'].get({
      pathParams: {
        collectionId: collection.collectionId,
        imageId: testImage!.id
      }
    });

    expect(response.raw.status, {
      message: `Thumbnail serving returned HTTP ${response.raw.status} instead of 200 for image ${testImage!.id} in collection ${collection.collectionId}`
    }).toBe(200);

    expect(response.raw.ok, {
      message: `Thumbnail serving failed (HTTP ${response.raw.status}) for valid image ${testImage!.id} with existing thumbnail`
    }).toBe(true);

    const thumbnailStats = await ImageServingFixtures.getImageStats(testImage!.thumbnailPath!);

    const responseBuffer = await BinaryResponseUtils.validateImageResponse(response.raw, {
      expectedContentType: 'image/jpeg',
      expectedContentLength: thumbnailStats.size.toString(),
      expectedCacheControl: 'max-age=31536000',
      shouldMatchSourceFile: testImage!.thumbnailPath!
    });

    // Validate image format using the already-read buffer
    if (responseBuffer) {
      BinaryResponseUtils.validateImageFormatFromBuffer(responseBuffer, 'webp', '/api/images/' + collection.collectionId + '/' + testImage!.id + '/thumbnail');
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
    const collection = await ImageServingFixtures.create({
      collectionId: 'valid-collection-no-image',
      imageCount: 1,
      includeAllThumbnails: true
    });

    const nonExistentImageId = 'non-existent-image-id';

    const response = await api['/api/images/:collectionId/:imageId'].get({
      pathParams: {
        collectionId: collection.collectionId,
        imageId: nonExistentImageId
      }
    });

    expect(response.raw.status, {
      message: `Image serving returned HTTP ${response.raw.status} instead of 404 for non-existent image "${nonExistentImageId}" in valid collection "${collection.collectionId}"`
    }).toBe(404);

    expect(response.raw.ok, {
      message: `Image serving succeeded unexpectedly for non-existent image "${nonExistentImageId}" in collection "${collection.collectionId}"`
    }).toBe(false);

    if (response.body) {
      const errorBody = response.body as unknown as ErrorResponse;
      expect(errorBody, {
        message: `Error response missing 'error' field for non-existent image "${nonExistentImageId}" in collection "${collection.collectionId}"`
      }).toHaveProperty('error');
      
      expect(errorBody, {
        message: `Error response missing 'message' field for non-existent image "${nonExistentImageId}" in collection "${collection.collectionId}"`
      }).toHaveProperty('message');
      
      expect(errorBody.message.toLowerCase(), {
        message: `Error message "${errorBody.message}" does not indicate image not found for image "${nonExistentImageId}"`
      }).toContain('image not found');
    }

    console.log(`✓ Non-existent image "${nonExistentImageId}" in valid collection correctly returns 404 with proper error message`);
  });

  test('Thumbnail serving with missing thumbnail file', async () => {
    const collection = await ImageServingFixtures.createWithMissingThumbnails({
      collectionId: 'missing-thumbnail-collection',
      imageCount: 2,
      missingThumbnailCount: 1
    });

    // Find an image without a thumbnail
    const imageWithoutThumbnail = collection.images.find(img => !img.thumbnailPath);
    expect(imageWithoutThumbnail, {
      message: `Fixture creation failed - no images found without thumbnails in collection "${collection.collectionId}"`
    }).toBeDefined();

    const response = await api['/api/images/:collectionId/:imageId/thumbnail'].get({
      pathParams: {
        collectionId: collection.collectionId,
        imageId: imageWithoutThumbnail!.id
      }
    });

    expect(response.raw.status, {
      message: `Thumbnail serving returned HTTP ${response.raw.status} instead of 404 for image "${imageWithoutThumbnail!.id}" with missing thumbnail file`
    }).toBe(404);

    expect(response.raw.ok, {
      message: `Thumbnail serving succeeded unexpectedly for image "${imageWithoutThumbnail!.id}" despite missing thumbnail file`
    }).toBe(false);

    if (response.body) {
      const errorBody = response.body as unknown as ErrorResponse;
      expect(errorBody, {
        message: `Error response missing 'error' field for missing thumbnail of image "${imageWithoutThumbnail!.id}"`
      }).toHaveProperty('error');
      
      expect(errorBody, {
        message: `Error response missing 'message' field for missing thumbnail of image "${imageWithoutThumbnail!.id}"`
      }).toHaveProperty('message');
      
      expect(errorBody.message.toLowerCase(), {
        message: `Error message "${errorBody.message}" does not indicate thumbnail not found for image "${imageWithoutThumbnail!.id}"`
      }).toContain('thumbnail not found');
    }

    console.log(`✓ Missing thumbnail for image "${imageWithoutThumbnail!.id}" correctly returns 404 with proper error message`);
  });
});