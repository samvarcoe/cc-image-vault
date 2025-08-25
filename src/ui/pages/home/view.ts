import { View, escapeHtml } from '../../mvc';
import { HomePageModel, CollectionListItem } from './model';

export class HomePageView extends View<unknown> {
  constructor(protected model: HomePageModel) {
    super(model);
  }

  getTitle(): string {
    return 'Image Vault - Home';
  }

  render(): string {
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

  private renderCollectionsList(collections: CollectionListItem[]): string {
    return `
      <section class="collections-section">
        <h2>Your Collections</h2>
        <div data-testid="collections-list" class="collections-list">
          ${collections.map(collection => this.renderCollectionItem(collection)).join('')}
        </div>
      </section>
    `;
  }

  private renderCollectionItem(collection: CollectionListItem): string {
    const escapedId = escapeHtml(collection.id);
    return `
      <div data-testid="collection-item-${escapedId}" class="collection-item">
        <a data-testid="collection-link-${escapedId}" href="/collection/${escapedId}" class="collection-link">
          <h3>${escapedId}</h3>
        </a>
        <button data-testid="delete-button-${escapedId}" class="delete-button" onclick="homeController.showDeleteConfirmation('${escapedId}')">
          Delete
        </button>
      </div>
    `;
  }

  private renderEmptyState(): string {
    return `
      <div data-testid="empty-state" class="empty-state">
        <h2>No Collections Yet</h2>
        <p>Create your first collection to get started organizing your images.</p>
      </div>
    `;
  }

  private renderCreateCollectionForm(): string {
    return `
      <section class="create-collection-section">
        <h2>Create New Collection</h2>
        <form data-testid="create-collection-form" class="create-collection-form" onsubmit="homeController.createCollection(event)">
          <div class="form-group">
            <label for="collection-id">Collection ID:</label>
            <input 
              data-testid="collection-id-input" 
              type="text" 
              id="collection-id" 
              name="collectionId"
              placeholder="Enter collection name (letters, numbers, and hyphens only)"
              pattern="[a-zA-Z0-9\\-]+"
              oninput="homeController.validateCollectionId(this.value)"
              required
            />
            <div data-testid="validation-error" class="validation-error" style="display: none;"></div>
            <div data-testid="duplicate-id-error" class="duplicate-id-error" style="display: none;">
              A collection with this ID already exists. Please choose a different name.
            </div>
          </div>
          <button data-testid="create-button" type="submit" class="create-button">
            Create Collection
          </button>
        </form>
      </section>
    `;
  }

  private renderConfirmationDialog(): string {
    return `
      <div data-testid="confirmation-dialog" class="confirmation-dialog" style="display: none;">
        <div class="dialog-overlay" onclick="homeController.cancelDeletion()"></div>
        <div class="dialog-content">
          <h3 data-testid="dialog-title">Confirm Deletion</h3>
          <p data-testid="warning-message">
            Are you sure you want to delete the collection "<span data-testid="collection-id-display" class="collection-id"></span>"?
            This action cannot be undone and will permanently remove all images in this collection.
          </p>
          <div class="dialog-buttons">
            <button data-testid="cancel-button" onclick="homeController.cancelDeletion()" class="cancel-button">
              Cancel
            </button>
            <button data-testid="confirm-button" onclick="homeController.confirmDeletion()" class="confirm-button danger">
              Delete Collection
            </button>
          </div>
        </div>
      </div>
    `;
  }
}