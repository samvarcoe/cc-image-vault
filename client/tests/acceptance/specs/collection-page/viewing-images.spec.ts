import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { Collection } from '@/domain';
import { createCollectionFixture } from '@/utils/fixtures/collection-fixtures';

test.describe('Client - Collection Page - Viewing Images', () => {

    test.beforeEach(async () => {
        Collection.clear();
    });

    test('User views collection page', async ({ page }) => {
        const ui = new ImageVault(page);

        const collection = await createCollectionFixture('TestCollection');
        const collectionImages = await collection.getImages({status: "COLLECTION"});

        // When the user visits the collection page "/collection/TestCollection"
        await ui.collectionPage.visitCollection('TestCollection');

        // Then all "Collection" images are shown as thumbnails
        await ui.collectionPage.imageGrid.image().shouldHaveCount(collectionImages.length);

        for(let i = 0; i < collectionImages.length; i++) {
            const image = collectionImages[i]!
            const thumbnailHeight = Math.round(400 * image.aspect);
            const path = `/private/${collection.name}/images/thumbnails/${image.id}.${image.extension}`

            await ui.collectionPage.imageGrid.image(image.id).shouldBeDisplayed();
            await ui.collectionPage.imageGrid.image(image.id).shouldHaveAttribute('loading', 'lazy');
            await ui.collectionPage.imageGrid.image(image.id).shouldHaveAttribute('src', path);
            await ui.collectionPage.imageGrid.image(image.id).image.shouldHaveHeight(thumbnailHeight);
        }

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views collection page on desktop', async ({ page }) => {
        const ui = new ImageVault(page);

        // Set desktop viewport (> 1024px)
        await page.setViewportSize({ width: 1200, height: 800 });

        await createCollectionFixture('TestCollection');

        // When the user visits the collection page "/collection/TestCollection"
        await ui.collectionPage.visitCollection('TestCollection');

        await ui.collectionPage.imageGrid.shouldHaveColumnCount(3);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views collection page on tablet', async ({ page }) => {
        const ui = new ImageVault(page);

        // Set desktop viewport (> 1024px)
        await page.setViewportSize({ width: 1200, height: 800 });

        await createCollectionFixture('TestCollection');

        // When the user visits the collection page "/collection/TestCollection"
        await ui.collectionPage.visitCollection('TestCollection');

        await ui.collectionPage.imageGrid.shouldHaveColumnCount(2);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views collection page on mobile', async ({ page }) => {
        const ui = new ImageVault(page);

        // Set desktop viewport (> 1024px)
        await page.setViewportSize({ width: 1200, height: 800 });

        await createCollectionFixture('TestCollection');

        // When the user visits the collection page "/collection/TestCollection"
        await ui.collectionPage.visitCollection('TestCollection');

        await ui.collectionPage.imageGrid.shouldHaveColumnCount(1);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views collection with no "COLLECTION" status images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a collection exists with name "EmptyCollection"
        Collection.create('EmptyCollection');

        // And the collection contains no images with "COLLECTION" status

        // When the user visits the collection page "/collection/EmptyCollection"
        await ui.collectionPage.visitCollection('EmptyCollection');

        // Then the page displays the message "This collection has no images with \"COLLECTION\" status"
        await ui.collectionPage.emptyMessage.shouldHaveText('This collection has no images with "COLLECTION" status');

        // And no image grid is displayed
        await ui.collectionPage.imageGrid.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('Error occurs when retrieving collection images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a collection exists with name "TestCollection"
        Collection.create('TestCollection');

        // Simulate a server error for image retrieval
        await page.setExtraHTTPHeaders({
            'x-force-fs-error': 'true'
        });

        // When the user visits the collection page "/collection/TestCollection"
        // And there is an error retrieving the images
        await ui.collectionPage.visitCollection('TestCollection');

        // Wait for the error response
        await page.waitForResponse(response =>
            response.url().includes('/api/images/TestCollection') &&
            response.status() >= 400
        );

        // Then the page displays the message "Error retrieving images"
        await ui.collectionPage.errorMessage.shouldHaveText('Error retrieving images');

        // And no image grid is displayed
        await ui.collectionPage.imageGrid.shouldNotBeDisplayed();

        // Note: Server errors will show in console as expected for failed network requests
    });

    test('User visits collection page with non-existent collection', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given no collection exists with name "NonExistentCollection"

        // When the user visits the collection page "/collection/NonExistentCollection"
        await ui.collectionPage.visitCollection('NonExistentCollection');

        // Wait for 404 response
        const response = await page.waitForResponse(response =>
            response.url().includes('/collection/NonExistentCollection') &&
            response.status() === 404
        );

        // Then the page returns a 404 status
        expect(response.status(), {
            message: `Collection page returned ${response.status()} status instead of 404 for non-existent collection`
        }).toBe(404);

        // And no images are displayed
        await ui.collectionPage.imageGrid.shouldNotBeDisplayed();

        console.log('✓ Non-existent collection returns 404 status');
    });
});