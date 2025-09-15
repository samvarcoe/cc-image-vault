import { Model } from '../../mvc.js';

export interface HomePageData {
  collections?: string[];
  error?: string;
  loading?: boolean;
}

export default class HomePageModel extends Model<HomePageData> {
  async loadCollections(): Promise<void> {
    try {
      this.data.loading = true;
      this.data.error = undefined;

      const response = await fetch('/api/collections');

      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }

      const collections = await response.json();
      this.data.collections = collections;
      this.data.loading = false;
    } catch {
      this.data.error = 'Unable to load collections';
      this.data.loading = false;
      this.data.collections = undefined;
    }
  }

  getCollections(): string[] {
    return this.data.collections || [];
  }

  hasError(): boolean {
    return !!this.data.error;
  }

  getErrorMessage(): string {
    return this.data.error || '';
  }

  hasCollections(): boolean {
    return (this.data.collections || []).length > 0;
  }

  isLoading(): boolean {
    return this.data.loading || false;
  }
}