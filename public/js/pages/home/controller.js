import { Controller } from '../../mvc.js';
import { HomePageModel } from './model.js';
import { HomePageView } from './view.js';
export class HomePageController extends Controller {
    constructor(model, view) {
        super(model, view);
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
        const model = this.model;
        const elementId = input.getAttribute('data-testid') || input.id;
        model.captureFocusState(elementId, input.selectionStart, input.selectionEnd);
        model.updateFormState(value);
        if (value && !model.getFormState().isValid) {
            model.setFormError('validation', 'Collection ID can only contain letters, numbers, and hyphens');
        }
        else {
            model.clearFormErrors();
        }
        this.updateView();
    }
    updateView() {
        super.updateView();
        this.restoreFocusState();
    }
    restoreFocusState() {
        const model = this.model;
        const focusState = model.getFocusState();
        if (focusState.activeElementId) {
            const element = document.querySelector(`[data-testid="${focusState.activeElementId}"], #${focusState.activeElementId}`);
            if (element && element.focus) {
                element.focus();
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    if (focusState.selectionStart !== null && focusState.selectionEnd !== null) {
                        element.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
                    }
                }
            }
        }
    }
    async handleCreateCollection(event) {
        event.preventDefault();
        const model = this.model;
        const formState = model.getFormState();
        if (!formState.isValid) {
            return;
        }
        model.setCreatingCollection(true);
        const existingCollection = model.getCollections().find(c => c.id === formState.collectionId);
        if (!existingCollection) {
            model.addCollectionOptimistically(formState.collectionId);
        }
        this.updateView();
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
                    model.removeCollectionOptimistically(formState.collectionId);
                }
                model.setFormError('duplicate');
                model.setCreatingCollection(false);
                this.updateView();
                return;
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            model.resetForm();
            model.setCreatingCollection(false);
            this.updateView();
        }
        catch (error) {
            console.error('Error creating collection:', error);
            if (!existingCollection) {
                model.removeCollectionOptimistically(formState.collectionId);
            }
            model.setFormError('server', 'Failed to create collection. Please try again.');
            model.setCreatingCollection(false);
            this.updateView();
        }
    }
    handleDeleteCollection(element) {
        const collectionId = element.dataset.collectionId;
        if (!collectionId)
            return;
        this.model.setDeletingCollection(collectionId);
        this.updateView();
    }
    handleCancelDeletion() {
        this.model.setDeletingCollection(null);
        this.updateView();
    }
    async handleConfirmDeletion() {
        const model = this.model;
        const collectionId = model.getLoadingState().deletingCollection;
        if (!collectionId)
            return;
        model.removeCollectionOptimistically(collectionId);
        this.updateView();
        try {
            const response = await fetch(`/api/collections/${collectionId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            model.setDeletingCollection(null);
            this.updateView();
        }
        catch (error) {
            console.error('Error deleting collection:', error);
            model.addCollectionOptimistically(collectionId);
            model.setDeletingCollection(null);
            this.updateView();
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const serverData = window.__MODEL_DATA__;
    const parsedData = JSON.parse(serverData);
    const model = new HomePageModel(parsedData.collections || []);
    const view = new HomePageView(model);
    const controller = new HomePageController(model, view);
    controller.init();
});
