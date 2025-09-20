import { Model } from '../../mvc.js';

export interface CreationFormData {
  name: string;
  validationError: string;
  loading: boolean;
}

export interface HomePageData {
  collections?: string[];
  error?: string;
  loading?: boolean;
  creationForm: CreationFormData;
}

export default class HomePageModel extends Model<HomePageData> {

  constructor(initialData: Partial<HomePageData> = {}) {
    super({
      collections: [],
      error: '',
      loading: false,
      creationForm: { name: '', validationError: '', loading: false },
      ...initialData
    })
  };

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

  // Creation form methods
  getCreationFormName(): string {
    return this.data.creationForm?.name || '';
  }

  setCreationFormName(name: string): void {
    if (!this.data.creationForm) {
      this.data.creationForm = { name: '', validationError: '', loading: false };
    }
    this.data.creationForm.name = name;
  }

  getCreationFormValidationError(): string {
    return this.data.creationForm?.validationError || '';
  }

  setCreationFormValidationError(error: string): void {
    if (!this.data.creationForm) {
      this.data.creationForm = { name: '', validationError: '', loading: false };
    }
    this.data.creationForm.validationError = error;
  }

  clearCreationFormValidationError(): void {
    if (this.data.creationForm) {
      this.data.creationForm.validationError = '';
    }
  }

  isCreationFormLoading(): boolean {
    return this.data.creationForm?.loading || false;
  }

  setCreationFormLoading(loading: boolean): void {
    if (!this.data.creationForm) {
      this.data.creationForm = { name: '', validationError: '', loading: false };
    }
    this.data.creationForm.loading = loading;
  }

  clearCreationForm(): void {
    this.data.creationForm = { name: '', validationError: '', loading: false };
  }

  addCollection(name: string): void {
    if (!this.data.collections) {
      this.data.collections = [];
    }
    this.data.collections.push(name);
    this.data.collections.sort();
  }

  validateCollectionName(name: string): string | null {
    // Check if name is empty
    if (!name || name.trim() === '') {
      return 'Collection name is required';
    }

    // Check if name is too long
    if (name.length > 256) {
      return 'Collection name must be 256 characters or less';
    }

    // Check if name contains only valid characters
    const validNamePattern = /^[a-zA-Z0-9_-]+$/;
    if (!validNamePattern.test(name)) {
      return 'Collection names may only contain letters, numbers, underscores and hyphens';
    }

    // Check for duplicate names
    const collections = this.getCollections();
    if (collections.includes(name)) {
      return 'A Collection with that name already exists';
    }

    return null;
  }

  async createCollection(name: string): Promise<void> {
    try {
      this.setCreationFormLoading(true);
      this.clearCreationFormValidationError();

      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'An error occurred whilst creating the Collection');
      }

      // Add the new collection to the list
      this.addCollection(name);

      // Clear the form
      this.clearCreationForm();
    } catch (error) {
      this.setCreationFormValidationError(
        error instanceof Error ? error.message : 'An error occurred whilst creating the Collection'
      );
      this.setCreationFormLoading(false);
      // Clear the form input on error so placeholder shows
      this.setCreationFormName('');
      throw error;
    } finally {
      this.setCreationFormLoading(false);
    }
  }
}