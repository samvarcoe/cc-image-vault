import { suite, test } from 'mocha';
import sinon from 'sinon';

import { Collection } from '../../../../src/collection';
import { ImageUtils } from '../../../utils/image-utils';
import { validateAsyncError } from '../../../utils';
import { ImageRetrievalError, ImageNotFoundError } from '../../../../errors';

import { getImageFixture } from '@/utils/fixtures/image-fixtures';

const testCollectionName = 'test-image-retrieval';

suite('Images - Retrieval', () => {
    test('User retrieves image using a valid ID', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ id: 'retrieval-test', extension: 'jpg' });
        
        // First add an image to the collection
        const addedMetadata = await collection.addImage(imageFixture.filePath);
        
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
        
        console.log(`✓ Retrieved image metadata matches expected values for ID: ${addedMetadata.id}`);
    });

    test('User attempts to retrieve a non-existent image', async () => {
        const collection = Collection.create(testCollectionName);
        const nonExistentImageId = 'non-existent-image-id';
        
        console.log('Validating that the correct Error is thrown when attempting to retrieve non-existent image');
        const error = await validateAsyncError(() => collection.getImage(nonExistentImageId));
        
        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve image from Collection "${testCollectionName}"`)
            .shouldHaveCause(ImageNotFoundError)
            .shouldHaveCauseMessage(`Image not found with ID: "${nonExistentImageId}"`);
    });

    test('User attempts to retrieve an image using an invalid ID', async () => {
        const collection = Collection.create(testCollectionName);
        const invalidImageId = 'invalid<>id'; // Contains unsafe characters
        
        console.log('Validating that the correct Error is thrown when attempting to retrieve image with invalid ID');
        const error = await validateAsyncError(() => collection.getImage(invalidImageId));
        
        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve image from Collection "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage('Invalid image ID');
    });

    test('User attempts to retrieve an image using an empty ID', async () => {
        const collection = Collection.create(testCollectionName);
        const emptyImageId = '';
        
        console.log('Validating that the correct Error is thrown when attempting to retrieve image with empty ID');
        const error = await validateAsyncError(() => collection.getImage(emptyImageId));
        
        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve image from Collection "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage('Image ID cannot be empty');
    });

    test('An internal error occurs when retrieving an image', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ id: 'internal-error-retrieval', extension: 'jpg' });
        
        // First add an image to the collection
        const addedMetadata = await collection.addImage(imageFixture.filePath);
        
        // Mock database operation to simulate internal error
        sinon.stub(collection as unknown as { getDB: () => unknown }, 'getDB').throws(new Error('Database connection failed'));
        
        console.log('Validating that the correct Error is thrown when internal error occurs during image retrieval');
        const error = await validateAsyncError(() => collection.getImage(addedMetadata.id));
        
        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve image from Collection "${testCollectionName}"`);
    });
});