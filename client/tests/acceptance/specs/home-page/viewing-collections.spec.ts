import { test } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { Collection } from '@/domain';

const VACATION_COLLECTION = 'vacation-photos';
const FAMILY_COLLECTION = 'family-events';
const WORK_COLLECTION = 'work-projects';

test.describe('Client - Home Page - Viewing Collections', () => {

    test.beforeEach(async () => {
        Collection.clear();
    });

    test('User visits home page and collections exist', async ({ page }) => {
        // Given there are some collections in the system
        Collection.create(VACATION_COLLECTION);
        Collection.create(FAMILY_COLLECTION);
        Collection.create(WORK_COLLECTION);

        const ui = new ImageVault(page);

        // When the user visits the home page
        await ui.homePage.visit();

        // And each collection card shows the collection name
        await ui.homePage.collectionsList.collection().shouldHaveCount(3);
        await ui.homePage.collectionsList.collection(VACATION_COLLECTION).title.shouldHaveText(VACATION_COLLECTION);
        await ui.homePage.collectionsList.collection(FAMILY_COLLECTION).title.shouldHaveText(FAMILY_COLLECTION);
        await ui.homePage.collectionsList.collection(WORK_COLLECTION).title.shouldHaveText(WORK_COLLECTION);

        // And each collection card links to the collection's main page
        await ui.homePage.collectionsList.collection(VACATION_COLLECTION).link.shouldHaveHref(`/collection/${VACATION_COLLECTION}`);
        await ui.homePage.collectionsList.collection(FAMILY_COLLECTION).link.shouldHaveHref(`/collection/${FAMILY_COLLECTION}`);
        await ui.homePage.collectionsList.collection(WORK_COLLECTION).link.shouldHaveHref(`/collection/${WORK_COLLECTION}`);

        // Verify no errors occurred during the interaction
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User navigates to a collection from the home page', async ({ page }) => {
        Collection.create(VACATION_COLLECTION);

        const ui = new ImageVault(page);

        await ui.homePage.visit();

        await ui.homePage.collectionsList.collection(VACATION_COLLECTION).link.click();

        await ui.shouldHaveUrl(`/collection/${VACATION_COLLECTION}`);
    });

    test('User visits home page and no collections exist', async ({ page }) => {
        const ui = new ImageVault(page);

        // When the user visits the home page
        await ui.homePage.visit();

        await ui.homePage.collectionsList.shouldContainText('No Collections found, create one to get started');

        // Verify no errors occurred during the interaction
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('Error occurs when loading collections on home page', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user visits the home page
        // When there is an error retrieving the collections list
        // Simulate filesystem failure by setting a special header
        await page.setExtraHTTPHeaders({
            'x-force-fs-error': 'true'
        });

        await ui.homePage.visit();

        await ui.homePage.userMessage.shouldHaveText("Unable to list Collections");

        await ui.shouldHaveNoConsoleErrors();
    });
});