import { Model } from '../../mvc.js';
export default class HomePageModel extends Model {
    constructor(initialData) {
        const { collections = [], formState = { collectionId: '', isValid: false, isSubmitting: false }, errorState = { validation: null, duplicate: false, server: null }, loadingState = { creatingCollection: false, deletingCollection: null }, } = initialData || {};
        super({
            collections,
            formState,
            errorState,
            loadingState,
        });
    }
    getCollections() {
        return this.data.collections || [];
    }
    getSortedCollections() {
        return [...this.getCollections()].sort((a, b) => a.id.localeCompare(b.id));
    }
    hasCollections() {
        return this.getCollections().length > 0;
    }
    getFormState() {
        return this.data.formState;
    }
    getErrorState() {
        return this.data.errorState;
    }
    getLoadingState() {
        return this.data.loadingState;
    }
    updateFormState(collectionId) {
        this.data.formState = Object.assign(Object.assign({}, this.data.formState), { collectionId, isValid: this.isValidCollectionId(collectionId) });
    }
    setFormSubmitting(isSubmitting) {
        this.data.formState = Object.assign(Object.assign({}, this.data.formState), { isSubmitting });
    }
    setFormError(type, message) {
        if (type === 'validation') {
            this.data.errorState.validation = message || null;
        }
        else if (type === 'duplicate') {
            this.data.errorState.duplicate = true;
        }
        else if (type === 'server') {
            this.data.errorState.server = message || null;
        }
    }
    clearFormErrors() {
        this.data.errorState = {
            validation: null,
            duplicate: false,
            server: null
        };
    }
    setCreatingCollection(isCreating) {
        this.data.loadingState.creatingCollection = isCreating;
    }
    setDeletingCollection(collectionId) {
        this.data.loadingState.deletingCollection = collectionId;
    }
    addCollectionOptimistically(collectionId) {
        this.data.collections = [...this.data.collections, { id: collectionId }];
    }
    removeCollectionOptimistically(collectionId) {
        this.data.collections = this.data.collections.filter(c => c.id !== collectionId);
    }
    resetForm() {
        this.data.formState = {
            collectionId: '',
            isValid: false,
            isSubmitting: false
        };
        this.clearFormErrors();
    }
    isValidCollectionId(id) {
        return /^[a-zA-Z0-9-]+$/.test(id) && id.trim().length > 0;
    }
}
