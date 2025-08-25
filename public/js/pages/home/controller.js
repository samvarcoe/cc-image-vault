// Client-side home page controller
class HomePageController {
  constructor() {
    this.currentCollectionToDelete = null;
    this.init();
  }

  init() {
    // Make controller available globally
    window.homeController = this;
    
    // Initialize form validation
    const input = document.querySelector('[data-testid="collection-id-input"]');
    const createButton = document.querySelector('[data-testid="create-button"]');
    
    if (input && createButton) {
      // Initial state
      createButton.disabled = !input.value.trim();
      
      // Real-time validation
      input.addEventListener('input', (e) => {
        this.validateCollectionId(e.target.value);
      });
    }
  }

  async createCollection(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const collectionId = formData.get('collectionId');

    // Clear previous errors
    this.clearErrors();

    // Validate collection ID
    if (!this.isValidCollectionId(collectionId)) {
      this.showValidationError('Collection ID can only contain letters, numbers, and hyphens');
      return;
    }

    try {
      const response = await fetch('/api/collections', {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the page to show the new collection
      window.location.reload();
    } catch (error) {
      console.error('Error creating collection:', error);
      this.showValidationError('Failed to create collection. Please try again.');
    }
  }

  validateCollectionId(value) {
    const createButton = document.querySelector('[data-testid="create-button"]');
    
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

  isValidCollectionId(id) {
    return /^[a-zA-Z0-9-]+$/.test(id);
  }

  showDeleteConfirmation(collectionId) {
    this.currentCollectionToDelete = collectionId;
    const dialog = document.querySelector('[data-testid="confirmation-dialog"]');
    const collectionDisplay = document.querySelector('[data-testid="collection-id-display"]');
    
    collectionDisplay.textContent = collectionId;
    dialog.style.display = 'flex';
  }

  cancelDeletion() {
    this.currentCollectionToDelete = null;
    const dialog = document.querySelector('[data-testid="confirmation-dialog"]');
    dialog.style.display = 'none';
  }

  async confirmDeletion() {
    if (!this.currentCollectionToDelete) return;

    try {
      const response = await fetch(`/api/collections/${this.currentCollectionToDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the page to remove the deleted collection
      window.location.reload();
    } catch (error) {
      console.error('Error deleting collection:', error);
      // Show error message to user
    }
  }

  showValidationError(message) {
    const errorElement = document.querySelector('[data-testid="validation-error"]');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  showDuplicateIdError() {
    const errorElement = document.querySelector('[data-testid="duplicate-id-error"]');
    errorElement.style.display = 'block';
  }

  clearErrors() {
    const validationError = document.querySelector('[data-testid="validation-error"]');
    const duplicateError = document.querySelector('[data-testid="duplicate-id-error"]');
    
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