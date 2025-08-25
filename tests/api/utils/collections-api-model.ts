import { APIModel } from './api-model';
import { ImageStatus } from '../../../src/domain/types';

// Type definitions for Collections API
export interface CreateCollectionRequest {
  id: string;
}

export interface CollectionResponse {
  id: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

// Type definitions for Images API
export interface ImageQueryParams {
  status?: ImageStatus;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at';
  orderDirection?: 'ASC' | 'DESC';
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
 * Collections API client for testing
 * Extends the base APIModel with collections-specific endpoints
 */
export class CollectionsAPI extends APIModel {
  '/api/collections' = {
    get: this.request<undefined, CollectionResponse[]>('/api/collections', 'GET'),
    post: this.request<CreateCollectionRequest, CollectionResponse>('/api/collections', 'POST'),
  };

  '/api/collections/:id' = {
    get: this.request<undefined, CollectionResponse>('/api/collections/:id', 'GET'),
    delete: this.request<undefined, void>('/api/collections/:id', 'DELETE'),
  };

  '/api/collections/:id/images' = {
    get: this.request<undefined, ImageMetadataResponse[]>('/api/collections/:id/images', 'GET'),
  };

  '/api/images/:collectionId/:imageId' = {
    get: this.request<undefined, undefined>('/api/images/:collectionId/:imageId', 'GET'),
  };

  '/api/images/:collectionId/:imageId/thumbnail' = {
    get: this.request<undefined, undefined>('/api/images/:collectionId/:imageId/thumbnail', 'GET'),
  };

}