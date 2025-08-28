import { View } from '../../mvc.js';
import CollectionPageModel, { ImageDisplayData } from './model.js';

export default class CollectionPageView extends View<CollectionPageModel> {
  constructor(model: CollectionPageModel) {
    super(model, 'collection');
  }

  title(): string {
    const collectionId = this.model.getCollectionId();
    return collectionId
      ? `Collection ${collectionId} - Image Vault`
      : 'Collection Not Found - Image Vault';
  }

  renderContent(): string {
    const model = this.model;

    if (model.isNotFoundError()) {
      return this.renderNotFoundPage();
    }

    return this.renderCollectionPage();
  }

  private renderNotFoundPage(): string {
    return /*html*/`
      <div data-testid="main-content">
        <h1>Collection Not Found</h1>
        <div data-testid="not-found-message">
          <p>The requested collection was not found.</p>
        </div>
      </div>
    `;
  }

  private renderCollectionPage(): string {
    return /*html*/`
      <div data-testid="main-content">
        <main class="collection-content">
          ${this.renderImageGrid()}
        </main>
      </div>
    `;
  }


  private renderImageGrid(): string {
    const model = this.model as CollectionPageModel;

    if (!model.hasImages()) {
      return this.renderEmptyState();
    }

    const images = model.getImages();
    
    // Distribute images across 3 columns
    const columns: ImageDisplayData[][] = [[], [], []];
    images.forEach((image, index) => {
      columns[index % 3]!.push(image);
    });

    return /*html*/`
      <div data-testid="image-grid" class="image-grid">
        ${columns.map((columnImages) => /*html*/`
          <div class="image-column">
            ${columnImages.map(image => this.renderImageItem(image)).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderEmptyState(): string {
    const model = this.model as CollectionPageModel;
    
    return /*html*/`
      <div class="empty-state">
        <div data-testid="empty-state-message">${model.getEmptyStateMessage()}</div>
      </div>
    `;
  }

  private renderImageItem(image: ImageDisplayData): string {
    return /*html*/`
      <div
        data-testid="image-item-${image.id}"
        class="image-item"
        width="480"
        height="${Math.round(480 / image.aspectRatio)}"
      >
        <img 
          data-testid="image-thumbnail-${image.id}"
          src="${image.thumbnailUrl}"
          alt="${image.originalName}"
          loading="lazy"
          class="image-thumbnail"
          width="480"
          height="${Math.round(480 / image.aspectRatio)}"
        />
      </div>
    `;
  }
}