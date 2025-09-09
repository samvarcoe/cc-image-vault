import { suite, test } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import path from 'path';

import { Collection } from '../../../../src/collection';
import { ImageUtils } from '../../../utils/image-utils';
import { validateAsyncError } from '../../../utils';
import { ImageAdditionError } from '../../../../errors';

import { 
    getImageFixture, 
    getCorruptedImageFixture, 
    getUnsupportedFileFixture,
} from '@/utils/fixtures/image-fixtures';

import { DirectoryFixtures } from '@/utils';
import { fsOps } from '../../../../src/fs-operations';
import { CONFIG } from '@/config';

const testCollectionName = 'test-image-collection';

suite('Images - Addition', () => {
    test('User adds a jpg image to a Collection', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ id: 'test-jpg', extension: 'jpg' });

        const metadata = await collection.addImage(imageFixture.filePath);

        ImageUtils.assertImageMetadata(metadata, {
            collection: testCollectionName,
            extension: 'jpg',
            status: 'INBOX',
            mime: 'image/jpeg',
            width: imageFixture.width,
            height: imageFixture.height,
            aspect: imageFixture.width / imageFixture.height
        });

        await ImageUtils.assertImageFileExists(testCollectionName, `${metadata.name}.jpg`, 'original');
        await ImageUtils.assertImageFileExists(testCollectionName, `${metadata.name}.jpg`, 'thumbnail');
    });

    test('User adds a jpg image with "jpeg" extension to a Collection', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ id: 'test-jpeg', extension: 'jpeg' });

        const metadata = await collection.addImage(imageFixture.filePath);

        ImageUtils.assertImageMetadata(metadata, {
            collection: testCollectionName,
            extension: 'jpg', // Should be normalized to jpg
            status: 'INBOX',
            mime: 'image/jpeg',
            width: imageFixture.width,
            height: imageFixture.height,
            aspect: imageFixture.width / imageFixture.height
        });

        // File should be stored with .jpg extension regardless of original .jpeg
        await ImageUtils.assertImageFileExists(testCollectionName, `${metadata.name}.jpg`, 'original');
        await ImageUtils.assertImageFileExists(testCollectionName, `${metadata.name}.jpg`, 'thumbnail');
    });

    test('User adds a png image to a Collection', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ id: 'test-png', extension: 'png' });

        const metadata = await collection.addImage(imageFixture.filePath);

        ImageUtils.assertImageMetadata(metadata, {
            collection: testCollectionName,
            extension: 'png',
            status: 'INBOX',
            mime: 'image/png',
            width: imageFixture.width,
            height: imageFixture.height,
            aspect: imageFixture.width / imageFixture.height
        });

        await ImageUtils.assertImageFileExists(testCollectionName, `${metadata.name}.png`, 'original');
        await ImageUtils.assertImageFileExists(testCollectionName, `${metadata.name}.png`, 'thumbnail');
    });

    test('User adds a webp image to a Collection', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ id: 'test-webp', extension: 'webp' });

        const metadata = await collection.addImage(imageFixture.filePath);

        ImageUtils.assertImageMetadata(metadata, {
            collection: testCollectionName,
            extension: 'webp',
            status: 'INBOX',
            mime: 'image/webp',
            width: imageFixture.width,
            height: imageFixture.height
        });

        await ImageUtils.assertImageFileExists(testCollectionName, `${metadata.name}.webp`, 'original');
        await ImageUtils.assertImageFileExists(testCollectionName, `${metadata.name}.webp`, 'thumbnail');
    });

    test('User attempts to add an image to a Collection using a path that does not exist', async () => {
        const collection = Collection.create(testCollectionName);
        const nonExistentPath = './blah/blah/blah.jpg';

        console.log('Validating that the correct Error is thrown when attempting to add non-existent image file');
        const error = await validateAsyncError(() => collection.addImage(nonExistentPath));

        error
            .shouldHaveType(ImageAdditionError)
            .shouldHaveMessage(`Unable to add image to Collection "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage(`"${nonExistentPath}" is not a file`);

        await ImageUtils.assertNoImageFilesCreated(testCollectionName);
    });

    test('User attempts to add a duplicate image to Collection', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ id: 'duplicate-test', extension: 'jpg' });

        // Add image first time
        await collection.addImage(imageFixture.filePath);

        console.log('Validating that the correct Error is thrown when attempting to add duplicate image');
        const error = await validateAsyncError(() => collection.addImage(imageFixture.filePath));

        error
            .shouldHaveType(ImageAdditionError)
            .shouldHaveMessage(`Unable to add image to Collection "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage('Image already exists in Collection');

        // Should not create additional files
        const originalDir = path.join(CONFIG.COLLECTIONS_DIRECTORY, testCollectionName, 'images', 'original');
        const originalFiles = await DirectoryFixtures.listFiles(originalDir);
        expect(originalFiles.length, 'Additional image files created after duplicate attempt').equals(1);
        console.log('✓ No additional image files created after duplicate attempt');
    });

    test('User attempts to add an image with unsupported format', async () => {
        const collection = Collection.create(testCollectionName);
        const unsupportedFilePath = await getUnsupportedFileFixture();

        console.log('Validating that the correct Error is thrown when attempting to add unsupported file type');
        const error = await validateAsyncError(() => collection.addImage(unsupportedFilePath));

        error
            .shouldHaveType(ImageAdditionError)
            .shouldHaveMessage(`Unable to add image to Collection "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage('Unsupported file type, must be image file with extension jpg/jpeg/png/webp');

        await ImageUtils.assertNoImageFilesCreated(testCollectionName);
    });

    test('User attempts to add a corrupted image file', async () => {
        const collection = Collection.create(testCollectionName);
        const corruptedFilePath = await getCorruptedImageFixture('jpg');

        console.log('Validating that the correct Error is thrown when attempting to add corrupted image');
        const error = await validateAsyncError(() => collection.addImage(corruptedFilePath));

        error
            .shouldHaveType(ImageAdditionError)
            .shouldHaveMessage(`Unable to add image to Collection "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage('Invalid or corrupted image file'); 

        await ImageUtils.assertNoImageFilesCreated(testCollectionName);
    });

    test('User attempts to add an image with unsafe filename', async () => {
        const collection = Collection.create(testCollectionName);
        const unsafeFilePath = './some/path/javascript:alert(1).jpg';

        console.log('Validating that the correct Error is thrown when attempting to add image with unsafe filename');
        const error = await validateAsyncError(() => collection.addImage(unsafeFilePath));

        error
            .shouldHaveType(ImageAdditionError)
            .shouldHaveMessage(`Unable to add image to Collection "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage('Unsafe or invalid filename');

        await ImageUtils.assertNoImageFilesCreated(testCollectionName);
    });

    test('User attempts to add an image with filename that exceeds 256 characters', async () => {
        const collection = Collection.create(testCollectionName);
        const longName = 'a'.repeat(260); // Exceeds 256 character limit
        const longFilePath = `./some/path/${longName}.jpg`;

        console.log('Validating that the correct Error is thrown when attempting to add image with long filename');
        const error = await validateAsyncError(() => collection.addImage(longFilePath));

        error
            .shouldHaveType(ImageAdditionError)
            .shouldHaveMessage(`Unable to add image to Collection "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage('Filename exceeds 256 characters');

        await ImageUtils.assertNoImageFilesCreated(testCollectionName);
    });

    test('An internal error occurs when adding an image to a Collection', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ id: 'internal-error-test', extension: 'jpg' });

        // Mock filesystem operation to simulate internal error
        sinon.stub(fsOps, 'writeFile').throws(new Error('Filesystem unavailable'));

        console.log('Validating that the correct Error is thrown when internal error occurs during image addition');
        const error = await validateAsyncError(() => collection.addImage(imageFixture.filePath));

        error
            .shouldHaveType(ImageAdditionError)
            .shouldHaveMessage(`Unable to add image to Collection "${testCollectionName}"`);
    });
});