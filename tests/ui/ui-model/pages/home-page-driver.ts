import { expect } from 'playwright/test';
import { PageObject } from '../page';
import { Element } from '../element';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog-component';
import { TEST_CONFIG } from '../../../utils/test-config';

export class HomePageDriver extends PageObject {
  protected url = '/';

  // Main elements
  get collectionsList(): Element {
    return this.element('Collections List', '[data-testid="collections-list"]');
  }

  get createCollectionForm(): Element {
    return this.element('Create Collection Form', '[data-testid="create-collection-form"]');
  }

  get collectionIdInput(): Element {
    return this.element('Collection ID Input', '[data-testid="collection-id-input"]');
  }

  get createButton(): Element {
    return this.element('Create Button', '[data-testid="create-button"]');
  }

  get validationError(): Element {
    return this.element('Validation Error', '[data-testid="validation-error"]');
  }

  get emptyStateMessage(): Element {
    return this.element('Empty State Message', '[data-testid="empty-state"]');
  }

  get duplicateIdError(): Element {
    return this.element('Duplicate ID Error', '[data-testid="duplicate-id-error"]');
  }

  // Components
  get confirmationDialog(): ConfirmationDialogComponent {
    return this.component(ConfirmationDialogComponent, 'Confirmation Dialog', '[data-testid="confirmation-dialog"]');
  }

  // Collection-specific elements (dynamic)
  collectionItem(collectionId: string): Element {
    return this.element(`Collection Item ${collectionId}`, `[data-testid="collection-item-${collectionId}"]`);
  }

  collectionLink(collectionId: string): Element {
    return this.element(`Collection Link ${collectionId}`, `[data-testid="collection-link-${collectionId}"]`);
  }

  collectionDeleteButton(collectionId: string): Element {
    return this.element(`Delete Button ${collectionId}`, `[data-testid="delete-button-${collectionId}"]`);
  }

  // Business workflows
  async createCollection(collectionId: string): Promise<void> {
    await this.collectionIdInput.type(collectionId);
    await this.createButton.click();
    
    // Wait for the API response
    await this.page.waitForResponse(response => 
      response.url().includes('/api/collections') && 
      response.request().method() === 'POST' &&
      (response.status() === 201 || response.status() >= 400)
    );
  }

  async deleteCollection(collectionId: string): Promise<void> {
    await this.collectionDeleteButton(collectionId).click();
    
    // Wait for confirmation dialog to appear
    await this.confirmationDialog.shouldBeDisplayed();
  }

  async confirmDeletion(): Promise<void> {
    await this.confirmationDialog.confirmButton.click();
    
    // Wait for the delete API response
    await this.page.waitForResponse(response => 
      response.url().includes('/api/collections') && 
      response.request().method() === 'DELETE' &&
      (response.status() === 204 || response.status() >= 400)
    );
  }

  async cancelDeletion(): Promise<void> {
    await this.confirmationDialog.cancelButton.click();
  }

  async navigateToCollection(collectionId: string): Promise<void> {
    await this.collectionLink(collectionId).click();
  }

  // Page assertions
  async shouldBeOnPage(): Promise<void> {
    const currentUrl = this.page.url();
    expect(currentUrl, { 
      message: `Current URL is "${currentUrl}" instead of home page after navigation` 
    }).toBe(`${TEST_CONFIG.UI_BASE_URL}${this.url}`);
    console.log('✓ User is on home page');
  }

  async shouldShowEmptyState(): Promise<void> {
    await this.emptyStateMessage.shouldBeDisplayed();
    await this.createCollectionForm.shouldBeDisplayed();
    console.log('✓ Home page shows empty state with create collection option');
  }

  async shouldShowCollectionsInAlphabeticalOrder(expectedCollectionIds: string[]): Promise<void> {
    // Wait for collections list to be present
    await this.collectionsList.shouldBeDisplayed();
    
    // Get all collection items in order they appear
    const collectionItems = await this.page.locator('[data-testid^="collection-item-"]').all();
    const actualOrder: string[] = [];
    
    for (const item of collectionItems) {
      const testId = await item.getAttribute('data-testid');
      if (testId) {
        const collectionId = testId.replace('collection-item-', '');
        actualOrder.push(collectionId);
      }
    }
    
    const expectedOrder = [...expectedCollectionIds].sort();
    expect(actualOrder, {
      message: `Collections are displayed as [${actualOrder.join(', ')}] instead of alphabetical order [${expectedOrder.join(', ')}]`
    }).toEqual(expectedOrder);
    
    console.log(`✓ Collections displayed in alphabetical order: [${expectedOrder.join(', ')}]`);
  }

  async shouldShowCollection(collectionId: string): Promise<void> {
    await this.collectionItem(collectionId).shouldBeDisplayed();
    await this.collectionLink(collectionId).shouldBeDisplayed();
    await this.collectionDeleteButton(collectionId).shouldBeDisplayed();
    console.log(`✓ Collection "${collectionId}" is displayed with link and delete button`);
  }

  async shouldNotShowCollection(collectionId: string): Promise<void> {
    await this.collectionItem(collectionId).shouldNotBeDisplayed();
    console.log(`✓ Collection "${collectionId}" is not displayed in the list`);
  }

  async shouldShowValidationError(expectedMessage: string): Promise<void> {
    await this.validationError.shouldBeDisplayed();
    const actualMessage = await this.validationError.getText();
    expect(actualMessage, {
      message: `Validation error shows "${actualMessage}" instead of "${expectedMessage}"`
    }).toBe(expectedMessage);
    console.log(`✓ Validation error displayed: "${expectedMessage}"`);
  }

  async shouldShowDuplicateIdError(): Promise<void> {
    await this.duplicateIdError.shouldBeDisplayed();
    console.log('✓ Duplicate ID error message is displayed');
  }

  async shouldHaveCreateButtonDisabled(): Promise<void> {
    const isDisabled = await this.createButton.isDisabled();
    expect(isDisabled, {
      message: 'Create button should be disabled when validation fails'
    }).toBe(true);
    console.log('✓ Create button is disabled during validation error');
  }

  async shouldHaveCreateButtonEnabled(): Promise<void> {
    const isDisabled = await this.createButton.isDisabled();
    expect(isDisabled, {
      message: 'Create button should be enabled when validation passes'
    }).toBe(false);
    console.log('✓ Create button is enabled with valid input');
  }

  async shouldShowDeletionConfirmation(collectionId: string): Promise<void> {
    await this.confirmationDialog.shouldBeDisplayed();
    await this.confirmationDialog.shouldShowCollectionId(collectionId);
    await this.confirmationDialog.shouldShowWarningMessage();
    console.log(`✓ Deletion confirmation dialog displayed for "${collectionId}"`);
  }
}