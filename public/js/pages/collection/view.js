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
        if (!this.model.getCollectionId()) {
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
      <div data-testid="main-content" ${this.model.isPopoverOpen() ? 'class="popover-blur"' : ''}>
        <main class="collection-content">
          ${this.renderImageGrid()}
        </main>
      </div>
      ${this.model.isPopoverOpen() ? this.renderPopover() : ''}
    `;
    }
    renderImageGrid() {
        const collectionId = this.model.getCollectionId();
        const images = this.model.getImages();
        if (images.length === 0) {
            return this.renderEmptyState();
        }
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
        return `
      <div class="empty-state">
        <div data-testid="empty-state-message">This collection has no images with status: "${this.model.getStatusFilter()}"</div>
      </div>
    `;
    }
    renderImageItem(collectionId, image) {
        const isPopoverOpen = this.model.isPopoverOpen();
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
          style="${isPopoverOpen ? 'pointer-events: none;' : ''}"
          data-image-id="${image.id}"
          data-collection-id="${collectionId}"
          data-action="open-popover"
        />
      </div>
    `;
    }
    renderPopover() {
        const popoverImageId = this.model.getPopoverImageId();
        const collectionId = this.model.getCollectionId();
        if (!popoverImageId) {
            return '';
        }
        const image = this.model.getImages().find(img => img.id === popoverImageId);
        if (!image) {
            return '';
        }
        return `
      ${this.renderPopoverBackdrop()}
      <div data-testid="image-popover" class="image-popover">
        <img 
          src="/api/images/${collectionId}/${popoverImageId}"
          alt="${image.originalName}"
          class="popover-image"
          data-natural-width="${image.dimensions.width}"
          data-natural-height="${image.dimensions.height}"
        />
      </div>
    `;
    }
    renderPopoverBackdrop() {
        return `
      <div 
        data-testid="popover-backdrop" 
        class="popover-backdrop"
        data-action="close-popover"
      ></div>
    `;
    }
}
