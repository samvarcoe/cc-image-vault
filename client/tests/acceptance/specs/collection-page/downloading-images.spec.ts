import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { createCollectionFixture, setupCollectionFixture } from '@/utils/fixtures/collection-fixtures';

test.describe('Client - Collection Page - Download Images', () => {

    test.beforeAll(async () => {
        await createCollectionFixture({name: 'download-test', inboxCount: 2, collectionCount: 3, archiveCount: 2});
    });

    test('User views INBOX images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');

        // Given the user is viewing "INBOX" images
        await page.goto(`/collection/${collection.name}?status=INBOX`);
        await page.waitForLoadState('networkidle');

        // When the user activates curate mode
        await ui.collectionPage.header.curateButton.click();

        // Then the "Download" button is displayed in the curation menu
        await ui.collectionPage.curationMenu.downloadButton.shouldBeDisplayed();

        // And the "Download" button is disabled
        await ui.collectionPage.curationMenu.downloadButton.shouldBeDisabled();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views COLLECTION images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');

        // Given the user is viewing "COLLECTION" images
        await page.goto(`/collection/${collection.name}?status=COLLECTION`);
        await page.waitForLoadState('networkidle');

        // When the user activates curate mode
        await ui.collectionPage.header.curateButton.click();

        // Then the "Download" button is displayed in the curation menu
        await ui.collectionPage.curationMenu.downloadButton.shouldBeDisplayed();

        // And the "Download" button is disabled
        await ui.collectionPage.curationMenu.downloadButton.shouldBeDisabled();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views ARCHIVE images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');

        // Given the user is viewing "ARCHIVE" images
        await page.goto(`/collection/${collection.name}?status=ARCHIVE`);
        await page.waitForLoadState('networkidle');

        // When the user activates curate mode
        await ui.collectionPage.header.curateButton.click();

        // Then the "Download" button is displayed in the curation menu
        await ui.collectionPage.curationMenu.downloadButton.shouldBeDisplayed();

        // And the "Download" button is disabled
        await ui.collectionPage.curationMenu.downloadButton.shouldBeDisabled();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User selects some images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');

        // Given curate mode is active
        await page.goto(`/collection/${collection.name}?status=COLLECTION&curate=true`);
        await page.waitForLoadState('networkidle');

        // Verify Download button is initially disabled
        await ui.collectionPage.curationMenu.downloadButton.shouldBeDisabled();

        // When the user selects some images
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;
        await ui.collectionPage.imageGrid.image(firstImage.id).click();

        // Then the "Download" button is enabled
        await ui.collectionPage.curationMenu.downloadButton.shouldBeEnabled();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User downloads a single image', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');

        // Given one image is selected
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;

        await page.goto(`/collection/${collection.name}?status=COLLECTION&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.curationMenu.downloadButton.shouldBeEnabled();

        // Set up route to intercept download and check loading state
        await page.route(`**/api/images/${collection.name}/${firstImage.id}/download`, async (route) => {
            // Then the "Download" button shows a spinner
            await ui.collectionPage.curationMenu.downloadButton.shouldHaveAttribute('data-loading', 'true');

            // And the "Download" button is disabled
            await ui.collectionPage.curationMenu.downloadButton.shouldBeDisabled();

            // Continue with the download
            await route.continue();
        });

        // Set up download listener before clicking
        const downloadPromise = page.waitForEvent('download');

        // When the user clicks the "Download" button
        await ui.collectionPage.curationMenu.downloadButton.click();

        // And the browser downloads the image with its original filename
        const download = await downloadPromise;
        const suggestedFilename = download.suggestedFilename();
        expect(suggestedFilename).toBe(`${firstImage.name}.${firstImage.extension}`);
        LOGGER.log(`✓ Browser downloaded image with original filename: ${suggestedFilename}`);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User downloads multiple images', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');

        // Given multiple images are selected
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;
        const secondImage = collectionImages[1]!;

        await page.goto(`/collection/${collection.name}?status=COLLECTION&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.curationMenu.downloadButton.shouldBeEnabled();

        // Set up route to intercept download and check loading state
        await page.route(`**/api/images/${collection.name}/download`, async (route) => {
            // Then the "Download" button shows a spinner
            await ui.collectionPage.curationMenu.downloadButton.shouldHaveAttribute('data-loading', 'true');

            // And the "Download" button is disabled
            await ui.collectionPage.curationMenu.downloadButton.shouldBeDisabled();

            // Continue with the download
            await route.continue();
        });

        // Set up download listener before clicking
        const downloadPromise = page.waitForEvent('download');

        // When the user clicks the "Download" button
        await ui.collectionPage.curationMenu.downloadButton.click();

        // And the browser downloads a ZIP archive named "[collection name]-[status]-images.zip"
        const download = await downloadPromise;
        const suggestedFilename = download.suggestedFilename();
        const expectedFilename = `${collection.name}-COLLECTION-images.zip`;
        expect(suggestedFilename).toBe(expectedFilename);
        LOGGER.log(`✓ Browser downloaded ZIP archive with correct name: ${suggestedFilename}`);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('Download completes successfully', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');

        // Given a download is in progress
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;

        await page.goto(`/collection/${collection.name}?status=COLLECTION&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();

        // Set up route to intercept download and check loading state
        await page.route(`**/api/images/${collection.name}/${firstImage.id}/download`, async (route) => {
            // Check loading state while download is in progress
            await ui.collectionPage.curationMenu.downloadButton.shouldHaveAttribute('data-loading', 'true');
            await ui.collectionPage.curationMenu.downloadButton.shouldBeDisabled();

            // Continue with the download
            await route.continue();
        });

        const downloadPromise = page.waitForEvent('download');
        await ui.collectionPage.curationMenu.downloadButton.click();

        // When the download completes successfully
        await downloadPromise;

        // Wait for UI to update
        await page.waitForTimeout(100);

        // Then the "Download" button spinner is removed
        await ui.collectionPage.curationMenu.downloadButton.shouldHaveAttribute('data-loading', 'false');

        // And the "Download" button is enabled
        await ui.collectionPage.curationMenu.downloadButton.shouldBeEnabled();

        // And no error messages are displayed
        await ui.collectionPage.curationMenu.errorMessage.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('Download fails with API error', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('download-test');

        // Given images are selected
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;

        await page.goto(`/collection/${collection.name}?status=COLLECTION&curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.imageGrid.image(firstImage.id).click();

        // Mock API error for download request
        await page.route('**/api/images/**/download', async route => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal server error' })
            });
        });

        // When the user clicks the "Download" button
        // And the API returns an error response
        await ui.collectionPage.curationMenu.downloadButton.click();

        // Wait for error to be processed
        await page.waitForTimeout(1000);

        // Then the "Download" button spinner is removed
        await ui.collectionPage.curationMenu.downloadButton.shouldHaveAttribute('data-loading', 'false');

        // And the "Download" button is enabled
        await ui.collectionPage.curationMenu.downloadButton.shouldBeEnabled();

        // And an error message "Unable to download image(s)" is displayed in the curation menu
        await ui.collectionPage.curationMenu.errorMessage.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.errorMessage.shouldHaveText('Unable to download image(s)');

        // Note: Console errors from 500 responses are expected when testing download failures
    });
});