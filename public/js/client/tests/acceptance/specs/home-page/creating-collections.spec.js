import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { Collection } from '@/domain';
import { createCollectionFixture, setupCollectionFixture } from '@/utils/fixtures/collection-fixtures';
async function pauseRoute(page, urlPattern, method) {
    let resume;
    const ready = new Promise(resolve => { resume = resolve; });
    await page.route(urlPattern, async (route) => {
        if (!method || route.request().method() === method) {
            await ready;
            await route.continue();
        }
        else {
            await route.continue();
        }
    });
    return resume;
}
test.describe('Client - Home Page - Creating Collections', () => {
    test.beforeAll(async () => {
        await createCollectionFixture({ name: 'home-existing-collection', inboxCount: 0, collectionCount: 0, archiveCount: 0 });
    });
    test.beforeEach(async () => {
        Collection.clear();
    });
    test('User views the Collection creation form', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();
        await ui.homePage.collectionsList.creationForm.shouldBeDisplayed();
        await ui.homePage.collectionsList.creationForm.nameInput.shouldHavePlaceholder('Add a new Collection...');
        await ui.homePage.collectionsList.creationForm.nameInput.shouldHaveValue('');
        await ui.homePage.collectionsList.creationForm.submitButton.shouldHaveText('Create');
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User attempts creation with a valid Collection name', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();
        const continueRequest = await pauseRoute(page, '/api/collections', 'POST');
        await ui.homePage.collectionsList.creationForm.nameInput.type('my-new-collection');
        await ui.homePage.collectionsList.creationForm.submitButton.click();
        await ui.homePage.collectionsList.creationForm.loadingSpinner.shouldBeDisplayed();
        await ui.homePage.collectionsList.creationForm.submitButton.shouldHaveText('');
        await ui.homePage.userMessage.shouldHaveText('');
        continueRequest();
        await ui.shouldHaveNoConsoleErrors();
    });
    test('The creation request succeeds', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();
        const responsePromise = page.waitForResponse(response => response.url().includes('/api/collections') &&
            response.request().method() === 'POST' &&
            response.status() === 201);
        await ui.homePage.collectionsList.creationForm.nameInput.type('successful-collection');
        await ui.homePage.collectionsList.creationForm.submitButton.click();
        await responsePromise;
        await ui.homePage.collectionsList.collection('successful-collection').shouldBeDisplayed();
        await ui.homePage.collectionsList.collection('successful-collection').title.shouldHaveText('successful-collection');
        await ui.homePage.collectionsList.creationForm.loadingSpinner.shouldNotBeDisplayed();
        await ui.homePage.collectionsList.creationForm.submitButton.shouldHaveText('Create');
        await ui.homePage.collectionsList.creationForm.nameInput.shouldHavePlaceholder('Add a new Collection...');
        await ui.homePage.collectionsList.creationForm.nameInput.shouldHaveValue('');
        await ui.homePage.userMessage.shouldHaveText('');
        await ui.shouldHaveNoConsoleErrors();
    });
    test('The creation request fails', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();
        await page.setExtraHTTPHeaders({
            'x-force-fs-error': 'true'
        });
        const responsePromise = page.waitForResponse(response => response.url().includes('/api/collections') &&
            response.request().method() === 'POST' &&
            response.status() >= 400);
        await ui.homePage.collectionsList.creationForm.nameInput.type('failed-collection');
        await ui.homePage.collectionsList.creationForm.submitButton.click();
        await responsePromise;
        await ui.homePage.collectionsList.collection().shouldHaveCount(0);
        await ui.homePage.collectionsList.creationForm.loadingSpinner.shouldNotBeDisplayed();
        await ui.homePage.collectionsList.creationForm.submitButton.shouldHaveText('Create');
        await ui.homePage.collectionsList.creationForm.nameInput.shouldHavePlaceholder('Add a new Collection...');
        await ui.homePage.collectionsList.creationForm.nameInput.shouldHaveValue('');
        await ui.homePage.userMessage.shouldHaveText('An error occurred whilst creating the Collection');
    });
    test('User attempts to create a Collection with a duplicate name', async ({ page }) => {
        const collection = setupCollectionFixture('home-existing-collection');
        const ui = new ImageVault(page);
        await ui.homePage.visit();
        await ui.homePage.collectionsList.creationForm.nameInput.type(collection.name);
        await ui.homePage.collectionsList.creationForm.submitButton.click();
        await ui.homePage.userMessage.shouldHaveText('A Collection with that name already exists');
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User attempts creation with an empty Collection name', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();
        const requestCountBefore = (await ui.getRequestsForUrl('/api/collections')).length;
        await ui.homePage.collectionsList.creationForm.submitButton.click();
        const requestCountAfter = (await ui.getRequestsForUrl('/api/collections')).length;
        expect(requestCountAfter, 'Additional requests should not have been made, request count after submission should be the same as before').toEqual(requestCountBefore);
        await ui.homePage.userMessage.shouldHaveText('Collection name is required');
        await ui.shouldHaveNoConsoleErrors();
    });
    test('User attempts creation with an invalid Collection name', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();
        const requestCountBefore = (await ui.getRequestsForUrl('/api/collections')).length;
        await ui.homePage.collectionsList.creationForm.nameInput.type('invalid@collection!name');
        await ui.homePage.collectionsList.creationForm.submitButton.click();
        const requestCountAfter = (await ui.getRequestsForUrl('/api/collections')).length;
        expect(requestCountAfter, 'Additional requests should not have been made, request count after submission should be the same as before').toEqual(requestCountBefore);
        await ui.homePage.userMessage.shouldHaveText('Collection names may only contain letters, numbers, underscores and hyphens');
        await ui.shouldHaveNoConsoleErrors();
    });
    test('User attempts creation with a Collection name that is too long', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();
        const requestCountBefore = (await ui.getRequestsForUrl('/api/collections')).length;
        const longName = 'a'.repeat(257);
        await ui.homePage.collectionsList.creationForm.nameInput.type(longName);
        await ui.homePage.collectionsList.creationForm.submitButton.click();
        const requestCountAfter = (await ui.getRequestsForUrl('/api/collections')).length;
        expect(requestCountAfter, 'Additional requests should not have been made, request count after submission should be the same as before').toEqual(requestCountBefore);
        await ui.homePage.userMessage.shouldHaveText('Collection name must be 256 characters or less');
        await ui.shouldHaveNoConsoleErrors();
    });
    test('User updates an invalid Collection name', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();
        await ui.homePage.collectionsList.creationForm.nameInput.type('invalid@name');
        await ui.homePage.collectionsList.creationForm.submitButton.click();
        await ui.homePage.userMessage.shouldHaveText('Collection names may only contain letters, numbers, underscores and hyphens');
        await ui.homePage.collectionsList.creationForm.nameInput.click();
        await ui.homePage.userMessage.shouldHaveText('');
        await ui.shouldHaveNoConsoleErrors();
    });
});
