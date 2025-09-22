import { expect } from '@playwright/test';
import { PageObject } from '../base/page';
import { Element } from '../base/element';

export class CollectionPage extends PageObject {
    protected url = '/collection';

    get header(): Header {
        return this.component(Header, 'Header Menu', '[data-id="header-menu"]');
    }

    get errorMessage(): Element {
        return this.element('Error Message', '[data-id="error-message"]');
    }

    get emptyMessage(): Element {
        return this.element('Empty Message', '[data-id="empty-message"]');
    }

    get imageGrid(): ImageGrid {
        return this.component(ImageGrid, 'Image Grid', '[data-id="image-grid"]');
    }

    get popover(): Popover {
        return this.component(Popover, 'Fullscreen Popover', '[data-id="fullscreen-popover"]');
    }

    get curationMenu(): CurationMenu {
        return this.component(CurationMenu, 'Curation Menu', '[data-id="curation-menu"]');
    }

    get confirmationDialog(): ConfirmationDialog {
        return this.component(ConfirmationDialog, 'Confirmation Dialog', '[data-id="confirmation-dialog"]');
    }

    async visit(collectionName: string, status?: ImageStatus): Promise<void> {
        const searchParams = status ? `?status=${status}` : '';
        await this.page.goto(`${this.url}/${collectionName}${searchParams}`);
        await this.page.waitForLoadState('networkidle');
    };
}

class ImageGrid extends Element {

    image(imageId?: string): ImageCard {
        return imageId
        ? this.child(ImageCard, `Image: "${imageId}"`, `[data-id="image-card-${imageId}"]`)
        : this.child(ImageCard, 'Image', '[data-id^="image-card-"]');
    };

    async shouldHaveColumnCount(count: number): Promise<void> {
        const columnCountStyle = await this.locator.evaluate(el =>
            window.getComputedStyle(el).columnCount
        );

        const columnCount = columnCountStyle === 'auto' ? 1 : parseInt(columnCountStyle);
        expect(columnCount, `Image grid has ${columnCount} columns instead of ${count}`).toBe(count);

        LOGGER.log(`✓ Image grid displays in ${count}-column layout`);
    }

    async shouldHaveNoSelectedImages(): Promise<void> {
        const selectedImages = this.locator.locator('[data-id^="image-card-"][data-selected="true"]');
        await expect(selectedImages, 'Expected no images to be selected in curate mode').toHaveCount(0);
        LOGGER.log('✓ No images are selected');
    }

    async shouldHaveAllImagesSelected(): Promise<void> {
        const allImages = this.locator.locator('[data-id^="image-card-"]');
        const selectedImages = this.locator.locator('[data-id^="image-card-"][data-selected="true"]');

        const totalCount = await allImages.count();
        await expect(selectedImages, `Expected all ${totalCount} images to be selected`).toHaveCount(totalCount);
        LOGGER.log(`✓ All ${totalCount} images are selected`);
    }
}

class ImageCard extends Element {
    get image(): Element {
        return this.child(Element, 'Image', 'img');
    }

    async shouldBeHidden(): Promise<void> {
        await expect(this.locator, `${this.name} should be hidden but data-hidden is not "true"`).toHaveAttribute('data-hidden', 'true');
        LOGGER.log(`✓ ${this.name} is hidden`);
    }

    async shouldNotBeHidden(): Promise<void> {
        await expect(this.locator, `${this.name} should not be hidden but data-hidden is "true"`).not.toHaveAttribute('data-hidden', 'true');
        LOGGER.log(`✓ ${this.name} is not hidden`);
    }

    async shouldShowPlaceholder(): Promise<void> {
        await this.shouldBeDisplayed();
        await this.image.shouldNotBeDisplayed();
        LOGGER.log(`✓ ${this.name} is showing placeholder (card visible, image hidden)`);
    }
}

class Header extends Element {
    get imageVaultLink(): Element {
        return this.child(Element, 'Image Vault Link', '[data-id="image-vault-link"]');
    }

    get statusToggle(): StatusToggle {
        return this.child(StatusToggle, 'Status Toggle', '[data-id="status-toggle"]');
    }

    get curateButton(): Element {
        return this.child(Element, 'Curate Button', '[data-id="curate-button"]');
    }

    async getBoundingBox() {
        return await this.locator.boundingBox();
    }

    async getZIndex(): Promise<number> {
        const zIndex = await this.locator.evaluate(el =>
            window.getComputedStyle(el).zIndex
        );
        return zIndex === 'auto' ? 0 : parseInt(zIndex);
    }
}

class StatusToggle extends Element {
    get collectionButton(): StatusButton {
        return this.child(StatusButton, 'Collection Button', '[data-id="status-button-COLLECTION"]');
    }

    get inboxButton(): StatusButton {
        return this.child(StatusButton, 'Inbox Button', '[data-id="status-button-INBOX"]');
    }

    get archiveButton(): StatusButton {
        return this.child(StatusButton, 'Archive Button', '[data-id="status-button-ARCHIVE"]');
    }
}

class StatusButton extends Element {
}

class CurationMenu extends Element {
    get selectAllButton(): Element {
        return this.child(Element, 'Select All Button', '[data-id="select-all-button"]');
    }

    get clearButton(): Element {
        return this.child(Element, 'Clear Button', '[data-id="clear-button"]');
    }

    get keepButton(): Element {
        return this.child(Element, 'Keep Button', '[data-id="keep-button"]');
    }

    get discardButton(): Element {
        return this.child(Element, 'Discard Button', '[data-id="discard-button"]');
    }

    get restoreButton(): Element {
        return this.child(Element, 'Restore Button', '[data-id="restore-button"]');
    }

    get deleteButton(): Element {
        return this.child(Element, 'Delete Button', '[data-id="delete-button"]');
    }

    get errorMessage(): Element {
        return this.child(Element, 'Curation Error Message', '[data-id="curation-error-message"]');
    }
}

class Popover extends Element {
    get image(): Element {
        return this.child(Element, 'Popover Image', '[data-id="popover-image"]');
    }

    get errorMessage(): Element {
        return this.child(Element, 'Popover Error Message', '[data-id="popover-error-message"]');
    }

    async getZIndex(): Promise<number> {
        const zIndex = await this.locator.evaluate(el =>
            window.getComputedStyle(el).zIndex
        );
        return zIndex === 'auto' ? 0 : parseInt(zIndex);
    }
};

class ConfirmationDialog extends Element {
    get message(): Element {
        return this.child(Element, 'Confirmation Message', '[data-id="confirmation-message"]');
    }

    get cancelButton(): Element {
        return this.child(Element, 'Cancel Button', '[data-id="cancel-button"]');
    }

    get deleteButton(): Element {
        return this.child(Element, 'Confirm Delete Button', '[data-id="confirm-delete-button"]');
    }
};
