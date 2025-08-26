import { test, expect } from '@playwright/test';
import { CollectionsAPI } from '../utils/collections-api-model';
import { CollectionsImagesAPIUtils } from '../utils/collections-images-api-utils';
import { CollectionFixtures } from '../../utils/fixtures/collection-fixtures';
import { Fixtures } from '../../utils/fixtures/base-fixtures';
import { TEST_CONFIG } from '../../utils/test-config';

test.describe('Collections Images API Endpoint', { tag: '@sequential' }, () => {
  let api: CollectionsAPI;

  // Setup API client using shared test configuration
  test.beforeAll(() => {
    api = new CollectionsAPI(TEST_CONFIG.API_BASE_URL);
  });

  // Setup private directory before each test
  test.beforeEach(async () => {
    await import('fs').then(fs => fs.promises.mkdir('/workspace/image-vault/private', { recursive: true }));
  });

  // Cleanup fixtures after each test
  test.afterEach(async () => {
    await Fixtures.cleanup();
  });

  test('Image listing with existing collection and images', async () => {
    // Given a collection exists with images in various statuses
    const collection = await CollectionFixtures.create({
      collectionId: 'mixed-status-collection',
      imageCounts: { 'inbox': 2, 'collection': 3, 'archive': 1 }
    });

    // When the client requests GET /api/collections/:id/images
    const response = await api['/api/collections/:id/images'].get({
      pathParams: { id: collection.id }
    });

    // Then the API returns 200 status code
    response.shouldHaveStatus(200);

    // And the API returns array of image metadata objects
    expect(response.body, { 
      message: `Collection ${collection.id} images response body is missing` 
    }).toBeDefined();
    expect(Array.isArray(response.body), { 
      message: `Collection ${collection.id} images response should be array but got ${typeof response.body}` 
    }).toBe(true);
    expect(response.body!.length, { 
      message: `Collection ${collection.id} should contain 6 images but returned ${response.body!.length}` 
    }).toBe(6);

    // And each image object contains id, originalName, status, size, dimensions, and timestamps
    response.body!.forEach((imageData, index) => {
      CollectionsImagesAPIUtils.assertValidImageMetadata(
        imageData, 
        `Collection ${collection.id} image ${index + 1}`
      );
    });

    // Verify all expected statuses are present
    const imageStatuses = response.body!.map(img => img.status);
    const uniqueStatuses = [...new Set(imageStatuses)];
    expect(uniqueStatuses.sort(), { 
      message: `Collection ${collection.id} should contain images with INBOX, COLLECTION, and ARCHIVE statuses` 
    }).toEqual(['ARCHIVE', 'COLLECTION', 'INBOX']);
  });

  test('Image listing with empty collection', async () => {
    // Given a collection exists with no images
    const collection = await CollectionFixtures.create({
      collectionId: 'empty-collection',
    });

    // When the client requests GET /api/collections/:id/images
    const response = await api['/api/collections/:id/images'].get({
      pathParams: { id: collection.id }
    });

    // Then the API returns 200 status code
    response.shouldHaveStatus(200);

    // And the API returns empty array
    expect(response.body, { 
      message: `Empty collection ${collection.id} images response body is missing` 
    }).toBeDefined();
    expect(Array.isArray(response.body), { 
      message: `Empty collection ${collection.id} images response should be array` 
    }).toBe(true);
    expect(response.body!.length, { 
      message: `Empty collection ${collection.id} should return 0 images but returned ${response.body!.length}` 
    }).toBe(0);
  });

  test('Image listing with non-existent collection', async () => {
    // Given no collection exists with the specified ID
    const nonExistentId = 'non-existent-collection';

    // When the client requests GET /api/collections/:id/images
    const response = await api['/api/collections/:id/images'].get({
      pathParams: { id: nonExistentId }
    });

    // Then the API returns 404 status code
    // And the API returns error message indicating collection not found
    CollectionsImagesAPIUtils.assertValidErrorResponse(response, 404, 'not found');
  });

  test('Image filtering by status', async () => {
    // Given a collection exists with images in multiple statuses
    const collection = await CollectionFixtures.create({
      collectionId: 'filter-test-collection',
      imageCounts: { 'inbox': 4, 'collection': 5, 'archive': 3 }
    });

    const statusesToTest = ['INBOX', 'COLLECTION', 'ARCHIVE'] as const;

    for (const status of statusesToTest) {
      // When the client requests GET /api/collections/:id/images with a specific status filter
      const response = await api['/api/collections/:id/images'].get({
        pathParams: { id: collection.id },
        queryParams: CollectionsImagesAPIUtils.buildQueryParams({ status })
      });

      // Then the API returns 200 status code
      response.shouldHaveStatus(200);

      // And the API returns only images matching the specified status
      expect(response.body, { 
        message: `Collection ${collection.id} filtered by ${status} returned no response body` 
      }).toBeDefined();

      const expectedCount = status === 'INBOX' ? 4 : status === 'COLLECTION' ? 5 : 3;
      expect(response.body!.length, { 
        message: `Collection ${collection.id} should return ${expectedCount} ${status} images but returned ${response.body!.length}` 
      }).toBe(expectedCount);

      // And the API excludes images with other statuses
      CollectionsImagesAPIUtils.assertImagesHaveStatus(response.body!, status, collection.id);
    }
  });

  test('Image listing with pagination', async () => {
    // Given a collection exists with multiple images
    const collection = await CollectionFixtures.create({
      collectionId: 'pagination-test-collection',
      imageCounts: { 'inbox': 10, 'collection': 10, 'archive': 5 }
    });

    // Test different pagination scenarios
    const paginationTests = [
      { limit: 10, offset: 0, expectedCount: 10, description: 'first page' },
      { limit: 10, offset: 10, expectedCount: 10, description: 'second page' },
      { limit: 10, offset: 20, expectedCount: 5, description: 'final partial page' },
      { limit: 5, offset: 5, expectedCount: 5, description: 'middle page' }
    ];

    for (const { limit, offset, expectedCount, description } of paginationTests) {
      // When the client requests GET /api/collections/:id/images with limit and offset parameters
      const response = await api['/api/collections/:id/images'].get({
        pathParams: { id: collection.id },
        queryParams: { limit: limit.toString(), offset: offset.toString() }
      });

      // Then the API returns 200 status code
      response.shouldHaveStatus(200);

      // And the API returns the specified number of image objects
      // And the API returns the correct subset of images based on offset
      CollectionsImagesAPIUtils.assertPaginationResults(
        response.body!, 
        expectedCount, 
        offset, 
        `${collection.id} (${description})`
      );

      // Verify each returned image has valid metadata
      response.body!.forEach((imageData, index) => {
        CollectionsImagesAPIUtils.assertValidImageMetadata(
          imageData, 
          `Collection ${collection.id} ${description} image ${index + 1}`
        );
      });
    }
  });

  test('Image listing with custom ordering', async () => {
    // Given a collection exists with images created at different times using fake timers
    const collection = await CollectionFixtures.createWithVariedImageCreationTimes({
      collectionId: 'ordering-test-collection',
      basePath: '/workspace/image-vault/private',
      imageCount: 8,
      statusDistribution: [
        { status: 'INBOX', count: 3 },
        { status: 'COLLECTION', count: 3 },
        { status: 'ARCHIVE', count: 2 }
      ],
      timeSpreadMinutes: 60 // Controlled time progression over 1 hour using fake timers
    });

    const orderingTests = [
      { orderBy: 'created_at' as const, orderDirection: 'ASC' as const },
      { orderBy: 'created_at' as const, orderDirection: 'DESC' as const },
      { orderBy: 'updated_at' as const, orderDirection: 'ASC' as const },
      { orderBy: 'updated_at' as const, orderDirection: 'DESC' as const }
    ];

    for (const { orderBy, orderDirection } of orderingTests) {
      // When the client requests GET /api/collections/:id/images with custom ordering parameters
      const response = await api['/api/collections/:id/images'].get({
        pathParams: { id: collection.id },
        queryParams: CollectionsImagesAPIUtils.buildQueryParams({ orderBy, orderDirection })
      });

      // Then the API returns 200 status code
      response.shouldHaveStatus(200);

      expect(response.body, { 
        message: `Collection ${collection.id} ordering test returned no response body` 
      }).toBeDefined();

      // And the API returns images ordered according to the specified criteria
      CollectionsImagesAPIUtils.assertImagesSorted(
        response.body!, 
        orderBy, 
        orderDirection, 
        collection.id
      );

      // Verify each returned image has valid metadata
      response.body!.forEach((imageData, index) => {
        CollectionsImagesAPIUtils.assertValidImageMetadata(
          imageData, 
          `Collection ${collection.id} ${orderBy} ${orderDirection} image ${index + 1}`
        );
      });
    }
  });

  test('Image listing with invalid status filter', async () => {
    // Given a collection exists with images
    const collection = await CollectionFixtures.create({
      collectionId: 'invalid-status-collection',
      imageCounts: { 'inbox': 2, 'collection': 3, 'archive': 1 }
    });

    // When the client requests GET /api/collections/:id/images with an invalid status parameter
    const response = await api['/api/collections/:id/images'].get({
      pathParams: { id: collection.id },
      queryParams: { status: 'INVALID_STATUS' }
    });

    // Then the API returns 400 status code
    // And the API returns error message indicating invalid status value
    CollectionsImagesAPIUtils.assertValidErrorResponse(response, 400, 'invalid');
  });

  test('Image listing with invalid pagination parameters', async () => {
    // Given a collection exists with images
    const collection = await CollectionFixtures.create({
      collectionId: 'invalid-params-collection',
      imageCounts: { 'inbox': 2, 'collection': 3, 'archive': 1 }
    });

    const invalidParamTests = CollectionsImagesAPIUtils.getInvalidQueryParams();

    for (const { params } of invalidParamTests) {
      // When the client requests GET /api/collections/:id/images with invalid limit or offset parameters
      const response = await api['/api/collections/:id/images'].get({
        pathParams: { id: collection.id },
        queryParams: params
      });

      // Then the API returns 400 status code
      // And the API returns error message indicating invalid pagination parameters
      CollectionsImagesAPIUtils.assertValidErrorResponse(
        response, 
        400, 
        'invalid'
      );
    }
  });
});