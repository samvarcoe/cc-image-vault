import { promises as fs } from 'fs';
import path from 'path';
import { Fixtures } from '../../utils/fixtures/base-fixtures';

export interface DirectoryState {
  privateDir: string;
  collectionDirs: string[];
}

/**
 * Fixtures for managing the ./private directory and collection state
 * Used specifically for API testing where we need to control filesystem state
 */
export class CollectionsDirectoryFixtures extends Fixtures<DirectoryState> {
  
  static async create(options: {
    baseDir?: string;
    existingCollections?: string[];
    simulatePermissionIssues?: boolean;
  } = {}): Promise<DirectoryState> {

    const {
      baseDir = '/workspace/image-vault',
      existingCollections = [],
      simulatePermissionIssues = false
    } = options;

    const privateDir = path.join(baseDir, 'private');

    // Ensure private directory exists
    try {
      await fs.mkdir(privateDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's okay
    }

    // Create any requested existing collections
    const collectionDirs: string[] = [];
    for (const collectionId of existingCollections) {
      const collectionPath = path.join(privateDir, collectionId);
      await fs.mkdir(collectionPath, { recursive: true });
      
      // Create a minimal collection.db file to make it look like a real collection
      const dbPath = path.join(collectionPath, 'collection.db');
      await fs.writeFile(dbPath, ''); // Empty SQLite file
      
      collectionDirs.push(collectionPath);
    }

    if (simulatePermissionIssues) {
      // Remove write permissions from the private directory
      await fs.chmod(privateDir, 0o444);
    }

    const cleanup = async () => {
      try {
        // Restore permissions if they were changed
        if (simulatePermissionIssues) {
          await fs.chmod(privateDir, 0o755);
        }

        // Clean up any collections that were created during testing
        const entries = await fs.readdir(privateDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            await fs.rm(path.join(privateDir, entry.name), { recursive: true, force: true });
          }
        }
      } catch (error) {
        // Cleanup errors are logged but not fatal
        console.warn(`Collections directory cleanup warning: ${error}`);
      }
    };

    this.addCleanup(cleanup);

    return {
      privateDir,
      collectionDirs
    };
  }

  /**
   * Creates state with multiple existing collections for listing tests
   */
  static async createWithExistingCollections(options: {
    collectionIds?: string[];
    baseDir?: string;
  } = {}): Promise<DirectoryState> {

    const {
      collectionIds = ['collection-1', 'collection-2', 'collection-3'],
      baseDir
    } = options;

    return this.create({
      baseDir,
      existingCollections: collectionIds
    });
  }

  /**
   * Creates empty private directory for testing empty state
   */
  static async createEmpty(options: {
    baseDir?: string;
  } = {}): Promise<DirectoryState> {

    return this.create({
      baseDir: options.baseDir,
      existingCollections: []
    });
  }

  /**
   * Creates state with permission issues for error testing
   */
  static async createWithPermissionIssues(options: {
    baseDir?: string;
  } = {}): Promise<DirectoryState> {

    return this.create({
      baseDir: options.baseDir,
      existingCollections: [],
      simulatePermissionIssues: true
    });
  }

  /**
   * Utility to check if a collection directory exists
   */
  static async collectionExists(privateDir: string, collectionId: string): Promise<boolean> {
    try {
      const collectionPath = path.join(privateDir, collectionId);
      const stat = await fs.stat(collectionPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Utility to count collections in the private directory
   */
  static async countCollections(privateDir: string): Promise<number> {
    try {
      const entries = await fs.readdir(privateDir, { withFileTypes: true });
      return entries.filter(entry => entry.isDirectory()).length;
    } catch {
      return 0;
    }
  }

  /**
   * Utility to list all collection IDs in the private directory
   */
  static async listCollectionIds(privateDir: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(privateDir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();
    } catch {
      return [];
    }
  }
}