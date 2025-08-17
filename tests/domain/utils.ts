import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import crypto from 'crypto';
import { ImageMetadata, ImageStatus } from '../../src/domain/types';

/**
 * Test utilities for domain layer tests
 */
export class TestUtils {
  /**
   * Creates a directory with read-only permissions to simulate access issues
   */
  static async createReadOnlyDirectory(basePath: string): Promise<string> {
    const readOnlyDir = path.join(basePath, 'readonly');
    await fs.mkdir(readOnlyDir, { recursive: true });
    await fs.chmod(readOnlyDir, 0o444); // Read-only permissions
    return readOnlyDir;
  }

  /**
   * Creates an invalid path that cannot be accessed
   */
  static getInvalidPath(): string {
    return '/nonexistent/invalid/path/that/does/not/exist';
  }

  /**
   * Creates a path with insufficient permissions for writing
   */
  static async createNoWritePermissionPath(): Promise<string> {
    // Create a path that points to a file instead of a directory
    // This will cause fs.access to succeed but mkdir to fail
    const tempFile = await fs.mkdtemp(path.join(tmpdir(), 'no-write-'));
    const filePath = path.join(tempFile, 'not-a-directory');
    await fs.writeFile(filePath, 'blocking file');
    return filePath;
  }

  /**
   * Simulates database corruption by creating an invalid SQLite file
   */
  static async corruptDatabase(dbPath: string): Promise<void> {
    // Delete the database file to make it inaccessible
    await fs.unlink(dbPath);
  }

  /**
   * Checks if a directory exists
   */
  static async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Checks if a file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(filePath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Recursively lists all files and directories in a path
   */
  static async listContents(dirPath: string): Promise<string[]> {
    try {
      const items: string[] = [];
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        items.push(fullPath);
        
        if (entry.isDirectory()) {
          const subItems = await this.listContents(fullPath);
          items.push(...subItems);
        }
      }
      
      return items;
    } catch {
      return [];
    }
  }

  /**
   * Calculates SHA256 hash of a file for duplicate detection testing
   */
  static async calculateFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Verifies that two files have identical content by comparing hashes
   */
  static async filesAreIdentical(filePath1: string, filePath2: string): Promise<boolean> {
    const hash1 = await this.calculateFileHash(filePath1);
    const hash2 = await this.calculateFileHash(filePath2);
    return hash1 === hash2;
  }

  /**
   * Validates image metadata structure and required fields
   */
  static validateImageMetadata(metadata: ImageMetadata): void {
    const requiredFields = [
      'id', 'originalName', 'fileHash', 'status', 'size',
      'dimensions', 'aspectRatio', 'extension', 'mimeType',
      'createdAt', 'updatedAt'
    ];

    for (const field of requiredFields) {
      if (!(field in metadata)) {
        throw new Error(`Image metadata missing required field: ${field}`);
      }
    }

    // Validate dimensions object
    if (!metadata.dimensions || typeof metadata.dimensions.width !== 'number' || typeof metadata.dimensions.height !== 'number') {
      throw new Error('Image metadata dimensions must have numeric width and height');
    }

    // Validate status is valid enum value
    const validStatuses: ImageStatus[] = ['INBOX', 'COLLECTION', 'ARCHIVE'];
    if (!validStatuses.includes(metadata.status)) {
      throw new Error(`Invalid image status: ${metadata.status}`);
    }

    // Validate dates
    if (!(metadata.createdAt instanceof Date) || !(metadata.updatedAt instanceof Date)) {
      throw new Error('Image metadata createdAt and updatedAt must be Date objects');
    }
  }

  /**
   * Filters images by status for testing retrieval operations
   */
  static filterImagesByStatus(images: ImageMetadata[], status: ImageStatus): ImageMetadata[] {
    return images.filter(image => image.status === status);
  }

  /**
   * Sorts images by specified field for testing ordering
   */
  static sortImages(images: ImageMetadata[], orderBy: 'created_at' | 'updated_at' = 'updated_at', direction: 'ASC' | 'DESC' = 'DESC'): ImageMetadata[] {
    const sorted = [...images].sort((a, b) => {
      const aValue = orderBy === 'created_at' ? a.createdAt : a.updatedAt;
      const bValue = orderBy === 'created_at' ? b.createdAt : b.updatedAt;
      
      if (direction === 'ASC') {
        return aValue.getTime() - bValue.getTime();
      } else {
        return bValue.getTime() - aValue.getTime();
      }
    });

    return sorted;
  }

  /**
   * Verifies collection directory structure exists
   */
  static async verifyCollectionStructure(collectionPath: string): Promise<boolean> {
    try {
      const requiredPaths = [
        path.join(collectionPath, 'images'),
        path.join(collectionPath, 'images', 'original'),
        path.join(collectionPath, 'images', 'thumbnails'),
        path.join(collectionPath, 'collection.db')
      ];

      for (const requiredPath of requiredPaths) {
        const isDirectory = requiredPath.endsWith('.db') ? false : true;
        const exists = isDirectory 
          ? await this.directoryExists(requiredPath)
          : await this.fileExists(requiredPath);
        
        if (!exists) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Simulates file system storage failure by making image storage directories read-only
   */
  static async simulateStorageFailure(collectionBasePath: string): Promise<() => Promise<void>> {
    const originalPermissions: Array<{ path: string; mode: number; isFile?: boolean }> = [];
    
    try {
      // Find the collection directory (look for directories that have an images subdirectory)
      const entries = await fs.readdir(collectionBasePath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const collectionDir = path.join(collectionBasePath, entry.name);
          const imagesDir = path.join(collectionDir, 'images');
          
          // Check if this looks like a collection directory
          if (await this.directoryExists(imagesDir)) {
            const originalDir = path.join(imagesDir, 'original');
            const thumbnailsDir = path.join(imagesDir, 'thumbnails');
            
            // Make the original and thumbnails directories read-only
            const dirsToBlock = [originalDir, thumbnailsDir];
            
            for (const dir of dirsToBlock) {
              try {
                if (await this.directoryExists(dir)) {
                  // Store original state for restoration
                  originalPermissions.push({ path: dir, mode: 0o755, isFile: false });
                  
                  // Replace directory with a file to block access
                  await fs.rm(dir, { recursive: true });
                  await fs.writeFile(dir, 'blocking file for storage failure simulation');
                }
              } catch (error) {
                console.warn('Failed to block directory:', dir, error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Storage failure simulation warning:', error);
    }

    // Return cleanup function
    return async () => {
      try {
        // Restore original state
        for (const { path: dirPath, mode, isFile } of originalPermissions) {
          try {
            if (isFile === false) {
              // Remove blocking file and recreate directory
              await fs.unlink(dirPath);
              await fs.mkdir(dirPath, { mode, recursive: true });
            } else {
              // Restore directory permissions if needed
              await fs.chmod(dirPath, mode);
            }
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }

  private static async findAllDirectories(basePath: string): Promise<string[]> {
    const directories: string[] = [basePath];
    
    try {
      const items = await fs.readdir(basePath, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          const fullPath = path.join(basePath, item.name);
          directories.push(fullPath);
          const subDirs = await this.findAllDirectories(fullPath);
          directories.push(...subDirs);
        }
      }
    } catch (error) {
      // Ignore errors
    }
    
    return directories;
  }

  /**
   * Verifies that filesystem state remains unchanged after failed operations
   */
  static async captureFilesystemState(dirPath: string): Promise<string[]> {
    return this.listContents(dirPath);
  }

  /**
   * Compares two filesystem states to ensure they are identical
   */
  static compareFilesystemStates(stateBefore: string[], stateAfter: string[]): boolean {
    if (stateBefore.length !== stateAfter.length) {
      return false;
    }

    const sortedBefore = [...stateBefore].sort();
    const sortedAfter = [...stateAfter].sort();

    return sortedBefore.every((path, index) => path === sortedAfter[index]);
  }

  /**
   * Captures database state by reading all image records for rollback verification
   */
  static async captureDatabaseState(collection: any): Promise<ImageMetadata[]> {
    try {
      return await collection.getImages();
    } catch (error) {
      // If database is inaccessible, return empty state
      return [];
    }
  }

  /**
   * Compares two database states to ensure they are identical
   */
  static compareDatabaseStates(stateBefore: ImageMetadata[], stateAfter: ImageMetadata[]): boolean {
    if (stateBefore.length !== stateAfter.length) {
      return false;
    }

    // Sort by ID for consistent comparison
    const sortedBefore = [...stateBefore].sort((a, b) => a.id.localeCompare(b.id));
    const sortedAfter = [...stateAfter].sort((a, b) => a.id.localeCompare(b.id));

    return sortedBefore.every((imageBefore, index) => {
      const imageAfter = sortedAfter[index];
      return (
        imageBefore.id === imageAfter.id &&
        imageBefore.status === imageAfter.status &&
        imageBefore.fileHash === imageAfter.fileHash &&
        imageBefore.originalName === imageAfter.originalName &&
        imageBefore.size === imageAfter.size
      );
    });
  }

  /**
   * Simulates database constraint violation by corrupting the database during an operation
   */
  static async simulateConstraintViolation(collection: any): Promise<() => Promise<void>> {
    // Get the database path from the collection
    const collectionPath = path.join(collection.basePath, collection.id);
    const dbPath = path.join(collectionPath, 'collection.db');
    
    // Create a backup of the database
    const backupPath = `${dbPath}.backup`;
    await fs.copyFile(dbPath, backupPath);
    
    // Corrupt the database to trigger constraint violations
    await fs.writeFile(dbPath, 'CORRUPTED_CONSTRAINT_VIOLATION_TEST');
    
    // Return cleanup function to restore database
    return async () => {
      try {
        await fs.copyFile(backupPath, dbPath);
        await fs.unlink(backupPath);
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }

  /**
   * Creates a scenario where file deletion will fail
   */
  static async simulateFileDeletionFailure(collectionPath: string, imageId: string): Promise<() => Promise<void>> {
    const imagesDir = path.join(collectionPath, 'images');
    const originalDir = path.join(imagesDir, 'original');
    const thumbnailPath = path.join(imagesDir, 'thumbnails', `${imageId}.jpg`);
    
    // Find the actual original file (it could have any extension)
    let originalPath = '';
    let originalBackupPath = '';
    try {
      const originalFiles = await fs.readdir(originalDir);
      const matchingFile = originalFiles.find(file => file.startsWith(imageId));
      if (matchingFile) {
        originalPath = path.join(originalDir, matchingFile);
        originalBackupPath = originalPath + '.backup-for-failure-test';
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }
    
    const originalExists = originalPath && await this.fileExists(originalPath);
    const thumbnailExists = await this.fileExists(thumbnailPath);
    const thumbnailBackupPath = thumbnailPath + '.backup-for-failure-test';
    
    // Replace files with directories to make fs.unlink() fail
    if (originalExists) {
      // Backup the original file and replace it with a directory
      await fs.rename(originalPath, originalBackupPath);
      await fs.mkdir(originalPath, { recursive: true });
    }
    if (thumbnailExists) {
      // Backup the thumbnail file and replace it with a directory
      await fs.rename(thumbnailPath, thumbnailBackupPath);
      await fs.mkdir(thumbnailPath, { recursive: true });
    }
    
    // Return cleanup function to restore files
    return async () => {
      try {
        if (originalExists) {
          // Remove directory and restore original file
          await fs.rm(originalPath, { recursive: true, force: true });
          if (await this.fileExists(originalBackupPath)) {
            await fs.rename(originalBackupPath, originalPath);
          }
        }
        if (thumbnailExists) {
          // Remove directory and restore thumbnail file
          await fs.rm(thumbnailPath, { recursive: true, force: true });
          if (await this.fileExists(thumbnailBackupPath)) {
            await fs.rename(thumbnailBackupPath, thumbnailPath);
          }
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }

  /**
   * Verifies that image files (original and thumbnail) exist for a given image ID
   */
  static async verifyImageFilesExist(collectionPath: string, imageId: string, extension: string = '.jpg'): Promise<{ originalExists: boolean; thumbnailExists: boolean }> {
    const imagesDir = path.join(collectionPath, 'images');
    const originalPath = path.join(imagesDir, 'original', `${imageId}${extension}`);
    const thumbnailPath = path.join(imagesDir, 'thumbnails', `${imageId}.jpg`);
    
    const originalExists = await this.fileExists(originalPath);
    const thumbnailExists = await this.fileExists(thumbnailPath);
    
    return { originalExists, thumbnailExists };
  }

  /**
   * Verifies that image files (original and thumbnail) do NOT exist for a given image ID
   */
  static async verifyImageFilesDeleted(collectionPath: string, imageId: string, extension: string = '.jpg'): Promise<{ originalDeleted: boolean; thumbnailDeleted: boolean }> {
    const { originalExists, thumbnailExists } = await this.verifyImageFilesExist(collectionPath, imageId, extension);
    
    return { 
      originalDeleted: !originalExists, 
      thumbnailDeleted: !thumbnailExists 
    };
  }
}