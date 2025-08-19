import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { Collection } from '../../../src/domain/collection';
import { ImageStatus } from '../../../src/domain/types';
import { Fixtures } from './base-fixtures';
import { ImageFixtures } from './image-fixtures';
import FakeTimers from '@sinonjs/fake-timers';

/**
 * Collection fixtures for creating collections with pre-populated images
 */
export class CollectionFixtures extends Fixtures<Collection> {
  static async create(options: {
    collectionId?: string;
    imageCounts?: {
      inbox?: number;
      collection?: number;
      archive?: number;
    };
    includeCorruptImages?: boolean;
    includeDuplicates?: boolean;
    simulateDatabaseIssues?: boolean;
    imageFormats?: Array<'jpeg' | 'png' | 'webp'>;
  } = {}): Promise<Collection> {

    const {
      collectionId = `test-collection-${Date.now()}`,
      imageCounts = { inbox: 2, collection: 2, archive: 1 },
      includeCorruptImages = false,
      includeDuplicates = false,
      simulateDatabaseIssues = false,
      imageFormats = ['jpeg', 'png', 'webp']
    } = options;

    const basePath = await fs.mkdtemp(path.join(tmpdir(), 'collection-fixture-'));
    
    // Create the collection
    let collection: Collection;
    try {
      collection = await Collection.create(collectionId, basePath);
    } catch (error) {
      if (simulateDatabaseIssues) {
        // Re-throw for testing error scenarios
        throw error;
      }
      throw new Error(`Collection fixture creation failed for "${collectionId}": ${error}`);
    }

    // Create images for each status
    const statuses: Array<{ status: ImageStatus; count: number }> = [
      { status: 'INBOX', count: imageCounts.inbox || 0 },
      { status: 'COLLECTION', count: imageCounts.collection || 0 },
      { status: 'ARCHIVE', count: imageCounts.archive || 0 }
    ];

    const allImageFiles: any[] = [];

    for (const { status, count } of statuses) {
      for (let i = 0; i < count; i++) {
        const format = imageFormats[i % imageFormats.length];
        const shouldCorrupt = includeCorruptImages && i === count - 1;

        try {
          const imageFile = await ImageFixtures.create({
            imageId: `${status.toLowerCase()}-image-${i + 1}`,
            format,
            originalName: `${status.toLowerCase()}-photo-${i + 1}.${format === 'jpeg' ? 'jpg' : format}`,
            simulateCorruption: shouldCorrupt
          });

          allImageFiles.push(imageFile);

          // Add image to collection
          const imageMetadata = await collection.addImage(imageFile.filePath);
          
          // Update status if not INBOX (default)
          if (status !== 'INBOX') {
            await collection.updateImageStatus(imageMetadata.id, status);
          }

        } catch (error) {
          if (shouldCorrupt) {
            // Expected to fail for corrupt images
            continue;
          }
          throw new Error(`Collection fixture failed to add image ${i + 1} with status ${status}: ${error}`);
        }
      }
    }

    // Create duplicate images if requested
    if (includeDuplicates && allImageFiles.length > 0) {
      const originalImage = allImageFiles[0];
      const duplicates = await ImageFixtures.createDuplicates({
        originalImage,
        count: 2,
        differentNames: true
      });

      // Try to add the duplicate (should fail)
      for (let i = 1; i < duplicates.length; i++) {
        try {
          await collection.addImage(duplicates[i].filePath);
          // If we reach here, duplicate detection failed
          throw new Error('Duplicate detection should have prevented this addition');
        } catch (error: any) {
          if (!error.message.includes('Duplicate Image')) {
            throw new Error(`Duplicate detection test failed: expected "Duplicate Image" error but got "${error.message}"`);
          }
          // Expected duplicate error - continue
        }
      }
    }

    const cleanup = async () => {
      try {
        // Collection cleanup will be handled by its own database connection cleanup
        await fs.rm(basePath, { recursive: true, force: true });
      } catch (error) {
        // Fixture cleanup errors are non-fatal but should be tracked
      }
    };

    this.addCleanup(cleanup);
    return collection;
  }

  /**
   * Creates a collection with images in multiple statuses for filtering tests
   */
  static async createWithMixedStatuses(options: {
    collectionId?: string;
    statusCounts?: Record<ImageStatus, number>;
  } = {}): Promise<Collection> {

    const {
      collectionId = `mixed-status-collection-${Date.now()}`,
      statusCounts = { 'INBOX': 3, 'COLLECTION': 5, 'ARCHIVE': 2 }
    } = options;

    return this.create({
      collectionId,
      imageCounts: {
        inbox: statusCounts.INBOX,
        collection: statusCounts.COLLECTION,
        archive: statusCounts.ARCHIVE
      }
    });
  }

  /**
   * Creates a collection with no images (empty collection)
   */
  static async createEmpty(options: {
    collectionId?: string;
  } = {}): Promise<Collection> {

    const { collectionId = `empty-collection-${Date.now()}` } = options;

    return this.create({
      collectionId,
      imageCounts: { inbox: 0, collection: 0, archive: 0 }
    });
  }

  /**
   * Creates a collection with processing failure scenarios
   */
  static async createWithFailures(options: {
    collectionId?: string;
    failureType?: 'processing' | 'storage' | 'duplicate';
  } = {}): Promise<Collection> {

    const {
      collectionId = `failure-test-collection-${Date.now()}`,
      failureType = 'processing'
    } = options;

    const baseOptions = {
      collectionId,
      imageCounts: { inbox: 1, collection: 0, archive: 0 }
    };

    switch (failureType) {
      case 'processing':
        return this.create({
          ...baseOptions,
          includeCorruptImages: true
        });
      
      case 'duplicate':
        return this.create({
          ...baseOptions,
          imageCounts: { inbox: 2, collection: 0, archive: 0 },
          includeDuplicates: true
        });
      
      case 'storage':
        return this.create({
          ...baseOptions,
          simulateDatabaseIssues: true
        });
      
      default:
        throw new Error(`Unknown failure type: ${failureType}`);
    }
  }

  /**
   * Creates a collection for database error testing
   */
  static async createWithDatabaseIssues(options: {
    collectionId?: string;
    issueType?: 'connection' | 'corruption' | 'permissions';
  } = {}): Promise<Collection> {

    const {
      collectionId = `db-issue-collection-${Date.now()}`,
      issueType = 'connection'
    } = options;

    // Create normal collection first
    const collection = await this.create({
      collectionId,
      imageCounts: { inbox: 2, collection: 1, archive: 1 }
    });

    // Then simulate the database issue
    const collectionPath = collection.basePath;
    const dbPath = path.join(collectionPath, collectionId, 'collection.db');

    // Close the existing database connection first
    await collection.close();

    switch (issueType) {
      case 'corruption':
        // Corrupt the database file
        await fs.writeFile(dbPath, 'CORRUPTED_DATABASE_DATA');
        break;
      
      case 'permissions':
        // Remove read permissions
        await fs.chmod(dbPath, 0o000);
        break;
      
      case 'connection':
        // Delete the database file entirely
        await fs.unlink(dbPath);
        break;
    }

    // The collection now has a closed connection and corrupted database
    return collection;
  }

  /**
   * Creates a collection with images having staggered creation times for ordering tests
   * Uses fake timers to ensure actual database timestamp differences
   */
  static async createWithVariedImageCreationTimes(options: {
    collectionId?: string;
    imageCount?: number;
    statusDistribution?: { status: ImageStatus; count: number }[];
    timeSpreadMinutes?: number;
  } = {}): Promise<Collection> {

    const {
      collectionId = `time-varied-collection-${Date.now()}`,
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

    const basePath = await fs.mkdtemp(path.join(tmpdir(), 'time-collection-fixture-'));
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
            imageId: `time-image-${imageIndex + 1}`,
            originalName: `${status.toLowerCase()}-photo-${i + 1}.jpg`,
            format: 'jpeg'
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
      } catch (error) {
        // Non-fatal cleanup error
      }
    };

    this.addCleanup(cleanup);
    return collection;
  }

  /**
   * Creates a collection with a large number of images for pagination testing
   */
  static async createWithLargeImageSet(options: {
    collectionId?: string;
    totalImages?: number;
    statusDistribution?: Record<ImageStatus, number>;
  } = {}): Promise<Collection> {

    const {
      collectionId = `large-collection-${Date.now()}`,
      totalImages = 250,
      statusDistribution = {
        'INBOX': Math.floor(totalImages * 0.4),
        'COLLECTION': Math.floor(totalImages * 0.4), 
        'ARCHIVE': Math.floor(totalImages * 0.2)
      }
    } = options;

    const basePath = await fs.mkdtemp(path.join(tmpdir(), 'large-collection-fixture-'));
    const collection = await Collection.create(collectionId, basePath);

    // Create images in batches for better performance
    const statuses: ImageStatus[] = ['INBOX', 'COLLECTION', 'ARCHIVE'];
    let imageIndex = 0;

    for (const status of statuses) {
      const count = statusDistribution[status];
      
      // Create images in batches of 20 for performance
      const batchSize = 20;
      for (let batchStart = 0; batchStart < count; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, count);
        const batchPromises = [];

        for (let i = batchStart; i < batchEnd; i++) {
          const promise = (async () => {
            const format = ['jpeg', 'png', 'webp'][i % 3] as 'jpeg' | 'png' | 'webp';
            const imageFile = await ImageFixtures.create({
              imageId: `large-image-${imageIndex + 1}`,
              originalName: `${status.toLowerCase()}-batch-${Math.floor(i / batchSize)}-image-${(i % batchSize) + 1}.${format === 'jpeg' ? 'jpg' : format}`,
              format,
              includeVisualContent: false // Use minimal images for performance
            });

            const imageMetadata = await collection.addImage(imageFile.filePath);
            
            if (status !== 'INBOX') {
              await collection.updateImageStatus(imageMetadata.id, status);
            }

            imageIndex++;
          })();
          
          batchPromises.push(promise);
        }

        // Wait for batch to complete before starting next batch
        await Promise.all(batchPromises);
      }
    }

    const cleanup = async () => {
      try {
        await fs.rm(basePath, { recursive: true, force: true });
      } catch (error) {
        // Non-fatal cleanup error
      }
    };

    this.addCleanup(cleanup);
    return collection;
  }

  /**
   * Creates a collection with specific images in ARCHIVE status for deletion testing
   */
  static async createWithArchiveImages(options: {
    collectionId?: string;
    archiveImageCount?: number;
  } = {}): Promise<{ collection: Collection; archiveImageIds: string[] }> {

    const {
      collectionId = `archive-test-collection-${Date.now()}`,
      archiveImageCount = 1
    } = options;

    const collection = await this.create({
      collectionId,
      imageCounts: { inbox: 0, collection: 0, archive: archiveImageCount }
    });

    // Get the archive images that were created
    const archiveImages = await collection.getImages({ status: 'ARCHIVE' });
    const archiveImageIds = archiveImages.map(img => img.id);

    return { collection, archiveImageIds };
  }
}