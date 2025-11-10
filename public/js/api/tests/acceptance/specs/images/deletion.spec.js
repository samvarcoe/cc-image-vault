import { suite, test } from 'mocha';
import { Collection } from '@/domain';
import { getImageFixture, corruptCollectionDB } from '@/utils';
import { CollectionsAPI } from '../../../utils/collections-api-model';
const api = new CollectionsAPI(CONFIG.API_BASE_URL);
suite('API - Images - Delete', () => {
    test('Client deletes an existing image from a collection', async () => {
        const collection = Collection.create('test-collection');
        const imageFixture = await getImageFixture({
            filename: 'test-image.jpeg',
            width: 600,
            height: 400
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        const deleteResponse = await api['/api/images/:collectionId/:imageId'].delete({
            pathParams: {
                collectionId: 'test-collection',
                imageId: imageMetadata.id
            }
        });
        deleteResponse.shouldHaveStatus(204);
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
        const response = await api['/api/images/:collectionId/:imageId'].delete({
            pathParams: {
                collectionId: 'non-existent-collection',
                imageId: '12345678-1234-4123-8123-123456789012'
            }
        });
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Collection not found');
    });
    test('Client attempts to delete a non-existent image from an existing collection', async () => {
        Collection.create('empty-collection');
        const response = await api['/api/images/:collectionId/:imageId'].delete({
            pathParams: {
                collectionId: 'empty-collection',
                imageId: '98765432-4321-4321-8321-210987654321'
            }
        });
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Image not found');
    });
    test('Client attempts to delete an image using an invalid image ID format', async () => {
        Collection.create('test-collection');
        const response = await api['/api/images/:collectionId/:imageId'].delete({
            pathParams: {
                collectionId: 'test-collection',
                imageId: 'invalid-uuid-format'
            }
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid image ID format');
    });
    test('Internal error occurs when deleting an image', async () => {
        const collection = Collection.create('error-test-collection');
        const imageFixture = await getImageFixture({
            filename: 'error-test-image.jpeg',
            width: 600,
            height: 400
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        corruptCollectionDB(collection);
        const response = await api['/api/images/:collectionId/:imageId'].delete({
            pathParams: {
                collectionId: 'error-test-collection',
                imageId: imageMetadata.id
            }
        });
        response
            .shouldHaveStatus(500)
            .shouldHaveBodyWithProperty('message', 'An error occurred whilst deleting the image');
    });
});
