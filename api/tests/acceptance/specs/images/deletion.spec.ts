import { suite, test } from 'mocha';
import { Collection } from '@/domain';
import { getImageFixture, corruptCollectionDB } from '@/utils';

import { CollectionsAPI } from '../../../utils/collections-api-model';

const api = new CollectionsAPI(CONFIG.API_BASE_URL);

suite('API - Images - Delete', () => {
    test('Client deletes an existing image from a collection', async () => {
        // Given a collection exists with an image
        const collection = Collection.create('test-collection');
        const imageFixture = await getImageFixture({
            id: 'test-image',
            width: 600,
            height: 400,
            extension: 'jpeg'
        });

        const imageMetadata = await collection.addImage(imageFixture.filePath);

        // When the client requests DELETE /api/images/:collectionId/:imageId
        const deleteResponse = await api['/api/images/:collectionId/:imageId'].delete({
            pathParams: {
                collectionId: 'test-collection',
                imageId: imageMetadata.id
            }
        });

        // Then the API returns 204 status code
        deleteResponse.shouldHaveStatus(204);

        // And subsequent requests for the image return 404
        const getResponse = await api['/api/images/:collectionId/:imageId'].get({
            pathParams: {
                collectionId: 'test-collection',
                imageId: imageMetadata.id
            }
        });

        getResponse
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Image not found');
    });

    test('Client attempts to delete an image from a non-existent collection', async () => {
        // Given no collection exists with the specified collection ID
        // (Collection.clear() is called in beforeEach hook)

        // When the client requests DELETE /api/images/:collectionId/:imageId
        const response = await api['/api/images/:collectionId/:imageId'].delete({
            pathParams: {
                collectionId: 'non-existent-collection',
                imageId: '12345678-1234-4123-8123-123456789012'
            }
        });

        // Then the API returns 404 status code
        // And the API returns error message indicating collection not found
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Collection not found');
    });

    test('Client attempts to delete a non-existent image from an existing collection', async () => {
        // Given a collection exists but does not contain the specified image ID
        Collection.create('empty-collection');

        // When the client requests DELETE /api/images/:collectionId/:imageId with a valid UUID format
        const response = await api['/api/images/:collectionId/:imageId'].delete({
            pathParams: {
                collectionId: 'empty-collection',
                imageId: '98765432-4321-4321-8321-210987654321'
            }
        });

        // Then the API returns 404 status code
        // And the API returns error message indicating image not found
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Image not found');
    });

    test('Client attempts to delete an image using an invalid image ID format', async () => {
        // Given a collection exists
        Collection.create('test-collection');

        // When the client requests DELETE /api/images/:collectionId/:imageId with an invalid image ID format
        const response = await api['/api/images/:collectionId/:imageId'].delete({
            pathParams: {
                collectionId: 'test-collection',
                imageId: 'invalid-uuid-format'
            }
        });

        // Then the API returns 400 status code
        // And the API returns error message indicating invalid image ID format
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid image ID format');
    });

    test('Internal error occurs when deleting an image', async () => {
        // Given a collection exists with an image
        const collection = Collection.create('error-test-collection');
        const imageFixture = await getImageFixture({
            id: 'error-test-image',
            width: 600,
            height: 400,
            extension: 'jpeg'
        });
        const imageMetadata = await collection.addImage(imageFixture.filePath);

        // Corrupt the database to simulate internal error
        corruptCollectionDB(collection);

        // When the client requests DELETE /api/images/:collectionId/:imageId
        // But there is an internal error deleting the image
        const response = await api['/api/images/:collectionId/:imageId'].delete({
            pathParams: {
                collectionId: 'error-test-collection',
                imageId: imageMetadata.id
            }
        });

        // Then the API returns 500 status code
        // And the API returns error message indicating an error occurred whilst deleting the image
        response
            .shouldHaveStatus(500)
            .shouldHaveBodyWithProperty('message', 'An error occurred whilst deleting the image');
    });
});