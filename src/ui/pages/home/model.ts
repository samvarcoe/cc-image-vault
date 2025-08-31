import { Model } from '../../mvc.js';

export interface FormState {
  collectionId: string;
  isValid: boolean;
  isSubmitting: boolean;
}

export interface ErrorState {
  validation: string | null;
  duplicate: boolean;
  server: string | null;
}

export interface LoadingState {
  creatingCollection: boolean;
  deletingCollection: string | null;
}

export interface HomePageData {
  collections: string[];
  formState: FormState;
  errorState: ErrorState;
  loadingState: LoadingState;
}

export default class HomePageModel extends Model<HomePageData> {

  constructor(initialData: Partial<HomePageData> = {}) {
    super({
      collections: [],
      formState: { collectionId: '', isValid: false, isSubmitting: false },
      errorState: { validation: null, duplicate: false, server: null },
      loadingState: { creatingCollection: false, deletingCollection: null },
      ...initialData,
    });
  }

  getCollections(): string[] {
    return this.data.collections || [];
  }

  getSortedCollections(): string[] {
    return [...this.getCollections()].sort();
  }

  hasCollections(): boolean {
    return this.getCollections().length > 0;
  }

  getFormState(): FormState {
    return this.data.formState;
  }

  getErrorState(): ErrorState {
    return this.data.errorState;
  }

  getLoadingState(): LoadingState {
    return this.data.loadingState;
  }

  updateFormState(collectionId: string): void {
    this.data.formState = {
      ...this.data.formState,
      collectionId,
      isValid: this.isValidCollectionId(collectionId)
    };
  }

  setFormSubmitting(isSubmitting: boolean): void {
    this.data.formState = {
      ...this.data.formState,
      isSubmitting
    };
  }

  setFormError(type: 'validation' | 'duplicate' | 'server', message?: string): void {
    if (type === 'validation') {
      this.data.errorState.validation = message || null;
    } else if (type === 'duplicate') {
      this.data.errorState.duplicate = true;
    } else if (type === 'server') {
      this.data.errorState.server = message || null;
    }
  }

  clearFormErrors(): void {
    this.data.errorState = {
      validation: null,
      duplicate: false,
      server: null
    };
  }

  setCreatingCollection(isCreating: boolean): void {
    this.data.loadingState.creatingCollection = isCreating;
  }

  setDeletingCollection(collectionId: string | null): void {
    this.data.loadingState.deletingCollection = collectionId;
  }

  addCollectionOptimistically(collectionId: string): void {
    this.data.collections = [...this.data.collections, collectionId];
  }

  removeCollectionOptimistically(collectionId: string): void {
    this.data.collections = this.data.collections.filter(id => id !== collectionId);
  }

  resetForm(): void {
    this.data.formState = {
      collectionId: '',
      isValid: false,
      isSubmitting: false
    };
    this.clearFormErrors();
  }

  private isValidCollectionId(id: string): boolean {
    return /^[a-zA-Z0-9-]+$/.test(id) && id.trim().length > 0;
  }
}