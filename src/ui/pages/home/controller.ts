import { Controller } from '../../mvc.js';
import { HomePageModel, HomePageData } from './model.js';
import { HomePageView } from './view.js';

export class HomePageController extends Controller<HomePageData> {
  constructor(model: HomePageModel, view: HomePageView) {
    super(model, view);
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
    const model = this.model as HomePageModel;
    
    // Capture current focus state before any updates
    const elementId = input.getAttribute('data-testid') || input.id;
    model.captureFocusState(elementId, input.selectionStart, input.selectionEnd);
    
    model.updateFormState(value);
    
    // Update validation errors
    if (value && !model.getFormState().isValid) {
      model.setFormError('validation', 'Collection ID can only contain letters, numbers, and hyphens');
    } else {
      model.clearFormErrors();
    }
    
    // Clean MVC approach - full re-render with focus restoration
    this.updateView();
  }

  protected updateView(): void {
    // Call parent's updateView to do the DOM re-render
    super.updateView();
    
    // Restore focus state after re-render
    this.restoreFocusState();
  }

  private restoreFocusState(): void {
    const model = this.model as HomePageModel;
    const focusState = model.getFocusState();
    
    if (focusState.activeElementId) {
      const element = document.querySelector(`[data-testid="${focusState.activeElementId}"], #${focusState.activeElementId}`) as HTMLInputElement;
      
      if (element && element.focus) {
        element.focus();
        
        // Restore cursor position for text inputs
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          if (focusState.selectionStart !== null && focusState.selectionEnd !== null) {
            element.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
          }
        }
      }
    }
  }

  private async handleCreateCollection(event: Event): Promise<void> {
    event.preventDefault();
    
    const model = this.model as HomePageModel;
    const formState = model.getFormState();
    
    if (!formState.isValid) {
      return;
    }

    // Set loading state and update view optimistically
    model.setCreatingCollection(true);
    // Only add optimistically if collection doesn't already exist
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
        // Revert optimistic update only if we added one
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

      // Success - reset form
      model.resetForm();
      model.setCreatingCollection(false);
      this.updateView();
    } catch (error) {
      console.error('Error creating collection:', error);
      // Revert optimistic update only if we added one
      if (!existingCollection) {
        model.removeCollectionOptimistically(formState.collectionId);
      }
      model.setFormError('server', 'Failed to create collection. Please try again.');
      model.setCreatingCollection(false);
      this.updateView();
    }
  }

  private handleDeleteCollection(element: HTMLElement): void {
    const collectionId = element.dataset.collectionId;
    if (!collectionId) return;

    (this.model as HomePageModel).setDeletingCollection(collectionId);
    this.updateView();
  }

  private handleCancelDeletion(): void {
    (this.model as HomePageModel).setDeletingCollection(null);
    this.updateView();
  }

  private async handleConfirmDeletion(): Promise<void> {
    const model = this.model as HomePageModel;
    const collectionId = model.getLoadingState().deletingCollection;
    
    if (!collectionId) return;

    // Optimistically remove from UI
    model.removeCollectionOptimistically(collectionId);
    this.updateView();

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Success - reset deletion state
      model.setDeletingCollection(null);
      this.updateView();
    } catch (error) {
      console.error('Error deleting collection:', error);
      // Revert optimistic update
      model.addCollectionOptimistically(collectionId);
      model.setDeletingCollection(null);
      // Could add error state here for deletion failures
      this.updateView();
    }
  }
}

// Initialize the controller when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Get collections from server-rendered data
  const serverData = (window as unknown as { __MODEL_DATA__: string }).__MODEL_DATA__;
  const parsedData = JSON.parse(serverData);
  
  const model = new HomePageModel(parsedData.collections || []);
  const view = new HomePageView(model);
  const controller = new HomePageController(model, view);
  controller.init();
});