import { test } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { Collection } from '@/domain';
import { createCollectionFixture } from '@/utils/fixtures/collection-fixtures';

const COLLECTION_NAME = 'SelectingImagesCollection';

test.describe('Client - Collection Page - Selecting Images', () => {

    test.beforeEach(async () => {
        Collection.clear();
    });

    test('User activates curate mode', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the Collection page is not in curate mode
        await createCollectionFixture(COLLECTION_NAME);
        await ui.collectionPage.visit(COLLECTION_NAME);
        await ui.collectionPage.header.curateButton.shouldNotBePressed();

        // When the user clicks the "Curate" button
        await ui.collectionPage.header.curateButton.click();

        // Then the curation menu displays the "Select All" and "Clear" buttons
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.selectAllButton.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.clearButton.shouldBeDisplayed();

        // And no images are selected
        await ui.collectionPage.imageGrid.shouldHaveNoSelectedImages();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User selects an image', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the Collection page is in curate mode
        const collection = await createCollectionFixture(COLLECTION_NAME);
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;

        await page.goto(`/collection/${COLLECTION_NAME}?curate=true`);
        await page.waitForLoadState('networkidle');

        // When the user clicks on an image thumbnail
        await ui.collectionPage.imageGrid.image(firstImage.id).click();

        // Then the image is selected
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User deselects an image', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given multiple images are selected
        const collection = await createCollectionFixture(COLLECTION_NAME);
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;
        const secondImage = collectionImages[1]!;

        await page.goto(`/collection/${COLLECTION_NAME}?curate=true`);
        await page.waitForLoadState('networkidle');

        // Select multiple images first
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();

        // When the user clicks on a selected image thumbnail
        await ui.collectionPage.imageGrid.image(firstImage.id).click();

        // Then the image is deselected
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldNotBeSelected();

        // And the other selected images remain selected
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User selects all images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the Collection page is in curate mode
        // And multiple images are displayed
        await createCollectionFixture(COLLECTION_NAME);
        await page.goto(`/collection/${COLLECTION_NAME}?curate=true`);
        await page.waitForLoadState('networkidle');

        // When the user clicks the "Select All" button
        await ui.collectionPage.curationMenu.selectAllButton.click();

        // Then all images on the page are selected
        await ui.collectionPage.imageGrid.shouldHaveAllImagesSelected();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User clears all selections', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given multiple images are selected
        await createCollectionFixture(COLLECTION_NAME);
        await page.goto(`/collection/${COLLECTION_NAME}?curate=true`);
        await page.waitForLoadState('networkidle');

        // Select all images first
        await ui.collectionPage.curationMenu.selectAllButton.click();
        await ui.collectionPage.imageGrid.shouldHaveAllImagesSelected();

        // When the user clicks the "Clear" button
        await ui.collectionPage.curationMenu.clearButton.click();

        // Then all images are deselected
        await ui.collectionPage.imageGrid.shouldHaveNoSelectedImages();

        // And the page remains in curate mode
        await ui.collectionPage.header.curateButton.shouldBePressed();
        await ui.collectionPage.curationMenu.shouldBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User deactivates curate mode with selections', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given multiple images are selected
        await createCollectionFixture(COLLECTION_NAME);
        await page.goto(`/collection/${COLLECTION_NAME}?curate=true`);
        await page.waitForLoadState('networkidle');

        // Select all images first
        await ui.collectionPage.curationMenu.selectAllButton.click();
        await ui.collectionPage.imageGrid.shouldHaveAllImagesSelected();

        // When the user deactivates curate mode
        await ui.collectionPage.header.curateButton.click();

        // Then all images are deselected
        await ui.collectionPage.imageGrid.shouldHaveNoSelectedImages();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User clicks image when not in curate mode', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the Collection page is not in curate mode
        const collection = await createCollectionFixture(COLLECTION_NAME);
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;

        await ui.collectionPage.visit(COLLECTION_NAME);
        await ui.collectionPage.header.curateButton.shouldNotBePressed();

        // When the user clicks on an image thumbnail
        await ui.collectionPage.imageGrid.image(firstImage.id).click();

        // Then the image is not selected
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldNotBeSelected();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
});