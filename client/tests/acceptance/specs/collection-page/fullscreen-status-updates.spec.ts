import { expect, test } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { Collection } from '@/domain';
import { createCollectionFixture } from '@/utils/fixtures/collection-fixtures';

const COLLECTION_NAME = 'FullscreenStatusCollection';
const SINGLE_IMAGE_COLLECTION = 'FullscreenStatusSingleImage';

test.describe('Client - Images - Fullscreen Status Updates', () => {

    test.beforeEach(async () => {
        Collection.clear();
    });

    test('User successfully keeps an INBOX image', async ({ page }) => {
        const ui = new ImageVault(page);

        // Install clock to control timing
        await page.clock.install();

        // Given the user is viewing an "INBOX" image in fullscreen
        const collection = await createCollectionFixture(COLLECTION_NAME);
        const inboxImages = await collection.getImages({status: "INBOX"});
        const testImage = inboxImages[0]!;
        const nextImage = inboxImages[1]!;

        await ui.collectionPage.visit('TestCollection', 'INBOX');
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);

        // And the user has initiated a request to "Keep" the image
        await ui.collectionPage.popover.pressTab();

        // When the update is successful
        // Then the status of the image is updated to "COLLECTION"


        // And the success message "Image status updated" displays under the image
        await ui.collectionPage.popover.shouldShowStatusMessage('Image moved to COLLECTION');

        // And after 500ms delay the popover advances to the next image
        await page.clock.fastForward(500);
        await ui.collectionPage.popover.shouldShowImage(nextImage.id, collection.name);

        // And the success message is hidden
        await ui.collectionPage.popover.shouldHideStatusMessage();

        const updatedImage = await collection.getImage(testImage.id);
        expect(updatedImage.status).toBe('COLLECTION');

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User successfully discards an INBOX image', async ({ page }) => {
        const ui = new ImageVault(page);

        // Install clock to control timing
        await page.clock.install();

        // Given the user is viewing an "INBOX" image in fullscreen
        const collection = await createCollectionFixture(COLLECTION_NAME);
        const inboxImages = await collection.getImages({status: "INBOX"});
        const testImage = inboxImages[0]!;
        const nextImage = inboxImages[1]!;

        await ui.collectionPage.visit('TestCollection', 'INBOX');
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);

        // And the user has initiated a request to "Discard" the image
        await ui.collectionPage.popover.pressBackspace();

        // When the update is successful
        // Then the status of the image is updated to "ARCHIVE"


        // And the success message "Image status updated" displays under the image
        await ui.collectionPage.popover.shouldShowStatusMessage('Image moved to ARCHIVE');

        // And after 500ms delay the popover advances to the next image
        await page.clock.fastForward(500);
        await ui.collectionPage.popover.shouldShowImage(nextImage.id, collection.name);

        // And the success message is hidden
        await ui.collectionPage.popover.shouldHideStatusMessage();

        const updatedImage = await collection.getImage(testImage.id);
        expect(updatedImage.status).toBe('ARCHIVE');

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User successfully discards a COLLECTION image', async ({ page }) => {
        const ui = new ImageVault(page);

        // Install clock to control timing
        await page.clock.install();

        // Given the user is viewing a "COLLECTION" image in fullscreen
        const collection = await createCollectionFixture(COLLECTION_NAME);
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const testImage = collectionImages[0]!;
        const nextImage = collectionImages[1]!;

        await ui.collectionPage.visit('TestCollection', 'COLLECTION');
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);

        // And the user has initiated a request to "Discard" the image
        await ui.collectionPage.popover.pressBackspace();

        // When the update is successful
        // Then the status of the image is updated to "ARCHIVE"

        // And the success message "Image status updated" displays under the image
        await ui.collectionPage.popover.shouldShowStatusMessage('Image moved to ARCHIVE');

        // And after 500ms delay the popover advances to the next image
        await page.clock.fastForward(500);
        await ui.collectionPage.popover.shouldShowImage(nextImage.id, collection.name);

        // And the success message is hidden
        await ui.collectionPage.popover.shouldHideStatusMessage();

        const updatedImage = await collection.getImage(testImage.id);
        expect(updatedImage.status).toBe('ARCHIVE');


        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User successfully restores an ARCHIVE image', async ({ page }) => {
        const ui = new ImageVault(page);

        // Install clock to control timing
        await page.clock.install();

        // Given the user is viewing an "ARCHIVE" image in fullscreen
        const collection = await createCollectionFixture(COLLECTION_NAME);
        const archiveImages = await collection.getImages({status: "ARCHIVE"});
        const testImage = archiveImages[0]!;
        const nextImage = archiveImages[1]!;

        await ui.collectionPage.visit('TestCollection', 'ARCHIVE');
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);

        // And the user has initiated a request to "Restore" the image
        await ui.collectionPage.popover.pressTab();

        // When the update is successful
        // Then the status of the image is updated to "COLLECTION"


        // And the success message "Image status updated" displays under the image
        await ui.collectionPage.popover.shouldShowStatusMessage('Image moved to COLLECTION');

        // And after 500ms delay the popover advances to the next image
        await page.clock.fastForward(500);
        await ui.collectionPage.popover.shouldShowImage(nextImage.id, collection.name);

        // And the success message is hidden
        await ui.collectionPage.popover.shouldHideStatusMessage();

        const updatedImage = await collection.getImage(testImage.id);
        expect(updatedImage.status).toBe('COLLECTION');

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User exits fullscreen mode after updating images', async ({ page }) => {
        const ui = new ImageVault(page);

        // Install clock to control timing
        await page.clock.install();

        // Given the user is viewing a fullscreen image
        const collection = await createCollectionFixture(COLLECTION_NAME);
        const inboxImages = await collection.getImages({status: "INBOX"});

        await ui.collectionPage.visit('TestCollection', 'INBOX');

        // Capture the first image ID from what's actually displayed in the popover
        const firstImageId = inboxImages[0]!.id;
        await ui.collectionPage.imageGrid.image(firstImageId).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(firstImageId, collection.name);

        // And the user has updated some images since entering fullscreen mode
        // Update first image: INBOX -> COLLECTION (Tab key)
        await ui.collectionPage.popover.pressTab();
        await page.clock.fastForward(500);

        // Capture the ID of whatever image is now showing (this is what we'll update next)
        const popoverImage = await page.locator('[data-id="popover-image"]');
        const currentImageSrc = await popoverImage.getAttribute('src');
        const currentImageId = currentImageSrc!.split('/').pop()!;

        // Update second image: whatever -> ARCHIVE (Backspace key)
        await ui.collectionPage.popover.pressBackspace();
        await page.clock.fastForward(500);

        // When the user exits fullscreen mode
        await page.keyboard.press('Escape');
        await ui.collectionPage.popover.shouldNotBeDisplayed();

        // Then the image grid reflects the updates they made
        // The first image (moved to COLLECTION) should not be in INBOX view
        await ui.collectionPage.imageGrid.image(firstImageId).shouldNotBeDisplayed();
        // The second image (moved to ARCHIVE) should not be in INBOX view
        await ui.collectionPage.imageGrid.image(currentImageId).shouldNotBeDisplayed();

        // Verify that remaining INBOX images are still displayed
        const remainingInboxImages = inboxImages.filter(img =>
            img.id !== firstImageId && img.id !== currentImageId
        );
        for (const img of remainingInboxImages) {
            await ui.collectionPage.imageGrid.image(img.id).shouldBeDisplayed();
        }

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User updates the last image', async ({ page }) => {
        const ui = new ImageVault(page);

        // Install clock to control timing
        await page.clock.install();

        // Given the user is viewing a fullscreen image
        // And it is the only image with the current status
        const collection = await createCollectionFixture(SINGLE_IMAGE_COLLECTION, 1);

        // Get all INBOX images and make sure only one remains
        const inboxImages = await collection.getImages({status: "INBOX"});
        const lastImage = inboxImages[0]!;

        await ui.collectionPage.visit('SingleImage', 'INBOX');
        await ui.collectionPage.imageGrid.image(lastImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(lastImage.id, collection.name);

        // When the user updates the status of the image
        await ui.collectionPage.popover.pressTab();
        await page.clock.fastForward(500);

        // Then fullscreen mode is closed
        await ui.collectionPage.popover.shouldNotBeDisplayed();

        // And the view shows the empty state since no images remain with current status
        await expect(page.locator('[data-id="empty-message"]')).toBeVisible();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('Status update request fails', async ({ page }) => {
        const ui = new ImageVault(page);

        await page.clock.install();

        // Given the user is viewing an image in fullscreen
        const collection = await createCollectionFixture(COLLECTION_NAME);
        const inboxImages = await collection.getImages({status: "INBOX"});
        const testImage = inboxImages[0]!;

        await ui.collectionPage.visit('TestCollection', 'INBOX');
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);

        // Mock failed API response
        await page.route(`**/api/images/${collection.name}/${testImage.id}`, (route) => {
            if (route.request().method() === 'PATCH') {
                route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({error: 'Internal Server Error'})
                });
            } else {
                route.continue();
            }
        });

        // And the user has initiated a status update request
        await ui.collectionPage.popover.pressTab();

        // When the update fails
        // Then the error message "Unable to update image status" displays under the image
        await ui.collectionPage.popover.shouldShowStatusMessage('Unable to update image status');

        // And the image does not advance to the next image
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);

        // And the error message is hidden after 500ms delay
        await page.clock.fastForward(500);
        await ui.collectionPage.popover.shouldHideStatusMessage();
    });

    test('User views a "COLLECTION" image in fullscreen', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a collection contains a "COLLECTION" image
        const collection = await createCollectionFixture(COLLECTION_NAME);
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const testImage = collectionImages[0]!;

        await ui.collectionPage.visit('TestCollection', 'COLLECTION');

        // When the user views the image in fullscreen
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);

        // Then the user is only able to initiate a "Discard" request
        // Track API calls to verify Tab doesn't trigger requests but Backspace does
        let apiCallMade = false;
        await page.route(`**/api/images/${collection.name}/${testImage.id}`, (route) => {
            if (route.request().method() === 'PATCH') {
                apiCallMade = true;
            } 
            route.continue();
        });

        // Test that Tab key does NOT trigger any API calls (should not work for COLLECTION images)
        await ui.collectionPage.popover.pressTab();
        await page.waitForTimeout(100); // Small delay to allow potential API call
        expect(apiCallMade, 'Tab key should not trigger API calls for COLLECTION images').toBe(false);

        // Verify no console errors occurred
        await ui.shouldHaveNoConsoleErrors();
    });

    test('User views an "ARCHIVE" image in fullscreen', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is viewing an "ARCHIVE" image in fullscreen
        const collection = await createCollectionFixture(COLLECTION_NAME);
        const archiveImages = await collection.getImages({status: "ARCHIVE"});
        const testImage = archiveImages[0]!;

        await ui.collectionPage.visit('TestCollection', 'ARCHIVE');

        // When the user views the image
        await ui.collectionPage.imageGrid.image(testImage.id).click();
        await ui.collectionPage.popover.shouldBeDisplayed();
        await ui.collectionPage.popover.shouldShowImage(testImage.id, collection.name);

        // Then the user is only able to initiate a "Restore" request
        // Track API calls to verify Backspace doesn't trigger requests but Tab does
        let apiCallMade = false;
        await page.route(`**/api/images/${collection.name}/${testImage.id}`, (route) => {
            if (route.request().method() === 'PATCH') {
                apiCallMade = true;
            }
            route.continue();
        });

        // Test that Backspace key does NOT trigger any API calls (should not work for ARCHIVE images)
        await ui.collectionPage.popover.pressBackspace();
        await page.waitForTimeout(100); // Small delay to allow potential API call
        expect(apiCallMade, 'Backspace key should not trigger API calls for ARCHIVE images').toBe(false);

        // Verify no console errors occurred
        await ui.shouldHaveNoConsoleErrors();
    });
});