import { APIModel } from './api-model';

type ImageMetadata = {
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
  created: Date;
  updated: Date;
};

/**
 * Request type for creating a collection
 */
export type CreateCollectionRequest = {
  name: string;
};

/**
 * Request type for updating image status
 */
export type ImageUpdateRequest = {
  status: string;
};

/**
 * Collections API client for testing
 * Extends the base APIModel with collections-specific endpoints and image serving
 */
export class CollectionsAPI extends APIModel {
  '/api/collections' = {
    get: this.request<undefined, string[]>('/api/collections', 'GET'),
    post: this.request<CreateCollectionRequest, undefined>('/api/collections', 'POST'),
  };

  '/api/images/:collectionId/:imageId' = {
    get: this.request<undefined, ArrayBuffer>('/api/images/:collectionId/:imageId', 'GET'),
    patch: this.request<ImageUpdateRequest, ImageMetadata>('/api/images/:collectionId/:imageId', 'PATCH'),
  };

  '/api/images/:collectionId/:imageId/thumbnail' = {
    get: this.request<undefined, ArrayBuffer>('/api/images/:collectionId/:imageId/thumbnail', 'GET'),
  };
}