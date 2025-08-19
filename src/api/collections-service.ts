import { promises as fs } from 'fs';
import path from 'path';
import { Collection } from '../domain/collection';
import { ImageMetadata, ImageStatus, QueryOptions } from '../domain/types';

export interface CollectionInfo {
  id: string;
}

export interface ImageQueryParams {
  status?: string;
  limit?: string;
  offset?: string;
  orderBy?: string;
  orderDirection?: string;
}

export interface ImageMetadataResponse {
  id: string;
  originalName: string;
  fileHash: string;
  status: ImageStatus;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: number;
  extension: string;
  mimeType: string;
  createdAt: string;  // ISO 8601 format
  updatedAt: string;  // ISO 8601 format
}

export class CollectionsService {
  private basePath: string;

  constructor(basePath: string = './private') {
    this.basePath = path.resolve(basePath);
  }

  /**
   * Lists all collections by scanning the base directory
   */
  async listCollections(): Promise<CollectionInfo[]> {
    try {
      // Ensure base path exists
      await fs.mkdir(this.basePath, { recursive: true });
      
      // Read directory contents
      const entries = await fs.readdir(this.basePath, { withFileTypes: true });
      
      // Filter for directories and return collection info
      const collections: CollectionInfo[] = [];
      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Verify it's a valid collection by checking for collection.db
          const dbPath = path.join(this.basePath, entry.name, 'collection.db');
          try {
            await fs.access(dbPath);
            collections.push({ id: entry.name });
          } catch {
            // Skip directories without collection.db
          }
        }
      }
      
      return collections.sort((a, b) => a.id.localeCompare(b.id));
    } catch (error: any) {
      if (error.code === 'EACCES' || error.code === 'EPERM') {
        throw new Error('Server error: insufficient permissions to access collections directory');
      }
      throw new Error('Server error: failed to list collections');
    }
  }

  /**
   * Creates a new collection with the given ID
   */
  async createCollection(id: string): Promise<CollectionInfo> {
    // Validate collection ID
    if (!this.isValidCollectionId(id)) {
      throw new Error('Invalid collection ID format');
    }

    // Check if collection already exists
    if (await this.collectionExists(id)) {
      throw new Error('Duplicate collection ID');
    }

    try {
      // Use domain layer to create collection
      const collection = await Collection.create(id, this.basePath);
      await collection.close();
      
      return { id };
    } catch (error: any) {
      if (error.message.includes('insufficient permissions')) {
        throw new Error('Server error: insufficient permissions to create collection');
      }
      if (error.message.includes('Unable to create Collection')) {
        throw new Error('Server error: failed to create collection');
      }
      throw new Error('Server error: ' + error.message);
    }
  }

  /**
   * Retrieves a collection by ID
   */
  async getCollection(id: string): Promise<CollectionInfo> {
    if (!await this.collectionExists(id)) {
      throw new Error('Collection not found');
    }
    
    return { id };
  }

  /**
   * Deletes a collection and all its contents
   */
  async deleteCollection(id: string): Promise<void> {
    if (!await this.collectionExists(id)) {
      throw new Error('Collection not found');
    }

    try {
      const collectionPath = path.join(this.basePath, id);
      await fs.rm(collectionPath, { recursive: true, force: true });
    } catch (error: any) {
      if (error.code === 'EACCES' || error.code === 'EPERM') {
        throw new Error('Server error: insufficient permissions to delete collection');
      }
      throw new Error('Server error: failed to delete collection');
    }
  }

  /**
   * Retrieves images from a collection with filtering, ordering, and pagination
   */
  async getCollectionImages(id: string, queryParams: ImageQueryParams): Promise<ImageMetadataResponse[]> {
    try {
      // Parse and validate query parameters first
      const validatedOptions = this.parseImageQueryParams(queryParams);
      
      // Check if collection directory exists to distinguish between "not found" and "access issues"
      if (!await this.collectionDirectoryExists(id)) {
        throw new Error('Collection not found');
      }
      
      const collectionPath = path.join(this.basePath, id);
      
      // Load collection and get images
      const collection = await Collection.load(collectionPath);
      const images = await collection.getImages(validatedOptions);
      await collection.close();
      
      // Convert to API response format with pagination
      return this.convertToApiResponse(images, validatedOptions);
    } catch (error: any) {
      if (error.message.includes('Invalid')) {
        throw error; // Re-throw validation errors
      }
      if (error.message.includes('Collection not found')) {
        throw new Error('Collection not found');
      }
      if (error.code === 'EACCES' || error.code === 'EPERM' || error.message.includes('permission')) {
        throw new Error('Server error: insufficient permissions to access collection');
      }
      throw new Error('Server error: failed to retrieve collection images');
    }
  }

  /**
   * Checks if a collection directory exists
   */
  private async collectionDirectoryExists(id: string): Promise<boolean> {
    try {
      const collectionPath = path.join(this.basePath, id);
      const stat = await fs.stat(collectionPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Checks if a collection exists (directory + accessible database)
   */
  private async collectionExists(id: string): Promise<boolean> {
    try {
      const collectionPath = path.join(this.basePath, id);
      const dbPath = path.join(collectionPath, 'collection.db');
      
      const [stat, _] = await Promise.all([
        fs.stat(collectionPath),
        fs.access(dbPath)
      ]);
      
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Validates collection ID for filesystem safety
   */
  private isValidCollectionId(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }

    // Check for empty string
    if (id.trim().length === 0) {
      return false;
    }

    // Check for directory traversal attempts
    if (id === '.' || id === '..') {
      return false;
    }

    // Check for filesystem-unsafe characters
    const unsafeChars = /[\/\\:*?"<>|]/;
    if (unsafeChars.test(id)) {
      return false;
    }

    // Additional restrictions for safety
    if (id.startsWith('.') || id.endsWith('.')) {
      return false;
    }

    return true;
  }

  /**
   * Parses and validates query parameters for image listing
   */
  private parseImageQueryParams(queryParams: ImageQueryParams) {
    const options: QueryOptions & { limit?: number; offset?: number } = {};

    // Validate status
    if (queryParams.status !== undefined) {
      const validStatuses: ImageStatus[] = ['INBOX', 'COLLECTION', 'ARCHIVE'];
      if (!validStatuses.includes(queryParams.status as ImageStatus)) {
        throw new Error('Invalid status parameter: must be one of INBOX, COLLECTION, ARCHIVE');
      }
      options.status = queryParams.status as ImageStatus;
    }

    // Validate limit
    if (queryParams.limit !== undefined) {
      const limit = parseInt(queryParams.limit, 10);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        throw new Error('Invalid limit parameter: must be a number between 1 and 1000');
      }
      options.limit = limit;
    }

    // Validate offset
    if (queryParams.offset !== undefined) {
      const offset = parseInt(queryParams.offset, 10);
      if (isNaN(offset) || offset < 0) {
        throw new Error('Invalid offset parameter: must be a non-negative number');
      }
      options.offset = offset;
    }

    // Validate orderBy
    if (queryParams.orderBy !== undefined) {
      const validOrderBy = ['created_at', 'updated_at'];
      if (!validOrderBy.includes(queryParams.orderBy)) {
        throw new Error('Invalid orderBy parameter: must be created_at or updated_at');
      }
      options.orderBy = queryParams.orderBy as 'created_at' | 'updated_at';
    }

    // Validate orderDirection
    if (queryParams.orderDirection !== undefined) {
      const validDirections = ['ASC', 'DESC'];
      if (!validDirections.includes(queryParams.orderDirection)) {
        throw new Error('Invalid orderDirection parameter: must be ASC or DESC');
      }
      options.orderDirection = queryParams.orderDirection as 'ASC' | 'DESC';
    }

    return options;
  }

  /**
   * Converts ImageMetadata to API response format with pagination
   */
  private convertToApiResponse(
    images: ImageMetadata[], 
    options: { limit?: number; offset?: number }
  ): ImageMetadataResponse[] {
    // Apply pagination if specified
    let result = images;
    
    if (options.offset !== undefined) {
      result = result.slice(options.offset);
    }
    
    if (options.limit !== undefined) {
      result = result.slice(0, options.limit);
    }

    // Convert Date objects to ISO strings
    return result.map(image => ({
      id: image.id,
      originalName: image.originalName,
      fileHash: image.fileHash,
      status: image.status,
      size: image.size,
      dimensions: {
        width: image.dimensions.width,
        height: image.dimensions.height
      },
      aspectRatio: image.aspectRatio,
      extension: image.extension,
      mimeType: image.mimeType,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString()
    }));
  }
}