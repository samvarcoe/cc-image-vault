import { Model } from '../../mvc.js';

export interface CollectionPageData {
    name?: string;
    status?: ImageStatus;
    images?: ImageMetadata[];
    error?: string;
    loading?: boolean;
    popover?: {
        visible: boolean;
        selectedImageId?: string;
        error?: string;
    };
}

export default class CollectionPageModel extends Model<CollectionPageData> {

    constructor(initialData: Partial<CollectionPageData> = {}) {
        super({
            name: '',
            status: 'COLLECTION',
            images: [],
            error: '',
            loading: false,
            popover: {
                visible: false,
                selectedImageId: undefined,
                error: undefined
            },
            ...initialData
        });
    }

    getCollectionName(): string {
        return this.data.name || '';
    }

    getCurrentStatus(): ImageStatus {
        return this.data.status || 'COLLECTION';
    }

    getImages(): ImageMetadata[] {
        return this.data.images || [];
    }

    hasImages(): boolean {
        return (this.data.images || []).length > 0;
    }

    hasError(): boolean {
        return !!this.data.error;
    }

    getErrorMessage(): string {
        return this.data.error || '';
    }

    isLoading(): boolean {
        return this.data.loading || false;
    }

    isPopoverVisible(): boolean {
        return this.data.popover?.visible || false;
    }

    getSelectedImageId(): string | undefined {
        return this.data.popover?.selectedImageId;
    }

    getSelectedImage(): ImageMetadata | undefined {
        const selectedId = this.getSelectedImageId();
        if (!selectedId) return undefined;
        return this.getImages().find(img => img.id === selectedId);
    }

    getPopoverError(): string | undefined {
        return this.data.popover?.error;
    }

    openPopover(imageId: string): void {
        this.data.popover = {
            visible: true,
            selectedImageId: imageId,
            error: undefined
        };
    }

    closePopover(): void {
        this.data.popover = {
            visible: false,
            selectedImageId: undefined,
            error: undefined
        };
    }

    setPopoverError(message: string): void {
        if (this.data.popover) {
            this.data.popover.error = message;
        }
    }
}