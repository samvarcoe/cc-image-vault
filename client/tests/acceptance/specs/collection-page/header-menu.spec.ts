import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { Collection } from '@/domain';
import { createCollectionFixture } from '@/utils/fixtures/collection-fixtures';

test.describe('Client - Collection Page - Header Menu', () => {

    test.beforeEach(async () => {
        Collection.clear();
    });

    test('User navigates to the Collection page', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a Collection exists
        await createCollectionFixture('TestCollection');

        // When the user visits the Collection page
        await ui.collectionPage.visit('TestCollection');

        // Then the page displays the header menu at the top of the page
        await ui.collectionPage.header.shouldBeDisplayed();

        // And the header contains the "Image Vault" text link
        await ui.collectionPage.header.imageVaultLink.shouldBeDisplayed();
        await ui.collectionPage.header.imageVaultLink.shouldHaveText('Image Vault');

        // And the header contains the Status toggle buttons
        await ui.collectionPage.header.statusToggle.shouldBeDisplayed();
        await ui.collectionPage.header.statusToggle.collectionButton.shouldBeDisplayed();
        await ui.collectionPage.header.statusToggle.inboxButton.shouldBeDisplayed();
        await ui.collectionPage.header.statusToggle.archiveButton.shouldBeDisplayed();

        // And the button corresponding to the current status shows as selected
        await ui.collectionPage.header.statusToggle.collectionButton.shouldBeSelected();

        // And the other buttons show as unselected
        await ui.collectionPage.header.statusToggle.inboxButton.shouldNotBeSelected();
        await ui.collectionPage.header.statusToggle.archiveButton.shouldNotBeSelected();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User navigates to the Home page via the Image Vault link', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given is on a Collection page
        await createCollectionFixture('TestCollection');
        await ui.collectionPage.visit('TestCollection');

        // When the user clicks the "Image Vault" link in the header
        await ui.collectionPage.header.imageVaultLink.click();

        // Then the user is navigated to the home page "/"
        await expect(page).toHaveURL('/');

        // And the header does not display on the home page
        await ui.homePage.header.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User scrolls the Collection page', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is on a Collection page with many images
        await createCollectionFixture('TestCollection');
        await ui.collectionPage.visit('TestCollection');

        // Get initial header position for comparison
        const initialHeaderBounds = await ui.collectionPage.header.getBoundingBox();

        // When the user scrolls down the page
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(100); // Allow time for scroll

        // Then the header remains fixed at the top of the viewport
        const scrolledHeaderBounds = await ui.collectionPage.header.getBoundingBox();
        expect(scrolledHeaderBounds?.y).toBe(initialHeaderBounds?.y);

        // And the header is visible on top of the images
        await ui.collectionPage.header.shouldBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User navigates between status views', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is on a Collection page
        await createCollectionFixture('TestCollection');
        await ui.collectionPage.visit('TestCollection', 'COLLECTION');

        // When the user clicks on a Status toggle button
        await ui.collectionPage.header.statusToggle.inboxButton.click();

        // Then the user is navigated to "/collection/TestCollection?status=[STATUS]"
        expect(page.url()).toContain('status=INBOX');

        // And the correct button shows as selected
        await ui.collectionPage.header.statusToggle.inboxButton.shouldBeSelected();
        await ui.collectionPage.header.statusToggle.collectionButton.shouldNotBeSelected();
        await ui.collectionPage.header.statusToggle.archiveButton.shouldNotBeSelected();

        // Test clicking another status button
        await ui.collectionPage.header.statusToggle.archiveButton.click();
        expect(page.url()).toContain('status=ARCHIVE');

        // And the correct button shows as selected
        await ui.collectionPage.header.statusToggle.archiveButton.shouldBeSelected();
        await ui.collectionPage.header.statusToggle.collectionButton.shouldNotBeSelected();
        await ui.collectionPage.header.statusToggle.inboxButton.shouldNotBeSelected();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User opens the fullscreen popover', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given user is on a Collection page
        const collection = await createCollectionFixture('TestCollection');
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;

        await ui.collectionPage.visit('TestCollection');

        // When the user opens a fullscreen image popover
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();

        // Then the fullscreen popover covers the header
        const headerZIndex = await ui.collectionPage.header.getZIndex();
        const popoverZIndex = await ui.collectionPage.popover.getZIndex();

        expect(popoverZIndex).toBeGreaterThan(headerZIndex);

        // Verify the header is still present but covered
        await ui.collectionPage.header.shouldBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
});