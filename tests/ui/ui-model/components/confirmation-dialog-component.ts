import { expect } from 'playwright/test';
import { Element } from '../element';

export class ConfirmationDialogComponent extends Element {
  // Dialog elements
  get confirmButton(): Element {
    return this.child(Element, 'Confirm Button', '[data-testid="confirm-button"]');
  }

  get cancelButton(): Element {
    return this.child(Element, 'Cancel Button', '[data-testid="cancel-button"]');
  }

  get dialogTitle(): Element {
    return this.child(Element, 'Dialog Title', '[data-testid="dialog-title"]');
  }

  get warningMessage(): Element {
    return this.child(Element, 'Warning Message', '[data-testid="warning-message"]');
  }

  get collectionIdDisplay(): Element {
    return this.child(Element, 'Collection ID Display', '[data-testid="collection-id-display"]');
  }

  // Component workflows
  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  // Component assertions
  async shouldShowCollectionId(expectedId: string): Promise<void> {
    const actualId = await this.collectionIdDisplay.getText();
    expect(actualId, {
      message: `Confirmation dialog shows collection ID "${actualId}" instead of "${expectedId}"`
    }).toBe(expectedId);
    console.log(`✓ Confirmation dialog shows collection ID "${expectedId}"`);
  }

  async shouldShowWarningMessage(): Promise<void> {
    await this.warningMessage.shouldBeDisplayed();
    const warningText = await this.warningMessage.getText();
    expect(warningText.length, {
      message: 'Warning message should contain text about deletion consequences'
    }).toBeGreaterThan(0);
    console.log('✓ Confirmation dialog shows warning message about deletion');
  }

  async shouldShowConfirmAndCancelButtons(): Promise<void> {
    await this.confirmButton.shouldBeDisplayed();
    await this.cancelButton.shouldBeDisplayed();
    console.log('✓ Confirmation dialog shows both confirm and cancel buttons');
  }
}