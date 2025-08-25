import { test } from '@playwright/test';
import { ImageVaultApp } from '../ui-model/image-vault-app';
import { HomePageFixtures } from '../utils/home-page-fixtures';
import { Fixtures } from '../../utils/fixtures/base-fixtures';

test.describe('Home Page', () => {
  test.afterEach(async () => {
    await Fixtures.cleanup();
  });

  test('Collections exist in the system', async ({ page }) => {

    // Given multiple collections exist in the system
    const collections = await HomePageFixtures.createMultipleCollections({
      collectionIds: ['zebra-photos', 'alpha-collection', 'mid-range-pics', 'beta-images']
    });
    const collectionIds = collections.map(c => c.id);

    const app = new ImageVaultApp(page);

    // When the user views the collections list
    await app.homePage.visit();
    console.log('Visited home page');

    // Then all of the collections are displayed in alphabetical order
    await app.homePage.shouldShowCollectionsInAlphabeticalOrder(collectionIds);

    // And the collections link to their respective collection pages
    for (const id of collectionIds) {
      await app.homePage.shouldShowCollection(id);
    }

    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoApiErrors();
  });

  test('No collections exist in the system', async ({ page }) => {
    // Given no collections exist in the system
    await HomePageFixtures.createEmptyCollectionsState();

    const app = new ImageVaultApp(page);

    // When the user views the collections list
    await app.homePage.visit();

    // Then the empty state message is displayed
    // And the system provides the option to create first collection
    await app.homePage.shouldShowEmptyState();

    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoApiErrors();
  });

  test('User creates their first collection', async ({ page }) => {
    // Given no collections exist in the system
    const { newCollectionId } = await HomePageFixtures.createFirstCollectionScenario();

    const app = new ImageVaultApp(page);
    await app.homePage.visit();
    await app.homePage.shouldShowEmptyState();

    // When the user attempts to create a new collection with a valid collection ID
    await app.homePage.createCollection(newCollectionId);

    // Then the system creates a new collection
    // And collection list on the homepage is updated
    await app.homePage.shouldShowCollection(newCollectionId);

    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoApiErrors();
  });

  test('User creates an additional collection', async ({ page }) => {
    // Given multiple collections exist in the system
    const { existingCollections, newCollectionId } = await HomePageFixtures.createAdditionalCollectionScenario({
      existingCollectionIds: ['existing-alpha', 'existing-beta'],
      newCollectionId: 'new-gamma-collection'
    });

    const app = new ImageVaultApp(page);
    await app.homePage.visit();

    // Verify existing collections are displayed
    for (const collection of existingCollections) {
      await app.homePage.shouldShowCollection(collection.id);
    }

    // When the user attempts to create a new collection with a valid collection ID
    await app.homePage.createCollection(newCollectionId);

    // Then the system creates a new collection
    // And collection list on the homepage is updated
    await app.homePage.shouldShowCollection(newCollectionId);

    // Verify all collections are now displayed in alphabetical order
    const allCollectionIds = [...existingCollections.map(c => c.id), newCollectionId];
    await app.homePage.shouldShowCollectionsInAlphabeticalOrder(allCollectionIds);

    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoApiErrors();
  });

  test('User attempts to create a collection with an invalid ID', async ({ page }) => {
    // Given the user is attempting to create a new collection
    await HomePageFixtures.createEmptyCollectionsState();

    const app = new ImageVaultApp(page);
    await app.homePage.visit();

    // When the user enters a collection ID with invalid characters
    const invalidId = 'invalid@collection!';
    await app.homePage.collectionIdInput.type(invalidId);

    // Then the system immediately displays a validation error message
    await app.homePage.shouldShowValidationError('Collection ID can only contain letters, numbers, and hyphens');

    // And the user is prevented from submitting the request
    await app.homePage.shouldHaveCreateButtonDisabled();

    await app.shouldHaveNoConsoleErrors();
  });

  test('Collection creation with duplicate ID', async ({ page }) => {
    // Given the user is on the home page
    // And a collection already exists with the target ID
    const { existingCollection, duplicateId } = await HomePageFixtures.createCollectionForDuplicateTest({
      existingId: 'existing-collection'
    });

    const app = new ImageVaultApp(page);
    await app.homePage.visit();
    await app.homePage.shouldShowCollection(existingCollection.id);

    // When the user attempts to create collection with duplicate ID
    await app.homePage.createCollection(duplicateId);

    // Then the system displays duplicate ID error message
    // And the system prevents collection creation
    await app.homePage.shouldShowDuplicateIdError();

    // Verify the original collection still exists and no duplicate was created
    await app.homePage.shouldShowCollection(existingCollection.id);

    // Note: We don't check for console/API errors here because we expect a 409 response for duplicate ID validation
  });

  test('User attempts to delete a collection', async ({ page }) => {
    // Given a collection exists in the system
    const collection = await HomePageFixtures.createCollectionForDeletion({
      collectionId: 'test-collection-for-deletion'
    });

    const app = new ImageVaultApp(page);
    await app.homePage.visit();
    await app.homePage.shouldShowCollection(collection.id);

    // When the user attempts to delete it
    await app.homePage.deleteCollection(collection.id);

    // Then a dialog is shown with the collection ID and a warning message
    await app.homePage.shouldShowDeletionConfirmation(collection.id);

    await app.shouldHaveNoConsoleErrors();
  });

  test('User confirms deletion of a collection', async ({ page }) => {
    // Given the deletion warning is displayed
    const collection = await HomePageFixtures.createCollectionForDeletion({
      collectionId: 'collection-to-be-deleted'
    });

    const app = new ImageVaultApp(page);
    await app.homePage.visit();
    await app.homePage.deleteCollection(collection.id);
    await app.homePage.shouldShowDeletionConfirmation(collection.id);

    // When the user confirms the deletion
    await app.homePage.confirmDeletion();

    // Then the collection is deleted
    // And the collection is removed from the collections list
    await app.homePage.shouldNotShowCollection(collection.id);

    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoApiErrors();
  });

  test('User cancels deletion of a collection', async ({ page }) => {
    // Given the deletion warning is displayed
    const collection = await HomePageFixtures.createCollectionForDeletion({
      collectionId: 'collection-to-keep'
    });

    const app = new ImageVaultApp(page);
    await app.homePage.visit();
    await app.homePage.deleteCollection(collection.id);
    await app.homePage.shouldShowDeletionConfirmation(collection.id);

    // When the user cancels the deletion
    await app.homePage.cancelDeletion();

    // Then the collection is not deleted
    // And the collection remains in the collections list
    await app.homePage.shouldShowCollection(collection.id);

    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoApiErrors();
  });
});