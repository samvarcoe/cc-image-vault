import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { Collection } from '@/domain';
import { createCollectionFixture } from '@/utils/fixtures/collection-fixtures';

test.describe('Client - Collection Page - Deleting Images', () => {

    test.beforeEach(async () => {
        Collection.clear();
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
        // Then the curation menu displays the "Delete" button
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.deleteButton.shouldBeDisplayed();

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
        // Then the "Delete" button is not displayed
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.deleteButton.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
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
        // Then the "Delete" button is not displayed
        await ui.collectionPage.curationMenu.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.deleteButton.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User initiates delete operation', async ({ page }) => {
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

        // When the user clicks the "Delete" button
        await ui.collectionPage.curationMenu.deleteButton.click();

        // Then a confirmation dialog appears
        await ui.collectionPage.confirmationDialog.shouldBeDisplayed();

        // And the dialog message says "Are you sure you want to permanently delete these images? This action cannot be undone."
        await ui.collectionPage.confirmationDialog.message.shouldHaveText('Are you sure you want to permanently delete these images? This action cannot be undone.');

        // And the dialog shows "Cancel" and "Delete" buttons
        await ui.collectionPage.confirmationDialog.cancelButton.shouldBeDisplayed();
        await ui.collectionPage.confirmationDialog.deleteButton.shouldBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User cancels delete operation', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the delete confirmation dialog is displayed
        // And multiple images are selected
        const collection = await createCollectionFixture('TestCollection');
        const archiveImages = await collection.getImages({status: "ARCHIVE"});
        const firstImage = archiveImages[0]!;
        const secondImage = archiveImages[1]!;

        await page.goto('/collection/TestCollection?status=ARCHIVE&curate=true');
        await page.waitForLoadState('networkidle');

        // Select images and open confirmation dialog
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.curationMenu.deleteButton.click();
        await ui.collectionPage.confirmationDialog.shouldBeDisplayed();

        // Track that no deletion request is made
        let deleteRequestMade = false;
        await page.route('**/api/images/TestCollection/*', async (route) => {
            if (route.request().method() === 'DELETE') {
                deleteRequestMade = true;
            }
            route.continue();
        });

        // When the user clicks the "Cancel" button
        await ui.collectionPage.confirmationDialog.cancelButton.click();

        // Then the confirmation dialog is closed
        await ui.collectionPage.confirmationDialog.shouldNotBeDisplayed();

        // And the selected images remain selected
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();

        // And no deletion request is made
        expect(deleteRequestMade, 'Expected no DELETE request to be made when user cancels').toBe(false);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User confirms delete operation', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the delete confirmation dialog is displayed
        // And multiple images are selected
        const collection = await createCollectionFixture('TestCollection');
        const archiveImages = await collection.getImages({status: "ARCHIVE"});
        const firstImage = archiveImages[0]!;
        const secondImage = archiveImages[1]!;

        await page.goto('/collection/TestCollection?status=ARCHIVE&curate=true');
        await page.waitForLoadState('networkidle');

        // Select images and open confirmation dialog
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.curationMenu.deleteButton.click();
        await ui.collectionPage.confirmationDialog.shouldBeDisplayed();

        await page.route('**/api/images/TestCollection/*', async (route) => {
            if (route.request().method() === 'DELETE') {
                // Then the selected images are immediately hidden
                // Assertions triggered when the request is caught
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeHidden();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeHidden();

                // But the image cards remain visible as placeholders
                await ui.collectionPage.imageGrid.image(firstImage.id).shouldShowPlaceholder();
                await ui.collectionPage.imageGrid.image(secondImage.id).shouldShowPlaceholder();
            }
            route.continue();
        });

        // When the user clicks the "Delete" button in the dialog
        await ui.collectionPage.confirmationDialog.deleteButton.click();

        // Then the confirmation dialog is closed
        await ui.collectionPage.confirmationDialog.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('Delete operation completes successfully', async ({ page }) => {
        const ui = new ImageVault(page);

        // Set longer action timeout for deletion operations that may take more than 1 second
        // page.context().setDefaultTimeout(10000);

        // Given a delete request is initiated
        const collection = await createCollectionFixture('TestCollectionDeleteSuccess');
        const archiveImages = await collection.getImages({status: "ARCHIVE"});
        const firstImage = archiveImages[0]!;
        const secondImage = archiveImages[1]!;

        await page.goto('/collection/TestCollectionDeleteSuccess?status=ARCHIVE&curate=true');
        await page.waitForLoadState('networkidle');

        // Select images, confirm delete operation
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.curationMenu.deleteButton.click();
        await ui.collectionPage.confirmationDialog.deleteButton.click();

        // When all deletion requests complete successfully
        // Wait for the images to be removed from the page (which indicates deletion completed)
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldNotExist();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldNotExist();

        // Wait for all network activity to complete to ensure DELETE requests finish
        await page.waitForLoadState('networkidle');

        // Add additional wait to ensure all async operations are fully complete
        await page.waitForTimeout(2000);

        // And no error messages are displayed
        await ui.collectionPage.curationMenu.errorMessage.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('Delete operation fails partially', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a delete request is initiated for multiple images
        const collection = await createCollectionFixture('TestCollectionDeletePartial');
        const archiveImages = await collection.getImages({status: "ARCHIVE"});
        const firstImage = archiveImages[0]!;
        const secondImage = archiveImages[1]!;
        const thirdImage = archiveImages[2]!;

        await page.goto('/collection/TestCollectionDeletePartial?status=ARCHIVE&curate=true');
        await page.waitForLoadState('networkidle');

        // Mock partial API failure - first image succeeds, second fails, third succeeds
        let requestCount = 0;
        await page.route('**/api/images/TestCollectionDeletePartial/*', async (route) => {
            if (route.request().method() === 'DELETE') {
                requestCount++;
                if (requestCount === 2) { // Second request fails
                    route.fulfill({
                        status: 500,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'Internal Server Error' })
                    });
                } else {
                    route.continue(); // First and third requests succeed
                }
            } else {
                route.continue();
            }
        });

        // Select three images and initiate delete
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.imageGrid.image(thirdImage.id).click();
        await ui.collectionPage.curationMenu.deleteButton.click();
        await ui.collectionPage.confirmationDialog.deleteButton.click();

        // When some deletion requests fail
        // Wait for API requests to complete
        await page.waitForLoadState('networkidle');

        // Then the successfully deleted image cards are removed
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldNotExist();
        await ui.collectionPage.imageGrid.image(thirdImage.id).shouldNotExist();

        // And the failed images are unhidden and remain selected
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldNotBeHidden();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();

        // And an error message "Unable to delete all images" is displayed in the curation menu
        await ui.collectionPage.curationMenu.errorMessage.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.errorMessage.shouldHaveText('Unable to delete all images');
    });

    test('Delete operation fails completely', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a delete request is initiated
        const collection = await createCollectionFixture('TestCollectionDeleteFail');
        const archiveImages = await collection.getImages({status: "ARCHIVE"});
        const firstImage = archiveImages[0]!;
        const secondImage = archiveImages[1]!;

        await page.goto('/collection/TestCollectionDeleteFail?status=ARCHIVE&curate=true');
        await page.waitForLoadState('networkidle');

        // Mock API failure by intercepting all DELETE requests
        await page.route('**/api/images/TestCollectionDeleteFail/*', async (route) => {
            if (route.request().method() === 'DELETE') {
                route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'Internal Server Error' })
                });
            } else {
                route.continue();
            }
        });

        // Select images and initiate delete
        await ui.collectionPage.imageGrid.image(firstImage.id).click();
        await ui.collectionPage.imageGrid.image(secondImage.id).click();
        await ui.collectionPage.curationMenu.deleteButton.click();
        await ui.collectionPage.confirmationDialog.deleteButton.click();

        // When all deletion requests fail
        // Wait for API requests to complete
        await page.waitForLoadState('networkidle');

        // Then all images are unhidden and remain selected
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldNotBeHidden();
        await ui.collectionPage.imageGrid.image(firstImage.id).shouldBeSelected();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldNotBeHidden();
        await ui.collectionPage.imageGrid.image(secondImage.id).shouldBeSelected();

        // And an error message "Unable to delete images" is displayed in the curation menu
        await ui.collectionPage.curationMenu.errorMessage.shouldBeDisplayed();
        await ui.collectionPage.curationMenu.errorMessage.shouldHaveText('Unable to delete images');
    });

    test('User deletes a large number of images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Set longer action timeout for large batch deletion operations
        await page.context().setDefaultTimeout(15000);

        const imageCount = 50;

        // Given many "ARCHIVE" images are selected
        await createCollectionFixture('TestBatchDeleteLarge', imageCount);

        await page.goto('/collection/TestBatchDeleteLarge?status=ARCHIVE&curate=true');
        await page.waitForLoadState('networkidle');

        await ui.collectionPage.imageGrid.image().shouldHaveCount(imageCount);

        // Track API requests to verify batching
        const apiCalls: string[] = [];
        await page.route('**/api/images/TestBatchDeleteLarge/*', (route) => {
            if (route.request().method() === 'DELETE') {
                apiCalls.push(route.request().url());
                route.continue();
            } else {
                route.continue();
            }
        });

        // Select all images
        await ui.collectionPage.curationMenu.selectAllButton.click();
        await ui.collectionPage.imageGrid.shouldHaveAllImagesSelected();

        // When the user confirms the delete operation
        await ui.collectionPage.curationMenu.deleteButton.click();
        await ui.collectionPage.confirmationDialog.deleteButton.click();

        // Wait for all the API calls to complete
        await page.waitForLoadState('networkidle');

        // Then all of the images are deleted successfully
        await ui.collectionPage.imageGrid.image().shouldHaveCount(0);

        // And API calls were made for all selected images
        expect(apiCalls.length, `The number of calls to DELETE delete images is incorrect`).toBe(imageCount);

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();

        await ui.shouldHaveNoFailedRequests();
    });
});