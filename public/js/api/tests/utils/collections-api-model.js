import { APIModel } from './api-model';
export class CollectionsAPI extends APIModel {
    constructor() {
        super(...arguments);
        this['/api/collections'] = {
            get: this.request('/api/collections', 'GET'),
            post: this.request('/api/collections', 'POST'),
        };
        this['/api/images/:collectionId'] = {
            post: this.request('/api/images/:collectionId', 'POST'),
        };
        this['/api/images/:collectionId/:imageId'] = {
            get: this.request('/api/images/:collectionId/:imageId', 'GET'),
            patch: this.request('/api/images/:collectionId/:imageId', 'PATCH'),
            delete: this.request('/api/images/:collectionId/:imageId', 'DELETE'),
        };
        this['/api/images/:collectionId/:imageId/thumbnail'] = {
            get: this.request('/api/images/:collectionId/:imageId/thumbnail', 'GET'),
        };
        this['/api/images/:collectionId/:imageId/download'] = {
            get: this.request('/api/images/:collectionId/:imageId/download', 'GET'),
        };
        this['/api/images/:collectionId/download'] = {
            post: this.request('/api/images/:collectionId/download', 'POST'),
        };
    }
}
