import { Model } from '../../mvc.js';
export class CollectionPageModel extends Model {
    constructor(collectionId, images = [], statusFilter = 'COLLECTION', loading = false, error) {
        const imageDisplayData = images.map(img => ({
            id: img.id,
            thumbnailUrl: `/api/images/${collectionId}/${img.id}/thumbnail`,
            originalName: img.originalName,
            status: img.status,
            dimensions: img.dimensions,
            aspectRatio: img.aspectRatio
        }));
        super({
            collectionId,
            statusFilter,
            images: imageDisplayData,
            loading,
            error
        });
    }
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
    getPageTitle() {
        if (this.isNotFoundError()) {
            return 'Collection Not Found - Image Vault';
        }
        return `Collection ${this.data.collectionId} - Image Vault`;
    }
    setLoading(loading) {
        this.data.loading = loading;
    }
    setError(error) {
        this.data.error = error;
    }
    updateImages(images) {
        this.data.images = images;
    }
    updateStatusFilter(status) {
        this.data.statusFilter = status;
    }
}
