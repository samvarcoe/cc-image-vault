import { ImageStatus, QueryOptions } from '@/domain';

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
