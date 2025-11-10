import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { createCollectionFixture, setupCollectionFixture } from '@/utils/fixtures/collection-fixtures';
test.describe('Client - Collection Page - Deleting Images', () => {
    test.beforeAll(async () => {
        await createCollectionFixture({ name: 'delete-standard', inboxCount: 2, collectionCount: 2, archiveCount: 3 });
        await createCollectionFixture({ name: 'delete-large', inboxCount: 0, collectionCount: 0, archiveCount: 50 });
    });
    test('User views ARCHIVE images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('delete-standard');
        await page.goto(`/collection/${collection.name}?status=ARCHIVE&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.deleteButton.shouldBeDisplayed();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views COLLECTION images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('delete-standard');
        await page.goto(`/collection/${collection.name}?status=COLLECTION&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.deleteButton.shouldNotBeDisplayed();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views INBOX images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('delete-standard');
        await page.goto(`/collection/${collection.name}?status=INBOX&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.deleteButton.shouldNotBeDisplayed();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User initiates delete operation', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('delete-standard');
        const archiveImages = await collection.getImages({ status: "ARCHIVE" });
        const firstImage = archiveImages[0];
        const secondImage = archiveImages[1];
        await page.goto(`/collection/${collection.name}?status=ARCHIVE&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();
        await ui.collectionPage.curationMenu.deleteButton.click();
        await ui.collectionPage.confirmationDialog.shouldBeDisplayed();
        await ui.collectionPage.confirmationDialog.message.shouldHaveText('Are you sure you want to permanently delete these images? This action cannot be undone.');
        await ui.collectionPage.confirmationDialog.cancelButton.shouldBeDisplayed();
        await ui.collectionPage.confirmationDialog.deleteButton.shouldBeDisplayed();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User cancels delete operation', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('delete-standard');
        const archiveImages = await collection.getImages({ status: "ARCHIVE" });
        const firstImage = archiveImages[0];
        const secondImage = archiveImages[1];
        await page.goto(`/collection/${collection.name}?status=ARCHIVE&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.curationMenu.deleteButton.click();
        await ui.collectionPage.confirmationDialog.shouldBeDisplayed();
        let deleteRequestMade = false;
        await page.route(`**/api/images/${collection.name}/*`, async (route) => {
            if (route.request().method() === 'DELETE') {
                deleteRequestMade = true;
            }
            route.continue();
        });
        await ui.collectionPage.confirmationDialog.cancelButton.click();
        await ui.collectionPage.confirmationDialog.shouldNotBeDisplayed();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();
        expect(deleteRequestMade, 'Expected no DELETE request to be made when user cancels').toBe(false);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User confirms delete operation', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('delete-standard');
        const archiveImages = await collection.getImages({ status: "ARCHIVE" });
        const firstImage = archiveImages[0];
        const secondImage = archiveImages[1];
        await page.goto(`/collection/${collection.name}?status=ARCHIVE&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.curationMenu.deleteButton.click();
        await ui.collectionPage.confirmationDialog.shouldBeDisplayed();
        await page.route(`**/api/images/${collection.name}/*`, async (route) => {
            if (route.request().method() === 'DELETE') {
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldShowPlaceholder();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldShowPlaceholder();
            }
            route.continue();
        });
        await ui.collectionPage.confirmationDialog.deleteButton.click();
        await ui.collectionPage.confirmationDialog.shouldNotBeDisplayed();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('Delete operation completes successfully', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('delete-standard');
        const archiveImages = await collection.getImages({ status: "ARCHIVE" });
        const firstImage = archiveImages[0];
        const secondImage = archiveImages[1];
        await page.goto(`/collection/${collection.name}?status=ARCHIVE&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.curationMenu.deleteButton.click();
        await ui.collectionPage.confirmationDialog.deleteButton.click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldNotExist();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldNotExist();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await ui.collectionPage.curationMenu.errorMessage.shouldNotBeDisplayed();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('Delete operation fails partially', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('delete-standard');
        const archiveImages = await collection.getImages({ status: "ARCHIVE" });
        const firstImage = archiveImages[0];
        const secondImage = archiveImages[1];
        const thirdImage = archiveImages[2];
        await page.goto(`/collection/${collection.name}?status=ARCHIVE&curate=true`);
        await page.waitForLoadState('networkidle');
        let requestCount = 0;
        await page.route(`**/api/images/${collection.name}/*`, async (route) => {
            if (route.request().method() === 'DELETE') {
                requestCount++;
                if (requestCount === 2) {
                    route.fulfill({
                        status: 500,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'Internal Server Error' })
                    });
                }
                else {
                    route.continue();
                }
            }
            else {
                route.continue();
            }
        });
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.imageGrid.image(thirdImage.id).click();
        await ui.collectionPage.curationMenu.deleteButton.click();
        await ui.collectionPage.confirmationDialog.deleteButton.click();
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldNotExist();
        await ui.collectionPage.imageGrid.image(thirdImage.id).shouldNotExist();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldNotBeHidden();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();
        await ui.collectionPage.curationMenu.errorMessage.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.errorMessage.shouldHaveText('Unable to delete all images');
    });
    test('Delete operation fails completely', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('delete-standard');
        const archiveImages = await collection.getImages({ status: "ARCHIVE" });
        const firstImage = archiveImages[0];
        const secondImage = archiveImages[1];
        await page.goto(`/collection/${collection.name}?status=ARCHIVE&curate=true`);
        await page.waitForLoadState('networkidle');
        await page.route(`**/api/images/${collection.name}/*`, async (route) => {
            if (route.request().method() === 'DELETE') {
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
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.curationMenu.deleteButton.click();
        await ui.collectionPage.confirmationDialog.deleteButton.click();
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldNotBeHidden();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldNotBeHidden();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();
        await ui.collectionPage.curationMenu.errorMessage.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.errorMessage.shouldHaveText('Unable to delete images');
    });
    test('User deletes a large number of images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('delete-large');
        page.context().setDefaultTimeout(10000);
        const imageCount = 50;
        await page.goto(`/collection/${collection.name}?status=ARCHIVE&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image().shouldHaveCount(imageCount);
        const apiCalls = [];
        await page.route(`**/api/images/${collection.name}/*`, (route) => {
            if (route.request().method() === 'DELETE') {
                apiCalls.push(route.request().url());
                route.continue();
            }
            else {
                route.continue();
            }
        });
        await ui.collectionPage.curationMenu.selectAllButton.click();
        await ui.collectionPage.imageGrid.shouldHaveAllImagesSelected();
        await ui.collectionPage.curationMenu.deleteButton.click();
        await ui.collectionPage.confirmationDialog.deleteButton.click();
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image().shouldHaveCount(0);
        expect(apiCalls.length, `The number of calls to DELETE delete images is incorrect`).toBe(imageCount);
        await ui.shouldHaveNoFailedRequests();
    });
});
