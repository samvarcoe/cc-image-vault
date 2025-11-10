import { test, expect } from '@playwright/test';
import { ImageVault } from '../../../ui-model/image-vault';
import { createCollectionFixture, setupCollectionFixture } from '@/utils/fixtures/collection-fixtures';
import { getImageFixture, getUnsupportedFileFixture } from '@/utils/fixtures/image-fixtures';
import { readFileSync } from 'fs';
test.describe('Client - Images - Upload', () => {
    test.beforeAll(async () => {
        await createCollectionFixture({ name: 'upload-standard', inboxCount: 2, collectionCount: 3, archiveCount: 2 });
    });
    test('User views Collection page header', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.uploadButton.shouldBeDisplayed();
        await ui.collectionPage.header.uploadButton.shouldBeEnabled();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User opens upload dialog', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.uploadButton.click();
        await ui.collectionPage.uploadDialog.shouldBeDisplayed();
        await ui.collectionPage.uploadDialog.fileInput.shouldHaveAttribute('accept', 'image/*');
        await ui.collectionPage.uploadDialog.fileInput.shouldHaveAttribute('multiple', '');
        await ui.collectionPage.uploadDialog.cancelButton.shouldBeDisplayed();
        await ui.collectionPage.uploadDialog.addButton.shouldBeDisplayed();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User submits images for upload', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.uploadButton.click();
        await ui.collectionPage.uploadDialog.shouldBeDisplayed();
        const image1 = await getImageFixture({ filename: 'test-1.jpg' });
        const image2 = await getImageFixture({ filename: 'test-2.png' });
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: image1.filename, mimeType: 'image/jpeg', buffer: image1.buffer },
            { name: image2.filename, mimeType: 'image/png', buffer: image2.buffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();
        await ui.collectionPage.uploadDialog.shouldNotBeDisplayed();
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'true');
        await ui.collectionPage.header.uploadButton.shouldBeDisabled();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User cancels file selection', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.uploadButton.click();
        await ui.collectionPage.uploadDialog.shouldBeDisplayed();
        await ui.collectionPage.uploadDialog.cancelButton.click();
        await ui.collectionPage.uploadDialog.shouldNotBeDisplayed();
        await ui.collectionPage.header.uploadButton.shouldHaveText('Upload');
        await ui.collectionPage.header.uploadButton.shouldBeEnabled();
        await ui.shouldHaveNoFailedRequests();
    });
    test('Upload completes successfully', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);
        await ui.collectionPage.header.uploadButton.click();
        const image = await getImageFixture({ filename: 'test-upload.jpg' });
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: image.filename, mimeType: 'image/jpeg', buffer: image.buffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();
        await page.waitForResponse(response => response.url().includes('/api/images/') &&
            response.url().includes(collection.name) &&
            response.status() === 201);
        await page.waitForTimeout(1000);
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'false');
        await ui.collectionPage.header.uploadButton.shouldHaveText('Upload');
        await ui.collectionPage.header.uploadButton.shouldBeEnabled();
        await ui.collectionPage.errorMessage.shouldNotBeDisplayed();
        await ui.shouldHaveNoFailedRequests();
    });
    test('Upload fails partially', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);
        let requestCount = 0;
        await page.route('**/api/images/*', async (route) => {
            if (route.request().method() === 'POST') {
                requestCount++;
                if (requestCount === 1) {
                    await route.fulfill({
                        status: 201,
                        contentType: 'application/json',
                        body: JSON.stringify({ id: 'success-id', status: 'INBOX' })
                    });
                }
                else {
                    await route.fulfill({
                        status: 400,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'Upload failed' })
                    });
                }
            }
        });
        await ui.collectionPage.header.uploadButton.click();
        const image1 = await getImageFixture({ filename: 'test-1.jpg' });
        const image2 = await getImageFixture({ filename: 'test-2.png' });
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: image1.filename, mimeType: 'image/jpeg', buffer: image1.buffer },
            { name: image2.filename, mimeType: 'image/png', buffer: image2.buffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();
        await page.waitForTimeout(2000);
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'false');
        await ui.collectionPage.header.uploadButton.shouldHaveText('Upload');
        await ui.collectionPage.header.uploadButton.shouldBeEnabled();
        await ui.collectionPage.errorMessage.shouldBeDisplayed();
        await ui.collectionPage.errorMessage.shouldContainText('Unable to upload some images');
    });
    test('Upload fails completely', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);
        await page.route('**/api/images/*', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'Upload failed' })
                });
            }
        });
        await ui.collectionPage.header.uploadButton.click();
        const image = await getImageFixture({ filename: 'test-upload.jpg' });
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: image.filename, mimeType: 'image/jpeg', buffer: image.buffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();
        await page.waitForTimeout(2000);
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'false');
        await ui.collectionPage.header.uploadButton.shouldHaveText('Upload');
        await ui.collectionPage.header.uploadButton.shouldBeEnabled();
        await ui.collectionPage.errorMessage.shouldBeDisplayed();
        await ui.collectionPage.errorMessage.shouldContainText('Unable to upload some images');
    });
    test('User attempts to navigate during upload', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);
        await page.route('**/api/images/*', async (route) => {
            if (route.request().method() === 'POST') {
                await new Promise(resolve => setTimeout(resolve, 5000));
                await route.continue();
            }
        });
        await ui.collectionPage.header.uploadButton.click();
        const image = await getImageFixture({ filename: 'test-upload.jpg' });
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: image.filename, mimeType: 'image/jpeg', buffer: image.buffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'true');
        let dialogHandled = false;
        page.on('dialog', async (dialog) => {
            expect(dialog.type()).toBe('beforeunload');
            dialogHandled = true;
            await dialog.dismiss();
        });
        await page.evaluate(() => {
            window.location.href = '/';
        });
        await page.waitForTimeout(100);
        expect(dialogHandled).toBe(true);
    });
    test('User chooses to stay during upload', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);
        await page.route('**/api/images/*', async (route) => {
            if (route.request().method() === 'POST') {
                await new Promise(resolve => setTimeout(resolve, 3000));
                await route.continue();
            }
        });
        await ui.collectionPage.header.uploadButton.click();
        const image = await getImageFixture({ filename: 'test-upload.jpg' });
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: image.filename, mimeType: 'image/jpeg', buffer: image.buffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'true');
        page.on('dialog', async (dialog) => {
            await dialog.dismiss();
        });
        await page.evaluate(() => {
            window.location.href = '/';
        });
        expect(page.url()).toContain(`/collection/${collection.name}`);
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'true');
    });
    test('User chooses to leave during upload', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);
        await page.route('**/api/images/*', async (route) => {
            if (route.request().method() === 'POST') {
                await new Promise(resolve => setTimeout(resolve, 5000));
                await route.continue();
            }
        });
        await ui.collectionPage.header.uploadButton.click();
        const image = await getImageFixture({ filename: 'test-upload.jpg' });
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: image.filename, mimeType: 'image/jpeg', buffer: image.buffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'true');
        page.on('dialog', async (dialog) => {
            await dialog.accept();
        });
        await page.goto('/');
        expect(page.url()).toBe(new URL('/', page.url()).href);
    });
    test('User uploads large number of files', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);
        const images = await Promise.all(Array.from({ length: 15 }, async (_, i) => {
            const image = await getImageFixture({ filename: `batch-test-${i}.jpg` });
            return { name: image.filename, mimeType: 'image/jpeg', buffer: image.buffer };
        }));
        await ui.collectionPage.header.uploadButton.click();
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles(images);
        await ui.collectionPage.uploadDialog.addButton.click();
        await page.waitForTimeout(3000);
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'false');
        await ui.collectionPage.header.uploadButton.shouldHaveText('Upload');
        await ui.collectionPage.header.uploadButton.shouldBeEnabled();
        await ui.shouldHaveNoFailedRequests();
    });
    test('User uploads invalid file type', async ({ page }) => {
        const ui = new ImageVault(page);
        const collection = setupCollectionFixture('upload-standard');
        await ui.collectionPage.visit(collection.name);
        const validImage = await getImageFixture({ filename: 'valid-image.jpg' });
        const invalidFilePath = await getUnsupportedFileFixture();
        const invalidFileBuffer = readFileSync(invalidFilePath);
        await ui.collectionPage.header.uploadButton.click();
        await ui.collectionPage.uploadDialog.fileInput.setInputFiles([
            { name: validImage.filename, mimeType: 'image/jpeg', buffer: validImage.buffer },
            { name: 'test-file.txt', mimeType: 'text/plain', buffer: invalidFileBuffer }
        ]);
        await ui.collectionPage.uploadDialog.addButton.click();
        await page.waitForTimeout(2000);
        await ui.collectionPage.errorMessage.shouldBeDisplayed();
        await ui.collectionPage.errorMessage.shouldContainText('Unable to upload some images');
        await ui.collectionPage.header.uploadButton.shouldHaveAttribute('data-loading', 'false');
        await ui.collectionPage.header.uploadButton.shouldHaveText('Upload');
        await ui.collectionPage.header.uploadButton.shouldBeEnabled();
    });
});
