import { test } from '@playwright/test';
import { ImageVaultApp } from '../../ui-model/image-vault-app';
import { PopoverFixtures } from '../../utils/popover-fixtures';
import { Fixtures } from '@/utils';

test.describe('Collection Page - Full Size Image Popover', () => {
  test.afterEach(async () => {
    await Fixtures.cleanup();
  });

  test('User opens popover by clicking thumbnail', async ({ page }) => {
    // Given a collection page displays images in the grid
    const { collection, imageId } = await PopoverFixtures.createCollectionWithSingleImage();
    const app = new ImageVaultApp(page);
    const collectionPage = app.collectionPage;
    
    await collectionPage.visitCollection(collection.id);
    await collectionPage.shouldDisplayImagesInThreeColumnGrid();

    // When the user clicks on an image thumbnail
    await collectionPage.clickImageThumbnail(imageId);

    // Then the system displays the full resolution image in a centered popover
    await collectionPage.shouldHavePopoverOpen();
    await collectionPage.imagePopover.shouldDisplayFullSizeImage(imageId);
    await collectionPage.imagePopover.shouldBeCenteredInViewport();

    // And the system applies light blur and semi-transparent overlay to the page background
    await collectionPage.imagePopover.shouldApplyBackgroundEffects();

    // And the images in the background are disabled from full-screen viewing
    await collectionPage.imagePopover.shouldDisableOtherThumbnails();

    // Verify no console errors or failed requests
    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoFailedRequests();
  });

  test('Popover displays full-size image when it fits viewport', async ({ page }) => {
    // Given a collection contains an image smaller than viewport with 5% margin
    const { collection, imageIds } = await PopoverFixtures.createCollectionWithVariedImageSizes();
    const app = new ImageVaultApp(page);
    const collectionPage = app.collectionPage;
    
    await collectionPage.visitCollection(collection.id);

    // When the user clicks on the image thumbnail
    await collectionPage.clickImageThumbnail(imageIds.smallLandscape);

    // Then the system displays the image at its native size in the popover
    await collectionPage.imagePopover.shouldDisplayImageAtNativeSize();

    // And the image centers in the viewport
    await collectionPage.imagePopover.shouldBeCenteredInViewport();

    // Verify no errors occurred
    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoFailedRequests();
  });

  test('Popover scales down large image to fit viewport', async ({ page }) => {
    // Given a collection contains an image larger than viewport with 5% margin
    const { collection, imageIds } = await PopoverFixtures.createCollectionWithVariedImageSizes();
    const app = new ImageVaultApp(page);
    const collectionPage = app.collectionPage;
    
    await collectionPage.visitCollection(collection.id);

    // When the user clicks on the image thumbnail
    await collectionPage.clickImageThumbnail(imageIds.largeLandscape);

    // Then the system displays the image scaled to fit within viewport with 5% margin
    await collectionPage.imagePopover.shouldDisplayImageScaledToFitViewport();

    // And the image maintains its original aspect ratio
    // (This is verified within shouldDisplayImageScaledToFitViewport)

    // And the image centers in the viewport
    await collectionPage.imagePopover.shouldBeCenteredInViewport();

    // Verify no errors occurred
    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoFailedRequests();
  });

  test('User closes popover by clicking outside image', async ({ page }) => {
    // Given a popover displays a full-size image
    const { collection, imageId } = await PopoverFixtures.createCollectionWithSingleImage();
    const app = new ImageVaultApp(page);
    const collectionPage = app.collectionPage;
    
    await collectionPage.visitCollection(collection.id);
    await collectionPage.clickImageThumbnail(imageId);
    await collectionPage.shouldHavePopoverOpen();

    // When the user clicks outside the image area
    await collectionPage.imagePopover.closeByClickingOutside();

    // Then the system closes the popover
    await collectionPage.shouldHavePopoverClosed();

    // And the system removes the blur and overlay from the page background
    // And the other images reenabled for full-screen viewing
    // (Both are verified within shouldHavePopoverClosed)

    // Verify no errors occurred
    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoFailedRequests();
  });

  test('User closes popover with ESC key', async ({ page }) => {
    // Given a popover displays a full-size image
    const { collection, imageId } = await PopoverFixtures.createCollectionWithSingleImage();
    const app = new ImageVaultApp(page);
    const collectionPage = app.collectionPage;
    
    await collectionPage.visitCollection(collection.id);
    await collectionPage.clickImageThumbnail(imageId);
    await collectionPage.shouldHavePopoverOpen();

    // When the user presses the ESC key
    await collectionPage.imagePopover.closeByEscapeKey();

    // Then the system closes the popover
    await collectionPage.shouldHavePopoverClosed();

    // And the system removes the blur and overlay from the page background
    // And the other images reenabled for full-screen viewing
    // (Both are verified within shouldHavePopoverClosed)

    // Verify no errors occurred
    await app.shouldHaveNoConsoleErrors();
    await app.shouldHaveNoFailedRequests();
  });
});