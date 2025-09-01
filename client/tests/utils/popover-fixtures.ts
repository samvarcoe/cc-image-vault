import { Collection } from '@/domain';
import { CollectionFixtures } from '../../../utils/fixtures/collection-fixtures';
import { ImageFixtures } from '../../../utils/fixtures/image-fixtures';

/**
 * Specialized fixtures for image popover testing
 * Creates collections with images of specific sizes relative to 1920x1080 viewport
 * 
 * Viewport with 5% margin: 1824x1026 effective area
 */
export class PopoverFixtures {
  private static readonly VIEWPORT_WIDTH = 1920;
  private static readonly VIEWPORT_HEIGHT = 1080;
  private static readonly MARGIN_PERCENT = 0.05;
  
  // Effective viewport area with 5% margin
  private static readonly EFFECTIVE_WIDTH = Math.floor(PopoverFixtures.VIEWPORT_WIDTH * (1 - PopoverFixtures.MARGIN_PERCENT * 2)); // 1824px
  private static readonly EFFECTIVE_HEIGHT = Math.floor(PopoverFixtures.VIEWPORT_HEIGHT * (1 - PopoverFixtures.MARGIN_PERCENT * 2)); // 1026px

  /**
   * Creates a collection with images designed for popover size testing
   */
  static async createCollectionWithVariedImageSizes(options: {
    collectionId?: string;
  } = {}): Promise<{
    collection: Collection;
    imageIds: {
      smallLandscape: string;
      smallPortrait: string;
      largeLandscape: string;
      largePortrait: string;
    };
  }> {
    const { collectionId = `popover-test-collection-${Date.now()}` } = options;

    // Create collection
    const collection = await CollectionFixtures.create({
      collectionId,
      imageCounts: { inbox: 0, collection: 0, archive: 0 }
    });

    // Small landscape image (fits within viewport with margin)
    const smallLandscapeFile = await ImageFixtures.create({
      width: 800, // Much smaller than effective width (1824px)
      height: 600, // Much smaller than effective height (1026px) 
      originalName: 'small-landscape',
      extension: 'jpeg'
    });

    // Small portrait image (fits within viewport with margin)
    const smallPortraitFile = await ImageFixtures.create({
      width: 600, // Much smaller than effective width (1824px)
      height: 800, // Much smaller than effective height (1026px)
      originalName: 'small-portrait', 
      extension: 'png'
    });

    // Large landscape image (exceeds viewport effective area)
    const largeLandscapeFile = await ImageFixtures.create({
      width: 2400, // Larger than effective width (1824px)
      height: 1600, // Larger than effective height (1026px)
      originalName: 'large-landscape',
      extension: 'webp'
    });

    // Large portrait image (exceeds viewport effective area)
    const largePortraitFile = await ImageFixtures.create({
      width: 1200, // Smaller than effective width but creates portrait ratio
      height: 1800, // Larger than effective height (1026px)
      originalName: 'large-portrait',
      extension: 'jpeg'
    });

    // Add all images to collection with COLLECTION status for display
    const smallLandscapeMetadata = await collection.addImage(smallLandscapeFile.filePath);
    await collection.updateImageStatus(smallLandscapeMetadata.id, 'COLLECTION');

    const smallPortraitMetadata = await collection.addImage(smallPortraitFile.filePath);
    await collection.updateImageStatus(smallPortraitMetadata.id, 'COLLECTION');

    const largeLandscapeMetadata = await collection.addImage(largeLandscapeFile.filePath);
    await collection.updateImageStatus(largeLandscapeMetadata.id, 'COLLECTION');

    const largePortraitMetadata = await collection.addImage(largePortraitFile.filePath);
    await collection.updateImageStatus(largePortraitMetadata.id, 'COLLECTION');

    return {
      collection,
      imageIds: {
        smallLandscape: smallLandscapeMetadata.id,
        smallPortrait: smallPortraitMetadata.id,
        largeLandscape: largeLandscapeMetadata.id,
        largePortrait: largePortraitMetadata.id
      }
    };
  }

  /**
   * Creates a collection with a single image for basic popover functionality testing
   */
  static async createCollectionWithSingleImage(options: {
    collectionId?: string;
    imageSize?: 'small' | 'large';
    orientation?: 'landscape' | 'portrait';
  } = {}): Promise<{
    collection: Collection;
    imageId: string;
  }> {
    const { 
      collectionId = `single-image-collection-${Date.now()}`,
      imageSize = 'small',
      orientation = 'landscape'
    } = options;

    // Create collection
    const collection = await CollectionFixtures.create({
      collectionId,
      imageCounts: { inbox: 0, collection: 0, archive: 0 }
    });

    let width: number, height: number;

    if (imageSize === 'small') {
      if (orientation === 'landscape') {
        width = 800;
        height = 600;
      } else {
        width = 600;
        height = 800;
      }
    } else { // large
      if (orientation === 'landscape') {
        width = 2400;
        height = 1600;
      } else {
        width = 1200;
        height = 1800;
      }
    }

    const imageFile = await ImageFixtures.create({
      width,
      height,
      originalName: `${imageSize}-${orientation}`,
      extension: 'jpeg'
    });

    const imageMetadata = await collection.addImage(imageFile.filePath);
    await collection.updateImageStatus(imageMetadata.id, 'COLLECTION');

    return {
      collection,
      imageId: imageMetadata.id
    };
  }

  /**
   * Creates a collection with multiple images for interaction testing
   */
  static async createCollectionWithMultipleImages(options: {
    collectionId?: string;
    imageCount?: number;
  } = {}): Promise<{
    collection: Collection;
    imageIds: string[];
  }> {
    const { 
      collectionId = `multi-image-collection-${Date.now()}`,
      imageCount = 3
    } = options;

    // Create collection
    const collection = await CollectionFixtures.create({
      collectionId,
      imageCounts: { inbox: 0, collection: 0, archive: 0 }
    });

    const imageIds: string[] = [];

    for (let i = 0; i < imageCount; i++) {
      const imageFile = await ImageFixtures.create({
        width: 800 + i * 100, // Vary sizes slightly
        height: 600 + i * 75,
        originalName: `test-image-${i + 1}`,
        extension: i % 2 === 0 ? 'jpeg' : 'png'
      });

      const imageMetadata = await collection.addImage(imageFile.filePath);
      await collection.updateImageStatus(imageMetadata.id, 'COLLECTION');
      imageIds.push(imageMetadata.id);
    }

    return {
      collection,
      imageIds
    };
  }

  /**
   * Get viewport dimensions and effective area for reference in tests
   */
  static getViewportInfo() {
    return {
      viewport: {
        width: PopoverFixtures.VIEWPORT_WIDTH,
        height: PopoverFixtures.VIEWPORT_HEIGHT
      },
      effective: {
        width: PopoverFixtures.EFFECTIVE_WIDTH,
        height: PopoverFixtures.EFFECTIVE_HEIGHT
      },
      marginPercent: PopoverFixtures.MARGIN_PERCENT
    };
  }
}