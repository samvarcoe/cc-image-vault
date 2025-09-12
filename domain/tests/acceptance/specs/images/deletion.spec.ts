import { suite, test } from 'mocha';
import sinon from 'sinon';

import { Collection } from '../../../../src/collection';
import { ImageUtils } from '../../../utils/image-utils';
import { captureAssertableAsyncError } from '../../../utils';
import { ImageDeletionError, ImageNotFoundError, ImageRetrievalError } from '../../../../errors';

import { getImageFixture } from '@/utils/fixtures/image-fixtures';

const testCollectionName = 'test-image-deletion';

suite('Domain - Images - Delete', () => {
    test('User deletes an image from a Collection', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ id: 'deletion-test', extension: 'jpg' });
        
        // First add an image to the collection
        const addedMetadata = await collection.addImage(imageFixture.filePath);
        
        // Verify the image files exist before deletion
        await ImageUtils.assertImageFileExists(testCollectionName, `${addedMetadata.id}.jpg`, 'original');
        await ImageUtils.assertImageFileExists(testCollectionName, `${addedMetadata.id}.jpg`, 'thumbnail');
        
        // Delete the image using the correct ID
        await collection.deleteImage(addedMetadata.id);
        
        // Verify the original image file is removed from the Collection's images/original directory
        await ImageUtils.assertImageFileDoesNotExist(testCollectionName, `${addedMetadata.id}.jpg`, 'original');
        
        // Verify the thumbnail file is removed from the Collection's images/thumbnails directory
        await ImageUtils.assertImageFileDoesNotExist(testCollectionName, `${addedMetadata.id}.jpg`, 'thumbnail');
        
        // Verify subsequent attempts to retrieve the image throw "ImageNotFoundError"
        console.log('Validating that subsequent retrieval attempts throw ImageNotFoundError');
        const error = await captureAssertableAsyncError(() => collection.getImage(addedMetadata.id));
        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve image: "${addedMetadata.id}" from Collection: "${testCollectionName}"`)
            .shouldHaveCause(ImageNotFoundError)
            .shouldHaveCauseMessage(`Image not found with ID: "${addedMetadata.id}"`);
            
        console.log(`✓ Image ${addedMetadata.id} successfully deleted from Collection "${testCollectionName}"`);
    });

    test('User attempts to delete a non-existent image', async () => {
        const collection = Collection.create(testCollectionName);
        const nonExistentImageId = crypto.randomUUID();
        
        console.log('Validating that the correct Error is thrown when attempting to delete non-existent image');
        const error = await captureAssertableAsyncError(() => collection.deleteImage(nonExistentImageId));
        
        error
            .shouldHaveType(ImageDeletionError)
            .shouldHaveMessage(`Unable to delete image: "${nonExistentImageId}" from Collection: "${testCollectionName}"`)
            .shouldHaveCause(ImageNotFoundError)
            .shouldHaveCauseMessage(`Image not found with ID: "${nonExistentImageId}"`);
    });

    test('User attempts to delete an image using an invalid image ID', async () => {
        const collection = Collection.create(testCollectionName);
        const invalidImageId = 'invalid<>id'; // Contains unsafe characters
        
        console.log('Validating that the correct Error is thrown when attempting to delete image with invalid ID');
        const error = await captureAssertableAsyncError(() => collection.deleteImage(invalidImageId));
        
        error
            .shouldHaveType(ImageDeletionError)
            .shouldHaveMessage(`Unable to delete image: "${invalidImageId}" from Collection: "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage('Invalid imageID');
    });

    test('An internal error occurs when deleting an image', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ id: 'internal-error-deletion', extension: 'jpg' });
        
        // First add an image to the collection
        const addedMetadata = await collection.addImage(imageFixture.filePath);
        
        // Verify the image files exist before attempting deletion
        await ImageUtils.assertImageFileExists(testCollectionName, `${addedMetadata.id}.jpg`, 'original');
        await ImageUtils.assertImageFileExists(testCollectionName, `${addedMetadata.id}.jpg`, 'thumbnail');
        
        // Mock database operation to simulate internal error
        sinon.stub(collection as unknown as { getDatabase: () => unknown }, 'getDatabase').throws(new Error('Database connection failed'));

        console.log('Validating that the correct Error is thrown when internal error occurs during image deletion');
        const error = await captureAssertableAsyncError(() => collection.deleteImage(addedMetadata.id));
        
        error
            .shouldHaveType(ImageDeletionError)
            .shouldHaveMessage(`Unable to delete image: "${addedMetadata.id}" from Collection: "${testCollectionName}"`);
            
        // Verify no image files are removed (atomic behavior)
        await ImageUtils.assertImageFileExists(testCollectionName, `${addedMetadata.id}.jpg`, 'original');
        await ImageUtils.assertImageFileExists(testCollectionName, `${addedMetadata.id}.jpg`, 'thumbnail');
        
        console.log(`✓ Collection "${testCollectionName}" remains unchanged after internal error`);
    });
});