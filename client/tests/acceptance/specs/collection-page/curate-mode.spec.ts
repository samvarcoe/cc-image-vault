import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { Collection } from '@/domain';
import { createCollectionFixture } from '@/utils/fixtures/collection-fixtures';

const COLLECTION_NAME = 'CurateModeCollection';

test.describe('Client - Collection Page - Curate Mode', () => {

    test.beforeEach(async () => {
        Collection.clear();
    });

    test('User navigates to a Collection page with "?curate=true" set', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user navigates to a Collection page
        await createCollectionFixture(COLLECTION_NAME);

        // And "?curate=true" is set in the URL
        // When the page loads
        await ui.collectionPage.visit(COLLECTION_NAME);
        await page.goto(`/collection/${COLLECTION_NAME}?curate=true`);
        await page.waitForLoadState('networkidle');

        // Then the "Curate" button displays in selected state
        expect(page.url()).toContain('curate=true');
        await ui.collectionPage.header.curateButton.shouldBeDisplayed();
        await ui.collectionPage.header.curateButton.shouldBePressed();

        // And the curation menu displays below the header
        await ui.collectionPage.curationMenu.shouldBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User navigates to a Collection page with "?curate=false" set', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user navigates to a Collection page
        await createCollectionFixture(COLLECTION_NAME);

        // And "?curate=false" is set in the URL
        // When the page loads
        await page.goto('/collection/TestCollection?curate=false');
        await page.waitForLoadState('networkidle');

        // Then the "Curate" button displays in unselected state
        expect(page.url()).toContain('curate=false');
        await ui.collectionPage.header.curateButton.shouldBeDisplayed();
        await ui.collectionPage.header.curateButton.shouldNotBePressed();

        // And the curation menu is not displayed
        await ui.collectionPage.curationMenu.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User navigates to a Collection page without "?curate" set', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user navigates to a Collection page
        await createCollectionFixture(COLLECTION_NAME);

        // And "?curate" is not set in the URL
        // When the page loads
        await ui.collectionPage.visit(COLLECTION_NAME);

        // Then the query parameter is updated to include "?curate=false" in the URL
    
        expect(page.url()).toContain('curate=false');

        // And the "Curate" button displays in unselected state
        await ui.collectionPage.header.curateButton.shouldBeDisplayed();
        await ui.collectionPage.header.curateButton.shouldNotBePressed();

        // And the curation menu is not displayed
        await ui.collectionPage.curationMenu.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User activates curate mode', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is viewing a Collection page
        await createCollectionFixture(COLLECTION_NAME);
        await ui.collectionPage.visit(COLLECTION_NAME);

        // And the page is not in curate mode
        await ui.collectionPage.header.curateButton.shouldNotBePressed();

        // When the user clicks the "Curate" button in the header
        await ui.collectionPage.header.curateButton.click();

        // Then the "Curate" button displays in selected state
        await ui.collectionPage.header.curateButton.shouldBePressed();

        // And the curation menu displays below the header
        await ui.collectionPage.curationMenu.shouldBeDisplayed();

        // And the query parameter is updated to "?curate=true" in the URL
        expect(page.url()).toContain('curate=true');

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User deactivates curate mode', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is viewing a Collection page
        await createCollectionFixture(COLLECTION_NAME);

        // And the page is in curate mode
        await page.goto(`/collection/${COLLECTION_NAME}?curate=true`);
        await page.waitForLoadState('networkidle');
        await ui.collectionPage.header.curateButton.shouldBePressed();

        // When the user clicks the "Curate" button in the header
        await ui.collectionPage.header.curateButton.click();

        // Then the "Curate" button displays in unselected state
        await ui.collectionPage.header.curateButton.shouldNotBePressed();

        // And the curation menu is hidden
        await ui.collectionPage.curationMenu.shouldNotBeDisplayed();

        // And the query parameter is updated to "?curate=false" in the URL
        expect(page.url()).toContain('curate=false');

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User scrolls the Collection page', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is on a Collection page with many images
        await createCollectionFixture(COLLECTION_NAME);

        // And the page is in curate mode
        await page.goto(`/collection/${COLLECTION_NAME}?curate=true`);
        await page.waitForLoadState('networkidle');

        // When the user scrolls down the page
        // Then the header remains fixed at the top of the viewport
        // shouldBeSticky() does the scroll internally
        await ui.collectionPage.header.shouldBeSticky();

        // And the curation menu remains positioned directly below the header
        await ui.collectionPage.curationMenu.shouldBeSticky();

        // And the curation menu is visible on top of the images
        await ui.collectionPage.curationMenu.shouldBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User clicks on an image with curate mode activated', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is on a Collection page with curate mode active
        const collection = await createCollectionFixture(COLLECTION_NAME);
        const collectionImages = await collection.getImages({status: "COLLECTION"});
        const firstImage = collectionImages[0]!;

        await page.goto(`/collection/${COLLECTION_NAME}?curate=true`);
        await page.waitForLoadState('networkidle');

        // When the user clicks on a thumbnail image
        await ui.collectionPage.imageGrid.image(firstImage.id).click();

        // Then the fullscreen popover does not open
        await ui.collectionPage.popover.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User navigates between status views with curate mode activated', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is viewing a Collection page
        await createCollectionFixture(COLLECTION_NAME);

        // And the page is in curate mode
        await page.goto(`/collection/${COLLECTION_NAME}?curate=true`);
        await page.waitForLoadState('networkidle');

        // When the user clicks on a Status toggle button
        await ui.collectionPage.header.statusToggle.inboxButton.click();

        // Then "?curate=true" persists in the URL
        expect(page.url()).toContain('curate=true');

        // And curate mode remains active
        await ui.collectionPage.header.curateButton.shouldBePressed();
        await ui.collectionPage.curationMenu.shouldBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User navigates between status views without curate mode activated', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is viewing a Collection page
        await createCollectionFixture(COLLECTION_NAME);

        // And the page is not in curate mode
        await page.goto('/collection/TestCollection?curate=false');
        await page.waitForLoadState('networkidle');

        // When the user clicks on a Status toggle button
        await ui.collectionPage.header.statusToggle.inboxButton.click();

        // Then "?curate=false" persists in the URL
        expect(page.url()).toContain('curate=false');

        // And curate mode remains inactive
        await ui.collectionPage.header.curateButton.shouldNotBePressed();
        await ui.collectionPage.curationMenu.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User refreshes the Collection page with curate mode activated', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is viewing a Collection page
        await createCollectionFixture(COLLECTION_NAME);

        // And the page is in curate mode
        await page.goto(`/collection/${COLLECTION_NAME}?curate=true`);
        await page.waitForLoadState('networkidle');

        // When the user refreshes the page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Then "?curate=true" persists in the URL
        expect(page.url()).toContain('curate=true');

        // And curate mode remains active
        await ui.collectionPage.header.curateButton.shouldBePressed();
        await ui.collectionPage.curationMenu.shouldBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User refreshes the Collection page without curate mode activated', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is viewing a Collection page
        await createCollectionFixture(COLLECTION_NAME);

        // And the page is not in curate mode
        await page.goto('/collection/TestCollection?curate=false');
        await page.waitForLoadState('networkidle');

        // When the user refreshes the page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Then "?curate=false" persists in the URL
        expect(page.url()).toContain('curate=false');

        // And curate mode remains inactive
        await ui.collectionPage.header.curateButton.shouldNotBePressed();
        await ui.collectionPage.curationMenu.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });
});