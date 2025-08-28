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

export default class CollectionPageModel extends Model<CollectionPageData> {

  // constructor(data: CollectionPageData) {
  //   super(data);
  // }

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
}