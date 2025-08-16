import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { Collection } from '../../src/domain/collection';
import { TestUtils } from './utils';

test.describe('Collections - Creation and Loading', () => {
  const tempDirs: string[] = [];

  test.afterAll(async () => {
    // Cleanup all temporary directories
    for (const dir of tempDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Cleanup warning for ${dir}:`, error);
      }
    }
  });

  async function createTempDir(): Promise<string> {
    const tempDir = await fs.mkdtemp(path.join(tmpdir(), 'collection-test-'));
    tempDirs.push(tempDir);
    return tempDir;
  }

  // Positive Scenarios

  test('Collection creation with valid parameters', async () => {
    console.log('Creating new Collection instance with valid collection ID and base path');
    
    const collectionId = `test-collection-${Date.now()}`;
    const basePath = await createTempDir();
    
    const collection = await Collection.create(collectionId, basePath);
    
    console.log('Verifying collection initializes with provided ID and path');
    expect(collection.id, { message: `Collection ID is "${collection.id}" instead of "${collectionId}" after creation` }).toBe(collectionId);
    expect(collection.basePath, { message: `Collection base path is "${collection.basePath}" instead of "${basePath}" after creation` }).toBe(basePath);
    console.log('Collection initialized with correct ID and path');
    
    console.log('Verifying collection creates necessary directory structure');
    const collectionPath = path.join(basePath, collectionId);
    const imagesPath = path.join(collectionPath, 'images');
    const originalPath = path.join(imagesPath, 'original');
    const thumbnailsPath = path.join(imagesPath, 'thumbnails');
    
    const collectionDirExists = await TestUtils.directoryExists(collectionPath);
    expect(collectionDirExists, { message: `Collection directory "${collectionPath}" does not exist after creation` }).toBe(true);
    console.log('Collection directory structure created successfully');
    
    const imagesDirExists = await TestUtils.directoryExists(imagesPath);
    expect(imagesDirExists, { message: `Images directory "${imagesPath}" does not exist after collection creation` }).toBe(true);
    
    const originalDirExists = await TestUtils.directoryExists(originalPath);
    expect(originalDirExists, { message: `Original images directory "${originalPath}" does not exist after collection creation` }).toBe(true);
    
    const thumbnailsDirExists = await TestUtils.directoryExists(thumbnailsPath);
    expect(thumbnailsDirExists, { message: `Thumbnails directory "${thumbnailsPath}" does not exist after collection creation` }).toBe(true);
    console.log('All required subdirectories created successfully');
    
    console.log('Verifying collection creates database file');
    const databasePath = path.join(collectionPath, 'collection.db');
    const databaseExists = await TestUtils.fileExists(databasePath);
    expect(databaseExists, { message: `Database file "${databasePath}" does not exist after collection creation` }).toBe(true);
    console.log('Database file created successfully');
  });

  test('Collection loading from existing directory', async () => {
    console.log('Setting up existing collection with valid database');
    
    const collectionId = `existing-collection-${Date.now()}`;
    const basePath = await createTempDir();
    
    // First create a collection
    await Collection.create(collectionId, basePath);
    const collectionPath = path.join(basePath, collectionId);
    
    console.log('Loading collection from existing directory using Collection.load()');
    const loadedCollection = await Collection.load(collectionPath);
    
    console.log('Verifying loaded collection is a valid Collection instance');
    expect(loadedCollection, { message: `Collection.load() returned null/undefined for existing collection at "${collectionPath}"` }).toBeTruthy();
    expect(loadedCollection.id, { message: `Loaded collection ID is "${loadedCollection.id}" instead of "${collectionId}" when loading existing collection` }).toBe(collectionId);
    console.log('Collection loaded successfully from existing directory');
  });

  // Negative Scenarios

  test('Collection creation with invalid path', async () => {
    console.log('Attempting to create Collection instance with invalid/inaccessible base path');
    
    const collectionId = `invalid-path-collection-${Date.now()}`;
    const invalidPath = TestUtils.getInvalidPath();
    
    console.log('Verifying collection throws meaningful error about invalid path');
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await Collection.create(collectionId, invalidPath);
    } catch (error: any) {
      errorThrown = true;
      errorMessage = error.message;
    }
    
    expect(errorThrown, { message: `Collection creation with invalid path "${invalidPath}" did not throw an error` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not indicate invalid path issue for path "${invalidPath}"` }).toContain('invalid path');
    console.log('Collection correctly threw meaningful error for invalid path');
    
    console.log('Verifying no files or directories were created');
    const pathExists = await TestUtils.directoryExists(invalidPath);
    expect(pathExists, { message: `Invalid path "${invalidPath}" directory was created despite being invalid` }).toBe(false);
    console.log('No files or directories created for invalid path');
  });

  test('Collection creation with insufficient permissions', async () => {
    console.log('Setting up path with insufficient write permissions');
    
    const collectionId = `permission-fail-collection-${Date.now()}`;
    const restrictedPath = await TestUtils.createNoWritePermissionPath();
    tempDirs.push(restrictedPath);
    
    console.log('Attempting to create Collection instance with insufficient permissions');
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await Collection.create(collectionId, restrictedPath);
    } catch (error: any) {
      errorThrown = true;
      errorMessage = error.message;
    }
    
    console.log('Verifying collection throws "Unable to create Collection" error');
    expect(errorThrown, { message: `Collection creation with insufficient permissions at "${restrictedPath}" did not throw an error` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not contain "Unable to create Collection" for permission failure` }).toContain('Unable to create Collection');
    console.log('Collection correctly threw "Unable to create Collection" error');
    
    console.log('Verifying no partial directory structure was created');
    const collectionPath = path.join(restrictedPath, collectionId);
    const collectionExists = await TestUtils.directoryExists(collectionPath);
    expect(collectionExists, { message: `Collection directory "${collectionPath}" was created despite insufficient permissions` }).toBe(false);
    console.log('No partial directory structure created');
  });

  test('Collection creation with database failure', async () => {
    console.log('Setting up scenario for database initialization failure');
    
    const collectionId = `db-fail-collection-${Date.now()}`;
    const basePath = await createTempDir();
    
    // Create the collection directory structure manually to simulate partial creation
    const collectionPath = path.join(basePath, collectionId);
    await fs.mkdir(collectionPath, { recursive: true });
    
    // Create a file where the database should be to cause database creation to fail
    const databasePath = path.join(collectionPath, 'collection.db');
    await fs.mkdir(databasePath); // Create directory instead of file to cause failure
    
    console.log('Attempting to create Collection instance when database initialization fails');
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await Collection.create(collectionId, basePath);
    } catch (error: any) {
      errorThrown = true;
      errorMessage = error.message;
    }
    
    console.log('Verifying collection throws "Unable to create Collection" error');
    expect(errorThrown, { message: `Collection creation with database failure did not throw an error for "${collectionPath}"` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not contain "Unable to create Collection" for database failure` }).toContain('Unable to create Collection');
    console.log('Collection correctly threw "Unable to create Collection" error for database failure');
    
    console.log('Verifying collection removes any partially created directories');
    const collectionExists = await TestUtils.directoryExists(collectionPath);
    expect(collectionExists, { message: `Collection directory "${collectionPath}" still exists after database failure - should be cleaned up` }).toBe(false);
    console.log('Partially created directories removed successfully');
    
    console.log('Verifying filesystem is left in original state');
    const baseContents = await TestUtils.listContents(basePath);
    const hasCollectionItems = baseContents.some(item => item.includes(collectionId));
    expect(hasCollectionItems, { message: `Base path "${basePath}" contains collection-related items after failed creation cleanup` }).toBe;
    console.log('Filesystem left in original state');
  });

  test('Collection loading with access issues', async () => {
    console.log('Setting up collection directory with database and permission problems');
    
    const collectionId = `access-issue-collection-${Date.now()}`;
    const basePath = await createTempDir();
    
    // First create a valid collection
    await Collection.create(collectionId, basePath);
    const collectionPath = path.join(basePath, collectionId);
    
    // Corrupt the database to simulate access issues
    const databasePath = path.join(collectionPath, 'collection.db');
    await TestUtils.corruptDatabase(databasePath);
    
    console.log('Attempting to load collection with access issues using Collection.load()');
    let errorThrown = false;
    let errorMessage = '';
    
    try {
      await Collection.load(collectionPath);
    } catch (error: any) {
      errorThrown = true;
      errorMessage = error.message;
    }
    
    console.log('Verifying collection throws "Unable to load Collection" error');
    expect(errorThrown, { message: `Collection loading with access issues at "${collectionPath}" did not throw an error` }).toBe(true);
    expect(errorMessage, { message: `Error message "${errorMessage}" does not contain "Unable to load Collection" for access issues` }).toContain('Unable to load Collection');
    console.log('Collection correctly threw "Unable to load Collection" error');
    
    console.log('Verifying error message indicates specific access issue');
    expect(errorMessage, { message: `Error message "${errorMessage}" does not indicate specific access issue details` }).toMatch(/(database|corrupt|access|permission)/i);
    console.log('Error message indicates specific access issue');
  });
});