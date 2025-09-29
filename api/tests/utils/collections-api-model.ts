import { APIModel } from './api-model';

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

  '/api/images/:collectionId' = {
    post: this.request<FormData, ImageMetadata>('/api/images/:collectionId', 'POST'),
  };

  '/api/images/:collectionId/:imageId' = {
    get: this.request<undefined, ArrayBuffer>('/api/images/:collectionId/:imageId', 'GET'),
    patch: this.request<ImageUpdateRequest, ImageMetadata>('/api/images/:collectionId/:imageId', 'PATCH'),
    delete: this.request<undefined, undefined>('/api/images/:collectionId/:imageId', 'DELETE'),
  };

  '/api/images/:collectionId/:imageId/thumbnail' = {
    get: this.request<undefined, ArrayBuffer>('/api/images/:collectionId/:imageId/thumbnail', 'GET'),
  };

  '/api/images/:collectionId/:imageId/download' = {
    get: this.request<undefined, ArrayBuffer>('/api/images/:collectionId/:imageId/download', 'GET'),
  };
}