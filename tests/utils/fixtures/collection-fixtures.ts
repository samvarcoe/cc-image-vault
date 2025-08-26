import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { Collection } from '../../../src/domain/collection';
import { ImageStatus } from '../../../src/domain/types';
import { Fixtures } from './base-fixtures';
import { ImageFixtures } from './image-fixtures';
import FakeTimers from '@sinonjs/fake-timers';

const COLLECTIONS_DIRECTORY = '/workspace/image-vault/private';

/**
 * Collection fixtures for creating collections with pre-populated images
 */
export class CollectionFixtures extends Fixtures<Collection> {
  static async clearDirectory(): Promise<void> {
    const contents = await fs.readdir(COLLECTIONS_DIRECTORY).catch(() => []);

    for (const item of contents) {
      const itemPath = path.join(COLLECTIONS_DIRECTORY, item);
      await fs.rm(itemPath, { recursive: true, force: true }).catch(() => {});
    }
  };
  
  static async create(options: {
    collectionId?: string;
    useTmpDir?: boolean;
    imageCounts?: {
      inbox: number;
      collection: number;
      archive: number;
    };
    imageFormats?: Array<'jpeg' | 'png' | 'webp'>;
  } = {}): Promise<Collection> {

    const {
      collectionId = `test-collection-${Date.now()}`,
      useTmpDir = false,
      imageCounts = { inbox: 0, collection: 0, archive: 0 },
      imageFormats = ['jpeg', 'png', 'webp']
    } = options;

    const basePath = useTmpDir ? await fs.mkdtemp(path.join(tmpdir(), 'collection-fixture-')) : COLLECTIONS_DIRECTORY;
    
    const collectionPath = path.join(basePath, collectionId);

    console.log(`Creating collection fixture: ${collectionId} at ${collectionPath}`);

    const collection = await Collection.create(collectionId, basePath);

    for (let i = 0; i < imageCounts.inbox ; i++) {
      const imageFile = await ImageFixtures.create({
        originalName: `inbox-photo-${i + 1}`,
        extension: imageFormats[i % imageFormats.length]
      });

      await collection.addImage(imageFile.filePath);
    }

    for (let i = 0; i < imageCounts.collection ; i++) {
      const imageFile = await ImageFixtures.create({
        originalName: `collection-photo-${i + 1}`,
        extension: imageFormats[i % imageFormats.length]
      });

      const imageMetadata = await collection.addImage(imageFile.filePath);
      await collection.updateImageStatus(imageMetadata.id, 'COLLECTION');
    }

    for (let i = 0; i < imageCounts.archive ; i++) {
      const imageFile = await ImageFixtures.create({
        originalName: `archive-photo-${i + 1}`,
        extension: imageFormats[i % imageFormats.length]
      });

      const imageMetadata = await collection.addImage(imageFile.filePath);
      await collection.updateImageStatus(imageMetadata.id, 'ARCHIVE');
    };

    const cleanup = async () => {
      await fs.rm(collectionPath, { recursive: true, force: true })
        .catch(() => { console.warn(`Failed to remove collection directory at ${collectionPath}` );});
    };

    this.addCleanup(cleanup);

    console.log(`✓ Collection fixture created`);
    return collection;
  }

  /**
   * Creates a collection with images having staggered creation times for ordering tests
   * Uses fake timers to ensure actual database timestamp differences
   */
  static async createWithVariedImageCreationTimes(options: {
    collectionId?: string;
    basePath?: string;
    imageCount?: number;
    statusDistribution?: { status: ImageStatus; count: number }[];
    timeSpreadMinutes?: number;
  } = {}): Promise<Collection> {

    const {
      collectionId = `time-varied-collection-${Date.now()}`,
      basePath: customBasePath,
      imageCount = 6,
      statusDistribution = [
        { status: 'INBOX', count: 2 },
        { status: 'COLLECTION', count: 2 },
        { status: 'ARCHIVE', count: 2 }
      ],
      timeSpreadMinutes = 30
    } = options;

    // Setup fake timers to control time progression
    const baseTime = Date.now();
    const clock = FakeTimers.install({
      now: baseTime,
      toFake: ['Date'] // Only fake Date-related methods
    });

    const basePath = customBasePath || await fs.mkdtemp(path.join(tmpdir(), 'time-collection-fixture-'));
    let collection: Collection;

    try {
      collection = await Collection.create(collectionId, basePath);

      // Calculate time increment for even distribution
      const timeIncrement = (timeSpreadMinutes * 60 * 1000) / imageCount;
      
      let imageIndex = 0;
      for (const { status, count } of statusDistribution) {
        for (let i = 0; i < count; i++) {
          // Advance time to the target timestamp for this image
          if (imageIndex > 0) {
            clock.tick(timeIncrement);
          }
          
          const imageFile = await ImageFixtures.create({
            originalName: `${status.toLowerCase()}-photo-${i + 1}`,
          });

          // Add image to collection - this will use the fake time
          const imageMetadata = await collection.addImage(imageFile.filePath);
          
          // Update status if not INBOX (this also updates updated_at timestamp)
          if (status !== 'INBOX') {
            await collection.updateImageStatus(imageMetadata.id, status);
          }

          imageIndex++;
        }
      }

    } finally {
      // Always restore real timers
      clock.uninstall();
    }

    const cleanup = async () => {
      try {
        await fs.rm(basePath, { recursive: true, force: true });
      } catch {
        // Non-fatal cleanup error
      }
    };

    this.addCleanup(cleanup);
    return collection;
  }
}
