import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { Collection } from '@/domain';
import { ImageStatus } from '../../domain/types';
import { Fixtures } from './base-fixtures';
import { ImageFixtures } from './image-fixtures';
import { CONFIG } from '../../config';
import FakeTimers from '@sinonjs/fake-timers';

/**
 * Collection fixtures for creating collections with pre-populated images
 */
export class CollectionFixtures extends Fixtures<Collection> {
  static async clearDirectory(): Promise<void> {
    const contents = await fs.readdir(CONFIG.COLLECTIONS_DIRECTORY).catch(() => []);

    for (const item of contents) {
      const itemPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, item);
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

    const basePath = useTmpDir ? await fs.mkdtemp(path.join(tmpdir(), 'collection-fixture-')) : CONFIG.COLLECTIONS_DIRECTORY;
    
    const collectionPath = path.join(basePath, collectionId);

    console.log(`Creating collection fixture: ${collectionId} at ${collectionPath}`);

    const collection = useTmpDir ? await Collection.create(collectionId, basePath) : await Collection.create(collectionId);

    // sizes and aspect ratios should vary for testing
    // vary between a max amd min width/height transitioning from landscape to portrait

    const maxWidth = 640;
    const minWidth = 320;
    const maxHeight = 640;
    const minHeight = 320;

    const variedWidth = (i: number, total: number) => Math.round(minWidth + (i/total) * (maxWidth - minWidth));
    const variedHeight = (i: number, total: number) => Math.round(maxHeight - (i/total) * (maxHeight - minHeight));

    for (let i = 0; i < imageCounts.inbox ; i++) {
      const imageFile = await ImageFixtures.create({
        originalName: `inbox-photo-${i + 1}`,
        extension: imageFormats[i % imageFormats.length],
        width: variedWidth(i, imageCounts.inbox),
        height: variedHeight(i, imageCounts.inbox)
      });

      await collection.addImage(imageFile.filePath);
    }

    for (let i = 0; i < imageCounts.collection ; i++) {
      const imageFile = await ImageFixtures.create({
        originalName: `collection-photo-${i + 1}`,
        extension: imageFormats[i % imageFormats.length],
        width: variedWidth(i, imageCounts.collection),
        height: variedHeight(i, imageCounts.collection)
      });

      const imageMetadata = await collection.addImage(imageFile.filePath);
      await collection.updateImageStatus(imageMetadata.id, 'COLLECTION');
    }

    for (let i = 0; i < imageCounts.archive ; i++) {
      const imageFile = await ImageFixtures.create({
        originalName: `archive-photo-${i + 1}`,
        extension: imageFormats[i % imageFormats.length],
        width: variedWidth(i, imageCounts.archive),
        height: variedHeight(i, imageCounts.archive)
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
      collection = customBasePath ? await Collection.create(collectionId, basePath) : await Collection.create(collectionId);

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
