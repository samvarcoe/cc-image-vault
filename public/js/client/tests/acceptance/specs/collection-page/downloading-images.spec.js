import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { createCollectionFixture, setupCollectionFixture } from '@/utils/fixtures/collection-fixtures';
test.describe('Client - Collection Page - Download Images', () => {
    test.beforeAll(async () => {
        await createCollectionFixture({ name: 'download-test', inboxCount: 2, collectionCount: 3, archiveCount: 2 });
    });
    test('User views INBOX images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');
        await page.goto(`/collection/${collection.name}?status=INBOX`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.header.curateButton.click();
        await ui.collectionPage.curationMenu.downloadButton.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.downloadButton.shouldBeDisabled();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views COLLECTION images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');
        await page.goto(`/collection/${collection.name}?status=COLLECTION`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.header.curateButton.click();
        await ui.collectionPage.curationMenu.downloadButton.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.downloadButton.shouldBeDisabled();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views ARCHIVE images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');
        await page.goto(`/collection/${collection.name}?status=ARCHIVE`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.header.curateButton.click();
        await ui.collectionPage.curationMenu.downloadButton.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.downloadButton.shouldBeDisabled();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User selects some images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');
        await page.goto(`/collection/${collection.name}?status=COLLECTION&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.curationMenu.downloadButton.shouldBeDisabled();
        const collectionImages = await collection.getImages({ status: "COLLECTION" });
        const firstImage = collectionImages[0];
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.curationMenu.downloadButton.shouldBeEnabled();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User downloads a single image', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');
        const collectionImages = await collection.getImages({ status: "COLLECTION" });
        const firstImage = collectionImages[0];
        await page.goto(`/collection/${collection.name}?status=COLLECTION&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.curationMenu.downloadButton.shouldBeEnabled();
        await page.route(`**/api/images/${collection.name}/${firstImage.id}/download`, async (route) => {
            await ui.collectionPage.curationMenu.downloadButton.shouldHaveAttribute('data-loading', 'true');
            await ui.collectionPage.curationMenu.downloadButton.shouldBeDisabled();
            await route.continue();
        });
        const downloadPromise = page.waitForEvent('download');
        await ui.collectionPage.curationMenu.downloadButton.click();
        const download = await downloadPromise;
        const suggestedFilename = download.suggestedFilename();
        expect(suggestedFilename).toBe(`${firstImage.name}.${firstImage.extension}`);
        LOGGER.log(`✓ Browser downloaded image with original filename: ${suggestedFilename}`);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User downloads multiple images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');
        const collectionImages = await collection.getImages({ status: "COLLECTION" });
        const firstImage = collectionImages[0];
        const secondImage = collectionImages[1];
        await page.goto(`/collection/${collection.name}?status=COLLECTION&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.curationMenu.downloadButton.shouldBeEnabled();
        const downloadPromise = page.waitForEvent('download');
        await ui.collectionPage.curationMenu.downloadButton.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toEqual(`${collection.name}-COLLECTION-images.zip`);
        await page.waitForTimeout(500);
        await ui.collectionPage.curationMenu.downloadButton.shouldHaveAttribute('data-loading', 'false');
        await ui.collectionPage.curationMenu.downloadButton.shouldBeEnabled();
        LOGGER.log(`✓ Download initiated via form submission for: ${collection.name}-COLLECTION-images.zip`);
        await ui.shouldHaveNoConsoleErrors();
    });
    test('Download completes successfully', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');
        const collectionImages = await collection.getImages({ status: "COLLECTION" });
        const firstImage = collectionImages[0];
        await page.goto(`/collection/${collection.name}?status=COLLECTION&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await page.route(`**/api/images/${collection.name}/${firstImage.id}/download`, async (route) => {
            await ui.collectionPage.curationMenu.downloadButton.shouldHaveAttribute('data-loading', 'true');
            await ui.collectionPage.curationMenu.downloadButton.shouldBeDisabled();
            await route.continue();
        });
        const downloadPromise = page.waitForEvent('download');
        await ui.collectionPage.curationMenu.downloadButton.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toEqual(`${firstImage.name}.${firstImage.extension}`);
        await page.waitForTimeout(100);
        await ui.collectionPage.curationMenu.downloadButton.shouldHaveAttribute('data-loading', 'false');
        await ui.collectionPage.curationMenu.downloadButton.shouldBeEnabled();
        await ui.collectionPage.curationMenu.errorMessage.shouldNotBeDisplayed();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('Download fails with API error', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');
        const collectionImages = await collection.getImages({ status: "COLLECTION" });
        const firstImage = collectionImages[0];
        await page.goto(`/collection/${collection.name}?status=COLLECTION&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await page.route('**/api/images/**/download', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal server error' })
            });
        });
        await ui.collectionPage.curationMenu.downloadButton.click();
        await page.waitForTimeout(1000);
        await ui.collectionPage.curationMenu.downloadButton.shouldHaveAttribute('data-loading', 'false');
        await ui.collectionPage.curationMenu.downloadButton.shouldBeEnabled();
        await ui.collectionPage.curationMenu.errorMessage.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.errorMessage.shouldHaveText('Unable to download image(s)');
    });
});
