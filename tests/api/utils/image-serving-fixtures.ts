import { promises as fs } from 'fs';
import path from 'path';
import { Fixtures } from '../../utils/fixtures/base-fixtures';
import { ImageFixtures } from '../../utils/fixtures/image-fixtures';
import { Collection } from '../../../src/domain/collection';
import sharp from 'sharp';

export interface ImageServingState {
  collectionPath: string;
  collectionId: string;
  images: {
    id: string;
    originalPath: string;
    thumbnailPath?: string;
    metadata: {
      originalName: string;
      size: number;
      dimensions: { width: number; height: number };
      mimeType: string;
      extension: string;
    };
  }[];
}

/**
 * Fixtures for creating realistic collections with images and thumbnails for serving tests
 */
export class ImageServingFixtures extends Fixtures<ImageServingState> {
  
  static async create(options: {
    collectionId?: string;
    baseDir?: string;
    imageCount?: number;
    includeAllThumbnails?: boolean;
    missingThumbnailImageIds?: string[];
    imageFormats?: Array<'jpeg' | 'png' | 'webp'>;
    simulatePermissionIssues?: boolean;
  } = {}): Promise<ImageServingState> {

    const {
      collectionId = `test-collection-${Date.now()}`,
      baseDir = '/workspace/projects/image-vault',
      imageCount = 3,
      includeAllThumbnails = true,
      missingThumbnailImageIds = [],
      imageFormats = ['jpeg', 'png', 'webp'],
      simulatePermissionIssues = false
    } = options;

    const privateDir = path.join(baseDir, 'private');
    const collectionPath = path.join(privateDir, collectionId);

    // Ensure private directory exists
    await fs.mkdir(privateDir, { recursive: true });

    // Create collection using the proper domain class
    const collection = await Collection.create(collectionId, privateDir);
    
    const images: ImageServingState['images'] = [];

    // Create test images and add them to collection
    for (let i = 0; i < imageCount; i++) {
      const format = imageFormats[i % imageFormats.length];
      const extension = format === 'jpeg' ? 'jpg' : format;
      
      // Create original image file
      const originalImage = await ImageFixtures.create({
        extension: format,
        width: 800 + (i * 200), // Vary sizes
        height: 600 + (i * 150),
        originalName: `test-photo-${i + 1}.${extension}`,
        includeVisualContent: true
      });

      // Add image to collection (this creates database record and files)
      const metadata = await collection.addImage(originalImage.filePath);
      
      const imageEntry: ImageServingState['images'][0] = {
        id: metadata.id,
        originalPath: path.join(collectionPath, 'images', 'original', `${metadata.id}${metadata.extension}`),
        metadata: {
          originalName: metadata.originalName,
          size: metadata.size,
          dimensions: metadata.dimensions,
          mimeType: metadata.mimeType,
          extension: metadata.extension
        }
      };

      // Set thumbnail path if it should exist
      const shouldCreateThumbnail = includeAllThumbnails && !missingThumbnailImageIds.includes(metadata.id);
      if (shouldCreateThumbnail) {
        imageEntry.thumbnailPath = path.join(collectionPath, 'images', 'thumbnails', `${metadata.id}.jpg`);
      } else if (!includeAllThumbnails || missingThumbnailImageIds.includes(metadata.id)) {
        // Remove thumbnail file if it shouldn't exist
        const thumbnailPath = path.join(collectionPath, 'images', 'thumbnails', `${metadata.id}.jpg`);
        try {
          await fs.unlink(thumbnailPath);
        } catch {
          // Ignore if file doesn't exist
        }
      }

      images.push(imageEntry);
    }

    await collection.close();

    // Simulate permission issues if requested
    if (simulatePermissionIssues) {
      const originalDir = path.join(collectionPath, 'images', 'original');
      await fs.chmod(originalDir, 0o000);
      
      // Verify that permission restrictions actually work
      try {
        await fs.access(originalDir);
        // If we get here, permissions aren't being enforced
        console.warn('Warning: Filesystem permissions not enforced in this environment, skipping permission test');
        await fs.chmod(originalDir, 0o755); // Restore permissions
        throw new Error('SKIP_PERMISSION_TEST: Filesystem permissions not enforced');
      } catch (error) {
        if ((error as Error).message.startsWith('SKIP_PERMISSION_TEST')) {
          throw error;
        }
        // Permission restriction is working as expected
      }
    }

    const cleanup = async () => {
      try {
        // Restore permissions if they were changed
        if (simulatePermissionIssues) {
          const originalDir = path.join(collectionPath, 'images', 'original');
          await fs.chmod(originalDir, 0o755);
        }

        // Remove the entire collection directory
        await fs.rm(collectionPath, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Image serving fixture cleanup warning: ${error}`);
      }
    };

    this.addCleanup(cleanup);

    return {
      collectionPath,
      collectionId,
      images
    };
  }

  /**
   * Creates collection with images but missing some thumbnails
   */
  static async createWithMissingThumbnails(options: {
    collectionId?: string;
    imageCount?: number;
    missingThumbnailCount?: number;
  } = {}): Promise<ImageServingState> {
    
    const {
      collectionId,
      imageCount = 4,
      missingThumbnailCount = 2
    } = options;

    // Generate missing thumbnail IDs (will be determined during creation)
    const state = await this.create({
      collectionId,
      imageCount,
      includeAllThumbnails: false
    });

    // Now selectively create thumbnails for some images
    const imagesToHaveThumbnails = state.images.slice(0, imageCount - missingThumbnailCount);
    
    for (const image of imagesToHaveThumbnails) {
      const thumbnailFileName = `${image.id}.jpg`;
      const thumbnailPath = path.join(path.dirname(image.originalPath), '..', 'thumbnails', thumbnailFileName);
      
      const thumbnailBuffer = await sharp(image.originalPath)
        .resize(400, 400, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      await fs.writeFile(thumbnailPath, thumbnailBuffer);
      image.thumbnailPath = thumbnailPath;
    }

    return state;
  }

  /**
   * Creates collection with permission issues for error testing
   */
  static async createWithPermissionIssues(options: {
    collectionId?: string;
  } = {}): Promise<ImageServingState> {
    
    return this.create({
      collectionId: options.collectionId,
      imageCount: 2,
      simulatePermissionIssues: true
    });
  }

  /**
   * Creates collection with various image formats
   */
  static async createWithVariousFormats(options: {
    collectionId?: string;
  } = {}): Promise<ImageServingState> {
    
    return this.create({
      collectionId: options.collectionId,
      imageCount: 6,
      imageFormats: ['jpeg', 'png', 'webp', 'jpeg', 'png', 'webp'],
      includeAllThumbnails: true
    });
  }

  /**
   * Utility to get image file stats
   */
  static async getImageStats(imagePath: string): Promise<{ size: number; exists: boolean }> {
    try {
      const stats = await fs.stat(imagePath);
      return { size: stats.size, exists: true };
    } catch {
      return { size: 0, exists: false };
    }
  }

  /**
   * Utility to verify thumbnail exists
   */
  static async thumbnailExists(collectionPath: string, imageId: string): Promise<boolean> {
    const thumbnailPath = path.join(collectionPath, 'images', 'thumbnails', `${imageId}.jpg`);
    try {
      await fs.access(thumbnailPath);
      return true;
    } catch {
      return false;
    }
  }
}