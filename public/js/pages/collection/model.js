import { Model } from '../../mvc.js';
export default class CollectionPageModel extends Model {
    constructor(data = {}) {
        super(Object.assign({ collectionId: undefined, statusFilter: 'COLLECTION', images: [], popoverImageId: null }, data));
    }
    getCollectionId() {
        return this.data.collectionId;
    }
    getImages() {
        return this.data.images || [];
    }
    getStatusFilter() {
        return this.data.statusFilter;
    }
    isPopoverOpen() {
        return this.data.popoverImageId !== null && this.data.popoverImageId !== undefined;
    }
    getPopoverImageId() {
        return this.data.popoverImageId || null;
    }
    openPopover(imageId) {
        this.data.popoverImageId = imageId;
    }
    closePopover() {
        this.data.popoverImageId = null;
    }
}
