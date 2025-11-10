import { test } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { Collection } from '@/domain';
import { createCollectionFixture, setupCollectionFixture } from '@/utils/fixtures/collection-fixtures';
test.describe('Client - Home Page - Viewing Collections', () => {
    test.beforeAll(async () => {
        await createCollectionFixture({ name: 'home-list-1', inboxCount: 0, collectionCount: 0, archiveCount: 0 });
        await createCollectionFixture({ name: 'home-list-2', inboxCount: 0, collectionCount: 0, archiveCount: 0 });
        await createCollectionFixture({ name: 'home-list-3', inboxCount: 0, collectionCount: 0, archiveCount: 0 });
        await createCollectionFixture({ name: 'home-navigation', inboxCount: 0, collectionCount: 0, archiveCount: 0 });
    });
    test.beforeEach(async () => {
        Collection.clear();
    });
    test('User visits home page and collections exist', async ({ page }) => {
        const collection1 = setupCollectionFixture('home-list-1');
        const collection2 = setupCollectionFixture('home-list-2');
        const collection3 = setupCollectionFixture('home-list-3');
        const ui = new ImageVault(page);
        await ui.homePage.visit();
        await ui.homePage.collectionsList.collection().shouldHaveCount(3);
        await ui.homePage.collectionsList.collection(collection1.name).title.shouldHaveText(collection1.name);
        await ui.homePage.collectionsList.collection(collection2.name).title.shouldHaveText(collection2.name);
        await ui.homePage.collectionsList.collection(collection3.name).title.shouldHaveText(collection3.name);
        await ui.homePage.collectionsList.collection(collection1.name).link.shouldHaveHref(`/collection/${collection1.name}`);
        await ui.homePage.collectionsList.collection(collection2.name).link.shouldHaveHref(`/collection/${collection2.name}`);
        await ui.homePage.collectionsList.collection(collection3.name).link.shouldHaveHref(`/collection/${collection3.name}`);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User navigates to a collection from the home page', async ({ page }) => {
        const collection = setupCollectionFixture('home-navigation');
        const ui = new ImageVault(page);
        await ui.homePage.visit();
        await ui.homePage.collectionsList.collection(collection.name).link.click();
        await ui.shouldHaveUrl(`/collection/${collection.name}`);
    });
    test('User visits home page and no collections exist', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();
        await ui.homePage.collectionsList.shouldContainText('No Collections found, create one to get started');
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('Error occurs when loading collections on home page', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.setExtraHTTPHeaders({
            'x-force-fs-error': 'true'
        });
        await ui.homePage.visit();
        await ui.homePage.userMessage.shouldHaveText("Unable to list Collections");
        await ui.shouldHaveNoConsoleErrors();
    });
});
