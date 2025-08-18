import { APIModel } from './api-model';

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
}