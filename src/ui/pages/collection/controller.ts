import { Controller } from '../../mvc.js';
import { CollectionPageModel, CollectionPageData } from './model.js';
import { CollectionPageView } from './view.js';

export class CollectionPageController extends Controller<CollectionPageData> {
  private collectionModel: CollectionPageModel;
  private collectionView: CollectionPageView;

  constructor(model: CollectionPageModel, view: CollectionPageView) {
    super(model, view);
    this.collectionModel = model;
    this.collectionView = view;
  }

  protected attachEventListeners(): void {
    // For future interactive features, we can add event listeners here
    // For now, the collection page is primarily static display
    // Status filtering is handled via URL navigation (server-side)
    
    // Add any client-side enhancements here if needed in the future:
    // - Image modal/lightbox functionality
    // - Infinite scroll/pagination
    // - Client-side status filter updates
    // - Bulk selection operations
  }

  // Method to handle future client-side status filter changes
  private handleStatusFilterChange(newStatus: string): void {
    const collectionId = this.collectionModel.getCollectionId();
    const url = newStatus === 'COLLECTION' 
      ? `/collection/${collectionId}` 
      : `/collection/${collectionId}?status=${newStatus}`;
    
    // Navigate to new URL (server will handle the filtering)
    window.location.href = url;
  }

  // Method for future image interaction features
  private handleImageClick(imageId: string): void {
    // Future implementation: open image in modal, navigate to detail view, etc.
    console.log(`Image clicked: ${imageId}`);
  }

  // Method for monitoring layout stability and performance
  private monitorPerformance(): void {
    // This could be used for performance monitoring in the future
    // For now, tests handle layout shift detection
  }
}