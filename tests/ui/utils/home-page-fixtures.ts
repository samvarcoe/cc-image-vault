import { CollectionsAPI } from '../../api/utils/collections-api-model';
import { CollectionsDirectoryFixtures } from '../../api/utils/collections-directory-fixtures';
import { Fixtures } from '../../utils/fixtures/base-fixtures';
import { CONFIG } from '../../../config';

interface CollectionListItem {
  id: string;
}

/**
 * UI fixtures for home page testing scenarios
 * Uses the existing API testing infrastructure to set up collections
 */
export class HomePageFixtures extends Fixtures<CollectionListItem[]> {
  private static collectionsAPI = new CollectionsAPI(CONFIG.UI_BASE_URL);

  /**
   * Creates an empty collections state for testing empty state UI
   */
  static async createEmptyCollectionsState(): Promise<CollectionListItem[]> {
    // Use existing directory fixtures to create clean state
    await CollectionsDirectoryFixtures.createEmpty();
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

    // Use existing directory fixtures and then create via API to ensure they're proper collections
    await CollectionsDirectoryFixtures.createEmpty();
    
    const createdCollections: CollectionListItem[] = [];

    // Create collections via API (this will create them properly with SQLite databases)
    for (const id of collectionIds) {
      await this.collectionsAPI['/api/collections'].post({ body: { id } });
      createdCollections.push({ id });
    }

    // Cleanup is handled by CollectionsDirectoryFixtures
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
    await CollectionsDirectoryFixtures.createEmpty();

    await this.collectionsAPI['/api/collections'].post({ body: { id: collectionId } });
    return { id: collectionId };
  }

  /**
   * Creates a collection with a specific ID that will be used to test duplicate ID scenarios
   */
  static async createCollectionForDuplicateTest(options: {
    existingId?: string;
  } = {}): Promise<{ existingCollection: CollectionListItem; duplicateId: string }> {
    
    const { existingId = 'duplicate-test-collection' } = options;

    await CollectionsDirectoryFixtures.createEmpty();
    await this.collectionsAPI['/api/collections'].post({ body: { id: existingId } });
    
    return { 
      existingCollection: { id: existingId }, 
      duplicateId: existingId // Same ID to trigger duplicate error
    };
  }

  /**
   * Creates collections for testing the first collection creation flow
   */
  static async createFirstCollectionScenario(): Promise<{ newCollectionId: string }> {
    await CollectionsDirectoryFixtures.createEmpty();
    return { newCollectionId: `first-collection-${Date.now()}` };
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

    const existingCollections = await this.createMultipleCollections({
      collectionIds: existingCollectionIds
    });

    return { existingCollections, newCollectionId };
  }
}