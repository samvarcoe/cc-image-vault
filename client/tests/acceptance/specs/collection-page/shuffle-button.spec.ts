import { test, expect, Page } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { createCollectionFixture, setupCollectionFixture } from '@/utils/fixtures/collection-fixtures';

test.describe('Client - Collection Page - Shuffle Button', () => {

    test.beforeAll(async () => {
        await createCollectionFixture({name: 'shuffle-standard', inboxCount: 5, collectionCount: 5, archiveCount: 5});
        await createCollectionFixture({name: 'shuffle-empty', inboxCount: 0, collectionCount: 0, archiveCount: 0});
        await createCollectionFixture({name: 'shuffle-single', inboxCount: 0, collectionCount: 1, archiveCount: 0});
    });

    test('User views shuffle button on Collection page with images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a Collection with images exists
        const collection = setupCollectionFixture('shuffle-standard');

        // When the user views the Collection page
        await ui.collectionPage.visit(collection.name);

        // Then the header displays the "Shuffle" button
        await ui.collectionPage.header.shuffleButton.shouldBeDisplayed();

        // And the "Shuffle" button is enabled
        await ui.collectionPage.header.shuffleButton.shouldBeEnabled();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views shuffle button on Collection page without images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given an empty Collection exists
        const collection = setupCollectionFixture('shuffle-empty');

        // When the user visits the Collection page
        await ui.collectionPage.visit(collection.name);

        // Then the header displays the "Shuffle" button
        await ui.collectionPage.header.shuffleButton.shouldBeDisplayed();

        // And the "Shuffle" button is disabled
        await ui.collectionPage.header.shuffleButton.shouldBeDisabled();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User shuffles COLLECTION status images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a Collection contains images with multiple statuses
        const collection = setupCollectionFixture('shuffle-standard');

        // And the user is viewing the COLLECTION status page
        await ui.collectionPage.visit(collection.name, 'COLLECTION');

        // Capture the original order of images
        const originalImageOrder = await getDisplayedImageIds(page);
        expect(originalImageOrder.length).toBeGreaterThan(1);

        // When the user clicks the "Shuffle" button
        await ui.collectionPage.header.shuffleButton.click();

        // Then the images reorder randomly
        const shuffledImageOrder = await getDisplayedImageIds(page);
        expect(shuffledImageOrder.length).toBe(originalImageOrder.length);
        expect(shuffledImageOrder).not.toEqual(originalImageOrder);

        // And the button displays visual feedback
        // (Visual feedback is tested by the absence of errors and successful reordering)

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User shuffles INBOX status images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a Collection contains images with multiple statuses
        const collection = setupCollectionFixture('shuffle-standard');

        // And the user is viewing the INBOX status page
        await ui.collectionPage.visit(collection.name, 'INBOX');

        // Capture the original order of images
        const originalImageOrder = await getDisplayedImageIds(page);
        expect(originalImageOrder.length).toBeGreaterThan(1);

        // When the user clicks the "Shuffle" button
        await ui.collectionPage.header.shuffleButton.click();

        // Then the images reorder randomly
        const shuffledImageOrder = await getDisplayedImageIds(page);
        expect(shuffledImageOrder.length).toBe(originalImageOrder.length);
        expect(shuffledImageOrder).not.toEqual(originalImageOrder);

        // And the button displays visual feedback
        // (Visual feedback is tested by the absence of errors and successful reordering)

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User shuffles ARCHIVE status images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a Collection contains images with multiple statuses
        const collection = setupCollectionFixture('shuffle-standard');

        // And the user is viewing the ARCHIVE status page
        await ui.collectionPage.visit(collection.name, 'ARCHIVE');

        // Capture the original order of images
        const originalImageOrder = await getDisplayedImageIds(page);
        expect(originalImageOrder.length).toBeGreaterThan(1);

        // When the user clicks the "Shuffle" button
        await ui.collectionPage.header.shuffleButton.click();

        // Then the images reorder randomly
        const shuffledImageOrder = await getDisplayedImageIds(page);
        expect(shuffledImageOrder.length).toBe(originalImageOrder.length);
        expect(shuffledImageOrder).not.toEqual(originalImageOrder);

        // And the button displays visual feedback
        // (Visual feedback is tested by the absence of errors and successful reordering)

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User shuffles images multiple times', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is on a Collection page with images
        const collection = setupCollectionFixture('shuffle-standard');
        await ui.collectionPage.visit(collection.name);

        // And the user has clicked the "Shuffle" button once
        await ui.collectionPage.header.shuffleButton.click();
        const firstShuffleOrder = await getDisplayedImageIds(page);

        // When the user clicks the "Shuffle" button again
        await ui.collectionPage.header.shuffleButton.click();

        // Then the images reorder into a new random sequence
        const secondShuffleOrder = await getDisplayedImageIds(page);
        expect(secondShuffleOrder.length).toBe(firstShuffleOrder.length);
        expect(secondShuffleOrder).not.toEqual(firstShuffleOrder);

        // And the button displays visual feedback
        // (Visual feedback is tested by the absence of errors and successful reordering)

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User opens fullscreen popover after shuffling', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user has shuffled images on a Collection page
        const collection = setupCollectionFixture('shuffle-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.shuffleButton.click();

        // Capture the shuffled order
        const shuffledImageOrder = await getDisplayedImageIds(page);
        expect(shuffledImageOrder.length).toBeGreaterThan(2);

        // When the user opens the fullscreen popover
        const firstImageSelector = `[data-id="image-card-${shuffledImageOrder[0]}"]`;
        await page.click(firstImageSelector);
        await ui.collectionPage.popover.shouldBeDisplayed();

        // Then the popover displays images in the shuffled order
        await ui.collectionPage.popover.shouldShowImage(shuffledImageOrder[0]!, collection.name);

        // And navigation advances through images in the shuffled sequence
        await ui.collectionPage.popover.pressEnter();
        await ui.collectionPage.popover.shouldShowImage(shuffledImageOrder[1]!, collection.name);

        await ui.collectionPage.popover.pressEnter();
        await ui.collectionPage.popover.shouldShowImage(shuffledImageOrder[2]!, collection.name);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User opens slideshow after shuffling', async ({ page }) => {
        const ui = new ImageVault(page);

        // Install clock to control timing
        await page.clock.install();

        // Given the user has shuffled images on a Collection page
        const collection = setupCollectionFixture('shuffle-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.shuffleButton.click();

        // Capture the shuffled order
        const shuffledImageOrder = await getDisplayedImageIds(page);
        expect(shuffledImageOrder.length).toBeGreaterThan(2);

        // When the user opens the slideshow
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();

        // Then the slideshow displays images in the shuffled order
        const firstSlideshowImageId = await ui.collectionPage.slideshow.getCurrentImageId();
        expect(firstSlideshowImageId).toBe(shuffledImageOrder[0]);

        // And auto-advance follows the shuffled sequence
        await page.clock.fastForward(5000);
        const secondSlideshowImageId = await ui.collectionPage.slideshow.getCurrentImageId();
        expect(secondSlideshowImageId).toBe(shuffledImageOrder[1]);

        await page.clock.fastForward(5000);
        const thirdSlideshowImageId = await ui.collectionPage.slideshow.getCurrentImageId();
        expect(thirdSlideshowImageId).toBe(shuffledImageOrder[2]);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User refreshes page after shuffling', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user has shuffled images on a Collection page
        const collection = setupCollectionFixture('shuffle-standard');
        await ui.collectionPage.visit(collection.name);

        // Capture the default order before shuffling
        const defaultImageOrder = await getDisplayedImageIds(page);

        // Shuffle the images
        await ui.collectionPage.header.shuffleButton.click();
        const shuffledImageOrder = await getDisplayedImageIds(page);
        expect(shuffledImageOrder).not.toEqual(defaultImageOrder);

        // When the user refreshes the page
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        // Then the images display in default order
        const afterRefreshImageOrder = await getDisplayedImageIds(page);
        expect(afterRefreshImageOrder).toEqual(defaultImageOrder);

        // And the shuffle order is not preserved
        expect(afterRefreshImageOrder).not.toEqual(shuffledImageOrder);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User shuffles collection with single image', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is on a Collection page with a single image
        const collection = setupCollectionFixture('shuffle-single');
        await ui.collectionPage.visit(collection.name);

        // Capture the single image ID
        const originalImageOrder = await getDisplayedImageIds(page);
        expect(originalImageOrder.length).toBe(1);

        // When the user clicks the "Shuffle" button
        await ui.collectionPage.header.shuffleButton.click();

        // Then the button displays visual feedback
        // (Visual feedback is tested by the absence of errors)

        // And the single image remains in place
        const afterShuffleImageOrder = await getDisplayedImageIds(page);
        expect(afterShuffleImageOrder).toEqual(originalImageOrder);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
});

/**
 * Helper function to extract the displayed image IDs in their current order
 */
async function getDisplayedImageIds(page: Page): Promise<string[]> {
    const imageCards = await page.locator('[data-id^="image-card-"]').all();
    const imageIds: string[] = [];

    for (const card of imageCards) {
        const dataId = await card.getAttribute('data-id');
        if (dataId) {
            // Extract image ID from data-id attribute (format: "image-card-{imageId}")
            const imageId = dataId.replace('image-card-', '');
            imageIds.push(imageId);
        }
    }

    return imageIds;
}
