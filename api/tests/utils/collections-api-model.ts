import { APIModel } from './api-model';

/**
 * Collections API client for testing
 * Extends the base APIModel with collections-specific endpoints
 */
export class CollectionsAPI extends APIModel {
  '/api/collections' = {
    get: this.request<undefined, string[]>('/api/collections', 'GET'),
  };
}