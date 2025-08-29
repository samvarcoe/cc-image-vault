import { View } from '../../mvc.js';
export default class CollectionPageView extends View {
    constructor(model) {
        super(model, 'collection');
    }
    title() {
        const collectionId = this.model.getCollectionId();
        return collectionId
            ? `Collection ${collectionId} - Image Vault`
            : 'Collection Not Found - Image Vault';
    }
    renderContent() {
        const model = this.model;
        if (model.isNotFoundError()) {
            return this.renderNotFoundPage();
        }
        return this.renderCollectionPage();
    }
    renderNotFoundPage() {
        return `
      <div data-testid="main-content">
        <h1>Collection Not Found</h1>
        <div data-testid="not-found-message">
          <p>The requested collection was not found.</p>
        </div>
      </div>
    `;
    }
    renderCollectionPage() {
        return `
      <div data-testid="main-content">
        <main class="collection-content">
          ${this.renderImageGrid()}
        </main>
      </div>
    `;
    }
    renderImageGrid() {
        const model = this.model;
        const collectionId = model.getCollectionId();
        if (!model.hasImages()) {
            return this.renderEmptyState();
        }
        const images = model.getImages();
        const columns = [[], [], []];
        images.forEach((image, index) => {
            columns[index % 3].push(image);
        });
        return `
      <div data-testid="image-grid" class="image-grid">
        ${columns.map((columnImages) => `
          <div class="image-column">
            ${columnImages.map(image => this.renderImageItem(collectionId, image)).join('')}
          </div>
        `).join('')}
      </div>
    `;
    }
    renderEmptyState() {
        const model = this.model;
        return `
      <div class="empty-state">
        <div data-testid="empty-state-message">${model.getEmptyStateMessage()}</div>
      </div>
    `;
    }
    renderImageItem(collectionId, image) {
        return `
      <div
        data-testid="image-item-${image.id}"
        class="image-item"
        width="480"
        height="${Math.round(480 / image.aspectRatio)}"
      >
        <img 
          data-testid="image-thumbnail-${image.id}"
          src="/api/images/${collectionId}/${image.id}/thumbnail"
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
