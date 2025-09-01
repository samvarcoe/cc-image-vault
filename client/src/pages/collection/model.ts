import { Model } from '../../mvc.js';

export type ImageStatus = 'INBOX' | 'COLLECTION' | 'ARCHIVE';

export interface CollectionPageData {
  collectionId: string | undefined;
  statusFilter: ImageStatus;
  images: ImageMetadata[];
  popoverImageId?: string | null;
}

export default class CollectionPageModel extends Model<CollectionPageData> {

  constructor(data: Partial<CollectionPageData> = {}) {
    super({
      collectionId: undefined,
      statusFilter: 'COLLECTION',
      images: [],
      popoverImageId: null,
      ...data,
    });
  }

  getCollectionId(): string | undefined {
    return this.data.collectionId;
  }

  getImages(): ImageMetadata[] {
    return this.data.images || [];
  }

  getStatusFilter(): ImageStatus {
    return this.data.statusFilter;
  }

  isPopoverOpen(): boolean {
    return this.data.popoverImageId !== null && this.data.popoverImageId !== undefined;
  }

  getPopoverImageId(): string | null {
    return this.data.popoverImageId || null;
  }

  openPopover(imageId: string): void {
    this.data.popoverImageId = imageId;
  }

  closePopover(): void {
    this.data.popoverImageId = null;
  }
}