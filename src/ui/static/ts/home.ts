// Home Page Controller
class HomePageController {
  private currentCollectionToDelete: string | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    (window as any).homeController = this;
    
    const input = document.querySelector('[data-testid="collection-id-input"]') as HTMLInputElement;
    const createButton = document.querySelector('[data-testid="create-button"]') as HTMLButtonElement;
    
    if (input && createButton) {
      createButton.disabled = !input.value.trim();
      
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.validateCollectionId(target.value);
      });
    }
  }

  async createCollection(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const collectionId = formData.get('collectionId') as string;

    this.clearErrors();

    if (!this.isValidCollectionId(collectionId)) {
      this.showValidationError('Collection ID can only contain letters, numbers, and hyphens');
      return;
    }

    try {
      const response = await fetch(window.location.origin + '/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: collectionId })
      });

      if (response.status === 409) {
        this.showDuplicateIdError();
        return;
      }

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      window.location.reload();
    } catch (error) {
      console.error('Error creating collection:', error);
      this.showValidationError('Failed to create collection. Please try again.');
    }
  }

  validateCollectionId(value: string): void {
    const createButton = document.querySelector('[data-testid="create-button"]') as HTMLButtonElement;
    
    if (!value.trim()) {
      this.clearErrors();
      createButton.disabled = true;
      return;
    }

    if (this.isValidCollectionId(value)) {
      this.clearErrors();
      createButton.disabled = false;
    } else {
      this.showValidationError('Collection ID can only contain letters, numbers, and hyphens');
      createButton.disabled = true;
    }
  }

  private isValidCollectionId(id: string): boolean {
    return /^[a-zA-Z0-9-]+$/.test(id);
  }

  showDeleteConfirmation(collectionId: string): void {
    this.currentCollectionToDelete = collectionId;
    const dialog = document.querySelector('[data-testid="confirmation-dialog"]') as HTMLElement;
    const collectionDisplay = document.querySelector('[data-testid="collection-id-display"]') as HTMLElement;
    
    collectionDisplay.textContent = collectionId;
    dialog.style.display = 'flex';
  }

  cancelDeletion(): void {
    this.currentCollectionToDelete = null;
    const dialog = document.querySelector('[data-testid="confirmation-dialog"]') as HTMLElement;
    dialog.style.display = 'none';
  }

  async confirmDeletion(): Promise<void> {
    if (!this.currentCollectionToDelete) return;

    try {
      const response = await fetch(window.location.origin + '/api/collections/' + this.currentCollectionToDelete, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      window.location.reload();
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  }

  private showValidationError(message: string): void {
    const errorElement = document.querySelector('[data-testid="validation-error"]') as HTMLElement;
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  private showDuplicateIdError(): void {
    const errorElement = document.querySelector('[data-testid="duplicate-id-error"]') as HTMLElement;
    errorElement.style.display = 'block';
  }

  private clearErrors(): void {
    const validationError = document.querySelector('[data-testid="validation-error"]') as HTMLElement;
    const duplicateError = document.querySelector('[data-testid="duplicate-id-error"]') as HTMLElement;
    
    if (validationError) validationError.style.display = 'none';
    if (duplicateError) duplicateError.style.display = 'none';
  }
}

// Initialize the controller when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new HomePageController();
  });
} else {
  new HomePageController();
}