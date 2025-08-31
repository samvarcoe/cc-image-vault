import { View } from '../../mvc.js';
export default class HomePageView extends View {
    constructor(model) {
        super(model, 'home');
        this.model = model;
    }
    title() {
        return 'Image Vault - Home';
    }
    renderContent() {
        const collections = this.model.getSortedCollections();
        const hasCollections = this.model.hasCollections();
        return `
      <div class="home-page">
        <header class="page-header">
          <h1>Image Vault</h1>
          <p>Organize and manage your image collections</p>
        </header>

        <main class="main-content">
          ${hasCollections ? this.renderCollectionsList(collections) : this.renderEmptyState()}
          ${this.renderCreateCollectionForm()}
        </main>

        ${this.renderConfirmationDialog()}
      </div>
    `;
    }
    renderCollectionsList(collections) {
        return `
      <section class="collections-section">
        <h2>Your Collections</h2>
        <div data-testid="collections-list" class="collections-list">
          ${collections.map(collectionId => this.renderCollectionItem(collectionId)).join('')}
        </div>
      </section>
    `;
    }
    renderCollectionItem(collectionId) {
        const loadingState = this.model.getLoadingState();
        const isDeleting = loadingState.deletingCollection === collectionId;
        return `
      <div data-testid="collection-item-${collectionId}" class="collection-item">
        <a data-testid="collection-link-${collectionId}" href="/collection/${collectionId}" class="collection-link">
          <h3>${collectionId}</h3>
        </a>
        <button 
          data-testid="delete-button-${collectionId}" 
          data-id="delete-collection" 
          data-collection-id="${collectionId}"
          class="delete-button ${isDeleting ? 'loading' : ''}"
          ${isDeleting ? 'disabled' : ''}
        >
          ${isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    `;
    }
    renderEmptyState() {
        return `
      <div data-testid="empty-state" class="empty-state">
        <h2>No Collections Yet</h2>
        <p>Create your first collection to get started organizing your images.</p>
      </div>
    `;
    }
    renderCreateCollectionForm() {
        const formState = this.model.getFormState();
        const errorState = this.model.getErrorState();
        const loadingState = this.model.getLoadingState();
        return `
      <section class="create-collection-section">
        <h2>Create New Collection</h2>
        <form data-testid="create-collection-form" data-id="create-collection-form" class="create-collection-form">
          <div class="form-group">
            <label for="collection-id">Collection ID:</label>
            <input 
              data-testid="collection-id-input" 
              data-id="collection-id-input"
              type="text" 
              id="collection-id" 
              name="collectionId"
              value="${formState.collectionId}"
              placeholder="Enter collection name (letters, numbers, and hyphens only)"
              pattern="[a-zA-Z0-9\\-]+"
              ${formState.isSubmitting || loadingState.creatingCollection ? 'disabled' : ''}
              required
            />
            ${this.renderFormErrors(errorState)}
          </div>
          <button 
            data-testid="create-button" 
            data-id="create-collection-submit"
            type="submit" 
            class="create-button ${loadingState.creatingCollection ? 'loading' : ''}"
            ${!formState.isValid || formState.isSubmitting || loadingState.creatingCollection ? 'disabled' : ''}
          >
            ${loadingState.creatingCollection ? 'Creating...' : 'Create Collection'}
          </button>
        </form>
      </section>
    `;
    }
    renderConfirmationDialog() {
        const loadingState = this.model.getLoadingState();
        const collectionToDelete = loadingState.deletingCollection;
        const isVisible = collectionToDelete !== null;
        return `
      <div data-testid="confirmation-dialog" class="confirmation-dialog" style="display: ${isVisible ? 'flex' : 'none'};">
        <div class="dialog-overlay" data-id="cancel-deletion"></div>
        <div class="dialog-content">
          <h3 data-testid="dialog-title">Confirm Deletion</h3>
          <p data-testid="warning-message">
            Are you sure you want to delete the collection "<span data-testid="collection-id-display" class="collection-id">${collectionToDelete || ''}</span>"?
            This action cannot be undone and will permanently remove all images in this collection.
          </p>
          <div class="dialog-buttons">
            <button 
              data-testid="cancel-button" 
              data-id="cancel-deletion" 
              class="cancel-button"
            >
              Cancel
            </button>
            <button 
              data-testid="confirm-button" 
              data-id="confirm-deletion" 
              class="confirm-button danger"
            >
              Delete Collection
            </button>
          </div>
        </div>
      </div>
    `;
    }
    renderFormErrors(errorState) {
        let errors = '';
        if (errorState.validation) {
            errors += `<div data-testid="validation-error" class="validation-error">${errorState.validation}</div>`;
        }
        if (errorState.duplicate) {
            errors += `
        <div data-testid="duplicate-id-error" class="duplicate-id-error">
          A collection with this ID already exists. Please choose a different name.
        </div>
      `;
        }
        if (errorState.server) {
            errors += `
        <div data-testid="server-error" class="server-error">
          ${errorState.server}
        </div>
      `;
        }
        return errors;
    }
}
