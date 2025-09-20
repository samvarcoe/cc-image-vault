import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { Collection } from '@/domain';
import { createCollectionFixture } from '@/utils/fixtures/collection-fixtures';
import { corruptCollectionDB } from '@/utils';

test.describe('Client - Collection Page - Viewing Images', () => {

    test.beforeEach(async () => {
        Collection.clear();
    });

    test('User views the Collection page with no Status set', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a Collection exists with name "TestCollection"
        await createCollectionFixture('TestCollection');

        // When the user visits the Collection page without a Status set in the URL
        await ui.collectionPage.visit('TestCollection');

        // Then the user is redirected to "/collection/TestCollection?status=COLLECTION"
        expect(page.url()).toContain('status=COLLECTION');

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views Collection images on the Collection page', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a Collection exists with name "TestCollection"
        // And the Collection contains images with multiple statuses
        const collection = await createCollectionFixture('TestCollection');
        const collectionImages = await collection.getImages({status: "COLLECTION"});

        // When the user visits the Collection page "/collection/TestCollection?status=COLLECTION"
        await ui.collectionPage.visit('TestCollection', 'COLLECTION');

        // Then all "Collection" images are shown as thumbnails
        // And no other images are displayed
        // And images have the correct aspect ratio
        // And images use native lazy loading
        await ui.collectionPage.imageGrid.image().shouldHaveCount(collectionImages.length);

        for(let i = 0; i < collectionImages.length; i++) {
            const image = collectionImages[i]!
            const thumbnailHeight = Math.round(400 /  image.aspect);
            const path = `/api/images/${collection.name}/${image.id}/thumbnail`;

            await ui.collectionPage.imageGrid.image(image.id).shouldBeDisplayed();
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveAttribute('loading', 'lazy');
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveAttribute('src', path);
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveHeight(thumbnailHeight);
        };

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views INBOX images on the Collection page', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a Collection exists with name "TestCollection"
        // And the Collection contains images with multiple statuses
        const collection = await createCollectionFixture('TestCollection');
        const inboxImages = await collection.getImages({status: "INBOX"});

        // When the user visits the Collection page "/collection/TestCollection?status=INBOX"
        await ui.collectionPage.visit('TestCollection', 'INBOX');

        // Then all "INBOX" images are shown as thumbnails
        // And no other images are displayed
        // And images have the correct aspect ratio
        // And images use native lazy loading
        await ui.collectionPage.imageGrid.image().shouldHaveCount(inboxImages.length);

        for(let i = 0; i < inboxImages.length; i++) {
            const image = inboxImages[i]!
            const thumbnailHeight = Math.round(400 /  image.aspect);
            const path = `/api/images/${collection.name}/${image.id}/thumbnail`;

            await ui.collectionPage.imageGrid.image(image.id).shouldBeDisplayed();
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveAttribute('loading', 'lazy');
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveAttribute('src', path);
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveHeight(thumbnailHeight);
        };

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views ARCHIVE images on the Collection page', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a Collection exists with name "TestCollection"
        // And the Collection contains images with multiple statuses
        const collection = await createCollectionFixture('TestCollection');
        const archiveImages = await collection.getImages({status: "ARCHIVE"});

        // When the user visits the Collection page "/collection/TestCollection?status=ARCHIVE"
        await ui.collectionPage.visit('TestCollection', 'ARCHIVE');

        // Then all "ARCHIVE" images are shown as thumbnails
        // And no other images are displayed
        // And images have the correct aspect ratio
        // And images use native lazy loading

        await ui.collectionPage.imageGrid.image().shouldHaveCount(archiveImages.length);

        for(let i = 0; i < archiveImages.length; i++) {
            const image = archiveImages[i]!
            const thumbnailHeight = Math.round(400 /  image.aspect);
            const path = `/api/images/${collection.name}/${image.id}/thumbnail`;

            await ui.collectionPage.imageGrid.image(image.id).shouldBeDisplayed();
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveAttribute('loading', 'lazy');
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveAttribute('src', path);
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveHeight(thumbnailHeight);
        };

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views Collection page on desktop', async ({ page }) => {
        const ui = new ImageVault(page);

        // Set desktop viewport (> 1024px)
        await page.setViewportSize({ width: 1200, height: 800 });

        // Given a Collection exists with name "TestCollection"
        // And the Collection contains images with "Collection" status
        await createCollectionFixture('TestCollection');

        // When the user visits the Collection page
        await ui.collectionPage.visit('TestCollection', 'COLLECTION');

        // Then the page displays images in a 3-column grid layout
        await ui.collectionPage.imageGrid.shouldHaveColumnCount(3);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views Collection page on tablet', async ({ page }) => {
        const ui = new ImageVault(page);

        // Set tablet viewport (768-1024px)
        await page.setViewportSize({ width: 768, height: 1024 });

        // Given a Collection exists with name "TestCollection"
        // And the Collection contains images
        await createCollectionFixture('TestCollection');

        // When the user visits the Collection page
        await ui.collectionPage.visit('TestCollection', 'COLLECTION');

        // Then the page displays images in a 2-column grid layout
        await ui.collectionPage.imageGrid.shouldHaveColumnCount(2);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views Collection page on mobile', async ({ page }) => {
        const ui = new ImageVault(page);

        // Set mobile viewport (< 768px)
        await page.setViewportSize({ width: 375, height: 667 });

        // Given a Collection exists with name "TestCollection"
        // And the Collection contains images
        await createCollectionFixture('TestCollection');

        // When the user visits the Collection page
        await ui.collectionPage.visit('TestCollection', 'COLLECTION');

        // Then the page displays images in a 1-column grid layout
        await ui.collectionPage.imageGrid.shouldHaveColumnCount(1);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views Collection with no images for a specific Status', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a Collection exists with name "EmptyCollection"
        Collection.create('EmptyCollection');

        // And the Collection contains no images with a specific Status
        const testStatus = 'COLLECTION';

        // When the user visits the Collection page with that Status
        await ui.collectionPage.visit('EmptyCollection', testStatus);

        // Then the page displays the message "This Collection has no images with \"[STATUS]\" status"
        await ui.collectionPage.emptyMessage.shouldHaveText(`This Collection has no images with "${testStatus}" status`);

        // And no image grid is displayed
        await ui.collectionPage.imageGrid.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('Error occurs when retrieving Collection images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a Collection exists with name "TestCollection"
        const collection = Collection.create('ErrorCollection');
        corruptCollectionDB(collection);

        // When the user visits the Collection page
        // And there is an error retrieving the images
        await ui.collectionPage.visit(collection.name, 'COLLECTION');

        // Then the page displays the message "Error retrieving images"
        await ui.collectionPage.errorMessage.shouldHaveText('Error retrieving images');

        // And no image grid is displayed
        await ui.collectionPage.imageGrid.shouldNotBeDisplayed();

        // Note: Server errors will show in console as expected for failed network requests
    });

    test('User visits Collection page with non-existent Collection', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given no Collection exists with name "NonExistentCollection"

        // When the user visits the Collection page
        // Wait for 404 response during navigation
        const responsePromise = page.waitForResponse(response =>
            response.url().includes('/collection/NonExistentCollection') &&
            response.status() === 404
        );

        await ui.collectionPage.visit('NonExistentCollection', 'COLLECTION');
        const response = await responsePromise;

        // Then the page returns a 404 status
        expect(response.status(), `Collection page returned ${response.status()} status instead of 404 for non-existent collection`).toBe(404);

        // And no images are displayed
        await ui.collectionPage.imageGrid.shouldNotBeDisplayed();

        LOGGER.log('✓ Non-existent collection returns 404 status');
    });
});