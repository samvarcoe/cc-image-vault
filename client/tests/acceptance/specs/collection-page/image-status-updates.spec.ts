import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { Collection } from '@/domain';
import { createCollectionFixture } from '@/utils/fixtures/collection-fixtures';

test.describe('Client - Collection Page - Image Status Updates', () => {

    test.beforeEach(async () => {
        Collection.clear();
    });

    test('User views INBOX images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is on a Collection page
        await createCollectionFixture('TestCollection');

        // And the current status view is "INBOX"
        // And curate mode is active
        await page.goto('/collection/TestCollection?status=INBOX&curate=true');
        await page.waitForLoadState('networkidle');

        // When the page loads
        // Then the curation menu displays "Keep" and "Discard" buttons
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.keepButton.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.discardButton.shouldBeDisplayed();

        // And the "Restore" button is not displayed
        await ui.collectionPage.curationMenu.restoreButton.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views COLLECTION images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is on a Collection page
        await createCollectionFixture('TestCollection');

        // And the current status view is "COLLECTION"
        // And curate mode is active
        await page.goto('/collection/TestCollection?status=COLLECTION&curate=true');
        await page.waitForLoadState('networkidle');

        // When the page loads
        // Then the curation menu displays "Discard" button
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.discardButton.shouldBeDisplayed();

        // And the "Keep" and "Restore" buttons are not displayed
        await ui.collectionPage.curationMenu.keepButton.shouldNotBeDisplayed();
        await ui.collectionPage.curationMenu.restoreButton.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User views ARCHIVE images with curate mode active', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is on a Collection page
        await createCollectionFixture('TestCollection');

        // And the current status view is "ARCHIVE"
        // And curate mode is active
        await page.goto('/collection/TestCollection?status=ARCHIVE&curate=true');
        await page.waitForLoadState('networkidle');

        // When the page loads
        // Then the curation menu displays "Restore" button only
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.restoreButton.shouldBeDisplayed();

        // And the "Keep" button is not displayed
        await ui.collectionPage.curationMenu.keepButton.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User initiates a "Keep" request', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given multiple "INBOX" images are selected
        const collection = await createCollectionFixture('TestCollection');
        const inboxImages = await collection.getImages({status: "INBOX"});
        const firstImage = inboxImages[0]!;
        const secondImage = inboxImages[1]!;

        await page.goto('/collection/TestCollection?status=INBOX&curate=true');
        await page.waitForLoadState('networkidle');

        // Select multiple images
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();
        
        await page.route('**/api/images/TestCollection/*', async (route) => {
            if (route.request().method() === 'PATCH') {
                // Then the selected images are immediately hidden
                // Assertions triggered when the request is caught
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeHidden();

                // But the image cards remain visible as a placeholder
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldShowPlaceholder();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldShowPlaceholder();
            }
        });

        // When the user clicks the "Keep" button
        await ui.collectionPage.curationMenu.keepButton.click();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User initiates a "Discard" request for "INBOX" images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given multiple "INBOX" images are selected
        const collection = await createCollectionFixture('TestCollection');
        const inboxImages = await collection.getImages({status: "INBOX"});
        const firstImage = inboxImages[0]!;
        const secondImage = inboxImages[1]!;

        await page.goto('/collection/TestCollection?status=INBOX&curate=true');
        await page.waitForLoadState('networkidle');

        // Select multiple images
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();

        await page.route('**/api/images/TestCollection/*', async (route) => {
            if (route.request().method() === 'PATCH') {
                // Then the selected images are immediately hidden
                // Assertions triggered when the request is caught
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeHidden();

                // But the image cards remain visible as a placeholder
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldShowPlaceholder();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldShowPlaceholder();
            }
        });

        // When the user clicks the "Discard" button
        await ui.collectionPage.curationMenu.discardButton.click();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User initiates a "Discard" request for "COLLECTION" images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given multiple "COLLECTION" images are selected
        const collection = await createCollectionFixture('TestCollection');
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;
        const secondImage = collectionImages[1]!;

        await page.goto('/collection/TestCollection?status=COLLECTION&curate=true');
        await page.waitForLoadState('networkidle');

        // Select multiple images
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();

        await page.route('**/api/images/TestCollection/*', async (route) => {
            if (route.request().method() === 'PATCH') {
                // Then the selected images are immediately hidden
                // Assertions triggered when the request is caught
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeHidden();

                // But the image cards remain visible as a placeholder
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldShowPlaceholder();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldShowPlaceholder();
            }
        });

        // When the user clicks the "Discard" button
        await ui.collectionPage.curationMenu.discardButton.click();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User initiates a "Restore" request', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given multiple "ARCHIVE" images are selected
        const collection = await createCollectionFixture('TestCollection');
        const archiveImages = await collection.getImages({status: "ARCHIVE"});
        const firstImage = archiveImages[0]!;
        const secondImage = archiveImages[1]!;

        await page.goto('/collection/TestCollection?status=ARCHIVE&curate=true');
        await page.waitForLoadState('networkidle');

        // Select multiple images
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();

        await page.route('**/api/images/TestCollection/*', async (route) => {
            if (route.request().method() === 'PATCH') {
                // Then the selected images are immediately hidden
                // Assertions triggered when the request is caught
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeHidden();

                // But the image cards remain visible as a placeholder
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldShowPlaceholder();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldShowPlaceholder();
            }
        });

        // When the user clicks the "Restore" button
        await ui.collectionPage.curationMenu.restoreButton.click()

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('A status change request responds successfully', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a status change request is initiated
        const collection = await createCollectionFixture('TestCollection');
        const inboxImages = await collection.getImages({status: "INBOX"});
        const testImage = inboxImages[0]!;

        await page.goto('/collection/TestCollection?status=INBOX&curate=true');
        await page.waitForLoadState('networkidle');

        // Select an image and initiate Keep request
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.imageGrid.image(testImage.id).shouldBeSelected();
        await ui.collectionPage.curationMenu.keepButton.click();

        // When the response is successful
        // Wait for API request to complete
        await page.waitForLoadState('networkidle');

        // Then the selected image cards are removed
        await ui.collectionPage.imageGrid.image(testImage.id).shouldNotExist();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('A status change request is unsuccessful', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a status change request is initiated
        const collection = await createCollectionFixture('TestCollection');
        const inboxImages = await collection.getImages({status: "INBOX"});
        const testImage = inboxImages[0]!;

        await page.goto('/collection/TestCollection?status=INBOX&curate=true');
        await page.waitForLoadState('networkidle');

        // Mock API failure by intercepting the PATCH request
        await page.route('**/api/images/TestCollection/*', async (route) => {
            if (route.request().method() === 'PATCH') {
                // Verify the image was hidden when the request was made
                await ui.collectionPage.imageGrid.image(testImage.id).shouldBeHidden();
                
                route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'Internal Server Error' })
                });
            } else {
                route.continue();
            }
        });

        // Select an image and initiate Keep request
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.imageGrid.image(testImage.id).shouldBeSelected();
        await ui.collectionPage.curationMenu.keepButton.click();

        // When the response is unsuccessful
        // Wait for API request to complete
        await page.waitForLoadState('networkidle');

        // Then the image on the image card is displayed
        await ui.collectionPage.imageGrid.image(testImage.id).shouldNotBeHidden();

        // And the image is still selected
        await ui.collectionPage.imageGrid.image(testImage.id).shouldBeSelected();

        // And an error message "Unable to complete update for all Images" is displayed in the curation menu
        await ui.collectionPage.curationMenu.errorMessage.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.errorMessage.shouldHaveText('Unable to complete update for all Images');
    });

    test('User updates a large number of images', async ({ page }) => {
        const ui = new ImageVault(page);

        const imageCount = 100

        await createCollectionFixture('TestBatchCollection', imageCount);

        await page.goto('/collection/TestBatchCollection?status=INBOX&curate=true');
        await page.waitForLoadState('networkidle');

        await ui.collectionPage.imageGrid.image().shouldHaveCount(imageCount);

        // Track API requests to verify batching
        const apiCalls: string[] = [];
        await page.route('**/api/images/TestBatchCollection/*', (route) => {
            if (route.request().method() === 'PATCH') {
                apiCalls.push(route.request().url());
                route.continue();
            } else {
                route.continue();
            }
        });

        await ui.collectionPage.curationMenu.selectAllButton.click();
        await ui.collectionPage.imageGrid.shouldHaveAllImagesSelected();

        // And clicks the "Keep" button
        await ui.collectionPage.curationMenu.keepButton.click();

        // Wait for all the API calls to complete
        await page.waitForLoadState('networkidle');

        // Ensure all images are removed from the grid
        await ui.collectionPage.imageGrid.image().shouldHaveCount(0);

        // And API calls were made for all selected images
        expect(apiCalls.length, `The number of calls to PATCH update status is incorrect`).toBe(imageCount);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
});