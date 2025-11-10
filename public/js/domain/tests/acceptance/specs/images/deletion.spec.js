import { suite, test } from 'mocha';
import sinon from 'sinon';
import { Collection } from '../../../../src/collection';
import { ImageUtils } from '../../../utils/image-utils';
import { captureAssertableAsyncError } from '../../../utils';
import { ImageDeletionError, ImageNotFoundError } from '../../../../errors';
import { getImageFixture } from '@/utils/fixtures/image-fixtures';
const testCollectionName = 'test-image-deletion';
suite('Domain - Images - Delete', () => {
    test('User deletes an image from a Collection', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ filename: 'deletion-test.jpg' });
        const addedMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        await ImageUtils.assertImageFileExists(testCollectionName, `${addedMetadata.id}.jpg`, 'original');
        await ImageUtils.assertImageFileExists(testCollectionName, `${addedMetadata.id}.jpg`, 'thumbnail');
        await collection.deleteImage(addedMetadata.id);
        await ImageUtils.assertImageFileDoesNotExist(testCollectionName, `${addedMetadata.id}.jpg`, 'original');
        await ImageUtils.assertImageFileDoesNotExist(testCollectionName, `${addedMetadata.id}.jpg`, 'thumbnail');
        LOGGER.log('Validating that subsequent retrieval attempts throw ImageNotFoundError');
        const error = await captureAssertableAsyncError(() => collection.getImage(addedMetadata.id));
        error
            .shouldHaveType(ImageNotFoundError)
            .shouldHaveMessage(`Image not found with ID: "${addedMetadata.id}"`);
        LOGGER.log(`✓ Image ${addedMetadata.id} successfully deleted from Collection "${testCollectionName}"`);
    });
    test('User attempts to delete a non-existent image', async () => {
        const collection = Collection.create(testCollectionName);
        const nonExistentImageId = crypto.randomUUID();
        LOGGER.log('Validating that the correct Error is thrown when attempting to delete non-existent image');
        const error = await captureAssertableAsyncError(() => collection.deleteImage(nonExistentImageId));
        error
            .shouldHaveType(ImageNotFoundError)
            .shouldHaveMessage(`Image not found with ID: "${nonExistentImageId}"`);
    });
    test('User attempts to delete an image using an invalid image ID', async () => {
        const collection = Collection.create(testCollectionName);
        const invalidImageId = 'invalid<>id';
        LOGGER.log('Validating that the correct Error is thrown when attempting to delete image with invalid ID');
        const error = await captureAssertableAsyncError(() => collection.deleteImage(invalidImageId));
        error
            .shouldHaveType(ImageDeletionError)
            .shouldHaveMessage(`Unable to delete image: "${invalidImageId}" from Collection: "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage('Invalid imageID');
    });
    test('An internal error occurs when deleting an image', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ filename: 'internal-error-deletion.jpg' });
        const addedMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        await ImageUtils.assertImageFileExists(testCollectionName, `${addedMetadata.id}.jpg`, 'original');
        await ImageUtils.assertImageFileExists(testCollectionName, `${addedMetadata.id}.jpg`, 'thumbnail');
        sinon.stub(collection, 'getDatabase').throws(new Error('Database connection failed'));
        LOGGER.log('Validating that the correct Error is thrown when internal error occurs during image deletion');
        const error = await captureAssertableAsyncError(() => collection.deleteImage(addedMetadata.id));
        error
            .shouldHaveType(ImageDeletionError)
            .shouldHaveMessage(`Unable to delete image: "${addedMetadata.id}" from Collection: "${testCollectionName}"`);
        await ImageUtils.assertImageFileExists(testCollectionName, `${addedMetadata.id}.jpg`, 'original');
        await ImageUtils.assertImageFileExists(testCollectionName, `${addedMetadata.id}.jpg`, 'thumbnail');
        LOGGER.log(`✓ Collection "${testCollectionName}" remains unchanged after internal error`);
    });
});
