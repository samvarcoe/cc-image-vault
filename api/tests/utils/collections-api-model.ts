import { APIModel } from './api-model';

/**
 * Request type for creating a collection
 */
export type CreateCollectionRequest = {
  name: string;
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
  };

  '/api/images/:collectionId/:imageId/thumbnail' = {
    get: this.request<undefined, ArrayBuffer>('/api/images/:collectionId/:imageId/thumbnail', 'GET'),
  };
}