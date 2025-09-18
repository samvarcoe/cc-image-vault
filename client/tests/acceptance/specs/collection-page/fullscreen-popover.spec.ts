import { test } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { Collection } from '@/domain';
import { createCollectionFixture } from '@/utils/fixtures/collection-fixtures';

test.describe('Client - Collection Page - Fullscreen Popover', () => {

    test.beforeEach(async () => {
        Collection.clear();
    });

    test('User clicks thumbnail to open popover', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a collection exists with name "TestCollection"
        const collection = await createCollectionFixture('TestCollection');
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;

        // And the collection contains images with "COLLECTION" status
        // When the user visits the collection page "/collection/TestCollection"
        await ui.collectionPage.visitCollection('TestCollection');

        // And the user clicks on a thumbnail image
        await ui.collectionPage.imageGrid.image(firstImage.id).click();

        // Then the popover displays the original image
        await ui.collectionPage.popover.image.shouldBeFullyVisible();
        await ui.collectionPage.popover.image.shouldHaveAttribute('src', `/api/images/${collection.name}/${firstImage.id}`);
        await ui.collectionPage.popover.image.shouldHaveAttribute('width', firstImage.width.toString());
        await ui.collectionPage.popover.image.shouldHaveAttribute('height', firstImage.height.toString());

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User closes popover by clicking background', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a collection page is open with an image popover displayed
        const collection = await createCollectionFixture('TestCollection');
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;

        await ui.collectionPage.visitCollection('TestCollection');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();

        // When the user clicks on the background overlay
        await ui.collectionPage.popover.click();

        // Then the popover closes
        await ui.collectionPage.popover.shouldNotBeDisplayed();

        // And the user returns to the collection page view
        await ui.collectionPage.imageGrid.shouldBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User closes popover with Esc key', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a collection page is open with an image popover displayed
        const collection = await createCollectionFixture('TestCollection');
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;

        await ui.collectionPage.visitCollection('TestCollection');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();

        // When the user presses the Esc key
        await page.keyboard.press('Escape');

        // Then the popover closes
        await ui.collectionPage.popover.shouldNotBeDisplayed();

        // And the user returns to the collection page view
        await ui.collectionPage.imageGrid.shouldBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('Popover displays on desktop viewport', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a collection page is open on desktop
        await page.setViewportSize({ width: 1200, height: 800 });

        const collection = await createCollectionFixture('TestCollection');
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;

        await ui.collectionPage.visitCollection('TestCollection');

        // When the user clicks on a thumbnail image
        await ui.collectionPage.imageGrid.image(firstImage.id).click();

        // Then the popover displays the image at maximum size 
        await ui.collectionPage.popover.image.shouldBeFullyVisible();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('Popover displays on tablet viewport', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a collection page is open on tablet
        await page.setViewportSize({ width: 768, height: 1024 });

        const collection = await createCollectionFixture('TestCollection');
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;

        await ui.collectionPage.visitCollection('TestCollection');

        // When the user clicks on a thumbnail image
        await ui.collectionPage.imageGrid.image(firstImage.id).click();

        // Then the popover displays the image at maximum size 
        await ui.collectionPage.popover.image.shouldBeFullyVisible();


        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('Popover displays on mobile viewport', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a collection page is open on mobile
        await page.setViewportSize({ width: 375, height: 667 });

        const collection = await createCollectionFixture('TestCollection');
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;

        await ui.collectionPage.visitCollection('TestCollection');

        // When the user clicks on a thumbnail image
        await ui.collectionPage.imageGrid.image(firstImage.id).click();

        // Then the popover displays the image at maximum size 
        await ui.collectionPage.popover.image.shouldBeFullyVisible();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('Original image fails to load in popover', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a collection page is open
        const collection = await createCollectionFixture('TestCollection');
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;

        await ui.collectionPage.visitCollection('TestCollection');

        // Mock the original image request to fail
        const originalImageUrl = `/api/images/${collection.name}/${firstImage.id}`;
        await page.route(originalImageUrl, route => route.abort());

        // When the user clicks on a thumbnail image
        await ui.collectionPage.imageGrid.image(firstImage.id).click();

        // And the original image fails to load
        // Then the popover displays the message "Unable to load full image"
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.errorMessage.shouldHaveText('Unable to load full image');

        // And the user can still close the popover normally
        await page.keyboard.press('Escape');
        await ui.collectionPage.popover.shouldNotBeDisplayed();

        console.log('✓ Popover handles image load failure gracefully');
    });
});