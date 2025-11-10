import { expect, test } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { createCollectionFixture, setupCollectionFixture } from '@/utils/fixtures/collection-fixtures';
test.describe('Client - Images - Fullscreen Status Updates', () => {
    test.beforeAll(async () => {
        await createCollectionFixture({ name: 'fullscreen-mixed', inboxCount: 3, collectionCount: 3, archiveCount: 3 });
        await createCollectionFixture({ name: 'fullscreen-single', inboxCount: 1, collectionCount: 0, archiveCount: 0 });
    });
    test('User successfully keeps an INBOX image', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.clock.install();
        const collection = setupCollectionFixture('fullscreen-mixed');
        const inboxImages = await collection.getImages({ status: "INBOX" });
        const testImage = inboxImages[0];
        const nextImage = inboxImages[1];
        await ui.collectionPage.visit(collection.name, 'INBOX');
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);
        await ui.collectionPage.popover.pressTab();
        await ui.collectionPage.popover.shouldShowStatusMessage('Image moved to COLLECTION');
        await page.clock.fastForward(500);
        await ui.collectionPage.popover.shouldShowImage(nextImage.id, collection.name);
        await ui.collectionPage.popover.shouldHideStatusMessage();
        const updatedImage = await collection.getImage(testImage.id);
        expect(updatedImage.status).toBe('COLLECTION');
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User successfully discards an INBOX image', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.clock.install();
        const collection = setupCollectionFixture('fullscreen-mixed');
        const inboxImages = await collection.getImages({ status: "INBOX" });
        const testImage = inboxImages[0];
        const nextImage = inboxImages[1];
        await ui.collectionPage.visit(collection.name, 'INBOX');
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);
        await ui.collectionPage.popover.pressBackspace();
        await ui.collectionPage.popover.shouldShowStatusMessage('Image moved to ARCHIVE');
        await page.clock.fastForward(500);
        await ui.collectionPage.popover.shouldShowImage(nextImage.id, collection.name);
        await ui.collectionPage.popover.shouldHideStatusMessage();
        const updatedImage = await collection.getImage(testImage.id);
        expect(updatedImage.status).toBe('ARCHIVE');
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User successfully discards a COLLECTION image', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.clock.install();
        const collection = setupCollectionFixture('fullscreen-mixed');
        const collectionImages = await collection.getImages({ status: "COLLECTION" });
        const testImage = collectionImages[0];
        const nextImage = collectionImages[1];
        await ui.collectionPage.visit(collection.name, 'COLLECTION');
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);
        await ui.collectionPage.popover.pressBackspace();
        await ui.collectionPage.popover.shouldShowStatusMessage('Image moved to ARCHIVE');
        await page.clock.fastForward(500);
        await ui.collectionPage.popover.shouldShowImage(nextImage.id, collection.name);
        await ui.collectionPage.popover.shouldHideStatusMessage();
        const updatedImage = await collection.getImage(testImage.id);
        expect(updatedImage.status).toBe('ARCHIVE');
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User successfully restores an ARCHIVE image', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.clock.install();
        const collection = setupCollectionFixture('fullscreen-mixed');
        const archiveImages = await collection.getImages({ status: "ARCHIVE" });
        const testImage = archiveImages[0];
        const nextImage = archiveImages[1];
        await ui.collectionPage.visit(collection.name, 'ARCHIVE');
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);
        await ui.collectionPage.popover.pressTab();
        await ui.collectionPage.popover.shouldShowStatusMessage('Image moved to COLLECTION');
        await page.clock.fastForward(500);
        await ui.collectionPage.popover.shouldShowImage(nextImage.id, collection.name);
        await ui.collectionPage.popover.shouldHideStatusMessage();
        const updatedImage = await collection.getImage(testImage.id);
        expect(updatedImage.status).toBe('COLLECTION');
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User exits fullscreen mode after updating images', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.clock.install();
        const collection = setupCollectionFixture('fullscreen-mixed');
        const inboxImages = await collection.getImages({ status: "INBOX" });
        await ui.collectionPage.visit(collection.name, 'INBOX');
        const firstImageId = inboxImages[0].id;
        await ui.collectionPage.imageGrid.image(firstImageId).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(firstImageId, collection.name);
        await ui.collectionPage.popover.pressTab();
        await page.clock.fastForward(500);
        const popoverImage = await page.locator('[data-id="popover-image"]');
        const currentImageSrc = await popoverImage.getAttribute('src');
        const currentImageId = currentImageSrc.split('/').pop();
        await ui.collectionPage.popover.pressBackspace();
        await page.clock.fastForward(500);
        await page.keyboard.press('Escape');
        await ui.collectionPage.popover.shouldNotBeDisplayed();
        await ui.collectionPage.imageGrid.image(firstImageId).shouldNotBeDisplayed();
        await ui.collectionPage.imageGrid.image(currentImageId).shouldNotBeDisplayed();
        const remainingInboxImages = inboxImages.filter(img => img.id !== firstImageId && img.id !== currentImageId);
        for (const img of remainingInboxImages) {
            await ui.collectionPage.imageGrid.image(img.id).shouldBeDisplayed();
        }
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User updates the last image', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.clock.install();
        const collection = setupCollectionFixture('fullscreen-single');
        const inboxImages = await collection.getImages({ status: "INBOX" });
        const lastImage = inboxImages[0];
        await ui.collectionPage.visit(collection.name, 'INBOX');
        await ui.collectionPage.imageGrid.image(lastImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(lastImage.id, collection.name);
        await ui.collectionPage.popover.pressTab();
        await page.clock.fastForward(500);
        await ui.collectionPage.popover.shouldNotBeDisplayed();
        await expect(page.locator('[data-id="empty-message"]')).toBeVisible();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('Status update request fails', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.clock.install();
        const collection = setupCollectionFixture('fullscreen-mixed');
        const inboxImages = await collection.getImages({ status: "INBOX" });
        const testImage = inboxImages[0];
        await ui.collectionPage.visit(collection.name, 'INBOX');
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);
        await page.route(`**/api/images/${collection.name}/${testImage.id}`, (route) => {
            if (route.request().method() === 'PATCH') {
                route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'Internal Server Error' })
                });
            }
            else {
                route.continue();
            }
        });
        await ui.collectionPage.popover.pressTab();
        await ui.collectionPage.popover.shouldShowStatusMessage('Unable to update image status');
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);
        await page.clock.fastForward(500);
        await ui.collectionPage.popover.shouldHideStatusMessage();
    });
    test('User views a "COLLECTION" image in fullscreen', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('fullscreen-mixed');
        const collectionImages = await collection.getImages({ status: "COLLECTION" });
        const testImage = collectionImages[0];
        await ui.collectionPage.visit(collection.name, 'COLLECTION');
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);
        let apiCallMade = false;
        await page.route(`**/api/images/${collection.name}/${testImage.id}`, (route) => {
            if (route.request().method() === 'PATCH') {
                apiCallMade = true;
            }
            route.continue();
        });
        await ui.collectionPage.popover.pressTab();
        await page.waitForTimeout(100);
        expect(apiCallMade, 'Tab key should not trigger API calls for COLLECTION images').toBe(false);
        await ui.shouldHaveNoConsoleErrors();
    });
    test('User views an "ARCHIVE" image in fullscreen', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('fullscreen-mixed');
        const archiveImages = await collection.getImages({ status: "ARCHIVE" });
        const testImage = archiveImages[0];
        await ui.collectionPage.visit(collection.name, 'ARCHIVE');
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);
        let apiCallMade = false;
        await page.route(`**/api/images/${collection.name}/${testImage.id}`, (route) => {
            if (route.request().method() === 'PATCH') {
                apiCallMade = true;
            }
            route.continue();
        });
        await ui.collectionPage.popover.pressBackspace();
        await page.waitForTimeout(100);
        expect(apiCallMade, 'Backspace key should not trigger API calls for ARCHIVE images').toBe(false);
        await ui.shouldHaveNoConsoleErrors();
    });
});
