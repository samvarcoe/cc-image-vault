import { test, expect } from '@playwright/test';
import { CollectionsAPI, ErrorResponse } from '../../utils/collections-api-model';
import { CollectionsDirectoryFixtures } from '../../utils/collections-directory-fixtures';
import { Fixtures, CollectionFixtures } from '@/utils';
import { Collection } from '@/domain';
import { CONFIG } from '@/config';

test.describe('Collections API Endpoint', { tag: '@sequential' }, () => {
  let api: CollectionsAPI;

  // Setup API client using shared test configuration
  test.beforeAll(async () => {
    await CollectionFixtures.clearDirectory();
    api = new CollectionsAPI(CONFIG.API_BASE_URL);

  });

  // Cleanup fixtures after each test
  test.afterEach(async () => {
    await Fixtures.cleanup();
  });

  test('Collection listing with existing collections', async () => {
    const collectionIds = ['collection-1', 'collection-2', 'collection-3'];

    for (const id of collectionIds) {
      await CollectionFixtures.create({ collectionId: id });
    }

    const response = await api['/api/collections'].get({});

    // Then the API returns 200 status code
    response
      .shouldHaveStatus(200)
      .shouldHaveBody(collectionIds.map(id => ({ id })));
  });

  test('Collection listing with no collections', async () => {
    // Given no collections exist in the private directory
    await CollectionsDirectoryFixtures.createEmpty();

    // When the client requests GET /api/collections
    const response = await api['/api/collections'].get({});

    // Then the API returns 200 status code
    response.shouldHaveStatus(200);

    // And the API returns empty array
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
  });

  test('Collection creation with valid ID', async () => {
    // Given the client provides a filesystem-safe collection ID
    const collectionId = 'valid-collection-123';
    await CollectionsDirectoryFixtures.createEmpty();

    // When the client requests POST /api/collections with the ID
    const response = await api['/api/collections'].post({
      body: { id: collectionId }
    });

    // Then the API returns 201 status code
    response.shouldHaveStatus(201);

    // And the API returns created collection object with id property
    expect(response.body).toBeDefined();
    expect(response.body!.id).toBe(collectionId);

    // And the collection can be loaded using the domain class
    const collectionPath = `/workspace/projects/image-vault/private/${collectionId}`;
    const collection = await Collection.load(collectionPath);
    expect(collection).toBeTruthy();
    expect(collection!.id).toBe(collectionId);
  });

  test('Collection creation with duplicate ID', async () => {
    // Given a collection already exists with the provided ID
    const duplicateId = 'existing-collection';
    await CollectionsDirectoryFixtures.createWithExistingCollections({
      collectionIds: [duplicateId]
    });

    // When the client requests POST /api/collections with the duplicate ID
    const response = await api['/api/collections'].post({
      body: { id: duplicateId }
    });

    // Then the API returns 409 status code
    response.shouldHaveStatus(409);

    // And the API returns error message indicating duplicate ID
    expect(response.body).toBeDefined();
    const errorResponse = response.body as unknown as ErrorResponse;
    expect(errorResponse.error).toBeDefined();
    expect(errorResponse.message).toBeDefined();
    expect(errorResponse.message.toLowerCase()).toContain('duplicate');
  });

  test('Collection creation with invalid ID', async () => {
    // Given the client provides an invalid filesystem ID
    const invalidIds = [
      'invalid/collection',  // Contains slash
      'invalid\\collection', // Contains backslash
      'invalid:collection',  // Contains colon
      'invalid*collection',  // Contains asterisk
      '',                    // Empty string
      '.',                   // Current directory
      '..',                  // Parent directory
    ];

    await CollectionsDirectoryFixtures.createEmpty();

    for (const invalidId of invalidIds) {
      // When the client requests POST /api/collections with the invalid ID
      const response = await api['/api/collections'].post({
        body: { id: invalidId }
      });

      // Then the API returns 400 status code
      response.shouldHaveStatus(400);

      // And the API returns error message indicating invalid ID format
      expect(response.body).toBeDefined();
      const errorResponse = response.body as unknown as ErrorResponse;
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.message).toBeDefined();
      expect(errorResponse.message.toLowerCase()).toContain('invalid');
    }
  });

  test('Collection retrieval with existing collection', async () => {
    // Given a collection exists with the specified ID
    const collectionId = 'existing-collection';
    await CollectionsDirectoryFixtures.createWithExistingCollections({
      collectionIds: [collectionId]
    });

    // When the client requests GET /api/collections/:id
    const response = await api['/api/collections/:id'].get({
      pathParams: { id: collectionId }
    });

    // Then the API returns 200 status code
    response.shouldHaveStatus(200);

    // And the API returns collection object with id property
    expect(response.body).toBeDefined();
    expect(response.body!.id).toBe(collectionId);
  });

  test('Collection retrieval with non-existent collection', async () => {
    // Given no collection exists with the specified ID
    const nonExistentId = 'non-existent-collection';
    await CollectionsDirectoryFixtures.createEmpty();

    // When the client requests GET /api/collections/:id
    const response = await api['/api/collections/:id'].get({
      pathParams: { id: nonExistentId }
    });

    // Then the API returns 404 status code
    response.shouldHaveStatus(404);

    // And the API returns error message indicating collection not found
    expect(response.body).toBeDefined();
    const errorResponse = response.body as unknown as ErrorResponse;
    expect(errorResponse.error).toBeDefined();
    expect(errorResponse.message).toBeDefined();
    expect(errorResponse.message.toLowerCase()).toContain('not found');
  });

  test('Collection deletion with existing collection', async () => {
    // Given a collection exists with images in various statuses
    const collectionId = 'collection-to-delete';
    await CollectionsDirectoryFixtures.createWithExistingCollections({
      collectionIds: [collectionId]
    });

    // Verify collection exists before deletion
    const collectionPath = `/workspace/projects/image-vault/private/${collectionId}`;
    const collectionBefore = await Collection.load(collectionPath);
    expect(collectionBefore).toBeTruthy();

    // When the client requests DELETE /api/collections/:id
    const response = await api['/api/collections/:id'].delete({
      pathParams: { id: collectionId }
    });

    // Then the API returns 204 status code
    response.shouldHaveStatus(204);

    // And the collection directory no longer exists
    try {
      await Collection.load(collectionPath);
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain('no such file or directory');
    }
  });

  test('Collection deletion with non-existent collection', async () => {
    // Given no collection exists with the specified ID
    const nonExistentId = 'non-existent-collection';
    await CollectionsDirectoryFixtures.createEmpty();

    // When the client requests DELETE /api/collections/:id
    const response = await api['/api/collections/:id'].delete({
      pathParams: { id: nonExistentId }
    });

    // Then the API returns 404 status code
    response.shouldHaveStatus(404);

    // And the API returns error message indicating collection not found
    expect(response.body).toBeDefined();
    const errorResponse = response.body as unknown as ErrorResponse;
    expect(errorResponse.error).toBeDefined();
    expect(errorResponse.message).toBeDefined();
    expect(errorResponse.message.toLowerCase()).toContain('not found');
  });
});