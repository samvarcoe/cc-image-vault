import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { Collection } from '@/domain';
import { createCollectionFixture, setupCollectionFixture } from '@/utils/fixtures/collection-fixtures';
import { corruptCollectionDB } from '@/utils';
test.describe('Client - Collection Page - Viewing Images', () => {
    test.beforeAll(async () => {
        await createCollectionFixture({ name: 'view-standard', inboxCount: 2, collectionCount: 3, archiveCount: 2 });
        await createCollectionFixture({ name: 'view-empty', inboxCount: 0, collectionCount: 0, archiveCount: 0 });
    });
    test('User views the Collection page with no Status set', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('view-standard');
        await ui.collectionPage.visit(collection.name);
        expect(page.url()).toContain('status=COLLECTION');
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views Collection images on the Collection page', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('view-standard');
        const collectionImages = await collection.getImages({ status: "COLLECTION" });
        await ui.collectionPage.visit(collection.name, 'COLLECTION');
        await ui.collectionPage.imageGrid.image().shouldHaveCount(collectionImages.length);
        for (let i = 0; i < collectionImages.length; i++) {
            const image = collectionImages[i];
            const thumbnailHeight = Math.round(400 / image.aspect);
            const path = `/api/images/${collection.name}/${image.id}/thumbnail`;
            await ui.collectionPage.imageGrid.image(image.id).shouldBeDisplayed();
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveAttribute('loading', 'lazy');
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveAttribute('src', path);
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveHeight(thumbnailHeight);
        }
        ;
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views INBOX images on the Collection page', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('view-standard');
        const inboxImages = await collection.getImages({ status: "INBOX" });
        await ui.collectionPage.visit(collection.name, 'INBOX');
        await ui.collectionPage.imageGrid.image().shouldHaveCount(inboxImages.length);
        for (let i = 0; i < inboxImages.length; i++) {
            const image = inboxImages[i];
            const thumbnailHeight = Math.round(400 / image.aspect);
            const path = `/api/images/${collection.name}/${image.id}/thumbnail`;
            await ui.collectionPage.imageGrid.image(image.id).shouldBeDisplayed();
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveAttribute('loading', 'lazy');
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveAttribute('src', path);
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveHeight(thumbnailHeight);
        }
        ;
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views ARCHIVE images on the Collection page', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('view-standard');
        const archiveImages = await collection.getImages({ status: "ARCHIVE" });
        await ui.collectionPage.visit(collection.name, 'ARCHIVE');
        await ui.collectionPage.imageGrid.image().shouldHaveCount(archiveImages.length);
        for (let i = 0; i < archiveImages.length; i++) {
            const image = archiveImages[i];
            const thumbnailHeight = Math.round(400 / image.aspect);
            const path = `/api/images/${collection.name}/${image.id}/thumbnail`;
            await ui.collectionPage.imageGrid.image(image.id).shouldBeDisplayed();
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveAttribute('loading', 'lazy');
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveAttribute('src', path);
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveHeight(thumbnailHeight);
        }
        ;
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views Collection page on desktop', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.setViewportSize({ width: 1200, height: 800 });
        const collection = setupCollectionFixture('view-standard');
        await ui.collectionPage.visit(collection.name, 'COLLECTION');
        await ui.collectionPage.imageGrid.shouldHaveColumnCount(3);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views Collection page on tablet', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.setViewportSize({ width: 768, height: 1024 });
        const collection = setupCollectionFixture('view-standard');
        await ui.collectionPage.visit(collection.name, 'COLLECTION');
        await ui.collectionPage.imageGrid.shouldHaveColumnCount(2);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views Collection page on mobile', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.setViewportSize({ width: 375, height: 667 });
        const collection = setupCollectionFixture('view-standard');
        await ui.collectionPage.visit(collection.name, 'COLLECTION');
        await ui.collectionPage.imageGrid.shouldHaveColumnCount(1);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views Collection with no images for a specific Status', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('view-empty');
        const testStatus = 'COLLECTION';
        await ui.collectionPage.visit(collection.name, testStatus);
        await ui.collectionPage.emptyMessage.shouldHaveText(`This Collection has no images with "${testStatus}" status`);
        await ui.collectionPage.imageGrid.shouldNotBeDisplayed();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('Error occurs when retrieving Collection images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = Collection.create(`error-${Date.now()}`);
        corruptCollectionDB(collection);
        await ui.collectionPage.visit(collection.name, 'COLLECTION');
        await ui.collectionPage.errorMessage.shouldHaveText('Error retrieving images');
        await ui.collectionPage.imageGrid.shouldNotBeDisplayed();
    });
    test('User visits Collection page with non-existent Collection', async ({ page }) => {
        const ui = new ImageVault(page);
        const responsePromise = page.waitForResponse(response => response.url().includes('/collection/NonExistentCollection') &&
            response.status() === 404);
        await ui.collectionPage.visit('NonExistentCollection', 'COLLECTION');
        const response = await responsePromise;
        expect(response.status(), `Collection page returned ${response.status()} status instead of 404 for non-existent collection`).toBe(404);
        await ui.collectionPage.imageGrid.shouldNotBeDisplayed();
        LOGGER.log('✓ Non-existent collection returns 404 status');
    });
});
