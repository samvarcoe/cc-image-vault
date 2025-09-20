import { Model } from '../../mvc.js';
export default class HomePageModel extends Model {
    constructor(initialData = {}) {
        super(Object.assign({ collections: [], error: '', loading: false, creationForm: { name: '', validationError: '', loading: false } }, initialData));
    }
    ;
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
    getCreationFormName() {
        var _a;
        return ((_a = this.data.creationForm) === null || _a === void 0 ? void 0 : _a.name) || '';
    }
    setCreationFormName(name) {
        if (!this.data.creationForm) {
            this.data.creationForm = { name: '', validationError: '', loading: false };
        }
        this.data.creationForm.name = name;
    }
    getCreationFormValidationError() {
        var _a;
        return ((_a = this.data.creationForm) === null || _a === void 0 ? void 0 : _a.validationError) || '';
    }
    setCreationFormValidationError(error) {
        if (!this.data.creationForm) {
            this.data.creationForm = { name: '', validationError: '', loading: false };
        }
        this.data.creationForm.validationError = error;
    }
    clearCreationFormValidationError() {
        if (this.data.creationForm) {
            this.data.creationForm.validationError = '';
        }
    }
    isCreationFormLoading() {
        var _a;
        return ((_a = this.data.creationForm) === null || _a === void 0 ? void 0 : _a.loading) || false;
    }
    setCreationFormLoading(loading) {
        if (!this.data.creationForm) {
            this.data.creationForm = { name: '', validationError: '', loading: false };
        }
        this.data.creationForm.loading = loading;
    }
    clearCreationForm() {
        this.data.creationForm = { name: '', validationError: '', loading: false };
    }
    addCollection(name) {
        if (!this.data.collections) {
            this.data.collections = [];
        }
        this.data.collections.push(name);
        this.data.collections.sort();
    }
    validateCollectionName(name) {
        if (!name || name.trim() === '') {
            return 'Collection name is required';
        }
        if (name.length > 256) {
            return 'Collection name must be 256 characters or less';
        }
        const validNamePattern = /^[a-zA-Z0-9_-]+$/;
        if (!validNamePattern.test(name)) {
            return 'Collection names may only contain letters, numbers, underscores and hyphens';
        }
        const collections = this.getCollections();
        if (collections.includes(name)) {
            return 'A Collection with that name already exists';
        }
        return null;
    }
    async createCollection(name) {
        try {
            this.setCreationFormLoading(true);
            this.clearCreationFormValidationError();
            const response = await fetch('/api/collections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'An error occurred whilst creating the Collection');
            }
            this.addCollection(name);
            this.clearCreationForm();
        }
        catch (error) {
            this.setCreationFormValidationError(error instanceof Error ? error.message : 'An error occurred whilst creating the Collection');
            this.setCreationFormLoading(false);
            this.setCreationFormName('');
            throw error;
        }
        finally {
            this.setCreationFormLoading(false);
        }
    }
}
