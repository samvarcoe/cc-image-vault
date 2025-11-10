import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { createCollectionFixture, setupCollectionFixture } from '@/utils/fixtures/collection-fixtures';
async function waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    while (true) {
        if (await condition())
            return;
        if (Date.now() - startTime >= timeout) {
            throw new Error('Timeout waiting for condition');
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
}
test.describe('Client - Collection Page - Slideshow', () => {
    test.beforeAll(async () => {
        await createCollectionFixture({ name: 'slideshow-standard', inboxCount: 2, collectionCount: 5, archiveCount: 2 });
        await createCollectionFixture({ name: 'slideshow-empty', inboxCount: 0, collectionCount: 0, archiveCount: 0 });
        await createCollectionFixture({ name: 'slideshow-small', inboxCount: 0, collectionCount: 3, archiveCount: 0 });
    });
    test('User views slideshow button on a collection page with images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('slideshow-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.slideshowButton.shouldBeDisplayed();
        await ui.collectionPage.header.slideshowButton.shouldBeEnabled();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User views slideshow button on a collection page without images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('slideshow-empty');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.slideshowButton.shouldBeDisplayed();
        await ui.collectionPage.header.slideshowButton.shouldBeDisabled();
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User starts slideshow from collection page', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.clock.install();
        const collection = setupCollectionFixture('slideshow-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();
        await ui.collectionPage.slideshow.image.shouldBeDisplayed();
        await ui.collectionPage.slideshow.shouldShowImageFromCollection(collection.name);
        const firstImageId = await ui.collectionPage.slideshow.getCurrentImageId();
        await page.clock.fastForward(5000);
        await ui.collectionPage.slideshow.shouldShowDifferentImage(firstImageId);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User pauses slideshow with spacebar', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.clock.install();
        const collection = setupCollectionFixture('slideshow-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();
        const initialImageId = await ui.collectionPage.slideshow.getCurrentImageId();
        await page.keyboard.press('Space');
        await page.clock.fastForward(5000);
        await ui.collectionPage.slideshow.shouldShowSameImage(initialImageId);
        await ui.collectionPage.slideshow.shouldShowPauseSymbol();
        await page.clock.fastForward(5000);
        await ui.collectionPage.slideshow.shouldShowSameImage(initialImageId);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User resumes slideshow with spacebar', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.clock.install();
        const collection = setupCollectionFixture('slideshow-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();
        await page.keyboard.press('Space');
        await ui.collectionPage.slideshow.shouldShowPauseSymbol();
        const pausedImageId = await ui.collectionPage.slideshow.getCurrentImageId();
        await page.keyboard.press('Space');
        await ui.collectionPage.slideshow.shouldHidePauseSymbol();
        await page.clock.fastForward(5000);
        await ui.collectionPage.slideshow.shouldShowDifferentImage(pausedImageId);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User manually advances with enter key', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.clock.install();
        const collection = setupCollectionFixture('slideshow-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();
        const initialImageId = await ui.collectionPage.slideshow.getCurrentImageId();
        await page.keyboard.press('Enter');
        await ui.collectionPage.slideshow.shouldShowDifferentImage(initialImageId);
        const manuallyAdvancedImageId = await ui.collectionPage.slideshow.getCurrentImageId();
        await page.clock.fastForward(5000);
        await ui.collectionPage.slideshow.shouldShowDifferentImage(manuallyAdvancedImageId);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User closes the slideshow', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('slideshow-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();
        await page.keyboard.press('Escape');
        await ui.collectionPage.slideshow.shouldNotBeDisplayed();
        await ui.collectionPage.header.shouldBeDisplayed();
        await ui.collectionPage.imageGrid.shouldBeDisplayed();
    });
    test('User watches a slideshow whilst curate mode is active', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('slideshow-standard');
        const collectionImages = await collection.getImages({ status: "COLLECTION" });
        const firstImage = collectionImages[0];
        const secondImage = collectionImages[1];
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.curateButton.click();
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldHaveAttribute('data-selected', 'true');
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldHaveAttribute('data-selected', 'true');
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();
        await page.keyboard.press('Escape');
        await ui.collectionPage.slideshow.shouldNotBeDisplayed();
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldHaveAttribute('data-selected', 'true');
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldHaveAttribute('data-selected', 'true');
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
    test('An image fails to load during a slideshow', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.clock.install();
        const collection = setupCollectionFixture('slideshow-standard');
        await ui.collectionPage.visit(collection.name);
        let requestCount = 0;
        let failedImageId;
        await page.route(`/api/images/${collection.name}/*`, route => {
            requestCount++;
            if (requestCount == 2) {
                failedImageId = route.request().url().split('/').pop();
                LOGGER.log(`Aborting image request #${requestCount} to ${route.request().url()} for image: ${failedImageId}`);
                route.abort('failed');
            }
            else {
                route.continue();
            }
        });
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();
        const initialImageId = await ui.collectionPage.slideshow.getCurrentImageId();
        await page.clock.fastForward(5000);
        await waitFor(() => requestCount == 3);
        expect(failedImageId, 'Failed image ID should have been captured in failed request').toBeDefined();
        await ui.collectionPage.slideshow.shouldShowDifferentImage(initialImageId);
        await ui.collectionPage.slideshow.shouldShowDifferentImage(failedImageId);
        expect(requestCount, 'The expected number of requests were not made').toBe(3);
    });
    test('User watches the whole slideshow', async ({ page }) => {
        const ui = new ImageVault(page);
        await page.clock.install();
        const collection = setupCollectionFixture('slideshow-small');
        const collectionImages = await collection.getImages({ status: "COLLECTION" });
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();
        const imageSequence = [];
        for (let i = 0; i < collectionImages.length; i++) {
            const currentImageId = await ui.collectionPage.slideshow.getCurrentImageId();
            imageSequence.push(currentImageId);
            if (i < collectionImages.length - 1) {
                await page.clock.fastForward(5000);
            }
        }
        expect(imageSequence.length).toBe(collectionImages.length);
        expect(new Set(imageSequence).size).toBe(collectionImages.length);
        await page.clock.fastForward(5000);
        await ui.collectionPage.slideshow.shouldShowImageFromCollection(collection.name);
        const firstImageOfSecondCycle = await ui.collectionPage.slideshow.getCurrentImageId();
        await page.clock.fastForward(5000);
        await ui.collectionPage.slideshow.shouldShowDifferentImage(firstImageOfSecondCycle);
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
});
