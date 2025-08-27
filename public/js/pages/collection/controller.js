import { Controller } from '../../mvc.js';
export class CollectionPageController extends Controller {
    constructor(model, view) {
        super(model, view);
        this.collectionModel = model;
        this.collectionView = view;
    }
    attachEventListeners() {
    }
    handleStatusFilterChange(newStatus) {
        const collectionId = this.collectionModel.getCollectionId();
        const url = newStatus === 'COLLECTION'
            ? `/collection/${collectionId}`
            : `/collection/${collectionId}?status=${newStatus}`;
        window.location.href = url;
    }
    handleImageClick(imageId) {
        console.log(`Image clicked: ${imageId}`);
    }
    monitorPerformance() {
    }
}
