import { Controller } from '../../mvc.js';
import HomePageModel from './model.js';
import HomePageView from './view.js';

export default class HomePageController extends Controller<HomePageModel, HomePageView> {
  constructor(model: HomePageModel, view: HomePageView) {
    super(model, view);
    this.attachEventListeners();
  }

  protected attachEventListeners(): void {
    // Single event listener using data-id delegation pattern
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const id = target.dataset.id || target.closest('[data-id]')?.getAttribute('data-id');

      switch (id) {
        case 'delete-collection':
          this.handleDeleteCollection(target.closest('[data-id]') as HTMLElement);
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

    // Handle input events for form validation
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLElement;
      const id = target.dataset.id;

      if (id === 'collection-id-input') {
        this.handleCollectionIdInput(target as HTMLInputElement);
      }
    });

    // Handle form submission
    document.addEventListener('submit', (e) => {
      const target = e.target as HTMLElement;
      const id = target.dataset.id;

      if (id === 'create-collection-form') {
        e.preventDefault();
        this.handleCreateCollection(e);
      }
    });
  }

  private handleCollectionIdInput(input: HTMLInputElement): void {
    const value = input.value.trim();
    
    this.model.updateFormState(value);
    
    // Update validation errors
    if (value && !this.model.getFormState().isValid) {
      this.model.setFormError('validation', 'Collection ID can only contain letters, numbers, and hyphens');
    } else {
      this.model.clearFormErrors();
    }

    this.view.update();
  }

  private async handleCreateCollection(event: Event): Promise<void> {
    event.preventDefault();

    const formState = this.model.getFormState();
    
    if (!formState.isValid) {
      return;
    }

    // Set loading state and update view optimistically
    this.model.setCreatingCollection(true);
    // Only add optimistically if collection doesn't already exist
    const existingCollection = this.model.getCollections().find(id => id === formState.collectionId);
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
        // Revert optimistic update only if we added one
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

      // Success - reset form
      this.model.resetForm();
      this.model.setCreatingCollection(false);
      this.view.update();
    } catch (error) {
      console.error('Error creating collection:', error);
      // Revert optimistic update only if we added one
      if (!existingCollection) {
        this.model.removeCollectionOptimistically(formState.collectionId);
      }
      this.model.setFormError('server', 'Failed to create collection. Please try again.');
      this.model.setCreatingCollection(false);
      this.view.update();
    }
  }

  private handleDeleteCollection(element: HTMLElement): void {
    const collectionId = element.dataset.collectionId;
    if (!collectionId) return;

    this.model.setDeletingCollection(collectionId);
    this.view.update();
  }

  private handleCancelDeletion(): void {
    this.model.setDeletingCollection(null);
    this.view.update();
  }

  private async handleConfirmDeletion(): Promise<void> {
    const collectionId = this.model.getLoadingState().deletingCollection;
    
    if (!collectionId) return;

    // Optimistically remove from UI
    this.model.removeCollectionOptimistically(collectionId);
    this.view.update();

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Success - reset deletion state
      this.model.setDeletingCollection(null);
      this.view.update();
    } catch (error) {
      console.error('Error deleting collection:', error);
      // Revert optimistic update
      this.model.addCollectionOptimistically(collectionId);
      this.model.setDeletingCollection(null);
      // Could add error state here for deletion failures
      this.view.update();
    }
  }
}