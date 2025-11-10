import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { createCollectionFixture, setupCollectionFixture } from '@/utils/fixtures/collection-fixtures';
test.describe('Client - Collection Page - Shuffle Button', () => {
    test.beforeAll(async () => {
        await createCollectionFixture({ name: 'shuffle-standard', inboxCount: 2, collectionCount: 5, archiveCount: 2 });
        await createCollectionFixture({ name: 'shuffle-empty', inboxCount: 0, collectionCount: 0, archiveCount: 0 });
        await createCollectionFixture({ name: 'shuffle-single', inboxCount: 0, collectionCount: 1, archiveCount: 0 });
    });
    test('User views shuffle button on Collection page with images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('shuffle-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.shuffleButton.shouldBeDisplayed();
        await ui.collectionPage.header.shuffleButton.shouldBeEnabled();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views shuffle button on Collection page without images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('shuffle-empty');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.shuffleButton.shouldBeDisplayed();
        await ui.collectionPage.header.shuffleButton.shouldBeDisabled();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User shuffles COLLECTION status images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('shuffle-standard');
        await ui.collectionPage.visit(collection.name, 'COLLECTION');
        const originalImageOrder = await getDisplayedImageIds(page);
        expect(originalImageOrder.length).toBeGreaterThan(1);
        await ui.collectionPage.header.shuffleButton.click();
        const shuffledImageOrder = await getDisplayedImageIds(page);
        expect(shuffledImageOrder.length).toBe(originalImageOrder.length);
        expect(shuffledImageOrder).not.toEqual(originalImageOrder);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User shuffles INBOX status images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('shuffle-standard');
        await ui.collectionPage.visit(collection.name, 'INBOX');
        const originalImageOrder = await getDisplayedImageIds(page);
        expect(originalImageOrder.length).toBeGreaterThan(1);
        await ui.collectionPage.header.shuffleButton.click();
        const shuffledImageOrder = await getDisplayedImageIds(page);
        expect(shuffledImageOrder.length).toBe(originalImageOrder.length);
        expect(shuffledImageOrder).not.toEqual(originalImageOrder);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User shuffles ARCHIVE status images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('shuffle-standard');
        await ui.collectionPage.visit(collection.name, 'ARCHIVE');
        const originalImageOrder = await getDisplayedImageIds(page);
        expect(originalImageOrder.length).toBeGreaterThan(1);
        await ui.collectionPage.header.shuffleButton.click();
        const shuffledImageOrder = await getDisplayedImageIds(page);
        expect(shuffledImageOrder.length).toBe(originalImageOrder.length);
        expect(shuffledImageOrder).not.toEqual(originalImageOrder);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User shuffles images multiple times', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('shuffle-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.shuffleButton.click();
        const firstShuffleOrder = await getDisplayedImageIds(page);
        await ui.collectionPage.header.shuffleButton.click();
        const secondShuffleOrder = await getDisplayedImageIds(page);
        expect(secondShuffleOrder.length).toBe(firstShuffleOrder.length);
        expect(secondShuffleOrder).not.toEqual(firstShuffleOrder);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User opens fullscreen popover after shuffling', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('shuffle-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.shuffleButton.click();
        const shuffledImageOrder = await getDisplayedImageIds(page);
        expect(shuffledImageOrder.length).toBeGreaterThan(2);
        const firstImageSelector = `[data-id="image-card-${shuffledImageOrder[0]}"]`;
        await page.click(firstImageSelector);
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(shuffledImageOrder[0], collection.name);
        await ui.collectionPage.popover.pressTab();
        await ui.collectionPage.popover.shouldShowImage(shuffledImageOrder[1], collection.name);
        await ui.collectionPage.popover.pressTab();
        await ui.collectionPage.popover.shouldShowImage(shuffledImageOrder[2], collection.name);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User opens slideshow after shuffling', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.clock.install();
        const collection = setupCollectionFixture('shuffle-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.shuffleButton.click();
        const shuffledImageOrder = await getDisplayedImageIds(page);
        expect(shuffledImageOrder.length).toBeGreaterThan(2);
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();
        const firstSlideshowImageId = await ui.collectionPage.slideshow.getCurrentImageId();
        expect(firstSlideshowImageId).toBe(shuffledImageOrder[0]);
        await page.clock.fastForward(5000);
        const secondSlideshowImageId = await ui.collectionPage.slideshow.getCurrentImageId();
        expect(secondSlideshowImageId).toBe(shuffledImageOrder[1]);
        await page.clock.fastForward(5000);
        const thirdSlideshowImageId = await ui.collectionPage.slideshow.getCurrentImageId();
        expect(thirdSlideshowImageId).toBe(shuffledImageOrder[2]);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User refreshes page after shuffling', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('shuffle-standard');
        await ui.collectionPage.visit(collection.name);
        const defaultImageOrder = await getDisplayedImageIds(page);
        await ui.collectionPage.header.shuffleButton.click();
        const shuffledImageOrder = await getDisplayedImageIds(page);
        expect(shuffledImageOrder).not.toEqual(defaultImageOrder);
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
        const afterRefreshImageOrder = await getDisplayedImageIds(page);
        expect(afterRefreshImageOrder).toEqual(defaultImageOrder);
        expect(afterRefreshImageOrder).not.toEqual(shuffledImageOrder);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User shuffles collection with single image', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('shuffle-single');
        await ui.collectionPage.visit(collection.name);
        const originalImageOrder = await getDisplayedImageIds(page);
        expect(originalImageOrder.length).toBe(1);
        await ui.collectionPage.header.shuffleButton.click();
        const afterShuffleImageOrder = await getDisplayedImageIds(page);
        expect(afterShuffleImageOrder).toEqual(originalImageOrder);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
});
async function getDisplayedImageIds(page) {
    const imageCards = await page.locator('[data-id^="image-card-"]').all();
    const imageIds = [];
    for (const card of imageCards) {
        const dataId = await card.getAttribute('data-id');
        if (dataId) {
            const imageId = dataId.replace('image-card-', '');
            imageIds.push(imageId);
        }
    }
    return imageIds;
}
