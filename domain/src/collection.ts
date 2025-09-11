import type { CollectionInstance, Extension, ImageMetadata, ImageUpdate, Mime, QueryOptions } from '../types';
import path from 'path';
import { CONFIG } from '../../config';
import { validateCollectionName } from './collection-utils'
import { initializeCollectionDatabase } from './database';
import { fsOps } from './fs-operations';
import sharp from 'sharp';
import crypto from 'crypto';
import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import { 
    CollectionClearError,
    CollectionCreateError,
    CollectionDeleteError,
    CollectionListError,
    CollectionLoadError,
    CollectionNotFoundError,
    ImageAdditionError,
    ImageDeletionError,
    ImageRetrievalError,
    ImageNotFoundError,
    ImageUpdateError,
    PendingImplementationError
} from '../errors';

/**
 * Collection class for managing isolated image collections
 * Each collection is self-contained with its own directory and SQLite database
 */
export class Collection implements CollectionInstance {
    readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    private getDatabase(): Database.Database {
        const databasePath = path.join(CONFIG.COLLECTIONS_DIRECTORY, this.name, 'collection.db');
        return new Database(databasePath);
    }

    /**
     * Create a new Collection with the specified name
     */
    static create(name: string): Collection {
        try {
            validateCollectionName(name);

            const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, name);

            if (fsOps.existsSync(collectionPath) && fsOps.statSync(collectionPath).isDirectory()) {
                throw new Error(`There is already a Collection with name: "${name}"`);
            }

            // Create collection directory structure atomically
            try {
                fsOps.mkdirSync(collectionPath, { recursive: true });

                const imagesPath = path.join(collectionPath, 'images');
                fsOps.mkdirSync(imagesPath, { recursive: true });
                fsOps.mkdirSync(path.join(imagesPath, 'original'), { recursive: true });
                fsOps.mkdirSync(path.join(imagesPath, 'thumbnails'), { recursive: true });

                initializeCollectionDatabase(collectionPath);

                return new Collection(name);
            } catch (error: unknown) {
                try {
                    // Clean up partial artifacts on error
                    fsOps.rmSync(collectionPath, { recursive: true, force: true });
                } catch (error: unknown) {
                    console.error(`Error cleaning up partial creation artifacts: ${(error as Error).message} `)
                }
                throw error;
            }
        } catch (error: unknown) {
            throw new CollectionCreateError(name, error);
        }
    }

    /**
     * Load an existing Collection from the filesystem
     */
    static load(name: string): Collection {
        try {
            validateCollectionName(name);

            const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, name);

            if (!fsOps.existsSync(collectionPath)) {
                throw new CollectionNotFoundError(name);
            }
            return new Collection(name);

        } catch (error: unknown) {
            throw new CollectionLoadError(name, error)
        }
    }

    /**
     * Delete a Collection and remove it from the filesystem
     */
    static delete(name: string): void {
        try {
            validateCollectionName(name);

            const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, name);

            // Check if collection exists
            if (!fsOps.existsSync(collectionPath)) {
                throw new CollectionNotFoundError(name);
            }

            // Delete the collection directory and all contents
            fsOps.rmSync(collectionPath, { recursive: true, force: true });

        } catch (error: unknown) {
            throw new CollectionDeleteError(name, error);
        }
    }

    /**
     * List all existing Collections
     */
    static list(): string[] {
        try {
            return fsOps.readdirSync(CONFIG.COLLECTIONS_DIRECTORY, { withFileTypes: true })
                .filter((entry) => entry.isDirectory())
                .map((entry) => entry.name)
                .sort();

        } catch (error: unknown) {
            throw new CollectionListError(error)
        }
    }

    /**
     * Clear all Collections from the Collections directory
     */
    static clear(): void {
        try {
            const collectionDirs = fsOps.readdirSync(CONFIG.COLLECTIONS_DIRECTORY, { withFileTypes: true })
                .filter((entry) => entry.isDirectory());

            for (const entry of collectionDirs) {
                const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, entry.name);
                fsOps.rmSync(collectionPath, { recursive: true, force: true });
            }

        } catch (error: unknown) {
            throw new CollectionClearError(error);
        }
    }

    /**
     * Add an image to this Collection
     */
    async addImage(filePath: string): Promise<ImageMetadata> {
        try {
            // Validate and normalize file format first
            const { extension, mime } = this.validateAndNormalizeFormat(filePath);

            const filename = this.extractFilename(filePath);
            
            // Validate filename safety and length
            this.validateFilename(filename);
            
            // Validate file exists and is a file
            await this.validateFileExists(filePath);
            
            // Calculate image hash for duplicate detection
            const hash = await this.calculateImageHash(filePath);
            
            // Check for duplicates
            await this.validateNoDuplicate(hash);
            
            // Validate image integrity and get metadata
            const imageInfo = await this.validateAndGetImageInfo(filePath);
            
            // Generate unique image ID and name
            const imageId = randomUUID();
            
            // Process and store image files
            await this.processAndStoreImage(filePath, imageId, extension);
            
            // Create image metadata
            const now = new Date();
            const metadata: ImageMetadata = {
                id: imageId,
                collection: this.name,
                name: filename,
                extension: extension as 'jpg' | 'png' | 'webp',
                mime: mime as 'image/jpeg' | 'image/png' | 'image/webp',
                size: (await fsOps.stat(filePath)).size,
                hash,
                width: imageInfo.width!,
                height: imageInfo.height!,
                aspect: imageInfo.width! / imageInfo.height!,
                status: 'INBOX',
                created: now,
                updated: now
            };
            
            // Store metadata in database
            await this.storeImageMetadata(metadata);
            
            return metadata;
            
        } catch (error: unknown) {
            throw new ImageAdditionError(this.name, error);
        }
    }

    validateImageExists(imageId: string) {
        const database = this.getDatabase();
        try {
            const row = database.prepare('SELECT * FROM images WHERE id = ?').get(imageId)
            if (row == undefined) {
                throw new ImageNotFoundError(imageId);
            }
        } finally {
            database.close()
        }
    }

    /**
     * Get image metadata by ID
     */
    async getImage(imageId: string): Promise<ImageMetadata> {
        try {
            this.validateImageId(imageId);

            const database = this.getDatabase();
            
            try {
                const row = database
                    .prepare('SELECT * FROM images WHERE id = ?')
                    .get(imageId) as {
                        id: string;
                        collection: string;
                        name: string;
                        extension: string;
                        mime: string;
                        size: number;
                        hash: string;
                        width: number;
                        height: number;
                        aspect: number;
                        status: string;
                        created: string;
                        updated: string;
                    } | undefined;
                
                if (!row) {
                    throw new ImageNotFoundError(imageId);
                }
                
                // Convert database row to ImageMetadata
                const metadata: ImageMetadata = {
                    id: row.id,
                    collection: row.collection,
                    name: row.name,
                    extension: row.extension as Extension,
                    mime: row.mime as Mime, 
                    size: row.size,
                    hash: row.hash,
                    width: row.width,
                    height: row.height,
                    aspect: row.aspect,
                    status: row.status as 'INBOX' | 'COLLECTION' | 'ARCHIVE',
                    created: new Date(row.created),
                    updated: new Date(row.updated)
                };
                
                return metadata;
            } finally {
                database.close();
            }
        } catch (error: unknown) {
            throw new ImageRetrievalError(this.name, imageId, error);
        }
    }

    /**
     * Update image status
     */
    async updateImage(imageId: string, update: ImageUpdate): Promise<ImageMetadata> {
        try {
            this.validateImageId(imageId);
            this.validateImageExists(imageId);
            this.validateImageStatus(update.status);
            
            const image = await this.getImage(imageId);
            const database = this.getDatabase();
            const now = new Date();
            
            try {
                database
                    .prepare('UPDATE images SET status = ?, updated = ? WHERE id = ?')
                    .run(update.status, now.toISOString(), imageId);
                
                const updatedMetadata: ImageMetadata = {
                    ...image,
                    status: update.status,
                    updated: now
                };
                
                return updatedMetadata;

            } finally {
                database.close();
            }
        } catch (error: unknown) {
            throw new ImageUpdateError(this.name, imageId, error);
        }
    }

    /**
     * Delete an image from this Collection
     */
    async deleteImage(imageId: string): Promise<void> {
        try {
            // Validate image ID format
            this.validateImageId(imageId);
            
            // Get image metadata to validate existence and for file paths
            const imageMetadata = await this.getImage(imageId);
            
            // Build file paths for original and thumbnail
            const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, this.name);
            const originalPath = path.join(collectionPath, 'images', 'original', `${imageId}.${imageMetadata.extension}`);
            const thumbnailPath = path.join(collectionPath, 'images', 'thumbnails', `${imageId}.${imageMetadata.extension}`);
            
            // Database-first deletion with rollback capability
            const database = this.getDatabase();
            let imageRemoved = false;
            
            try {
                // Remove from database first
                database.prepare('DELETE FROM images WHERE id = ?').run(imageId);
                imageRemoved = true;
                
                // Remove files (original and thumbnail)
                await fsOps.unlink(originalPath);
                await fsOps.unlink(thumbnailPath);
                
            } catch (fileError) {
                // Rollback database deletion if file deletion failed
                if (imageRemoved) {
                    try {
                        database
                            .prepare(
                                `INSERT INTO images (
                                    id, collection, name, extension, mime, size, hash,
                                    width, height, aspect, status, created, updated
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                            )
                            .run(
                                imageMetadata.id,
                                imageMetadata.collection,
                                imageMetadata.name,
                                imageMetadata.extension,
                                imageMetadata.mime,
                                imageMetadata.size,
                                imageMetadata.hash,
                                imageMetadata.width,
                                imageMetadata.height,
                                imageMetadata.aspect,
                                imageMetadata.status,
                                imageMetadata.created.toISOString(),
                                imageMetadata.updated.toISOString()
                            );
                    } catch (rollbackError) {
                        console.error(`Failed to rollback database deletion for image ${imageId}:`, rollbackError);
                    }
                }
                throw fileError;
            } finally {
                database.close();
            }
            
        } catch (error: unknown) {
            // Handle specific error cases for proper error wrapping
            if (error instanceof ImageRetrievalError && error.cause instanceof ImageNotFoundError) {
                throw new ImageDeletionError(this.name, imageId, error.cause);
            }
            
            throw new ImageDeletionError(this.name, imageId, error);
        }
    }

    /**
     * Get all images in this Collection with optional filtering
     */
    async getImages(options?: QueryOptions): Promise<ImageMetadata[]> {
        console.log(`args: options: ${options}`);
        throw new PendingImplementationError('Collection.getImages');
    }

    /**
     * Update multiple images at once
     */
    async updateImages(updates: Record<string, Partial<ImageUpdate>>): Promise<ImageMetadata[]> {
        console.log(`args: updates: ${updates}`);
        throw new PendingImplementationError('Collection.updateImages');
    }

    /**
     * Delete multiple images at once
     */
    async deleteImages(imageIds: string[]): Promise<void> {
        console.log(`args: imageIds: ${imageIds}`);
        throw new PendingImplementationError('Collection.deleteImages');
    }

    private validateImageStatus(status: string): void {
        const validStatuses = ['INBOX', 'COLLECTION', 'ARCHIVE'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status value');
        }
    }

    private async validateFileExists(filePath: string): Promise<void> {
        try {
            const stats = await fsOps.stat(filePath);
            if (!stats.isFile()) {
                throw new Error(`"${filePath}" is not a file`);
            }
        } catch (error: unknown) {
            if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
                throw new Error(`"${filePath}" is not a file`);
            }
            throw error;
        }
    }

    private validateAndNormalizeFormat(filePath: string): { extension: string; mime: string } {
        const ext = path.extname(filePath).toLowerCase();
        
        switch (ext) {
            case '.jpg':
                return { extension: 'jpg', mime: 'image/jpeg' };
            case '.jpeg':
                return { extension: 'jpg', mime: 'image/jpeg' }; // Normalize to jpg
            case '.png':
                return { extension: 'png', mime: 'image/png' };
            case '.webp':
                return { extension: 'webp', mime: 'image/webp' };
            default:
                throw new Error('Unsupported file type, must be image file with extension jpg/jpeg/png/webp');
        }
    }

    private extractFilename(filepath: string): string {
        const filename = path.basename(filepath);
        const extension = path.extname(filepath);
        return filename.slice(0, filename.length - extension.length);
    }

    private validateFilename(filename: string): void {
        
        // Check filename length (including extension)
        if (filename.length > 256) {
            throw new Error('Filename exceeds 256 characters');
        }
        
        // Only allow Alphanumeric and . _ - ( )
        const pattern = /^[A-Za-z0-9()._-]+$/;
        if (!pattern.test(filename)) {
            throw new Error('Unsafe or invalid filename');
        }
    }

    private validateImageId(imageID: string) {
        const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if(!pattern.test(imageID)) {
            throw new Error('Invalid imageID');
        } 

    }

    private async calculateImageHash(filePath: string): Promise<string> {
        const buffer = await fsOps.readFile(filePath);
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    private async validateNoDuplicate(hash: string): Promise<void> {
        const database = this.getDatabase();
        
        try {
            const existing = database.prepare('SELECT id FROM images WHERE hash = ?').get(hash);
            if (existing) {
                throw new Error('Image already exists in Collection');
            }
        } finally {
            database.close();
        }
    }

    private async validateAndGetImageInfo(filePath: string): Promise<sharp.Metadata> {
        try {
            const imageInfo = await sharp(filePath).metadata();
            
            if (!imageInfo.width || !imageInfo.height) {
                throw new Error('Invalid or corrupted image file');
            }
            
            return imageInfo;
        } catch {
            throw new Error('Invalid or corrupted image file');
        }
    }

    private async processAndStoreImage(sourceFilePath: string, imageID: string, extension: string): Promise<void> {
        const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, this.name);
        const originalPath = path.join(collectionPath, 'images', 'original', `${imageID}.${extension}`);
        const thumbnailPath = path.join(collectionPath, 'images', 'thumbnails', `${imageID}.${extension}`);
        
        // Copy original image - use fsOps for mockable operations
        const sourceBuffer = await fsOps.readFile(sourceFilePath);
        await fsOps.writeFile(originalPath, sourceBuffer);
        
        // Generate thumbnail
        await sharp(sourceFilePath)
            .resize(CONFIG.THUMBNAIL_WIDTH, null, { 
                withoutEnlargement: true,
                fit: 'inside'
            })
            .toFile(thumbnailPath);
    }

    private async storeImageMetadata(metadata: ImageMetadata): Promise<void> {
        const database = this.getDatabase();
        
        try {
            database
                .prepare(
                    `INSERT INTO images (
                        id, collection, name, extension, mime, size, hash,
                        width, height, aspect, status, created, updated
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                )
                .run(
                    metadata.id,
                    metadata.collection,
                    metadata.name,
                    metadata.extension,
                    metadata.mime,
                    metadata.size,
                    metadata.hash,
                    metadata.width,
                    metadata.height,
                    metadata.aspect,
                    metadata.status,
                    metadata.created.toISOString(),
                    metadata.updated.toISOString()
                );
        } finally {
            database.close();
        }
    }
}