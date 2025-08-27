import { View, escapeHtml } from '../../mvc.js';
import { CollectionPageModel, CollectionPageData, ImageDisplayData } from './model.js';

export class CollectionPageView extends View<CollectionPageData> {
  constructor(model: CollectionPageModel) {
    super(model);
  }

  getTitle(): string {
    const model = this.model as CollectionPageModel;
    return model.getPageTitle();
  }

  render(): string {
    const model = this.model as CollectionPageModel;

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
    const model = this.model as CollectionPageModel;
    
    return /*html*/`
      <div data-testid="main-content">
        <header class="collection-header">
          <h1>${escapeHtml(`Collection ${model.getCollectionId()}`)}</h1>
          ${this.renderStatusFilter()}
        </header>
        
        <main class="collection-content">
          ${this.renderImageGrid()}
        </main>
      </div>
    `;
  }

  private renderStatusFilter(): string {
    const model = this.model as CollectionPageModel;
    const currentStatus = model.getStatusFilter();
    
    return /*html*/`
      <div class="status-filter">
        <label>View: </label>
        ${this.renderStatusFilterLink('COLLECTION', currentStatus)}
        ${this.renderStatusFilterLink('INBOX', currentStatus)}
        ${this.renderStatusFilterLink('ARCHIVE', currentStatus)}
      </div>
    `;
  }

  private renderStatusFilterLink(status: string, currentStatus: string): string {
    const model = this.model as CollectionPageModel;
    const collectionId = model.getCollectionId();
    const isActive = status === currentStatus;
    const href = status === 'COLLECTION' 
      ? `/collection/${collectionId}` 
      : `/collection/${collectionId}?status=${status}`;
    
    const className = isActive ? 'status-filter-link active' : 'status-filter-link';
    
    return /*html*/`
      <a href="${escapeHtml(href)}" class="${className}">
        ${escapeHtml(status)}
      </a>
    `;
  }

  private renderImageGrid(): string {
    const model = this.model as CollectionPageModel;

    if (!model.hasImages()) {
      return this.renderEmptyState();
    }

    const images = model.getImages();
    return /*html*/`
      <div data-testid="image-grid" class="image-grid">
        ${images.map(image => this.renderImageItem(image)).join('')}
      </div>
    `;
  }

  private renderEmptyState(): string {
    const model = this.model as CollectionPageModel;
    
    return /*html*/`
      <div class="empty-state">
        <div data-testid="empty-state-message">${escapeHtml(model.getEmptyStateMessage())}</div>
      </div>
    `;
  }

  private renderImageItem(image: ImageDisplayData): string {
    return /*html*/`
      <div data-testid="image-item-${escapeHtml(image.id)}" class="image-item">
        <img 
          data-testid="image-thumbnail-${escapeHtml(image.id)}"
          src="${escapeHtml(image.thumbnailUrl)}"
          alt="${escapeHtml(image.originalName)}"
          loading="lazy"
          class="image-thumbnail"
          width="${image.dimensions.width}"
          height="${image.dimensions.height}"
        />
        <div class="image-info">
          <div class="image-name" title="${escapeHtml(image.originalName)}">
            ${escapeHtml(image.originalName)}
          </div>
        </div>
      </div>
    `;
  }
}