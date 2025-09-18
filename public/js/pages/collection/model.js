import { Model } from '../../mvc.js';
export default class CollectionPageModel extends Model {
    constructor(initialData = {}) {
        super(Object.assign({ name: '', images: [], error: '', loading: false }, initialData));
    }
    getCollectionName() {
        return this.data.name || '';
    }
    getImages() {
        return this.data.images || [];
    }
    hasImages() {
        return (this.data.images || []).length > 0;
    }
    hasError() {
        return !!this.data.error;
    }
    getErrorMessage() {
        return this.data.error || '';
    }
    isLoading() {
        return this.data.loading || false;
    }
}
