import { suite, test } from 'mocha';

import { Collection } from '../../../../src/collection';
import { ImageUtils } from '../../../utils/image-utils';
import { captureAssertableAsyncError } from '../../../utils';
import { ImageUpdateError, ImageNotFoundError } from '../../../../errors';

import { getImageFixture } from '@/utils/fixtures/image-fixtures';
import sinon from 'sinon';

const testCollectionName = 'test-image-update-collection';

suite('Domain - Images - Update', () => {
    test('User updates the status of an image', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ id: 'test-update-image', extension: 'jpg' });
        
        // Add an image to update
        const originalMetadata = await collection.addImage(imageFixture.filePath);
        ImageUtils.assertImageStatus(originalMetadata, 'INBOX');
        
        // Update the image status
        const updatedMetadata = await collection.updateImage(originalMetadata.id, { status: 'COLLECTION' });
        
        // Verify the returned metadata has the new status
        ImageUtils.assertImageMetadata(updatedMetadata, {
            id: originalMetadata.id,
            collection: testCollectionName,
            status: 'COLLECTION'
        });
        
        // Verify subsequent calls return the updated metadata
        const retrievedMetadata = await collection.getImage(originalMetadata.id);
        ImageUtils.assertImageStatus(retrievedMetadata, 'COLLECTION');
        
        console.log(`✓ Image ${originalMetadata.id} status successfully updated from INBOX to COLLECTION`);
    });

    test('User attempts to update the status of a non-existent image', async () => {
        const collection = Collection.create(testCollectionName);
        const nonExistentImageId = crypto.randomUUID();
        
        const error = await captureAssertableAsyncError(async () => {
            await collection.updateImage(nonExistentImageId, { status: 'COLLECTION' });
        });
        
        error
            .shouldHaveType(ImageUpdateError)
            .shouldHaveMessage(`Unable to update image: "${nonExistentImageId}" in Collection: "${testCollectionName}"`)
            .shouldHaveCause(ImageNotFoundError)
            .shouldHaveCauseMessage(`Image not found with ID: "${nonExistentImageId}"`);
        
        console.log(`✓ Non-existent image update properly rejected with error chain`);
    });

    test('User attempts to update the status of an image using an invalid image ID', async () => {
        const collection = Collection.create(testCollectionName);
        const invalidImageId = '../../../etc/passwd'; // Path traversal attempt
        
        const error = await captureAssertableAsyncError(async () => {
            await collection.updateImage(invalidImageId, { status: 'COLLECTION' });
        });
        
        error
            .shouldHaveType(ImageUpdateError)
            .shouldHaveMessage(`Unable to update image: "${invalidImageId}" in Collection: "${testCollectionName}"`)
            .shouldHaveCauseMessage('Invalid imageID');
        
        console.log(`✓ Invalid image ID properly rejected for security`);
    });

    test('User attempts to update the status of an image using an invalid status value', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ id: 'test-invalid-status', extension: 'jpg' });
        
        // Add an image to update
        const originalMetadata = await collection.addImage(imageFixture.filePath);
        
        const error = await captureAssertableAsyncError(async () => {
            // TypeScript would normally catch this, but we test runtime validation
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await collection.updateImage(originalMetadata.id, { status: 'INVALID_STATUS' as any });
        });
        
        error
            .shouldHaveType(ImageUpdateError)
            .shouldHaveMessage(`Unable to update image: "${originalMetadata.id}" in Collection: "${testCollectionName}"`)
            .shouldHaveCauseMessage('Invalid status value');
        
        console.log(`✓ Invalid status value properly rejected`);
    });

    test('An internal error occurs when the user attempts to update the status of an image', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ id: 'test-internal-error', extension: 'jpg' });
        
        // Add an image to update
        const originalMetadata = await collection.addImage(imageFixture.filePath);

        // Mock database operation to simulate internal error
        sinon.stub(collection as unknown as { getDatabase: () => unknown }, 'getDatabase').throws(new Error('Database connection failed'));

        const error = await captureAssertableAsyncError(async () => {
            await collection.updateImage(originalMetadata.id, { status: 'COLLECTION' });
        });
        
        error
            .shouldHaveType(ImageUpdateError)
            .shouldHaveMessage(`Unable to update image: "${originalMetadata.id}" in Collection: "${testCollectionName}"`);
        
        console.log(`✓ Internal errors properly wrapped in ImageUpdateError`);
    });
});