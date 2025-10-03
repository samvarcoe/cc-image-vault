import { suite, test } from 'mocha';
import sinon from 'sinon';

import { Collection } from '../../../../src/collection';
import { ImageUtils } from '../../../utils/image-utils';
import { captureAssertableAsyncError } from '../../../utils';
import { ImageRetrievalError, ImageNotFoundError } from '../../../../errors';

import { getImageFixture } from '@/utils/fixtures/image-fixtures';

const testCollectionName = 'test-image-retrieval';

suite('Domain - Images - Retrieval', () => {
    test('User retrieves image using a valid ID', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ filename: 'retrieval-test.jpg' });
        
        // First add an image to the collection
        const addedMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        
        // Now retrieve the image using the ID
        const retrievedMetadata = await collection.getImage(addedMetadata.id);
        
        // Verify the retrieved metadata matches the original
        ImageUtils.assertImageMetadata(retrievedMetadata, {
            id: addedMetadata.id,
            collection: testCollectionName,
            name: addedMetadata.name,
            extension: 'jpg',
            mime: 'image/jpeg',
            size: addedMetadata.size,
            hash: addedMetadata.hash,
            width: imageFixture.width,
            height: imageFixture.height,
            aspect: imageFixture.width / imageFixture.height,
            status: 'INBOX',
            created: addedMetadata.created,
            updated: addedMetadata.updated
        });
        
        LOGGER.log(`✓ Retrieved image metadata matches expected values for ID: ${addedMetadata.id}`);
    });

    test('User attempts to retrieve a non-existent image', async () => {
        const collection = Collection.create(testCollectionName);
        const nonExistentImageId = crypto.randomUUID();
        
        LOGGER.log('Validating that the correct Error is thrown when attempting to retrieve non-existent image');
        const error = await captureAssertableAsyncError(() => collection.getImage(nonExistentImageId));
        
        error
            .shouldHaveType(ImageNotFoundError)
            .shouldHaveMessage(`Image not found with ID: "${nonExistentImageId}"`);
    });

    test('User attempts to retrieve an image using an invalid ID', async () => {
        const collection = Collection.create(testCollectionName);
        const invalidImageId = 'invalid<>id'; // Contains unsafe characters
        
        LOGGER.log('Validating that the correct Error is thrown when attempting to retrieve image with invalid ID');
        const error = await captureAssertableAsyncError(() => collection.getImage(invalidImageId));
        
        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve image: "${invalidImageId}" from Collection: "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage('Invalid imageID');
    });

    test('An internal error occurs when retrieving an image', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ filename: 'internal-error-retrieval.jpg' });
        
        // First add an image to the collection
        const addedMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        
        // Mock database operation to simulate internal error
        sinon.stub(collection as unknown as { getDatabase: () => unknown }, 'getDatabase').throws(new Error('Database connection failed'));

        LOGGER.log('Validating that the correct Error is thrown when internal error occurs during image retrieval');
        const error = await captureAssertableAsyncError(() => collection.getImage(addedMetadata.id));
        
        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve image: "${addedMetadata.id}" from Collection: "${testCollectionName}"`);
    });
});