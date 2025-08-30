import { View } from '../../mvc.js';
import CollectionPageModel from './model.js';

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

    if (!this.model.getCollectionId()) {
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
      <div data-testid="main-content" ${this.model.isPopoverOpen() ? 'class="popover-blur"' : ''}>
        <main class="collection-content">
          ${this.renderImageGrid()}
        </main>
      </div>
      ${this.model.isPopoverOpen() ? this.renderPopover() : ''}
    `;
  }


  private renderImageGrid(): string {
    const collectionId = this.model.getCollectionId();
    const images = this.model.getImages();

    if (images.length === 0) {
      return this.renderEmptyState();
    }
    
    // Distribute images across 3 columns
    const columns: ImageMetadata[][] = [[], [], []];
    images.forEach((image, index) => {
      columns[index % 3]!.push(image);
    });

    return /*html*/`
      <div data-testid="image-grid" class="image-grid">
        ${columns.map((columnImages) => /*html*/`
          <div class="image-column">
            ${columnImages.map(image => this.renderImageItem(collectionId!, image)).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderEmptyState(): string {
    // const model = this.model as CollectionPageModel;
    
    return /*html*/`
      <div class="empty-state">
        <div data-testid="empty-state-message">This collection has no images with status: "${this.model.getStatusFilter()}"</div>
      </div>
    `;
  }

  private renderImageItem(collectionId: string, image: ImageMetadata): string {
    const isPopoverOpen = this.model.isPopoverOpen();
    return /*html*/`
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

  private renderPopover(): string {
    const popoverImageId = this.model.getPopoverImageId();
    const collectionId = this.model.getCollectionId();
    
    if (!popoverImageId) {
      return '';
    }

    // Find the image metadata for the popover image
    const image = this.model.getImages().find(img => img.id === popoverImageId);
    if (!image) {
      return '';
    }

    return /*html*/`
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

  private renderPopoverBackdrop(): string {
    return /*html*/`
      <div 
        data-testid="popover-backdrop" 
        class="popover-backdrop"
        data-action="close-popover"
      ></div>
    `;
  }
}