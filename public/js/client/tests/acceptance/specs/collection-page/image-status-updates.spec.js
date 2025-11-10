import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { createCollectionFixture, setupCollectionFixture } from '@/utils/fixtures/collection-fixtures';
test.describe('Client - Collection Page - Image Status Updates', () => {
    test.beforeAll(async () => {
        await createCollectionFixture({ name: 'status-standard', inboxCount: 2, collectionCount: 2, archiveCount: 2 });
        await createCollectionFixture({ name: 'status-batch', inboxCount: 100, collectionCount: 0, archiveCount: 0 });
    });
    test('User views INBOX images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('status-standard');
        await page.goto(`/collection/${collection.name}?status=INBOX&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.keepButton.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.discardButton.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.restoreButton.shouldNotBeDisplayed();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views COLLECTION images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('status-standard');
        await page.goto(`/collection/${collection.name}?status=COLLECTION&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.discardButton.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.keepButton.shouldNotBeDisplayed();
        await ui.collectionPage.curationMenu.restoreButton.shouldNotBeDisplayed();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views ARCHIVE images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('status-standard');
        await page.goto(`/collection/${collection.name}?status=ARCHIVE&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.restoreButton.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.keepButton.shouldNotBeDisplayed();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User initiates a "Keep" request', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('status-standard');
        const inboxImages = await collection.getImages({ status: "INBOX" });
        const firstImage = inboxImages[0];
        const secondImage = inboxImages[1];
        await page.goto(`/collection/${collection.name}?status=INBOX&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();
        await page.route(`**/api/images/${collection.name}/*`, async (route) => {
            if (route.request().method() === 'PATCH') {
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldShowPlaceholder();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldShowPlaceholder();
            }
        });
        await ui.collectionPage.curationMenu.keepButton.click();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User initiates a "Discard" request for "INBOX" images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('status-standard');
        const inboxImages = await collection.getImages({ status: "INBOX" });
        const firstImage = inboxImages[0];
        const secondImage = inboxImages[1];
        await page.goto(`/collection/${collection.name}?status=INBOX&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();
        await page.route(`**/api/images/${collection.name}/*`, async (route) => {
            if (route.request().method() === 'PATCH') {
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldShowPlaceholder();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldShowPlaceholder();
            }
        });
        await ui.collectionPage.curationMenu.discardButton.click();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User initiates a "Discard" request for "COLLECTION" images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('status-standard');
        const collectionImages = await collection.getImages({ status: "COLLECTION" });
        const firstImage = collectionImages[0];
        const secondImage = collectionImages[1];
        await page.goto(`/collection/${collection.name}?status=COLLECTION&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();
        await page.route(`**/api/images/${collection.name}/*`, async (route) => {
            if (route.request().method() === 'PATCH') {
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldShowPlaceholder();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldShowPlaceholder();
            }
        });
        await ui.collectionPage.curationMenu.discardButton.click();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User initiates a "Restore" request', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('status-standard');
        const archiveImages = await collection.getImages({ status: "ARCHIVE" });
        const firstImage = archiveImages[0];
        const secondImage = archiveImages[1];
        await page.goto(`/collection/${collection.name}?status=ARCHIVE&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();
        await page.route(`**/api/images/${collection.name}/*`, async (route) => {
            if (route.request().method() === 'PATCH') {
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldShowPlaceholder();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldShowPlaceholder();
            }
        });
        await ui.collectionPage.curationMenu.restoreButton.click();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('A status change request responds successfully', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('status-standard');
        const inboxImages = await collection.getImages({ status: "INBOX" });
        const testImage = inboxImages[0];
        await page.goto(`/collection/${collection.name}?status=INBOX&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.imageGrid.image(testImage.id).shouldBeSelected();
        await ui.collectionPage.curationMenu.keepButton.click();
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(testImage.id).shouldNotExist();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('A status change request is unsuccessful', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('status-standard');
        const inboxImages = await collection.getImages({ status: "INBOX" });
        const testImage = inboxImages[0];
        await page.goto(`/collection/${collection.name}?status=INBOX&curate=true`);
        await page.waitForLoadState('networkidle');
        await page.route(`**/api/images/${collection.name}/*`, async (route) => {
            if (route.request().method() === 'PATCH') {
                await ui.collectionPage.imageGrid.image(testImage.id).shouldBeHidden();
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
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.imageGrid.image(testImage.id).shouldBeSelected();
        await ui.collectionPage.curationMenu.keepButton.click();
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(testImage.id).shouldNotBeHidden();
        await ui.collectionPage.imageGrid.image(testImage.id).shouldBeSelected();
        await ui.collectionPage.curationMenu.errorMessage.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.errorMessage.shouldHaveText('Unable to complete update for all Images');
    });
    test('User updates a large number of images', async ({ page }) => {
        const ui = new ImageVault(page);
        const imageCount = 100;
        const collection = setupCollectionFixture('status-batch');
        await page.goto(`/collection/${collection.name}?status=INBOX&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image().shouldHaveCount(imageCount);
        const apiCalls = [];
        await page.route(`**/api/images/${collection.name}/*`, (route) => {
            if (route.request().method() === 'PATCH') {
                apiCalls.push(route.request().url());
                route.continue();
            }
            else {
                route.continue();
            }
        });
        await ui.collectionPage.curationMenu.selectAllButton.click();
        await ui.collectionPage.imageGrid.shouldHaveAllImagesSelected();
        await ui.collectionPage.curationMenu.keepButton.click();
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image().shouldHaveCount(0);
        expect(apiCalls.length, `The number of calls to PATCH update status is incorrect`).toBe(imageCount);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
});
