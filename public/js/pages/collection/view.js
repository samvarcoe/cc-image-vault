import { View, escapeHtml } from '../../mvc.js';
export class CollectionPageView extends View {
    constructor(model) {
        super(model);
    }
    getTitle() {
        const model = this.model;
        return model.getPageTitle();
    }
    render() {
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
        const model = this.model;
        return `
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
    renderStatusFilter() {
        const model = this.model;
        const currentStatus = model.getStatusFilter();
        return `
      <div class="status-filter">
        <label>View: </label>
        ${this.renderStatusFilterLink('COLLECTION', currentStatus)}
        ${this.renderStatusFilterLink('INBOX', currentStatus)}
        ${this.renderStatusFilterLink('ARCHIVE', currentStatus)}
      </div>
    `;
    }
    renderStatusFilterLink(status, currentStatus) {
        const model = this.model;
        const collectionId = model.getCollectionId();
        const isActive = status === currentStatus;
        const href = status === 'COLLECTION'
            ? `/collection/${collectionId}`
            : `/collection/${collectionId}?status=${status}`;
        const className = isActive ? 'status-filter-link active' : 'status-filter-link';
        return `
      <a href="${escapeHtml(href)}" class="${className}">
        ${escapeHtml(status)}
      </a>
    `;
    }
    renderImageGrid() {
        const model = this.model;
        if (!model.hasImages()) {
            return this.renderEmptyState();
        }
        const images = model.getImages();
        return `
      <div data-testid="image-grid" class="image-grid">
        ${images.map(image => this.renderImageItem(image)).join('')}
      </div>
    `;
    }
    renderEmptyState() {
        const model = this.model;
        return `
      <div class="empty-state">
        <div data-testid="empty-state-message">${escapeHtml(model.getEmptyStateMessage())}</div>
      </div>
    `;
    }
    renderImageItem(image) {
        return `
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
