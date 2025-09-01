import { promises as fs } from 'fs';
import path from 'path';
import { Fixtures, DirectoryFixtures } from '@/utils';
import { Collection } from '@/domain';

/**
 * Simplified fixtures for managing collection directory state in API tests
 * Uses domain Collection class for proper collection creation
 */
export class CollectionsDirectoryFixtures extends Fixtures<Collection[]> {

  /**
   * Creates multiple collections using the Collection domain class
   */
  static async createWithExistingCollections(options: {
    collectionIds?: string[];
  } = {}): Promise<Collection[]> {
    const {
      collectionIds = ['collection-1', 'collection-2', 'collection-3']
    } = options;

    const collections: Collection[] = [];
    for (const collectionId of collectionIds) {
      const collection = await Collection.create(collectionId);
      collections.push(collection);
    }

    return collections;
  }

  /**
   * Ensures a clean private directory for testing empty state
   */
  static async createEmpty(): Promise<Collection[]> {
    const privateDir = path.join('/workspace/projects/image-vault', 'private');
    await DirectoryFixtures.ensureExists(privateDir);
    await DirectoryFixtures.clearContents(privateDir);
    return [];
  }

  // Utility methods for filesystem checks (these should eventually be moved to domain tests)
  
  /**
   * @deprecated Use Collection domain methods instead of direct filesystem checks
   */
  static async collectionExists(privateDir: string, collectionId: string): Promise<boolean> {
    const collectionPath = path.join(privateDir, collectionId);
    return await DirectoryFixtures.exists(collectionPath);
  }

  /**
   * @deprecated Use Collection domain methods instead of direct filesystem checks
   */
  static async countCollections(privateDir: string): Promise<number> {
    return await DirectoryFixtures.countDirectories(privateDir);
  }
}