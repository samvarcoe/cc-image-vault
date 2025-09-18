import { suite, test } from 'mocha';
import sinon from 'sinon';
import crypto from 'crypto';
import { expect } from 'chai';

import { Collection } from '../../../../src/collection';
import { captureAssertableAsyncError } from '../../../utils';
import { ImageRetrievalError, ImageNotFoundError } from '../../../../errors';

import { getImageFixture } from '@/utils/fixtures/image-fixtures';

const testCollectionName = 'test-get-image-data';

suite('Domain - Images - Get Image Data', () => {
    test('User retrieves image data using a valid ID', async () => {
        const collection = Collection.create(testCollectionName);
        const image = await getImageFixture({ id: 'get-image-data-test', extension: 'jpg' });

        const metadata = await collection.addImage(image.filePath);

        const imageData = await collection.getImageData(metadata.id);

        expect(Buffer.compare(imageData, image.buffer), 'The image data returned does not match the original Buffer').to.equal(0);
        console.log('✓ Retrieved image data matches the original Buffer');
    });

    test('User attempts to retrieve image data for a non-existent image', async () => {
        const collection = Collection.create(testCollectionName);
        const nonExistentImageId = crypto.randomUUID();

        console.log('Validating that the correct Error is thrown when attempting to retrieve data for non-existent image');
        const error = await captureAssertableAsyncError(() => collection.getImageData(nonExistentImageId));

        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve image: "${nonExistentImageId}" from Collection: "${testCollectionName}"`)
            .shouldHaveCause(ImageNotFoundError)
            .shouldHaveCauseMessage(`Image not found with ID: "${nonExistentImageId}"`);
    });

    test('User attempts to retrieve image data using an invalid ID', async () => {
        const collection = Collection.create(testCollectionName);
        const invalidImageId = 'invalid<>id'; // Contains unsafe characters

        console.log('Validating that the correct Error is thrown when attempting to retrieve image data with invalid ID');
        const error = await captureAssertableAsyncError(() => collection.getImageData(invalidImageId));

        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve image: "${invalidImageId}" from Collection: "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage('Invalid imageID');
    });

    test('An internal error occurs when retrieving image data', async () => {
        const collection = Collection.create(testCollectionName);
        const image = await getImageFixture({ id: 'internal-error-get-data', extension: 'jpg' });

        // First add an image to the collection
        const metadata = await collection.addImage(image.filePath);

        // Mock database operation to simulate internal error
        sinon.stub(collection as unknown as { getDatabase: () => unknown }, 'getDatabase').throws(new Error('Database connection failed'));

        console.log('Validating that the correct Error is thrown when internal error occurs during image data retrieval');
        const error = await captureAssertableAsyncError(() => collection.getImageData(metadata.id));

        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve image: "${metadata.id}" from Collection: "${testCollectionName}"`);
    });
});