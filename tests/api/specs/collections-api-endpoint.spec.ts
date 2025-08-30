import { test, expect } from '@playwright/test';
import { CollectionsAPI, ErrorResponse } from '../utils/collections-api-model';
import { CollectionsDirectoryFixtures } from '../utils/collections-directory-fixtures';
import { Fixtures } from '../../utils/fixtures/base-fixtures';
import { CONFIG } from '../../../config';
import { CollectionFixtures } from '../../utils/fixtures/collection-fixtures';

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
    // Given multiple collections exist in the private directory
    await CollectionsDirectoryFixtures.createWithExistingCollections({
      collectionIds: ['collection-1', 'collection-2', 'collection-3']
    });

    // When the client requests GET /api/collections
    const response = await api['/api/collections'].get({});

    // Then the API returns 200 status code
    response.shouldHaveStatus(200);

    // And the API returns array of collection objects with id property
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(3);
    
    const collectionIds = response.body!.map(collection => collection.id).sort();
    expect(collectionIds).toEqual(['collection-1', 'collection-2', 'collection-3']);
    
    // Verify each collection has required id property
    response.body!.forEach(collection => {
      expect(collection).toHaveProperty('id');
      expect(typeof collection.id).toBe('string');
    });
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
    const directoryState = await CollectionsDirectoryFixtures.createEmpty();

    // And no collection exists with that ID
    const collectionExists = await CollectionsDirectoryFixtures.collectionExists(
      directoryState.privateDir, 
      collectionId
    );
    expect(collectionExists).toBe(false);

    // When the client requests POST /api/collections with the ID
    const response = await api['/api/collections'].post({
      body: { id: collectionId }
    });

    // Then the API returns 201 status code
    response.shouldHaveStatus(201);

    // And the API creates collection directory in ./private
    const collectionExistsAfter = await CollectionsDirectoryFixtures.collectionExists(
      directoryState.privateDir, 
      collectionId
    );
    expect(collectionExistsAfter).toBe(true);

    // And the API returns created collection object with id property
    expect(response.body).toBeDefined();
    expect(response.body!.id).toBe(collectionId);
  });

  test('Collection creation with duplicate ID', async () => {
    // Given a collection already exists with the provided ID
    const duplicateId = 'existing-collection';
    const directoryState = await CollectionsDirectoryFixtures.createWithExistingCollections({
      collectionIds: [duplicateId]
    });

    const initialCount = await CollectionsDirectoryFixtures.countCollections(directoryState.privateDir);

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

    // And the API creates no new files or directories
    const finalCount = await CollectionsDirectoryFixtures.countCollections(directoryState.privateDir);
    expect(finalCount).toBe(initialCount);
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

    const directoryState = await CollectionsDirectoryFixtures.createEmpty();
    const initialCount = await CollectionsDirectoryFixtures.countCollections(directoryState.privateDir);

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

    // And the API creates no new files or directories
    const finalCount = await CollectionsDirectoryFixtures.countCollections(directoryState.privateDir);
    expect(finalCount).toBe(initialCount);
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
    const directoryState = await CollectionsDirectoryFixtures.createWithExistingCollections({
      collectionIds: [collectionId]
    });

    // Verify collection exists before deletion
    const existsBefore = await CollectionsDirectoryFixtures.collectionExists(
      directoryState.privateDir, 
      collectionId
    );
    expect(existsBefore).toBe(true);

    // When the client requests DELETE /api/collections/:id
    const response = await api['/api/collections/:id'].delete({
      pathParams: { id: collectionId }
    });

    // Then the API returns 204 status code
    response.shouldHaveStatus(204);

    // And the API removes all collection files and directories
    const existsAfter = await CollectionsDirectoryFixtures.collectionExists(
      directoryState.privateDir, 
      collectionId
    );
    expect(existsAfter).toBe(false);

    // And the API deletes all associated images and thumbnails
    // (This is verified by the directory no longer existing)
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