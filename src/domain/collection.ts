import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import sqlite3 from 'sqlite3';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { ImageMetadata, ImageStatus, QueryOptions } from './types';

export class Collection {
  public readonly id: string;
  public readonly basePath: string;
  private db: sqlite3.Database;

  private constructor(id: string, basePath: string, db: sqlite3.Database) {
    this.id = id;
    this.basePath = basePath;
    this.db = db;
  }

  static async create(id: string, basePath: string): Promise<Collection> {
    // Validate input parameters
    if (!id || !basePath) {
      throw new Error('Collection ID and base path are required');
    }

    // Check if base path is accessible
    try {
      await fs.access(basePath);
    } catch {
      throw new Error('Unable to create Collection: invalid path');
    }

    const collectionPath = path.join(basePath, id);
    const createdDirectories: string[] = [];

    try {
      // Create collection directory structure
      await fs.mkdir(collectionPath, { recursive: true });
      createdDirectories.push(collectionPath);

      const imagesPath = path.join(collectionPath, 'images');
      await fs.mkdir(imagesPath, { recursive: true });
      createdDirectories.push(imagesPath);

      const originalPath = path.join(imagesPath, 'original');
      await fs.mkdir(originalPath, { recursive: true });
      createdDirectories.push(originalPath);

      const thumbnailsPath = path.join(imagesPath, 'thumbnails');
      await fs.mkdir(thumbnailsPath, { recursive: true });
      createdDirectories.push(thumbnailsPath);

      // Create and initialize database
      const databasePath = path.join(collectionPath, 'collection.db');
      const db = await Collection.initializeDatabase(databasePath);

      return new Collection(id, basePath, db);

    } catch (error: unknown) {
      // Clean up any created directories on failure
      try {
        // Remove the entire collection directory if it was created
        const collectionExists = await Collection.directoryExists(collectionPath);
        if (collectionExists) {
          await fs.rm(collectionPath, { recursive: true, force: true });
        }
      } catch {
        // Ignore cleanup errors
      }

      if ((error as NodeJS.ErrnoException).code === 'EACCES' || (error as NodeJS.ErrnoException).code === 'EPERM') {
        throw new Error('Unable to create Collection: insufficient permissions');
      }
      
      throw new Error('Unable to create Collection: ' + (error as Error).message);
    }
  }

  static async load(collectionPath: string): Promise<Collection> {
    try {
      // Verify collection directory exists
      const stat = await fs.stat(collectionPath);
      if (!stat.isDirectory()) {
        throw new Error('Collection path is not a directory');
      }

      // Extract collection ID from path
      const id = path.basename(collectionPath);
      const basePath = path.dirname(collectionPath);

      // Verify database exists and connect
      const databasePath = path.join(collectionPath, 'collection.db');
      const db = await Collection.connectToDatabase(databasePath);

      return new Collection(id, basePath, db);

    } catch (error: unknown) {
      throw new Error('Unable to load Collection: ' + (error as Error).message);
    }
  }

  private static async initializeDatabase(databasePath: string): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      try {
        const db = new sqlite3.Database(databasePath, async (err) => {
          if (err) {
            reject(new Error('Database initialization failed: ' + err.message));
          } else {
            try {
              await Collection.createSchema(db);
              resolve(db);
            } catch (schemaError: unknown) {
              reject(new Error('Database schema creation failed: ' + (schemaError as Error).message));
            }
          }
        });
      } catch (error: unknown) {
        reject(new Error('Database initialization failed: ' + (error as Error).message));
      }
    });
  }

  private static async createSchema(db: sqlite3.Database): Promise<void> {
    return new Promise((resolve, reject) => {
      const createImageTable = `
        CREATE TABLE IF NOT EXISTS images (
          id TEXT PRIMARY KEY,
          original_name TEXT NOT NULL,
          file_hash TEXT UNIQUE NOT NULL,
          status TEXT NOT NULL DEFAULT 'INBOX',
          size INTEGER NOT NULL,
          width INTEGER NOT NULL,
          height INTEGER NOT NULL,
          aspect_ratio REAL NOT NULL,
          extension TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      db.run(createImageTable, (err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private static async connectToDatabase(databasePath: string): Promise<sqlite3.Database> {
    // Check if database file exists
    try {
      await fs.access(databasePath);
    } catch {
      throw new Error('database file not found');
    }

    return new Promise((resolve, reject) => {
      try {
        const db = new sqlite3.Database(databasePath, (err) => {
          if (err) {
            reject(new Error('database connection failed: ' + err.message));
          } else {
            resolve(db);
          }
        });
      } catch (error: unknown) {
        reject(new Error('database access error: ' + (error as Error).message));
      }
    });
  }

  private static async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  // Image processing utilities
  private async calculateFileHash(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error: unknown) {
      throw new Error('Unable to process image: failed to calculate hash - ' + (error as Error).message);
    }
  }

  private async extractImageMetadata(filePath: string): Promise<{ width: number; height: number; size: number; mimeType: string; extension: string }> {
    try {
      const stats = await fs.stat(filePath);
      const metadata = await sharp(filePath).metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Unable to process image: invalid image dimensions');
      }

      const extension = path.extname(filePath).toLowerCase();
      const mimeType = this.getMimeTypeFromExtension(extension);

      return {
        width: metadata.width,
        height: metadata.height,
        size: stats.size,
        mimeType,
        extension
      };
    } catch (error: unknown) {
      if ((error as Error).message.includes('Unable to process image')) {
        throw error;
      }
      throw new Error('Unable to process image: failed to extract metadata - ' + (error as Error).message);
    }
  }

  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.tiff': 'image/tiff',
      '.tif': 'image/tiff'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  private async generateThumbnail(originalPath: string, thumbnailPath: string, maxDimension: number = 300): Promise<void> {
    try {
      await sharp(originalPath)
        .resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
    } catch (error: unknown) {
      throw new Error('Unable to process image: failed to generate thumbnail - ' + (error as Error).message);
    }
  }

  private async isDuplicateHash(fileHash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id FROM images WHERE file_hash = ?',
        [fileHash],
        (err: Error | null, row: Record<string, unknown> | undefined) => {
          if (err) {
            reject(new Error('Unable to retrieve images: database query failed - ' + err.message));
          } else {
            resolve(!!row);
          }
        }
      );
    });
  }

  // Main public methods
  async addImage(filePath: string): Promise<ImageMetadata> {
    if (!filePath) {
      throw new Error('Unable to process image: file path is required');
    }

    // Verify file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new Error('Unable to process image: file not found');
    }

    const fileHash = await this.calculateFileHash(filePath);
    
    // Check for duplicates
    if (await this.isDuplicateHash(fileHash)) {
      throw new Error('Duplicate Image: an image with this hash already exists in the collection');
    }

    const metadata = await this.extractImageMetadata(filePath);
    const imageId = uuidv4();
    const originalName = path.basename(filePath);
    
    // Define file paths
    const originalDir = path.join(this.basePath, this.id, 'images', 'original');
    const thumbnailDir = path.join(this.basePath, this.id, 'images', 'thumbnails');
    const originalDestPath = path.join(originalDir, `${imageId}${metadata.extension}`);
    const thumbnailDestPath = path.join(thumbnailDir, `${imageId}.jpg`);

    const createdFiles: string[] = [];

    try {
      // Copy original file
      await fs.copyFile(filePath, originalDestPath);
      createdFiles.push(originalDestPath);

      // Generate thumbnail
      await this.generateThumbnail(filePath, thumbnailDestPath);
      createdFiles.push(thumbnailDestPath);

      // Insert into database
      const now = new Date();
      const aspectRatio = metadata.width / metadata.height;

      await this.insertImageRecord({
        id: imageId,
        originalName,
        fileHash,
        status: 'INBOX',
        size: metadata.size,
        width: metadata.width,
        height: metadata.height,
        aspectRatio,
        extension: metadata.extension,
        mimeType: metadata.mimeType,
        createdAt: now,
        updatedAt: now
      });

      return {
        id: imageId,
        originalName,
        fileHash,
        status: 'INBOX' as ImageStatus,
        size: metadata.size,
        dimensions: {
          width: metadata.width,
          height: metadata.height
        },
        aspectRatio,
        extension: metadata.extension,
        mimeType: metadata.mimeType,
        createdAt: now,
        updatedAt: now
      };

    } catch (error: unknown) {
      // Rollback: remove any created files
      for (const file of createdFiles) {
        try {
          await fs.unlink(file);
        } catch {
          // Ignore cleanup errors
        }
      }

      if ((error as Error).message.includes('Unable to process image')) {
        throw error;
      }
      if ((error as Error).message.includes('ENOSPC') || (error as Error).message.includes('no space left')) {
        throw new Error('Unable to save image: insufficient disk space');
      }
      if ((error as Error).message.includes('EACCES') || (error as Error).message.includes('EPERM') || (error as Error).message.includes('ENOTDIR')) {
        throw new Error('Unable to save image: insufficient permissions');
      }
      
      throw new Error('Unable to save image: ' + (error as Error).message);
    }
  }

  private async insertImageRecord(imageData: {
    id: string;
    originalName: string;
    fileHash: string;
    status: string;
    size: number;
    width: number;
    height: number;
    aspectRatio: number;
    extension: string;
    mimeType: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO images (
          id, original_name, file_hash, status, size, width, height,
          aspect_ratio, extension, mime_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [
        imageData.id,
        imageData.originalName,
        imageData.fileHash,
        imageData.status,
        imageData.size,
        imageData.width,
        imageData.height,
        imageData.aspectRatio,
        imageData.extension,
        imageData.mimeType,
        imageData.createdAt.toISOString(),
        imageData.updatedAt.toISOString()
      ], function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(new Error('Database insert failed: ' + err.message));
        } else {
          resolve();
        }
      });
    });
  }

  async getImages(options?: QueryOptions): Promise<ImageMetadata[]> {
    try {
      let sql = 'SELECT * FROM images';
      const params: (string | number)[] = [];

      if (options?.status) {
        sql += ' WHERE status = ?';
        params.push(options.status);
      }

      const orderBy = options?.orderBy || 'updated_at';
      const orderDirection = options?.orderDirection || 'DESC';
      sql += ` ORDER BY ${orderBy} ${orderDirection}`;

      return new Promise((resolve, reject) => {
        // Check if database connection is still valid
        if (!this.db || this.db === null) {
          reject(new Error('Unable to retrieve images: database connection lost'));
          return;
        }

        this.db.all(sql, params, (err: Error | null, rows: Record<string, unknown>[]) => {
          if (err) {
            if (err.message.includes('SQLITE_MISUSE') || err.message.includes('closed') || err.message.includes('cannot operate')) {
              reject(new Error('Unable to retrieve images: database connection issues - database connection closed'));
            } else {
              reject(new Error('Unable to retrieve images: database connection issues - ' + err.message));
            }
          } else {
            const images = rows.map(row => ({
              id: row.id as string,
              originalName: row.original_name as string,
              fileHash: row.file_hash as string,
              status: row.status as ImageStatus,
              size: row.size as number,
              dimensions: {
                width: row.width as number,
                height: row.height as number
              },
              aspectRatio: row.aspect_ratio as number,
              extension: row.extension as string,
              mimeType: row.mime_type as string,
              createdAt: new Date(row.created_at as string),
              updatedAt: new Date(row.updated_at as string)
            }));
            resolve(images);
          }
        });
      });
    } catch (error: unknown) {
      throw new Error('Unable to retrieve images: ' + (error as Error).message);
    }
  }

  async updateImageStatus(imageId: string, newStatus: ImageStatus): Promise<ImageMetadata> {
    if (!imageId || !newStatus) {
      throw new Error('Image ID and status are required');
    }

    const validStatuses: ImageStatus[] = ['INBOX', 'COLLECTION', 'ARCHIVE'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Valid statuses are: ${validStatuses.join(', ')}`);
    }

    try {
      const now = new Date();
      
      return new Promise((resolve, reject) => {
        this.db.run(
          'UPDATE images SET status = ?, updated_at = ? WHERE id = ?',
          [newStatus, now.toISOString(), imageId],
          function(this: sqlite3.RunResult, err: Error | null) {
            if (err) {
              reject(new Error('Unable to update image status: database error - ' + err.message));
            } else if (this.changes === 0) {
              reject(new Error(`image not found: ${imageId}`));
            } else {
              // Fetch and return updated image
              resolve(undefined);
            }
          }
        );
      }).then(() => {
        return new Promise<ImageMetadata>((resolve, reject) => {
          this.db.get(
            'SELECT * FROM images WHERE id = ?',
            [imageId],
            (err: Error | null, row: Record<string, unknown> | undefined) => {
              if (err) {
                reject(new Error('Unable to retrieve updated image: ' + err.message));
              } else if (!row) {
                reject(new Error('Image not found after status update'));
              } else {
                resolve({
                  id: row.id as string,
                  originalName: row.original_name as string,
                  fileHash: row.file_hash as string,
                  status: row.status as ImageStatus,
                  size: row.size as number,
                  dimensions: {
                    width: row.width as number,
                    height: row.height as number
                  },
                  aspectRatio: row.aspect_ratio as number,
                  extension: row.extension as string,
                  mimeType: row.mime_type as string,
                  createdAt: new Date(row.created_at as string),
                  updatedAt: new Date(row.updated_at as string)
                });
              }
            }
          );
        });
      });
    } catch (error: unknown) {
      throw new Error('Unable to update image status: ' + (error as Error).message);
    }
  }

  async deleteImage(imageId: string): Promise<boolean> {
    if (!imageId) {
      throw new Error('Image ID is required');
    }

    try {
      // First, get the image metadata to determine file paths and verify existence
      const imageMetadata = await this.getImageMetadata(imageId);
      
      const originalPath = path.join(this.basePath, this.id, 'images', 'original', `${imageId}${imageMetadata.extension}`);
      const thumbnailPath = path.join(this.basePath, this.id, 'images', 'thumbnails', `${imageId}.jpg`);

      // Start transaction by removing from database first
      await this.deleteImageRecord(imageId);

      try {
        // Delete original file
        await fs.unlink(originalPath);
      } catch (error: unknown) {
        // Rollback database changes if file deletion fails
        await this.rollbackImageDeletion(imageMetadata);
        throw new Error('Unable to process file change: failed to delete original file - ' + (error as Error).message);
      }

      try {
        // Delete thumbnail file
        await fs.unlink(thumbnailPath);
      } catch (error: unknown) {
        // Rollback database changes and restore original file if thumbnail deletion fails
        await this.rollbackImageDeletion(imageMetadata);
        try {
          // Try to restore the original file by copying it back
          const originalBackupPath = originalPath + '.backup';
          if (await this.fileExists(originalBackupPath)) {
            await fs.copyFile(originalBackupPath, originalPath);
            await fs.unlink(originalBackupPath);
          }
        } catch {
          // Ignore restore errors
        }
        throw new Error('Unable to process file change: failed to delete thumbnail file - ' + (error as Error).message);
      }

      return true;

    } catch (error: unknown) {
      if ((error as Error).message.includes('Image not found')) {
        throw new Error(`Image not found: ${imageId}`);
      }
      if ((error as Error).message.includes('Unable to process file change')) {
        throw error;
      }
      throw new Error('Unable to delete image: ' + (error as Error).message);
    }
  }

  private async getImageMetadata(imageId: string): Promise<ImageMetadata> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM images WHERE id = ?',
        [imageId],
        (err: Error | null, row: Record<string, unknown> | undefined) => {
          if (err) {
            reject(new Error('Database query failed: ' + err.message));
          } else if (!row) {
            reject(new Error('Image not found'));
          } else {
            resolve({
              id: row.id as string,
              originalName: row.original_name as string,
              fileHash: row.file_hash as string,
              status: row.status as ImageStatus,
              size: row.size as number,
              dimensions: {
                width: row.width as number,
                height: row.height as number
              },
              aspectRatio: row.aspect_ratio as number,
              extension: row.extension as string,
              mimeType: row.mime_type as string,
              createdAt: new Date(row.created_at as string),
              updatedAt: new Date(row.updated_at as string)
            });
          }
        }
      );
    });
  }

  private async deleteImageRecord(imageId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM images WHERE id = ?',
        [imageId],
        function(this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            reject(new Error('Database deletion failed: ' + err.message));
          } else if (this.changes === 0) {
            reject(new Error('Image not found'));
          } else {
            resolve();
          }
        }
      );
    });
  }

  private async rollbackImageDeletion(imageMetadata: ImageMetadata): Promise<void> {
    try {
      // Restore the database record
      await this.insertImageRecord({
        id: imageMetadata.id,
        originalName: imageMetadata.originalName,
        fileHash: imageMetadata.fileHash,
        status: imageMetadata.status,
        size: imageMetadata.size,
        width: imageMetadata.dimensions.width,
        height: imageMetadata.dimensions.height,
        aspectRatio: imageMetadata.aspectRatio,
        extension: imageMetadata.extension,
        mimeType: imageMetadata.mimeType,
        createdAt: imageMetadata.createdAt,
        updatedAt: imageMetadata.updatedAt
      });
    } catch {
      // Ignore rollback errors - we've already failed
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err: Error | null) => {
        if (err) {
          reject(new Error('Failed to close database connection: ' + err.message));
        } else {
          // Set database reference to null to trigger connection errors
          // @ts-expect-error - Setting db to null for cleanup
          this.db = null;
          resolve();
        }
      });
    });
  }
}