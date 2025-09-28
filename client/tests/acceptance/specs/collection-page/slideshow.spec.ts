import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { Collection } from '@/domain';
import { createCollectionFixture } from '@/utils/fixtures/collection-fixtures';

const COLLECTION_NAME = 'SlideshowCollection';
const EMPTY_COLLECTION_NAME = 'SlideshowEmptyCollection';
const SMALL_COLLECTION_NAME = 'SlideshowSmallCollection';

test.describe('Client - Collection Page - Slideshow', () => {

    test.beforeEach(async () => {
        Collection.clear();
    });

    test('User views slideshow button on a collection page with images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a collection with images exists
        await createCollectionFixture(COLLECTION_NAME);

        // When the user views the images on the collection page
        await ui.collectionPage.visit(COLLECTION_NAME);

        // Then the header displays the "Slideshow" button
        await ui.collectionPage.header.slideshowButton.shouldBeDisplayed();

        // And the "Slideshow" button is enabled
        await ui.collectionPage.header.slideshowButton.shouldBeEnabled();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views slideshow button on a collection page without images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given an empty collection exists
        await createCollectionFixture(EMPTY_COLLECTION_NAME, 0);

        // When the user visits the collection page
        await ui.collectionPage.visit(EMPTY_COLLECTION_NAME);

        // Then the header displays the "Slideshow" button
        await ui.collectionPage.header.slideshowButton.shouldBeDisplayed();

        // And the "Slideshow" button is disabled
        await ui.collectionPage.header.slideshowButton.shouldBeDisabled();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User starts slideshow from collection page', async ({ page }) => {
        const ui = new ImageVault(page);
        // Install clock to control timing
        await page.clock.install();

        // Given the user is on a collection page with images
        await createCollectionFixture(COLLECTION_NAME);

        await ui.collectionPage.visit(COLLECTION_NAME);

        // When the user clicks the "Slideshow" button
        await ui.collectionPage.header.slideshowButton.click();

        // Then the slideshow opens in fullscreen view
        await ui.collectionPage.slideshow.shouldBeDisplayed();

        // And the first random image is displayed
        await ui.collectionPage.slideshow.image.shouldBeDisplayed();
        await ui.collectionPage.slideshow.shouldShowImageFromCollection(COLLECTION_NAME);

        // Store the current image ID for comparison
        const firstImageId = await ui.collectionPage.slideshow.getCurrentImageId();

        // And the image advances every 5 seconds
        await page.clock.fastForward(5000);

        // Verify the image has changed
        await ui.collectionPage.slideshow.shouldShowDifferentImage(firstImageId);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User pauses slideshow with spacebar', async ({ page }) => {
        const ui = new ImageVault(page);

        // Install clock to control timing
        await page.clock.install();

        // Given a slideshow is running
        await createCollectionFixture(COLLECTION_NAME);
        await ui.collectionPage.visit(COLLECTION_NAME);
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();

        // Store the current image for comparison
        const initialImageId = await ui.collectionPage.slideshow.getCurrentImageId();

        // When the user presses the SPACE key
        await page.keyboard.press('Space');

        // Then the auto-advance pauses
        await page.clock.fastForward(5000);
        await ui.collectionPage.slideshow.shouldShowSameImage(initialImageId);

        // And the pause symbol (⏸) appears in the bottom right corner
        await ui.collectionPage.slideshow.shouldShowPauseSymbol();

        // And the current image remains displayed
        await page.clock.fastForward(5000);
        await ui.collectionPage.slideshow.shouldShowSameImage(initialImageId);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User resumes slideshow with spacebar', async ({ page }) => {
        const ui = new ImageVault(page);

        // Install clock to control timing
        await page.clock.install();

        // Given a slideshow is paused
        await createCollectionFixture(COLLECTION_NAME);
        await ui.collectionPage.visit(COLLECTION_NAME);
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();

        // Pause the slideshow
        await page.keyboard.press('Space');
        await ui.collectionPage.slideshow.shouldShowPauseSymbol();

        // Store the current image for comparison
        const pausedImageId = await ui.collectionPage.slideshow.getCurrentImageId();

        // When the user presses the SPACE key
        await page.keyboard.press('Space');

        // Then the auto-advance resumes
        // And the pause symbol disappears
        await ui.collectionPage.slideshow.shouldHidePauseSymbol();

        // And the image advances every 5 seconds
        await page.clock.fastForward(5000);
        await ui.collectionPage.slideshow.shouldShowDifferentImage(pausedImageId);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User manually advances with enter key', async ({ page }) => {
        const ui = new ImageVault(page);

        // Install clock to control timing
        await page.clock.install();

        // Given a slideshow is running
        await createCollectionFixture(COLLECTION_NAME);
        await ui.collectionPage.visit(COLLECTION_NAME);
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();

        // Store the current image for comparison
        const initialImageId = await ui.collectionPage.slideshow.getCurrentImageId();

        // When the user presses the ENTER key
        await page.keyboard.press('Enter');

        // Then the slideshow immediately advances to the next random image
        await ui.collectionPage.slideshow.shouldShowDifferentImage(initialImageId);

        // Store the manually advanced image
        const manuallyAdvancedImageId = await ui.collectionPage.slideshow.getCurrentImageId();

        // And the image advances every 5 seconds
        await page.clock.fastForward(5000);
        await ui.collectionPage.slideshow.shouldShowDifferentImage(manuallyAdvancedImageId);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User closes the slideshow', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a slideshow is running
        await createCollectionFixture(COLLECTION_NAME);
        await ui.collectionPage.visit(COLLECTION_NAME);
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();

        // When the user presses the ESC key
        await page.keyboard.press('Escape');

        // Then the slideshow is closed
        await ui.collectionPage.slideshow.shouldNotBeDisplayed();

        // And the collection page is displayed
        await ui.collectionPage.header.shouldBeDisplayed();
        await ui.collectionPage.imageGrid.shouldBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User watches a slideshow whilst curate mode is active', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is on a collection page with curate mode active
        const collection = await createCollectionFixture(COLLECTION_NAME);
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;
        const secondImage = collectionImages[1]!;

        await ui.collectionPage.visit(COLLECTION_NAME);

        // Activate curate mode
        await ui.collectionPage.header.curateButton.click();
        await ui.collectionPage.curationMenu.shouldBeDisplayed();

        // And multiple images are selected
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();

        // Verify images are selected
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldHaveAttribute('data-selected', 'true');
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldHaveAttribute('data-selected', 'true');

        // When the user opens and closes the slideshow
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();

        await page.keyboard.press('Escape');
        await ui.collectionPage.slideshow.shouldNotBeDisplayed();

        // Then curate mode remains active
        await ui.collectionPage.curationMenu.shouldBeDisplayed();

        // And the images are still selected
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldHaveAttribute('data-selected', 'true');
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldHaveAttribute('data-selected', 'true');

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('An image fails to load during a slideshow', async ({ page }) => {
        const ui = new ImageVault(page);

        // Install clock to control timing
        await page.clock.install();

        // Given a slideshow is running
        const collection = await createCollectionFixture(COLLECTION_NAME);

        await ui.collectionPage.visit(COLLECTION_NAME);

        let requestCount = 0;
        let failedImageId: string;

        // Force the second image to fail
         await page.route(`/api/images/${collection.name}/*`, route => {
            requestCount++;

            if (requestCount == 2) {
                LOGGER.log(`Aborting image request #${requestCount} to ${route.request().url()}`);
                route.abort('failed');
                failedImageId = route.request().url().split('/').pop()!;

            } else {
                route.continue();
            }
        });

        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();

        // Store the initially displayed image
        const initialImageId = await ui.collectionPage.slideshow.getCurrentImageId();

        // Advance the clock
        await page.clock.fastForward(5000);
        
        // When an image fails to load during auto-advance
        expect(failedImageId!, 'Failed image ID should have been captured in failed request').toBeDefined();

        // Then the slideshow automatically skips to the next image
        await ui.collectionPage.slideshow.shouldShowDifferentImage(initialImageId);
        await ui.collectionPage.slideshow.shouldShowDifferentImage(failedImageId!);
        expect(requestCount, 'The expected number of requests were not made').toBe(3);
    });

    test('User watches the whole slideshow', async ({ page }) => {
        const ui = new ImageVault(page);

        // Install clock to control timing
        await page.clock.install();

        // Create a collection with fewer images to test cycling more easily
        const collection = await createCollectionFixture(SMALL_COLLECTION_NAME, 3);
        const collectionImages = await collection.getImages({status: "COLLECTION"});

        await ui.collectionPage.visit(SMALL_COLLECTION_NAME);
        await ui.collectionPage.header.slideshowButton.click();
        await ui.collectionPage.slideshow.shouldBeDisplayed();

        // Track the sequence of images shown
        const imageSequence: string[] = [];

        // Collect the first complete cycle (3 images)
        for (let i = 0; i < collectionImages.length; i++) {
            const currentImageId = await ui.collectionPage.slideshow.getCurrentImageId();
            imageSequence.push(currentImageId);

            if (i < collectionImages.length - 1) {
                await page.clock.fastForward(5000);
            }
        }

        // Verify all images were shown once
        expect(imageSequence.length).toBe(collectionImages.length);
        expect(new Set(imageSequence).size).toBe(collectionImages.length); // All unique images

        // Given a slideshow has displayed all available images once
        // When the current cycle completes
        await page.clock.fastForward(5000);

        // Then the slideshow starts again
        await ui.collectionPage.slideshow.shouldShowImageFromCollection(collection.name);

        // Store the first image of the second cycle
        const firstImageOfSecondCycle = await ui.collectionPage.slideshow.getCurrentImageId();

        // And the image advances every 5 seconds
        await page.clock.fastForward(5000);
        await ui.collectionPage.slideshow.shouldShowDifferentImage(firstImageOfSecondCycle);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
});