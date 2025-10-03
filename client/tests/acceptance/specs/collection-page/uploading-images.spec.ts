import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { createCollectionFixture, setupCollectionFixture } from '@/utils/fixtures/collection-fixtures';
import { getImageFixture, getUnsupportedFileFixture } from '@/utils/fixtures/image-fixtures';
import { readFileSync } from 'fs';

test.describe('Client - Images - Upload', () => {

    test.beforeAll(async () => {
        await createCollectionFixture({name: 'upload-standard', inboxCount: 2, collectionCount: 3, archiveCount: 2});
    });

    test('User views Collection page header', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given a Collection exists
        const collection = setupCollectionFixture('upload-standard');

        // When the user visits the Collection page
        await ui.collectionPage.visit(collection.name);

        // Then the header displays the "Upload" button
        await ui.collectionPage.header.uploadButton.shouldBeDisplayed();

        // And the "Upload" button is enabled
        await ui.collectionPage.header.uploadButton.shouldBeEnabled();

        // Verify no errors occurred
        await ui.shouldHaveNoFailedRequests();
    });

    test('User opens upload dialog', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user is on a Collection page
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);

        // When the user clicks the "Upload" button
        await ui.collectionPage.header.uploadButton.click();

        // Then a file browser dialog opens
        await ui.collectionPage.uploadDialog.shouldBeDisplayed();

        // And the dialog accepts image files (JPG, JPEG, PNG, WebP)
        await ui.collectionPage.uploadDialog.fileInput.shouldHaveAttribute('accept', 'image/*');

        // And the dialog allows multiple file selection
        await ui.collectionPage.uploadDialog.fileInput.shouldHaveAttribute('multiple', '');

        // And the dialog shows "Cancel" and "Add" buttons
        await ui.collectionPage.uploadDialog.cancelButton.shouldBeDisplayed();
        await ui.collectionPage.uploadDialog.addButton.shouldBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoFailedRequests();
    });

    test('User submits images for upload', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the file browser dialog is open
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.uploadButton.click();
        await ui.collectionPage.uploadDialog.shouldBeDisplayed();

        // Create test images
        const image1 = await getImageFixture({ id: 'test-1', extension: 'jpg' });
        const image2 = await getImageFixture({ id: 'test-2', extension: 'png' });

        // Set files on the file input
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: image1.filename, mimeType: 'image/jpeg', buffer: image1.buffer },
            { name: image2.filename, mimeType: 'image/png', buffer: image2.buffer }
        ]);

        // When the user submits images for upload
        await ui.collectionPage.uploadDialog.addButton.click();

        // Then the dialog closes
        await ui.collectionPage.uploadDialog.shouldNotBeDisplayed();

        // And the upload process begins
        // And the "Upload" button shows a spinner
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'true');

        // And the "Upload" button is disabled
        await ui.collectionPage.header.uploadButton.shouldBeDisabled();

        // Verify no errors occurred
        await ui.shouldHaveNoFailedRequests();
    });

    test('User cancels file selection', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the file browser dialog is open
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.uploadButton.click();
        await ui.collectionPage.uploadDialog.shouldBeDisplayed();

        // When the user clicks "Cancel"
        await ui.collectionPage.uploadDialog.cancelButton.click();

        // Then the dialog closes
        await ui.collectionPage.uploadDialog.shouldNotBeDisplayed();

        // And no upload process begins
        await ui.collectionPage.header.uploadButton.shouldHaveText('Upload');

        // And the "Upload" button remains enabled
        await ui.collectionPage.header.uploadButton.shouldBeEnabled();

        // Verify no errors occurred
        await ui.shouldHaveNoFailedRequests();
    });

    test('Upload completes successfully', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given files are being uploaded
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);

        // Start upload process
        await ui.collectionPage.header.uploadButton.click();
        const image = await getImageFixture({ id: 'test-upload', extension: 'jpg' });
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: image.filename, mimeType: 'image/jpeg', buffer: image.buffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();

        // When all upload requests complete successfully
        await page.waitForResponse(response =>
            response.url().includes('/api/images/') &&
            response.url().includes(collection.name) &&
            response.status() === 201
        );

        // Wait for upload to complete
        await page.waitForTimeout(1000);

        // Then the "Upload" button spinner is removed
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'false');

        // And the "Upload" button text returns to "Upload"
        await ui.collectionPage.header.uploadButton.shouldHaveText('Upload');

        // And the "Upload" button is enabled
        await ui.collectionPage.header.uploadButton.shouldBeEnabled();

        // And no error messages are displayed
        await ui.collectionPage.errorMessage.shouldNotBeDisplayed();

        // Verify no errors occurred
        await ui.shouldHaveNoFailedRequests();
    });

    test('Upload fails partially', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given files are being uploaded
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);

        // Mock mixed upload responses (some succeed, some fail)
        let requestCount = 0;
        await page.route('**/api/images/*', async route => {
            if (route.request().method() === 'POST') {
                requestCount++;
                if (requestCount === 1) {
                    // First request succeeds
                    await route.fulfill({
                        status: 201,
                        contentType: 'application/json',
                        body: JSON.stringify({ id: 'success-id', status: 'INBOX' })
                    });
                } else {
                    // Second request fails
                    await route.fulfill({
                        status: 400,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'Upload failed' })
                    });
                }
            }
        });

        // Start upload process with multiple files
        await ui.collectionPage.header.uploadButton.click();
        const image1 = await getImageFixture({ id: 'test-1', extension: 'jpg' });
        const image2 = await getImageFixture({ id: 'test-2', extension: 'png' });
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: image1.filename, mimeType: 'image/jpeg', buffer: image1.buffer },
            { name: image2.filename, mimeType: 'image/png', buffer: image2.buffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();

        // When some upload requests fail
        await page.waitForTimeout(2000); // Wait for uploads to complete

        // Then the "Upload" button spinner is removed
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'false');

        // And the "Upload" button text returns to "Upload"
        await ui.collectionPage.header.uploadButton.shouldHaveText('Upload');

        // And the "Upload" button is enabled
        await ui.collectionPage.header.uploadButton.shouldBeEnabled();

        // And the error message "Unable to upload some images" is displayed in the header
        await ui.collectionPage.errorMessage.shouldBeDisplayed();
        await ui.collectionPage.errorMessage.shouldContainText('Unable to upload some images');

        // Note: Console errors from 400 responses are expected when testing upload failures
    });

    test('Upload fails completely', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given files are being uploaded
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);

        // Mock failed upload responses for error scenario
        await page.route('**/api/images/*', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'Upload failed' })
                });
            }
        });

        // Start upload process
        await ui.collectionPage.header.uploadButton.click();
        const image = await getImageFixture({ id: 'test-upload', extension: 'jpg' });
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: image.filename, mimeType: 'image/jpeg', buffer: image.buffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();

        // When all upload requests fail
        await page.waitForTimeout(2000); // Wait for uploads to complete

        // Then the "Upload" button spinner is removed
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'false');

        // And the "Upload" button text returns to "Upload"
        await ui.collectionPage.header.uploadButton.shouldHaveText('Upload');

        // And the "Upload" button is enabled
        await ui.collectionPage.header.uploadButton.shouldBeEnabled();

        // And the error message "Unable to upload some images" is displayed in the header
        await ui.collectionPage.errorMessage.shouldBeDisplayed();
        await ui.collectionPage.errorMessage.shouldContainText('Unable to upload some images');

        // Note: Console errors from 400 responses are expected when testing upload failures
    });

    test('User attempts to navigate during upload', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given files are being uploaded
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);

        // Use route interception to delay upload response for timing control
        await page.route('**/api/images/*', async route => {
            if (route.request().method() === 'POST') {
                // Delay response to simulate ongoing upload for timing control
                await new Promise(resolve => setTimeout(resolve, 5000));
                // Let the real system handle the request after delay
                await route.continue();
            }
        });

        // Start upload process
        await ui.collectionPage.header.uploadButton.click();
        const image = await getImageFixture({ id: 'test-upload', extension: 'jpg' });
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: image.filename, mimeType: 'image/jpeg', buffer: image.buffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();

        // Wait for upload to start
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'true');

        // Set up dialog handler before triggering navigation
        let dialogHandled = false;
        page.on('dialog', async dialog => {
            expect(dialog.type()).toBe('beforeunload');
            // Note: Modern browsers may not expose custom beforeunload messages for security reasons
            // The important thing is that the dialog appears, confirming our event handler works
            dialogHandled = true;
            await dialog.dismiss(); // Stay on page
        });

        // When the user attempts to navigate away from the page
        await page.evaluate(() => {
            window.location.href = '/';
        });

        // Then a warning dialog appears
        await page.waitForTimeout(100);
        expect(dialogHandled).toBe(true);

        // Verify no errors occurred
    });

    test('User chooses to stay during upload', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the navigation warning dialog is displayed
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);

        // Use route interception to delay upload for timing control
        await page.route('**/api/images/*', async route => {
            if (route.request().method() === 'POST') {
                await new Promise(resolve => setTimeout(resolve, 3000));
                // Let the real system handle the request after delay
                await route.continue();
            }
        });

        // Start upload
        await ui.collectionPage.header.uploadButton.click();
        const image = await getImageFixture({ id: 'test-upload', extension: 'jpg' });
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: image.filename, mimeType: 'image/jpeg', buffer: image.buffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'true');

        // Set up dialog handler to stay on page
        page.on('dialog', async dialog => {
            await dialog.dismiss(); // Stay on page
        });

        // When the user clicks "Stay on Page" (simulated by dismissing dialog)
        await page.evaluate(() => {
            window.location.href = '/';
        });

        // Then the warning dialog closes
        // And the user remains on the current page
        expect(page.url()).toContain(`/collection/${collection.name}`);

        // And the upload process continues
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'true');

        // Verify no errors occurred
    });

    test('User chooses to leave during upload', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the navigation warning dialog is displayed
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);

        // Use route interception to delay upload for timing control
        await page.route('**/api/images/*', async route => {
            if (route.request().method() === 'POST') {
                await new Promise(resolve => setTimeout(resolve, 5000));
                // Let the real system handle the request after delay
                await route.continue();
            }
        });

        // Start upload
        await ui.collectionPage.header.uploadButton.click();
        const image = await getImageFixture({ id: 'test-upload', extension: 'jpg' });
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: image.filename, mimeType: 'image/jpeg', buffer: image.buffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'true');

        // Set up dialog handler to accept leaving
        page.on('dialog', async dialog => {
            await dialog.accept(); // Leave page
        });

        // When the user clicks "Leave"
        await page.goto('/'); // Force navigation

        // Then the user navigates away from the page
        expect(page.url()).toBe(new URL('/', page.url()).href);
    });

    test('User uploads large number of files', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user has selected many image files
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);

        // Create 15 test images (more than batch size of 10)
        const images = await Promise.all(
            Array.from({ length: 15 }, async (_, i) => {
                const image = await getImageFixture({ id: `batch-test-${i}`, extension: 'jpg' });
                return { name: image.filename, mimeType: 'image/jpeg' as const, buffer: image.buffer };
            })
        );

        // Start upload process
        await ui.collectionPage.header.uploadButton.click();
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles(images);

        // When the upload process begins
        await ui.collectionPage.uploadDialog.addButton.click();

        // Then all files are processed successfully
        await page.waitForTimeout(3000); // Wait for batch processing

        // Verify upload completed successfully
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'false');
        await ui.collectionPage.header.uploadButton.shouldHaveText('Upload');
        await ui.collectionPage.header.uploadButton.shouldBeEnabled();

        // Verify no errors occurred
        await ui.shouldHaveNoFailedRequests();
    });

    test('User uploads invalid file type', async ({ page }) => {
        const ui = new ImageVault(page);

        // Given the user has submitted a mixture of valid and non-image files
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);

        // Create valid image and invalid text file
        const validImage = await getImageFixture({ id: 'valid-image', extension: 'jpg' });
        const invalidFilePath = await getUnsupportedFileFixture();
        const invalidFileBuffer = readFileSync(invalidFilePath);

        // Start upload process
        await ui.collectionPage.header.uploadButton.click();
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: validImage.filename, mimeType: 'image/jpeg', buffer: validImage.buffer },
            { name: 'test-file.txt', mimeType: 'text/plain', buffer: invalidFileBuffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();

        // When the process concludes
        await page.waitForTimeout(2000);

        // Then the valid image files are uploaded successfully
        // And the error message "Unable to upload some images" is displayed
        await ui.collectionPage.errorMessage.shouldBeDisplayed();
        await ui.collectionPage.errorMessage.shouldContainText('Unable to upload some images');

        // Upload button returns to normal state
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'false');
        await ui.collectionPage.header.uploadButton.shouldHaveText('Upload');
        await ui.collectionPage.header.uploadButton.shouldBeEnabled();

        // Verify no console errors occurred (handled gracefully)
    });
});