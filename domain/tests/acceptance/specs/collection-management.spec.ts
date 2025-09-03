import { suite, test } from 'node:test';
import assert from 'assert';
import { promises as fs } from 'fs';
import path from 'path';
import sinon from 'sinon';
import { Collection } from '@/domain';
import { DirectoryFixtures } from '@/utils/fixtures/directory-fixtures';
import { CONFIG } from '../../../../config';

suite('Collection Management', () => {
  let collectionsDir: string;

  const setupCollectionsDirectory = async (): Promise<void> => {
    const tempDir = await DirectoryFixtures.createTemporary({ prefix: 'collections-test-' });
    collectionsDir = tempDir.path;
  };

  const createExistingCollection = async (name: string): Promise<string> => {
    const collectionPath = path.join(collectionsDir, name);
    await DirectoryFixtures.create({ path: collectionPath });
    
    const dbPath = path.join(collectionPath, 'collection.db');
    await fs.writeFile(dbPath, 'test-sqlite-content');
    
    const imagesDir = path.join(collectionPath, 'images');
    await DirectoryFixtures.create({ path: imagesDir });
    await DirectoryFixtures.create({ path: path.join(imagesDir, 'original') });
    await DirectoryFixtures.create({ path: path.join(imagesDir, 'thumbnails') });
    
    return collectionPath;
  };

  const assertCollectionDirectoryExists = async (name: string): Promise<void> => {
    const collectionPath = path.join(collectionsDir, name);
    const exists = await DirectoryFixtures.exists(collectionPath);
    assert.ok(exists, `Collection directory "${name}" not created in Collections directory`);
    console.log(`✓ Collection directory "${name}" exists`);
  };

  const assertSqliteFileExists = async (name: string): Promise<void> => {
    const dbPath = path.join(collectionsDir, name, 'collection.db');
    try {
      const stats = await fs.stat(dbPath);
      assert.ok(stats.isFile(), `SQLite database file not created for Collection "${name}"`);
      console.log(`✓ SQLite database file exists for Collection "${name}"`);
    } catch {
      assert.fail(`SQLite database file "collection.db" not found for Collection "${name}"`);
    }
  };

  const assertFileStructureExists = async (name: string): Promise<void> => {
    const collectionPath = path.join(collectionsDir, name);
    const imagesPath = path.join(collectionPath, 'images');
    const originalPath = path.join(imagesPath, 'original');
    const thumbnailsPath = path.join(imagesPath, 'thumbnails');

    assert.ok(await DirectoryFixtures.exists(imagesPath), `Images directory not created for Collection "${name}"`);
    assert.ok(await DirectoryFixtures.exists(originalPath), `Original images directory not created for Collection "${name}"`);
    assert.ok(await DirectoryFixtures.exists(thumbnailsPath), `Thumbnails directory not created for Collection "${name}"`);
    
    console.log(`✓ File structure created for Collection "${name}"`);
  };

  const assertCollectionDirectoryDoesNotExist = async (name: string): Promise<void> => {
    const collectionPath = path.join(collectionsDir, name);
    const exists = await DirectoryFixtures.exists(collectionPath);
    assert.ok(!exists, `Collection directory "${name}" should not have been created`);
    console.log(`✓ Collection directory "${name}" was not created`);
  };

  const assertDirectoryIsClean = async (name: string): Promise<void> => {
    const collectionPath = path.join(collectionsDir, name);
    const exists = await DirectoryFixtures.exists(collectionPath);
    assert.ok(!exists, `Partial Collection artifacts remain for "${name}" after error`);
    console.log(`✓ No partial artifacts remain for Collection "${name}"`);
  };

  const assertCollectionDoesNotExist = async (name: string): Promise<void> => {
    const collectionPath = path.join(collectionsDir, name);
    const exists = await DirectoryFixtures.exists(collectionPath);
    assert.ok(!exists, `Collection "${name}" should be removed from filesystem`);
    console.log(`✓ Collection "${name}" removed from filesystem`);
  };

  const assertCollectionRemains = async (name: string): Promise<void> => {
    const collectionPath = path.join(collectionsDir, name);
    const exists = await DirectoryFixtures.exists(collectionPath);
    assert.ok(exists, `Collection "${name}" should remain unchanged after error`);
    console.log(`✓ Collection "${name}" remains unchanged`);
  };

  test('User creates Collection with valid name', async () => {
    await setupCollectionsDirectory();
    
    // Mock CONFIG.COLLECTIONS_DIRECTORY to point to our test directory
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);

    try {
      const collectionName = 'test-collection-123';
      Collection.create(collectionName);
      
      await assertCollectionDirectoryExists(collectionName);
      await assertSqliteFileExists(collectionName);
      await assertFileStructureExists(collectionName);
    } finally {
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('User attempts to create a Collection with duplicate name', async () => {
    await setupCollectionsDirectory();
    await createExistingCollection('existing-collection');
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);

    try {
      const existingName = 'existing-collection';
      
      assert.throws(
        () => Collection.create(existingName),
        (error: Error) => error.message === `There is already a Collection with name: "${existingName}"`,
        `Collection creation with duplicate name "${existingName}" should throw specific error`
      );
      
      const collections = await DirectoryFixtures.listDirectoryNames(collectionsDir);
      assert.strictEqual(
        collections.filter(name => name === existingName).length,
        1,
        `Duplicate Collection directory created for name "${existingName}"`
      );
      
      console.log(`✓ Duplicate Collection creation prevented for "${existingName}"`);
    } finally {
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('User attempts to create a Collection with invalid name', async () => {
    await setupCollectionsDirectory();
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);

    try {
      const invalidName = 'invalid@name!';
      
      assert.throws(
        () => Collection.create(invalidName),
        (error: Error) => error.message === `"${invalidName}" is not a valid Collection name`,
        `Collection creation with invalid name "${invalidName}" should throw specific error`
      );
      
      await assertCollectionDirectoryDoesNotExist(invalidName);
    } finally {
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('An internal error occurs when creating a Collection', async () => {
    await setupCollectionsDirectory();
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);
    
    // Mock filesystem error during directory creation
    const fsStub = sinon.stub(fs, 'mkdir').rejects(new Error('Filesystem error'));

    try {
      const collectionName = 'test-collection';
      
      assert.throws(
        () => Collection.create(collectionName),
        (error: Error) => error.message === `Unable to create Collection "${collectionName}"`,
        `Internal error during Collection creation should throw generic error for "${collectionName}"`
      );
      
      await assertDirectoryIsClean(collectionName);
    } finally {
      fsStub.restore();
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('User loads Collection from filesystem', async () => {
    await setupCollectionsDirectory();
    const collectionName = 'existing-collection';
    await createExistingCollection(collectionName);
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);

    try {
      const collection = Collection.load(collectionName);
      
      assert.ok(collection, `Collection instance not returned for "${collectionName}"`);
      assert.strictEqual(
        collection.id,
        collectionName,
        `Collection instance id mismatch for loaded Collection "${collectionName}"`
      );
      
      console.log(`✓ Collection "${collectionName}" loaded successfully`);
    } finally {
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('User attempts to load a non-existent Collection', async () => {
    await setupCollectionsDirectory();
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);

    try {
      const nonExistentName = 'non-existent';
      
      assert.throws(
        () => Collection.load(nonExistentName),
        (error: Error) => error.message === `No Collection exists with name: "${nonExistentName}"`,
        `Loading non-existent Collection "${nonExistentName}" should throw specific error`
      );
      
      console.log(`✓ Non-existent Collection load properly rejected for "${nonExistentName}"`);
    } finally {
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('An internal error occurs when loading a Collection', async () => {
    await setupCollectionsDirectory();
    const collectionName = 'existing-collection';
    await createExistingCollection(collectionName);
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);
    
    // Mock filesystem error during loading
    const fsStub = sinon.stub(fs, 'stat').rejects(new Error('Filesystem error'));

    try {
      assert.throws(
        () => Collection.load(collectionName),
        (error: Error) => error.message === `Unable to load Collection: "${collectionName}"`,
        `Internal error during Collection load should throw generic error for "${collectionName}"`
      );
      
      console.log(`✓ Internal load error properly handled for Collection "${collectionName}"`);
    } finally {
      fsStub.restore();
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('User deletes a Collection', async () => {
    await setupCollectionsDirectory();
    const collectionName = 'collection-to-delete';
    await createExistingCollection(collectionName);
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);

    try {
      Collection.delete(collectionName);
      
      await assertCollectionDoesNotExist(collectionName);
    } finally {
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('User attempts to delete a Collection that does not exist', async () => {
    await setupCollectionsDirectory();
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);

    try {
      const nonExistentName = 'non-existent';
      
      assert.throws(
        () => Collection.delete(nonExistentName),
        (error: Error) => error.message === `No Collection with name: "${nonExistentName}"`,
        `Deleting non-existent Collection "${nonExistentName}" should throw specific error`
      );
      
      console.log(`✓ Non-existent Collection deletion properly rejected for "${nonExistentName}"`);
    } finally {
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('An internal error occurs when deleting a Collection', async () => {
    await setupCollectionsDirectory();
    const collectionName = 'collection-to-delete';
    await createExistingCollection(collectionName);
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);
    
    // Mock filesystem error during deletion
    const fsStub = sinon.stub(fs, 'rm').rejects(new Error('Filesystem error'));

    try {
      assert.throws(
        () => Collection.delete(collectionName),
        (error: Error) => error.message === `Unable to delete Collection: "${collectionName}"`,
        `Internal error during Collection deletion should throw generic error for "${collectionName}"`
      );
      
      await assertCollectionRemains(collectionName);
    } finally {
      fsStub.restore();
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('User requests list of existing Collections and some Collections exist', async () => {
    await setupCollectionsDirectory();
    await createExistingCollection('collection-1');
    await createExistingCollection('collection-2');
    await createExistingCollection('collection-3');
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);

    try {
      const collections = Collection.list();
      
      assert.ok(Array.isArray(collections), 'Collection list should return an array');
      assert.strictEqual(
        collections.length,
        3,
        `Collection list count mismatch: expected 3 Collections in directory`
      );
      
      assert.ok(
        collections.includes('collection-1'),
        'Collection list missing "collection-1"'
      );
      assert.ok(
        collections.includes('collection-2'),
        'Collection list missing "collection-2"'
      );
      assert.ok(
        collections.includes('collection-3'),
        'Collection list missing "collection-3"'
      );
      
      console.log(`✓ Collection list correctly returned ${collections.length} Collections`);
    } finally {
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('User requests list of existing Collections and no Collections exist', async () => {
    await setupCollectionsDirectory();
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);

    try {
      const collections = Collection.list();
      
      assert.ok(Array.isArray(collections), 'Collection list should return an array');
      assert.strictEqual(
        collections.length,
        0,
        'Collection list should be empty when no Collections exist'
      );
      
      console.log('✓ Empty Collection list correctly returned');
    } finally {
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('An internal error occurs when listing Collections', async () => {
    await setupCollectionsDirectory();
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);
    
    // Mock filesystem error during listing
    const fsStub = sinon.stub(fs, 'readdir').rejects(new Error('Filesystem error'));

    try {
      assert.throws(
        () => Collection.list(),
        (error: Error) => error.message === 'Unable to list the Collections',
        'Internal error during Collection listing should throw generic error'
      );
      
      console.log('✓ Internal list error properly handled');
    } finally {
      fsStub.restore();
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('User clears Collections', async () => {
    await setupCollectionsDirectory();
    await createExistingCollection('collection-1');
    await createExistingCollection('collection-2');
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);

    try {
      Collection.clear();
      
      const remainingCollections = await DirectoryFixtures.listDirectoryNames(collectionsDir);
      assert.strictEqual(
        remainingCollections.length,
        0,
        'Collections directory should be empty after clearing'
      );
      
      const collections = Collection.list();
      assert.strictEqual(
        collections.length,
        0,
        'Collection list should return empty array after clearing'
      );
      
      console.log('✓ Collections successfully cleared');
    } finally {
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('User attempts to clear an empty Collections directory', async () => {
    await setupCollectionsDirectory();
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);

    try {
      // Should not throw an error
      Collection.clear();
      
      const collections = Collection.list();
      assert.strictEqual(
        collections.length,
        0,
        'Collection list should return empty array after clearing empty directory'
      );
      
      console.log('✓ Empty Collections directory cleared without error');
    } finally {
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });

  test('An internal error occurs when the user attempts to clear the Collections directory', async () => {
    await setupCollectionsDirectory();
    await createExistingCollection('collection-1');
    
    const configStub = sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(collectionsDir);
    
    // Mock filesystem error during clearing
    const fsStub = sinon.stub(fs, 'readdir').rejects(new Error('Filesystem error'));

    try {
      assert.throws(
        () => Collection.clear(),
        (error: Error) => error.message === 'Unable to clear the Collections directory',
        'Internal error during Collections clearing should throw generic error'
      );
      
      await assertCollectionRemains('collection-1');
      console.log('✓ Internal clear error properly handled with Collections preserved');
    } finally {
      fsStub.restore();
      configStub.restore();
      await DirectoryFixtures.cleanup();
    }
  });
});