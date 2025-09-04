import type { CollectionInstance, ImageMetadata, ImageUpdate, QueryOptions } from '../types';
import path from 'path';
import { CONFIG } from '../../config';
import { validateCollectionName } from './collection-utils'
import { initializeCollectionDatabase } from './database';
import { fsOps } from './fs-operations';
import { 
    CollectionClearError,
    CollectionCreateError,
    CollectionDeleteError,
    CollectionListError,
    CollectionLoadError,
    CollectionNotFoundError
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
                } finally {
                    // Ignore cleanup errors
                    throw error;
                }
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
    async addImage(_filePath: string): Promise<ImageMetadata> {
        throw new Error('Pending Implementation: Collection.addImage');
    }

    /**
     * Get image metadata by ID
     */
    async getImage(_imageId: string): Promise<ImageMetadata> {
        throw new Error('Pending Implementation: Collection.getImage');
    }

    /**
     * Update image status
     */
    async updateImage(_imageId: string, _status: ImageUpdate): Promise<ImageMetadata> {
        throw new Error('Pending Implementation: Collection.updateImage');
    }

    /**
     * Delete an image from this Collection
     */
    async deleteImage(_imageId: string): Promise<void> {
        throw new Error('Pending Implementation: Collection.deleteImage');
    }

    /**
     * Get all images in this Collection with optional filtering
     */
    async getImages(_options?: QueryOptions): Promise<ImageMetadata[]> {
        throw new Error('Pending Implementation: Collection.getImages');
    }

    /**
     * Update multiple images at once
     */
    async updateImages(_updates: Record<string, Partial<ImageUpdate>>): Promise<ImageMetadata[]> {
        throw new Error('Pending Implementation: Collection.updateImages');
    }

    /**
     * Delete multiple images at once
     */
    async deleteImages(_imageIds: string[]): Promise<void> {
        throw new Error('Pending Implementation: Collection.deleteImages');
    }
}