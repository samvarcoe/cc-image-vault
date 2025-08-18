import { promises as fs } from 'fs';
import path from 'path';
import { Collection } from '../domain/collection';

export interface CollectionInfo {
  id: string;
}

export class CollectionsService {
  private basePath: string;

  constructor(basePath: string = './private') {
    this.basePath = path.resolve(basePath);
  }

  /**
   * Lists all collections by scanning the base directory
   */
  async listCollections(): Promise<CollectionInfo[]> {
    try {
      // Ensure base path exists
      await fs.mkdir(this.basePath, { recursive: true });
      
      // Read directory contents
      const entries = await fs.readdir(this.basePath, { withFileTypes: true });
      
      // Filter for directories and return collection info
      const collections: CollectionInfo[] = [];
      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Verify it's a valid collection by checking for collection.db
          const dbPath = path.join(this.basePath, entry.name, 'collection.db');
          try {
            await fs.access(dbPath);
            collections.push({ id: entry.name });
          } catch {
            // Skip directories without collection.db
          }
        }
      }
      
      return collections.sort((a, b) => a.id.localeCompare(b.id));
    } catch (error: any) {
      if (error.code === 'EACCES' || error.code === 'EPERM') {
        throw new Error('Server error: insufficient permissions to access collections directory');
      }
      throw new Error('Server error: failed to list collections');
    }
  }

  /**
   * Creates a new collection with the given ID
   */
  async createCollection(id: string): Promise<CollectionInfo> {
    // Validate collection ID
    if (!this.isValidCollectionId(id)) {
      throw new Error('Invalid collection ID format');
    }

    // Check if collection already exists
    if (await this.collectionExists(id)) {
      throw new Error('Duplicate collection ID');
    }

    try {
      // Use domain layer to create collection
      const collection = await Collection.create(id, this.basePath);
      await collection.close();
      
      return { id };
    } catch (error: any) {
      if (error.message.includes('insufficient permissions')) {
        throw new Error('Server error: insufficient permissions to create collection');
      }
      if (error.message.includes('Unable to create Collection')) {
        throw new Error('Server error: failed to create collection');
      }
      throw new Error('Server error: ' + error.message);
    }
  }

  /**
   * Retrieves a collection by ID
   */
  async getCollection(id: string): Promise<CollectionInfo> {
    if (!await this.collectionExists(id)) {
      throw new Error('Collection not found');
    }
    
    return { id };
  }

  /**
   * Deletes a collection and all its contents
   */
  async deleteCollection(id: string): Promise<void> {
    if (!await this.collectionExists(id)) {
      throw new Error('Collection not found');
    }

    try {
      const collectionPath = path.join(this.basePath, id);
      await fs.rm(collectionPath, { recursive: true, force: true });
    } catch (error: any) {
      if (error.code === 'EACCES' || error.code === 'EPERM') {
        throw new Error('Server error: insufficient permissions to delete collection');
      }
      throw new Error('Server error: failed to delete collection');
    }
  }

  /**
   * Checks if a collection exists
   */
  private async collectionExists(id: string): Promise<boolean> {
    try {
      const collectionPath = path.join(this.basePath, id);
      const dbPath = path.join(collectionPath, 'collection.db');
      
      const [stat, _] = await Promise.all([
        fs.stat(collectionPath),
        fs.access(dbPath)
      ]);
      
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Validates collection ID for filesystem safety
   */
  private isValidCollectionId(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }

    // Check for empty string
    if (id.trim().length === 0) {
      return false;
    }

    // Check for directory traversal attempts
    if (id === '.' || id === '..') {
      return false;
    }

    // Check for filesystem-unsafe characters
    const unsafeChars = /[\/\\:*?"<>|]/;
    if (unsafeChars.test(id)) {
      return false;
    }

    // Additional restrictions for safety
    if (id.startsWith('.') || id.endsWith('.')) {
      return false;
    }

    return true;
  }
}