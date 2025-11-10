import { test } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { createCollectionFixture, setupCollectionFixture } from '@/utils/fixtures/collection-fixtures';
test.describe('Client - Collection Page - Selecting Images', () => {
    test.beforeAll(async () => {
        await createCollectionFixture({ name: 'select-standard', inboxCount: 1, collectionCount: 3, archiveCount: 1 });
    });
    test('User activates curate mode', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('select-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.curateButton.shouldNotBePressed();
        await ui.collectionPage.header.curateButton.click();
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.selectAllButton.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.clearButton.shouldBeDisplayed();
        await ui.collectionPage.imageGrid.shouldHaveNoSelectedImages();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User selects an image', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('select-standard');
        const collectionImages = await collection.getImages({ status: "COLLECTION" });
        const firstImage = collectionImages[0];
        await page.goto(`/collection/${collection.name}?curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User deselects an image', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('select-standard');
        const collectionImages = await collection.getImages({ status: "COLLECTION" });
        const firstImage = collectionImages[0];
        const secondImage = collectionImages[1];
        await page.goto(`/collection/${collection.name}?curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldNotBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User selects all images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('select-standard');
        await page.goto(`/collection/${collection.name}?curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.curationMenu.selectAllButton.click();
        await ui.collectionPage.imageGrid.shouldHaveAllImagesSelected();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User clears all selections', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('select-standard');
        await page.goto(`/collection/${collection.name}?curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.curationMenu.selectAllButton.click();
        await ui.collectionPage.imageGrid.shouldHaveAllImagesSelected();
        await ui.collectionPage.curationMenu.clearButton.click();
        await ui.collectionPage.imageGrid.shouldHaveNoSelectedImages();
        await ui.collectionPage.header.curateButton.shouldBePressed();
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User deactivates curate mode with selections', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('select-standard');
        await page.goto(`/collection/${collection.name}?curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.curationMenu.selectAllButton.click();
        await ui.collectionPage.imageGrid.shouldHaveAllImagesSelected();
        await ui.collectionPage.header.curateButton.click();
        await ui.collectionPage.imageGrid.shouldHaveNoSelectedImages();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User clicks image when not in curate mode', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('select-standard');
        const collectionImages = await collection.getImages({ status: "COLLECTION" });
        const firstImage = collectionImages[0];
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.curateButton.shouldNotBePressed();
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldNotBeSelected();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
});
