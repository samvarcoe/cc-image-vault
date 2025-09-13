import { test } from '@playwright/test';
import { ImageVault } from '../../ui-model/image-vault';
import { Collection } from '@/domain';

test.describe('Client - Home Page - Viewing Collections', () => {

  test.beforeEach(async () => {
    Collection.clear();
  });

  test('User visits home page and collections exist', async ({ page }) => {
    // Given there are some collections in the system
    Collection.create('vacation-photos');
    Collection.create('family-events');
    Collection.create('work-projects');

    const ui = new ImageVault(page);

    // When the user visits the home page
    await ui.homePage.visit();

    // And each collection card shows the collection name
    await ui.homePage.collectionCard().shouldHaveCount(3);
    await ui.homePage.collectionCard('vacation-photos').title.shouldHaveText('vacation-photos');
    await ui.homePage.collectionCard('family-events').title.shouldHaveText('family-events');
    await ui.homePage.collectionCard('work-projects').title.shouldHaveText('work-projects');

    // And each collection card links to the collection's main page
    await ui.homePage.collectionCard('vacation-photos').link.shouldHaveHref('/collection/vacation-photos');
    await ui.homePage.collectionCard('family-events').link.shouldHaveHref('/collection/family-events');
    await ui.homePage.collectionCard('work-projects').link.shouldHaveHref('/collection/work-projects');

    // Verify no errors occurred during the interaction
    await ui.shouldHaveNoConsoleErrors();
    await ui.shouldHaveNoFailedRequests();
  });

  test('User visits home page and no collections exist', async ({ page }) => {
    const ui = new ImageVault(page);

    // When the user visits the home page
    await ui.homePage.visit();

    await ui.homePage.userMessage.shouldHaveText("No Collections found, create one to get started")

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
      'X-Test-Force-FS-Error': 'true'
    });

    await ui.homePage.visit();

    await ui.homePage.userMessage.shouldHaveText("Unable to load collections");

    await ui.shouldHaveNoConsoleErrors();
  });
});