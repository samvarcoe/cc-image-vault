import { promises as fs } from 'fs';
import path from 'path';
import { Fixtures } from '../../utils/fixtures/base-fixtures';
import { ImageFixtures } from '../../utils/fixtures/image-fixtures';
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
      baseDir = '/workspace/image-vault',
      imageCount = 3,
      includeAllThumbnails = true,
      missingThumbnailImageIds = [],
      imageFormats = ['jpeg', 'png', 'webp'],
      simulatePermissionIssues = false
    } = options;

    const privateDir = path.join(baseDir, 'private');
    const collectionPath = path.join(privateDir, collectionId);
    const imagesDir = path.join(collectionPath, 'images');
    const originalDir = path.join(imagesDir, 'original');
    const thumbnailsDir = path.join(imagesDir, 'thumbnails');

    // Create directory structure
    await fs.mkdir(originalDir, { recursive: true });
    await fs.mkdir(thumbnailsDir, { recursive: true });

    // Create collection database file
    const dbPath = path.join(collectionPath, 'collection.db');
    await fs.writeFile(dbPath, '');

    const images: ImageServingState['images'] = [];

    // Create test images and thumbnails
    for (let i = 0; i < imageCount; i++) {
      const imageId = `image-${i + 1}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const format = imageFormats[i % imageFormats.length];
      const extension = format === 'jpeg' ? 'jpg' : format;
      
      // Create original image
      const originalImage = await ImageFixtures.create({
        imageId,
        format,
        width: 800 + (i * 200), // Vary sizes
        height: 600 + (i * 150),
        originalName: `test-photo-${i + 1}.${extension}`,
        includeVisualContent: true
      });

      // Copy to collection original directory with UUID name
      const originalFileName = `${imageId}.${extension}`;
      const originalPath = path.join(originalDir, originalFileName);
      await fs.copyFile(originalImage.filePath, originalPath);

      const imageEntry: ImageServingState['images'][0] = {
        id: imageId,
        originalPath,
        metadata: {
          originalName: originalImage.originalName,
          size: originalImage.size,
          dimensions: originalImage.dimensions,
          mimeType: originalImage.mimeType,
          extension: originalImage.extension
        }
      };

      // Create thumbnail if not in missing list
      const shouldCreateThumbnail = includeAllThumbnails && !missingThumbnailImageIds.includes(imageId);
      
      if (shouldCreateThumbnail) {
        const thumbnailFileName = `${imageId}.webp`; // Thumbnails are always WebP
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFileName);
        
        // Create 400px thumbnail preserving aspect ratio
        const thumbnailBuffer = await sharp(originalImage.filePath)
          .resize(400, 400, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .webp({ quality: 80 })
          .toBuffer();
        
        await fs.writeFile(thumbnailPath, thumbnailBuffer);
        imageEntry.thumbnailPath = thumbnailPath;
      }

      images.push(imageEntry);
    }

    // Simulate permission issues if requested
    if (simulatePermissionIssues) {
      // Remove read permissions from original directory
      await fs.chmod(originalDir, 0o000);
    }

    const cleanup = async () => {
      try {
        // Restore permissions if they were changed
        if (simulatePermissionIssues) {
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
      const thumbnailFileName = `${image.id}.webp`;
      const thumbnailPath = path.join(path.dirname(image.originalPath), '..', 'thumbnails', thumbnailFileName);
      
      const thumbnailBuffer = await sharp(image.originalPath)
        .resize(400, 400, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .webp({ quality: 80 })
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
    const thumbnailPath = path.join(collectionPath, 'images', 'thumbnails', `${imageId}.webp`);
    try {
      await fs.access(thumbnailPath);
      return true;
    } catch {
      return false;
    }
  }
}