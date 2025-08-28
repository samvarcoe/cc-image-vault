import { test } from '@playwright/test';
import { ImageVaultApp } from '../ui-model/image-vault-app';
import { CollectionFixtures } from '../../utils/fixtures/collection-fixtures';
import { Fixtures } from '../../utils/fixtures/base-fixtures';

test.describe('Collection Page - Displaying Images', () => {
  test.afterAll(async () => {
    await Fixtures.cleanup();
  });

  test('Collection page displays images with default status', async ({ page }) => {
    // Given a collection exists with images in "COLLECTION" status
    const collection = await CollectionFixtures.create({
      collectionId: 'test-collection-default-status',
      imageCounts: { inbox: 0, collection: 9, archive: 0 }
    });
    
    const collectionImages = await collection.getImages({ status: 'COLLECTION' });
    
    const app = new ImageVaultApp(page);
    
    // When the user navigates to "/collection/:id"
    await app.collectionPage.visitCollection(collection.id);
    
    // Then the system displays images with "COLLECTION" status in a 3-column grid
    await app.collectionPage.shouldBeOnCollectionPage(collection.id);
    await app.collectionPage.shouldDisplayImagesInThreeColumnGrid();
    
    // And each image displays its thumbnail with proper dimensions
    for (const image of collectionImages) {
      await app.collectionPage.imageItem(image.id).thumbnail.shouldHaveWidth(480);
      await app.collectionPage.imageItem(image.id).thumbnail.shouldHaveHeight(Math.round(480 / image.aspectRatio));
    }

    await app.collectionPage.imageItem().shouldHaveCount(collectionImages.length);
    
    // And images use native HTML lazy loading
    await app.collectionPage.shouldLoadImagesLazily();
    await app.collectionPage.shouldDefaultToCollectionStatus();
    
    // Verify no console errors or failed requests
    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoApiErrors();
  });

  test('Collection page displays images filtered by status parameter', async ({ page }) => {
    // Given a collection exists with images in multiple statuses
    const collection = await CollectionFixtures.create({
      collectionId: 'test-collection-multiple-statuses',
      imageCounts: { inbox: 2, collection: 2, archive: 2 }
    });
    
    const inboxImages = await collection.getImages({ status: 'INBOX' });
    const imageIds = inboxImages.map(img => img.id);
    
    const app = new ImageVaultApp(page);
    
    // When the user navigates to "/collection/:id?status=INBOX"
    await app.collectionPage.visitCollection(collection.id, 'INBOX');
    
    // Then the system displays only images with "INBOX" status
    await app.collectionPage.shouldBeOnCollectionPage(collection.id, 'INBOX');
    // await app.collectionPage.shouldDisplayOnlyImagesWithStatus('INBOX', imageIds);
    
    // And the system arranges the images in a 3-column grid layout
    await app.collectionPage.shouldDisplayImagesInThreeColumnGrid();
    
    // And thumbnails are displayed for each image
    await app.collectionPage.shouldDisplayImagesWithThumbnails(imageIds);
    
    // Verify no console errors or failed requests
    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoApiErrors();
  });

  test('Collection page displays archived images', async ({ page }) => {
    // Given a collection exists with images in "ARCHIVE" status
    const collection = await CollectionFixtures.create({
      collectionId: 'test-collection-archive-status',
      imageCounts: { inbox: 0, collection: 0, archive: 3 }
    });
    
    const app = new ImageVaultApp(page);
    
    // When the user navigates to "/collection/:id?status=ARCHIVE"
    await app.collectionPage.visitCollection(collection.id, 'ARCHIVE');
    
    // Then the system displays only images with "ARCHIVE" status
    await app.collectionPage.shouldBeOnCollectionPage(collection.id, 'ARCHIVE');
    // await app.collectionPage.shouldDisplayOnlyImagesWithStatus('ARCHIVE', imageIds);
    
    // And the system maintains the 3-column grid structure
    await app.collectionPage.shouldDisplayImagesInThreeColumnGrid();
    
    // Verify no console errors or failed requests
    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoApiErrors();
  });

  test('Empty collection displays status-specific message', async ({ page }) => {
    // Given a collection exists with no images in "INBOX" status
    const collection = await CollectionFixtures.create({
      collectionId: 'test-collection-empty-inbox',
      imageCounts: { inbox: 0, collection: 2, archive: 1 }
    });
    
    const app = new ImageVaultApp(page);
    
    // When the user navigates to "/collection/:id?status=INBOX"
    await app.collectionPage.visitCollection(collection.id, 'INBOX');
    
    // Then the system displays "This collection has no images with status: "INBOX""
    await app.collectionPage.shouldBeOnCollectionPage(collection.id, 'INBOX');
    await app.collectionPage.shouldDisplayEmptyStateMessage('INBOX');
    
    // And the system maintains the page layout
    await app.collectionPage.shouldMaintainPageLayout();
    
    // Verify no console errors or failed requests
    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoApiErrors();
  });

  test('Empty collection displays default status message', async ({ page }) => {
    // Given a collection exists with no images in "COLLECTION" status
    const collection = await CollectionFixtures.create({
      collectionId: 'test-collection-empty-collection',
      imageCounts: { inbox: 2, collection: 0, archive: 1 }
    });
    
    const app = new ImageVaultApp(page);
    
    // When the user navigates to "/collection/:id"
    await app.collectionPage.visitCollection(collection.id);
    
    // Then the system displays "This collection has no images with status: "COLLECTION""
    await app.collectionPage.shouldBeOnCollectionPage(collection.id);
    await app.collectionPage.shouldDisplayEmptyStateMessage('COLLECTION');
    
    // And the system maintains the page layout
    await app.collectionPage.shouldMaintainPageLayout();
    
    // Verify no console errors or failed requests
    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoApiErrors();
  });

  test('Collection page with non-existent collection ID', async ({ page }) => {
    const app = new ImageVaultApp(page);
    
    // Given no collection exists with the specified ID
    const nonExistentCollectionId = 'non-existent-collection-id';
    
    // When the user navigates to "/collection/:id"
    await app.collectionPage.visitCollection(nonExistentCollectionId);
    
    // Then the system displays a 404 error page
    // And the system informs the user that the collection was not found
    await app.collectionPage.shouldShow404Page();
    
    // Verify no console errors (404 is expected, not an error)
    await app.shouldHaveNoConsoleErrors();
  });

  test('Collection page with invalid status parameter', async ({ page }) => {
    // Given a collection exists with images
    const collection = await CollectionFixtures.create({
      collectionId: 'test-collection-invalid-status',
      imageCounts: { inbox: 1, collection: 2, archive: 1 }
    });
    
    const app = new ImageVaultApp(page);
    
    // When the user navigates to "/collection/:id?status=INVALID"
    await app.collectionPage.visitCollection(collection.id, 'INVALID');
    
    // Then the system defaults to "COLLECTION" status filter
    await app.collectionPage.shouldBeOnCollectionPage(collection.id);
    await app.collectionPage.shouldHandleInvalidStatusParameter();
    
    // And the system displays images with "COLLECTION" status
    // await app.collectionPage.shouldDisplayOnlyImagesWithStatus('COLLECTION', imageIds);
    
    // Verify no console errors or failed requests
    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoApiErrors();
  });
});