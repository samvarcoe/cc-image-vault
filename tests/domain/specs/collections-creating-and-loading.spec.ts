import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';
import { Collection } from '../../../src/domain/collection';
import { CollectionFixtures } from '../../utils/fixtures/collection-fixtures';
import { Fixtures } from '../../utils/fixtures/base-fixtures';
import { TestUtils } from '../utils';

test.describe('Collections - Creation and Loading', () => {
  
  test.afterAll(async () => {
    await Fixtures.cleanup();
  });

  // Positive Scenarios

  test('Collection creation with valid parameters', async () => {
    const collectionId = `test-collection-${Date.now()}`;
    
    const collection = await CollectionFixtures.createEmpty({ collectionId });
    
    expect(collection.id, { 
      message: `Collection has ID "${collection.id}" instead of "${collectionId}" after creation with valid parameters` 
    }).toBe(collectionId);
    
    expect(collection.basePath, { 
      message: `Collection base path "${collection.basePath}" should be defined after creation with valid parameters` 
    }).toBeTruthy();
    
    console.log(`✓ Collection ${collectionId} created with correct ID and base path`);
    
    const collectionPath = path.join(collection.basePath, collectionId);
    await TestUtils.shouldHaveValidStructure(collectionPath);
  });

  test('Collection loading from existing directory', async () => {
    const collectionId = `existing-collection-${Date.now()}`;
    
    // First create a collection using fixtures
    const collection = await CollectionFixtures.createEmpty({ collectionId });
    const collectionPath = path.join(collection.basePath, collectionId);
    
    const loadedCollection = await Collection.load(collectionPath);
    
    expect(loadedCollection, { 
      message: `Collection.load() returned null/undefined for existing collection directory at "${collectionPath}"` 
    }).toBeTruthy();
    
    expect(loadedCollection.id, { 
      message: `Loaded collection has ID "${loadedCollection.id}" instead of "${collectionId}" when loading from existing directory` 
    }).toBe(collectionId);
    
    console.log(`✓ Collection ${collectionId} successfully loaded from existing directory`);
  });

  // Negative Scenarios

  test('Collection creation with invalid path', async () => {
    const collectionId = `invalid-path-collection-${Date.now()}`;
    const invalidPath = TestUtils.getInvalidPath();
    
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      // Use Collection.create directly for error testing scenario
      await Collection.create(collectionId, invalidPath);
    } catch (error: unknown) {
      errorThrown = true;
      errorMessage = error.message;
    }
    
    expect(errorThrown, { 
      message: `Collection creation with invalid path "${invalidPath}" did not throw error as expected` 
    }).toBe(true);
    
    expect(errorMessage, { 
      message: `Collection creation error "${errorMessage}" does not indicate invalid path issue for "${invalidPath}"` 
    }).toContain('invalid path');
    
    const pathExists = await TestUtils.directoryExists(invalidPath);
    expect(pathExists, { 
      message: `Invalid path "${invalidPath}" was created despite collection creation failure` 
    }).toBe(false);
    
    console.log(`✓ Collection creation properly rejected invalid path "${invalidPath}" with no filesystem changes`);
  });

  test('Collection creation with insufficient permissions', async () => {
    const collectionId = `permission-fail-collection-${Date.now()}`;
    const restrictedPath = await TestUtils.createNoWritePermissionPath();
    
    // Add manual cleanup for this specific test resource
    (Fixtures as any).addCleanup(async () => {
      try {
        await fs.rm(restrictedPath, { recursive: true, force: true });
      } catch {
        // Cleanup failures are non-fatal
      }
    });
    
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      // Use Collection.create directly for error testing scenario
      await Collection.create(collectionId, restrictedPath);
    } catch (error: unknown) {
      errorThrown = true;
      errorMessage = error.message;
    }
    
    expect(errorThrown, { 
      message: `Collection creation with insufficient permissions at "${restrictedPath}" did not throw error as expected` 
    }).toBe(true);
    
    expect(errorMessage, { 
      message: `Permission error "${errorMessage}" does not contain "Unable to create Collection" message for restricted path "${restrictedPath}"` 
    }).toContain('Unable to create Collection');
    
    const collectionPath = path.join(restrictedPath, collectionId);
    const collectionExists = await TestUtils.directoryExists(collectionPath);
    expect(collectionExists, { 
      message: `Collection directory "${collectionPath}" was created despite insufficient permissions failure` 
    }).toBe(false);
    
    console.log(`✓ Collection creation properly handled insufficient permissions at "${restrictedPath}" with proper cleanup`);
  });

  test('Collection creation with database failure', async () => {
    const collectionId = `db-fail-collection-${Date.now()}`;
    
    // Use fixtures to create a temp directory that will be cleaned up
    const tempDir = await fs.mkdtemp('/tmp/db-fail-test-');
    (Fixtures as any).addCleanup(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Cleanup failures are non-fatal
      }
    });
    
    // Create the collection directory structure manually to simulate partial creation
    const collectionPath = path.join(tempDir, collectionId);
    await fs.mkdir(collectionPath, { recursive: true });
    
    // Create a directory where the database should be to cause database creation to fail
    const databasePath = path.join(collectionPath, 'collection.db');
    await fs.mkdir(databasePath); // Create directory instead of file to cause failure
    
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      // Use Collection.create directly for error testing scenario
      await Collection.create(collectionId, tempDir);
    } catch (error: unknown) {
      errorThrown = true;
      errorMessage = error.message;
    }
    
    expect(errorThrown, { 
      message: `Collection creation with database initialization failure did not throw error for "${collectionPath}"` 
    }).toBe(true);
    
    expect(errorMessage, { 
      message: `Database failure error "${errorMessage}" does not contain "Unable to create Collection" message for failed initialization` 
    }).toContain('Unable to create Collection');
    
    const collectionExists = await TestUtils.directoryExists(collectionPath);
    expect(collectionExists, { 
      message: `Collection directory "${collectionPath}" still exists after database failure instead of being cleaned up` 
    }).toBe(false);
    
    const baseContents = await TestUtils.listContents(tempDir);
    const hasCollectionItems = baseContents.some(item => item.includes(collectionId));
    expect(hasCollectionItems, { 
      message: `Base path "${tempDir}" contains collection remnants after database failure cleanup` 
    }).toBe(false);
    
    console.log(`✓ Collection creation with database failure properly cleaned up partial state`);
  });

  test('Collection loading with access issues', async () => {
    const collectionId = `access-issue-collection-${Date.now()}`;
    
    // First create a valid collection using fixtures
    const collection = await CollectionFixtures.createEmpty({ collectionId });
    const collectionPath = path.join(collection.basePath, collectionId);
    
    // Corrupt the database to simulate access issues
    const databasePath = path.join(collectionPath, 'collection.db');
    await TestUtils.corruptDatabase(databasePath);
    
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await Collection.load(collectionPath);
    } catch (error: unknown) {
      errorThrown = true;
      errorMessage = error.message;
    }
    
    expect(errorThrown, { 
      message: `Collection loading with corrupted database at "${collectionPath}" did not throw error as expected` 
    }).toBe(true);
    
    expect(errorMessage, { 
      message: `Access error "${errorMessage}" does not contain "Unable to load Collection" message for corrupted database` 
    }).toContain('Unable to load Collection');
    
    expect(errorMessage, { 
      message: `Access error "${errorMessage}" does not indicate specific database access issue (database, corrupt, access, or permission)` 
    }).toMatch(/(database|corrupt|access|permission)/i);
    
    console.log(`✓ Collection loading properly rejected corrupted database with specific error details`);
  });
});