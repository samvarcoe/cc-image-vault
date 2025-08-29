import { promises as fs } from 'fs';
import path from 'path';
import { ImageStatus, QueryOptions } from '../domain/types';

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

/**
 * Validates collection ID for filesystem safety
 */
export function validateCollectionId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid collection ID format');
  }

  // Check for empty string
  if (id.trim().length === 0) {
    throw new Error('Invalid collection ID format');
  }

  // Check for directory traversal attempts
  if (id === '.' || id === '..') {
    throw new Error('Invalid collection ID format');
  }

  // Check for filesystem-unsafe characters
  const unsafeChars = /[/\\:*?"<>|]/;
  if (unsafeChars.test(id)) {
    throw new Error('Invalid collection ID format');
  }

  // Additional restrictions for safety
  if (id.startsWith('.') || id.endsWith('.')) {
    throw new Error('Invalid collection ID format');
  }
}

/**
 * Lists all collections by scanning the base directory
 */
export async function listCollectionDirectories(basePath: string): Promise<CollectionInfo[]> {
  try {
    // Ensure base path exists
    await fs.mkdir(basePath, { recursive: true });
    
    // Read directory contents
    const entries = await fs.readdir(basePath, { withFileTypes: true });
    
    // Filter for directories and return collection info
    const collections: CollectionInfo[] = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Verify it's a valid collection by checking for collection.db
        const dbPath = path.join(basePath, entry.name, 'collection.db');
        try {
          await fs.access(dbPath);
          collections.push({ id: entry.name });
        } catch {
          // Skip directories without collection.db
        }
      }
    }
    
    return collections.sort((a, b) => a.id.localeCompare(b.id));
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'EACCES' || (error as NodeJS.ErrnoException).code === 'EPERM') {
      throw new Error('Server error: insufficient permissions to access collections directory');
    }
    throw new Error('Server error: failed to list collections');
  }
}

/**
 * Checks if a collection exists (directory + accessible database)
 */
export async function collectionExists(basePath: string, id: string): Promise<boolean> {
  try {
    const collectionPath = path.join(basePath, id);
    const dbPath = path.join(collectionPath, 'collection.db');
    
    const [stat] = await Promise.all([
      fs.stat(collectionPath),
      fs.access(dbPath)
    ]);
    
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Checks if a collection directory exists
 */
export async function collectionDirectoryExists(collectionPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(collectionPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Parses and validates query parameters for image listing
 */
export function parseImageQueryParams(queryParams: ImageQueryParams): QueryOptions & { limit?: number; offset?: number } {
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
export function convertToApiResponse(
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