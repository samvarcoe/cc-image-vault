import { Model } from '../../mvc.js';
export default class CollectionPageModel extends Model {
    getCollectionId() {
        return this.data.collectionId;
    }
    getStatusFilter() {
        return this.data.statusFilter;
    }
    getImages() {
        return this.data.images || [];
    }
    hasImages() {
        return this.getImages().length > 0;
    }
    isLoading() {
        return this.data.loading;
    }
    getError() {
        return this.data.error;
    }
    hasError() {
        return !!this.data.error;
    }
    isNotFoundError() {
        return this.data.error === 'Collection not found';
    }
    getEmptyStateMessage() {
        return `This collection has no images with status: "${this.data.statusFilter}"`;
    }
}
