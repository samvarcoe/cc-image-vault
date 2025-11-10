import { expect } from '@playwright/test';
import { PageObject } from '../base/page';
import { Element } from '../base/element';
export class CollectionPage extends PageObject {
    constructor() {
        super(...arguments);
        this.url = '/collection';
    }
    get header() {
        return this.component(Header, 'Header Menu', '[data-id="header-menu"]');
    }
    get errorMessage() {
        return this.element('Error Message', '[data-id="error-message"]');
    }
    get emptyMessage() {
        return this.element('Empty Message', '[data-id="empty-message"]');
    }
    get imageGrid() {
        return this.component(ImageGrid, 'Image Grid', '[data-id="image-grid"]');
    }
    get popover() {
        return this.component(Popover, 'Fullscreen Popover', '[data-id="fullscreen-popover"]');
    }
    get curationMenu() {
        return this.component(CurationMenu, 'Curation Menu', '[data-id="curation-menu"]');
    }
    get confirmationDialog() {
        return this.component(ConfirmationDialog, 'Confirmation Dialog', '[data-id="confirmation-dialog"]');
    }
    get uploadDialog() {
        return this.component(UploadDialog, 'Upload Dialog', '[data-id="upload-dialog"]');
    }
    get slideshow() {
        return this.component(Slideshow, 'Slideshow', '[data-id="slideshow"]');
    }
    async visit(collectionName, status) {
        const searchParams = status ? `?status=${status}` : '';
        await this.page.goto(`${this.url}/${collectionName}${searchParams}`);
        await this.page.waitForLoadState('domcontentloaded');
    }
    ;
}
class ImageGrid extends Element {
    image(imageId) {
        return imageId
            ? this.child(ImageCard, `Image: "${imageId}"`, `[data-id="image-card-${imageId}"]`)
            : this.child(ImageCard, 'Image', '[data-id^="image-card-"]');
    }
    ;
    async shouldHaveColumnCount(count) {
        const columnCountStyle = await this.locator.evaluate(el => window.getComputedStyle(el).columnCount);
        const columnCount = columnCountStyle === 'auto' ? 1 : parseInt(columnCountStyle);
        expect(columnCount, `Image grid has ${columnCount} columns instead of ${count}`).toBe(count);
        LOGGER.log(`✓ Image grid displays in ${count}-column layout`);
    }
    async shouldHaveNoSelectedImages() {
        const selectedImages = this.locator.locator('[data-id^="image-card-"][data-selected="true"]');
        await expect(selectedImages, 'Expected no images to be selected in curate mode').toHaveCount(0);
        LOGGER.log('✓ No images are selected');
    }
    async shouldHaveAllImagesSelected() {
        const allImages = this.locator.locator('[data-id^="image-card-"]');
        const selectedImages = this.locator.locator('[data-id^="image-card-"][data-selected="true"]');
        const totalCount = await allImages.count();
        await expect(selectedImages, `Expected all ${totalCount} images to be selected`).toHaveCount(totalCount);
        LOGGER.log(`✓ All ${totalCount} images are selected`);
    }
}
class ImageCard extends Element {
    get image() {
        return this.child(Element, 'Image', 'img');
    }
    async shouldBeHidden() {
        await expect(this.locator, `${this.name} should be hidden but data-hidden is not "true"`).toHaveAttribute('data-hidden', 'true');
        LOGGER.log(`✓ ${this.name} is hidden`);
    }
    async shouldNotBeHidden() {
        await expect(this.locator, `${this.name} should not be hidden but data-hidden is "true"`).not.toHaveAttribute('data-hidden', 'true');
        LOGGER.log(`✓ ${this.name} is not hidden`);
    }
    async shouldShowPlaceholder() {
        await this.shouldBeDisplayed();
        await this.image.shouldNotBeDisplayed();
        LOGGER.log(`✓ ${this.name} is showing placeholder (card visible, image hidden)`);
    }
}
class Header extends Element {
    get imageVaultLink() {
        return this.child(Element, 'Image Vault Link', '[data-id="image-vault-link"]');
    }
    get statusToggle() {
        return this.child(StatusToggle, 'Status Toggle', '[data-id="status-toggle"]');
    }
    get curateButton() {
        return this.child(Element, 'Curate Button', '[data-id="curate-button"]');
    }
    get shuffleButton() {
        return this.child(Element, 'Shuffle Button', '[data-id="shuffle-button"]');
    }
    get slideshowButton() {
        return this.child(Element, 'Slideshow Button', '[data-id="slideshow-button"]');
    }
    get uploadButton() {
        return this.child(Element, 'Upload Button', '[data-id="upload-button"]');
    }
    async getBoundingBox() {
        return await this.locator.boundingBox();
    }
    async getZIndex() {
        const zIndex = await this.locator.evaluate(el => window.getComputedStyle(el).zIndex);
        return zIndex === 'auto' ? 0 : parseInt(zIndex);
    }
}
class StatusToggle extends Element {
    get collectionButton() {
        return this.child(StatusButton, 'Collection Button', '[data-id="status-button-COLLECTION"]');
    }
    get inboxButton() {
        return this.child(StatusButton, 'Inbox Button', '[data-id="status-button-INBOX"]');
    }
    get archiveButton() {
        return this.child(StatusButton, 'Archive Button', '[data-id="status-button-ARCHIVE"]');
    }
}
class StatusButton extends Element {
}
class CurationMenu extends Element {
    get selectAllButton() {
        return this.child(Element, 'Select All Button', '[data-id="select-all-button"]');
    }
    get clearButton() {
        return this.child(Element, 'Clear Button', '[data-id="clear-button"]');
    }
    get keepButton() {
        return this.child(Element, 'Keep Button', '[data-id="keep-button"]');
    }
    get discardButton() {
        return this.child(Element, 'Discard Button', '[data-id="discard-button"]');
    }
    get restoreButton() {
        return this.child(Element, 'Restore Button', '[data-id="restore-button"]');
    }
    get deleteButton() {
        return this.child(Element, 'Delete Button', '[data-id="delete-button"]');
    }
    get downloadButton() {
        return this.child(Element, 'Download Button', '[data-id="download-button"]');
    }
    get errorMessage() {
        return this.child(Element, 'Curation Error Message', '[data-id="curation-error-message"]');
    }
}
class Popover extends Element {
    get image() {
        return this.child(Element, 'Popover Image', '[data-id="popover-image"]');
    }
    get errorMessage() {
        return this.child(Element, 'Popover Error Message', '[data-id="popover-error-message"]');
    }
    get statusMessage() {
        return this.child(Element, 'Popover Status Message', '[data-id="popover-status-message"]');
    }
    async shouldShowImage(imageId, collectionName) {
        await this.image.shouldHaveAttribute('src', `/api/images/${collectionName}/${imageId}`);
        LOGGER.log(`✓ Popover displays image "${imageId}" from collection "${collectionName}"`);
    }
    async shouldShowStatusMessage(expectedMessage) {
        await this.statusMessage.shouldBeDisplayed();
        await this.statusMessage.shouldHaveText(expectedMessage);
        LOGGER.log(`✓ Popover shows status message: "${expectedMessage}"`);
    }
    async shouldHideStatusMessage() {
        await this.statusMessage.shouldNotBeDisplayed();
        LOGGER.log('✓ Popover status message is hidden');
    }
    async shouldHaveStatusMessageThenHide(expectedMessage) {
        await this.statusMessage.shouldBeDisplayed();
        await this.statusMessage.shouldHaveText(expectedMessage);
        await this.statusMessage.shouldNotBeDisplayed();
        LOGGER.log(`✓ Popover status message "${expectedMessage}" appeared then was hidden`);
    }
    async pressTab() {
        await this.page.keyboard.press('Tab');
        LOGGER.log('✓ Pressed Tab key in popover');
    }
    async pressBackspace() {
        await this.page.keyboard.press('Backspace');
        LOGGER.log('✓ Pressed Backspace key in popover');
    }
    async scrollDown() {
        await this.locator.hover();
        await this.page.mouse.wheel(0, 100);
        LOGGER.log('✓ Scrolled mouse wheel down in popover');
    }
    async scrollUp() {
        await this.locator.hover();
        await this.page.mouse.wheel(0, -100);
        LOGGER.log('✓ Scrolled mouse wheel up in popover');
    }
    async getZIndex() {
        const zIndex = await this.locator.evaluate(el => window.getComputedStyle(el).zIndex);
        return zIndex === 'auto' ? 0 : parseInt(zIndex);
    }
}
;
class ConfirmationDialog extends Element {
    get message() {
        return this.child(Element, 'Confirmation Message', '[data-id="confirmation-message"]');
    }
    get cancelButton() {
        return this.child(Element, 'Cancel Button', '[data-id="cancel-button"]');
    }
    get deleteButton() {
        return this.child(Element, 'Confirm Delete Button', '[data-id="confirm-delete-button"]');
    }
}
;
class UploadDialog extends Element {
    get fileInput() {
        return this.child(Element, 'File Input', '[data-id="file-input"]');
    }
    get cancelButton() {
        return this.child(Element, 'Cancel Button', '[data-id="cancel-button"]');
    }
    get addButton() {
        return this.child(Element, 'Add Button', '[data-id="add-button"]');
    }
}
;
class Slideshow extends Element {
    get image() {
        return this.child(Element, 'Slideshow Image', '[data-id="slideshow-image"]');
    }
    get pauseSymbol() {
        return this.child(Element, 'Pause Symbol', '[data-id="pause-symbol"]');
    }
    async shouldShowPauseSymbol() {
        await this.pauseSymbol.shouldBeDisplayed();
        LOGGER.log('✓ Pause symbol is displayed');
    }
    async shouldHidePauseSymbol() {
        await this.pauseSymbol.shouldNotBeDisplayed();
        LOGGER.log('✓ Pause symbol is hidden');
    }
    async shouldShowImageFromCollection(collectionName) {
        const src = await this.image.getAttribute('src');
        const expectedPattern = `/api/images/${collectionName}/`;
        expect(src).toContain(expectedPattern);
        LOGGER.log(`✓ Slideshow is displaying image from collection "${collectionName}"`);
    }
    async getCurrentImageId() {
        const src = await this.image.getAttribute('src');
        if (!src) {
            throw new Error('Slideshow image has no src attribute');
        }
        const matches = src.match(/\/api\/images\/[^/]+\/(.+)$/);
        if (!matches || !matches[1]) {
            throw new Error(`Could not extract image ID from src: ${src}`);
        }
        return matches[1];
    }
    async shouldShowDifferentImage(previousImageId) {
        const currentImageId = await this.getCurrentImageId();
        expect(currentImageId).not.toBe(previousImageId);
        LOGGER.log(`✓ Slideshow advanced from image "${previousImageId}" to "${currentImageId}"`);
    }
    async shouldShowSameImage(expectedImageId) {
        const currentImageId = await this.getCurrentImageId();
        expect(currentImageId).toBe(expectedImageId);
        LOGGER.log(`✓ Slideshow is still showing image "${expectedImageId}"`);
    }
    async getZIndex() {
        const zIndex = await this.locator.evaluate(el => window.getComputedStyle(el).zIndex);
        return zIndex === 'auto' ? 0 : parseInt(zIndex);
    }
}
;
