import { Model } from '../../mvc.js';
export default class HomePageModel extends Model {
    async loadCollections() {
        try {
            this.data.loading = true;
            this.data.error = undefined;
            const response = await fetch('/api/collections');
            if (!response.ok) {
                throw new Error('Failed to fetch collections');
            }
            const collections = await response.json();
            this.data.collections = collections;
            this.data.loading = false;
        }
        catch (_a) {
            this.data.error = 'Unable to load collections';
            this.data.loading = false;
            this.data.collections = undefined;
        }
    }
    getCollections() {
        return this.data.collections || [];
    }
    hasError() {
        return !!this.data.error;
    }
    getErrorMessage() {
        return this.data.error || '';
    }
    hasCollections() {
        return (this.data.collections || []).length > 0;
    }
    isLoading() {
        return this.data.loading || false;
    }
}
