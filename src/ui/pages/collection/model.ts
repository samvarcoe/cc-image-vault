import { Model } from '../../mvc.js';

export type ImageStatus = 'INBOX' | 'COLLECTION' | 'ARCHIVE';

export interface ImageMetadata {
  id: string;
  originalName: string;
  fileHash: string;
  status: ImageStatus;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: number;
  extension: string;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageDisplayData {
  id: string;
  thumbnailUrl: string;
  originalName: string;
  status: ImageStatus;
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: number;
}

export interface CollectionPageData {
  collectionId: string;
  statusFilter: ImageStatus;
  images: ImageDisplayData[];
  loading: boolean;
  error?: string;
}

export class CollectionPageModel extends Model<CollectionPageData> {
  constructor(
    collectionId: string, 
    images: ImageMetadata[] = [], 
    statusFilter: ImageStatus = 'COLLECTION',
    loading: boolean = false,
    error?: string
  ) {
    // Convert ImageMetadata to ImageDisplayData
    const imageDisplayData: ImageDisplayData[] = images.map(img => ({
      id: img.id,
      thumbnailUrl: `/api/images/${collectionId}/${img.id}/thumbnail`,
      originalName: img.originalName,
      status: img.status,
      dimensions: img.dimensions,
      aspectRatio: img.aspectRatio
    }));

    super({
      collectionId,
      statusFilter,
      images: imageDisplayData,
      loading,
      error
    });
  }

  getCollectionId(): string {
    return this.data.collectionId;
  }

  getStatusFilter(): ImageStatus {
    return this.data.statusFilter;
  }

  getImages(): ImageDisplayData[] {
    return this.data.images || [];
  }

  hasImages(): boolean {
    return this.getImages().length > 0;
  }

  isLoading(): boolean {
    return this.data.loading;
  }

  getError(): string | undefined {
    return this.data.error;
  }

  hasError(): boolean {
    return !!this.data.error;
  }

  isNotFoundError(): boolean {
    return this.data.error === 'Collection not found';
  }

  getEmptyStateMessage(): string {
    return `This collection has no images with status: "${this.data.statusFilter}"`;
  }

  getPageTitle(): string {
    if (this.isNotFoundError()) {
      return 'Collection Not Found - Image Vault';
    }
    return `Collection ${this.data.collectionId} - Image Vault`;
  }

  // Methods for client-side state management (if needed for future features)
  setLoading(loading: boolean): void {
    this.data.loading = loading;
  }

  setError(error?: string): void {
    this.data.error = error;
  }

  updateImages(images: ImageDisplayData[]): void {
    this.data.images = images;
  }

  updateStatusFilter(status: ImageStatus): void {
    this.data.statusFilter = status;
  }
}