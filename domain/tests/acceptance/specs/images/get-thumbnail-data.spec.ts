import { suite, test } from 'mocha';
import sinon from 'sinon';
import crypto from 'crypto';
import { expect } from 'chai';

import { Collection } from '../../../../src/collection';
import { captureAssertableAsyncError } from '../../../utils';
import { ImageRetrievalError, ImageNotFoundError } from '../../../../errors';

import { getImageFixture } from '@/utils/fixtures/image-fixtures';
import sharp from 'sharp';

const testCollectionName = 'test-get-thumbnail-data';

suite('Domain - Images - Get Thumbnail Data', () => {
    test('User retrieves thumbnail data using a valid ID', async () => {
        const collection = Collection.create(testCollectionName);
        const image = await getImageFixture({ id: 'get-thumbnail-data-test', extension: 'jpg' });

        const metadata = await collection.addImage(image.filePath);

        const thumbnailBuffer = await sharp(image.filePath)
            .resize(CONFIG.THUMBNAIL_WIDTH, null, { 
                withoutEnlargement: true,
                fit: 'inside'
            }).toBuffer();

        const thumbnailData = await collection.getThumbnailData(metadata.id);

        expect(Buffer.compare(thumbnailData, thumbnailBuffer), 'The thumbnail data returned does not match the thumbnail Buffer').to.equal(0);
        LOGGER.log('✓ Retrieved thumbnail data matches thumbnail Buffer');
    });

    test('User attempts to retrieve thumbnail data for a non-existent image', async () => {
        const collection = Collection.create(testCollectionName);
        const nonExistentImageId = crypto.randomUUID();

        LOGGER.log('Validating that the correct Error is thrown when attempting to retrieve thumbnail data for non-existent image');
        const error = await captureAssertableAsyncError(() => collection.getThumbnailData(nonExistentImageId));

        error
            .shouldHaveType(ImageNotFoundError)
            .shouldHaveMessage(`Image not found with ID: "${nonExistentImageId}"`);
    });

    test('User attempts to retrieve thumbnail data using an invalid ID', async () => {
        const collection = Collection.create(testCollectionName);
        const invalidImageId = 'invalid<>id'; // Contains unsafe characters

        LOGGER.log('Validating that the correct Error is thrown when attempting to retrieve thumbnail data with invalid ID');
        const error = await captureAssertableAsyncError(() => collection.getThumbnailData(invalidImageId));

        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve image: "${invalidImageId}" from Collection: "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage('Invalid imageID');
    });

    test('An internal error occurs when retrieving thumbnail data', async () => {
        const collection = Collection.create(testCollectionName);
        const image = await getImageFixture({ id: 'internal-error-get-thumbnail', extension: 'jpg' });

        // First add an image to the collection
        const metadata = await collection.addImage(image.filePath);

        // Mock database operation to simulate internal error
        sinon.stub(collection as unknown as { getDatabase: () => unknown }, 'getDatabase').throws(new Error('Database connection failed'));

        LOGGER.log('Validating that the correct Error is thrown when internal error occurs during thumbnail data retrieval');
        const error = await captureAssertableAsyncError(() => collection.getThumbnailData(metadata.id));

        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve image: "${metadata.id}" from Collection: "${testCollectionName}"`);
    });
});