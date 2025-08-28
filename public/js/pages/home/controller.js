import { Controller } from '../../mvc.js';
export default class HomePageController extends Controller {
    constructor(model, view) {
        super(model, view);
        this.attachEventListeners();
    }
    attachEventListeners() {
        document.addEventListener('click', (e) => {
            var _a;
            const target = e.target;
            const id = target.dataset.id || ((_a = target.closest('[data-id]')) === null || _a === void 0 ? void 0 : _a.getAttribute('data-id'));
            switch (id) {
                case 'delete-collection':
                    this.handleDeleteCollection(target.closest('[data-id]'));
                    break;
                case 'cancel-deletion':
                    this.handleCancelDeletion();
                    break;
                case 'confirm-deletion':
                    this.handleConfirmDeletion();
                    break;
                case 'create-collection-submit':
                    this.handleCreateCollection(e);
                    break;
            }
        });
        document.addEventListener('input', (e) => {
            const target = e.target;
            const id = target.dataset.id;
            if (id === 'collection-id-input') {
                this.handleCollectionIdInput(target);
            }
        });
        document.addEventListener('submit', (e) => {
            const target = e.target;
            const id = target.dataset.id;
            if (id === 'create-collection-form') {
                e.preventDefault();
                this.handleCreateCollection(e);
            }
        });
    }
    handleCollectionIdInput(input) {
        const value = input.value.trim();
        this.model.updateFormState(value);
        if (value && !this.model.getFormState().isValid) {
            this.model.setFormError('validation', 'Collection ID can only contain letters, numbers, and hyphens');
        }
        else {
            this.model.clearFormErrors();
        }
        this.view.update();
    }
    async handleCreateCollection(event) {
        event.preventDefault();
        const formState = this.model.getFormState();
        if (!formState.isValid) {
            return;
        }
        this.model.setCreatingCollection(true);
        const existingCollection = this.model.getCollections().find(c => c.id === formState.collectionId);
        if (!existingCollection) {
            this.model.addCollectionOptimistically(formState.collectionId);
        }
        this.view.update();
        try {
            const response = await fetch('/api/collections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: formState.collectionId })
            });
            if (response.status === 409) {
                if (!existingCollection) {
                    this.model.removeCollectionOptimistically(formState.collectionId);
                }
                this.model.setFormError('duplicate');
                this.model.setCreatingCollection(false);
                this.view.update();
                return;
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.model.resetForm();
            this.model.setCreatingCollection(false);
            this.view.update();
        }
        catch (error) {
            console.error('Error creating collection:', error);
            if (!existingCollection) {
                this.model.removeCollectionOptimistically(formState.collectionId);
            }
            this.model.setFormError('server', 'Failed to create collection. Please try again.');
            this.model.setCreatingCollection(false);
            this.view.update();
        }
    }
    handleDeleteCollection(element) {
        const collectionId = element.dataset.collectionId;
        if (!collectionId)
            return;
        this.model.setDeletingCollection(collectionId);
        this.view.update();
    }
    handleCancelDeletion() {
        this.model.setDeletingCollection(null);
        this.view.update();
    }
    async handleConfirmDeletion() {
        const collectionId = this.model.getLoadingState().deletingCollection;
        if (!collectionId)
            return;
        this.model.removeCollectionOptimistically(collectionId);
        this.view.update();
        try {
            const response = await fetch(`/api/collections/${collectionId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.model.setDeletingCollection(null);
            this.view.update();
        }
        catch (error) {
            console.error('Error deleting collection:', error);
            this.model.addCollectionOptimistically(collectionId);
            this.model.setDeletingCollection(null);
            this.view.update();
        }
    }
}
