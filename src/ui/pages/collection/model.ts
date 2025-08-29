import { Model } from '../../mvc.js';

export type ImageStatus = 'INBOX' | 'COLLECTION' | 'ARCHIVE';

export interface CollectionPageData {
  collectionId: string;
  statusFilter: ImageStatus;
  images: ImageMetadata[];
  loading: boolean;
  error?: string;
}

export default class CollectionPageModel extends Model<CollectionPageData> {

  constructor(data: Partial<CollectionPageData> = {}) {
    const {
      collectionId = '',
      statusFilter = 'COLLECTION',
      images= [],
      loading = false,
      error = undefined,
    } = data

    super({
      collectionId,
      statusFilter,
      images,
      loading,
      error,
    });
  }

  getCollectionId(): string {
    return this.data.collectionId;
  }

  getStatusFilter(): ImageStatus {
    return this.data.statusFilter;
  }

  getImages(): ImageMetadata[] {
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