import { CollectionsAPI } from '../../api/utils/collections-api-model';
import { Fixtures } from '../../utils/fixtures/base-fixtures';

interface CollectionListItem {
  id: string;
}

/**
 * UI fixtures for home page testing scenarios
 * Uses the API layer to set up collections for UI testing
 */
export class HomePageFixtures extends Fixtures<CollectionListItem[]> {
  private static collectionsAPI = new CollectionsAPI('http://claude-code:3000');

  /**
   * Creates an empty collections state for testing empty state UI
   */
  static async createEmptyCollectionsState(): Promise<CollectionListItem[]> {
    // Ensure we start with a clean slate by deleting any existing collections
    const existingCollections = await this.collectionsAPI.listCollections();
    
    for (const collection of existingCollections) {
      await this.collectionsAPI.deleteCollection(collection.id);
    }

    const cleanup = async () => {
      // No cleanup needed - collections were already cleaned up
    };

    this.addCleanup(cleanup);
    return [];
  }

  /**
   * Creates multiple collections for alphabetical sorting tests
   */
  static async createMultipleCollections(options: {
    collectionIds?: string[];
  } = {}): Promise<CollectionListItem[]> {
    
    const {
      collectionIds = ['zebra-photos', 'alpha-collection', 'mid-range-pics', 'beta-images']
    } = options;

    // Ensure clean state first
    await this.createEmptyCollectionsState();

    const createdCollections: CollectionListItem[] = [];

    // Create collections in the specified order
    for (const id of collectionIds) {
      await this.collectionsAPI.createCollection({ id });
      createdCollections.push({ id });
    }

    const cleanup = async () => {
      // Delete all created collections
      for (const collection of createdCollections) {
        try {
          await this.collectionsAPI.deleteCollection(collection.id);
        } catch {
          // Non-fatal cleanup error
        }
      }
    };

    this.addCleanup(cleanup);
    return createdCollections;
  }

  /**
   * Creates collections specifically for deletion testing
   */
  static async createCollectionForDeletion(options: {
    collectionId?: string;
  } = {}): Promise<CollectionListItem> {
    
    const { collectionId = `deletion-test-${Date.now()}` } = options;

    // Ensure clean state
    await this.createEmptyCollectionsState();

    await this.collectionsAPI.createCollection({ id: collectionId });
    const collection = { id: collectionId };

    const cleanup = async () => {
      try {
        await this.collectionsAPI.deleteCollection(collectionId);
      } catch {
        // Non-fatal cleanup error - collection may already be deleted by test
      }
    };

    this.addCleanup(cleanup);
    return collection;
  }

  /**
   * Creates a collection with a specific ID that will be used to test duplicate ID scenarios
   */
  static async createCollectionForDuplicateTest(options: {
    existingId?: string;
  } = {}): Promise<{ existingCollection: CollectionListItem; duplicateId: string }> {
    
    const { existingId = 'duplicate-test-collection' } = options;

    // Ensure clean state
    await this.createEmptyCollectionsState();

    await this.collectionsAPI.createCollection({ id: existingId });
    const existingCollection = { id: existingId };

    const cleanup = async () => {
      try {
        await this.collectionsAPI.deleteCollection(existingId);
      } catch {
        // Non-fatal cleanup error
      }
    };

    this.addCleanup(cleanup);
    return { 
      existingCollection, 
      duplicateId: existingId // Same ID to trigger duplicate error
    };
  }

  /**
   * Creates collections for testing the first collection creation flow
   */
  static async createFirstCollectionScenario(): Promise<{ newCollectionId: string }> {
    // Start with empty state
    await this.createEmptyCollectionsState();

    const newCollectionId = `first-collection-${Date.now()}`;

    const cleanup = async () => {
      try {
        await this.collectionsAPI.deleteCollection(newCollectionId);
      } catch {
        // Non-fatal cleanup error - collection may not have been created if test failed
      }
    };

    this.addCleanup(cleanup);
    return { newCollectionId };
  }

  /**
   * Creates collections for testing additional collection creation
   */
  static async createAdditionalCollectionScenario(options: {
    existingCollectionIds?: string[];
    newCollectionId?: string;
  } = {}): Promise<{ existingCollections: CollectionListItem[]; newCollectionId: string }> {
    
    const {
      existingCollectionIds = ['existing-collection-1', 'existing-collection-2'],
      newCollectionId = `additional-collection-${Date.now()}`
    } = options;

    // Create existing collections
    const existingCollections = await this.createMultipleCollections({
      collectionIds: existingCollectionIds
    });

    const cleanup = async () => {
      try {
        // Try to cleanup the new collection (may not exist if test failed)
        await this.collectionsAPI.deleteCollection(newCollectionId);
      } catch {
        // Non-fatal cleanup error
      }
      // Existing collections cleanup is already handled by createMultipleCollections
    };

    this.addCleanup(cleanup);
    return { existingCollections, newCollectionId };
  }
}