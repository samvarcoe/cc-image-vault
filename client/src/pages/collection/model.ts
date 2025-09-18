import { Model } from '../../mvc.js';
import type { ImageMetadata } from '@/domain';

export interface CollectionPageData {
    name?: string;
    images?: ImageMetadata[];
    error?: string;
    loading?: boolean;
}

export default class CollectionPageModel extends Model<CollectionPageData> {

    constructor(initialData: Partial<CollectionPageData> = {}) {
        super({
            name: '',
            images: [],
            error: '',
            loading: false,
            ...initialData
        });
    }

    getCollectionName(): string {
        return this.data.name || '';
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
}