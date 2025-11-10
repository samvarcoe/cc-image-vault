import { suite, test } from 'mocha';
import { Collection } from '@/domain';
import { getImageFixture, corruptCollectionDB } from '@/utils';
import { CollectionsAPI } from '../../../utils/collections-api-model';
import { AssertableResponse } from '../../../utils/assertable-response';
const api = new CollectionsAPI(CONFIG.API_BASE_URL);
suite('API - Images - Updating Image Status', () => {
    test('Client updates the status of an image', async () => {
        const collection = Collection.create('test-collection');
        const imageFixture = await getImageFixture({
            filename: 'test-image.jpeg',
            width: 600,
            height: 400
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        const updateRequest = {
            status: 'COLLECTION'
        };
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'test-collection',
                imageId: imageMetadata.id
            },
            body: updateRequest
        });
        response
            .shouldHaveStatus(200)
            .shouldHaveBodyWithProperty('id', imageMetadata.id)
            .shouldHaveBodyWithProperty('collection', 'test-collection')
            .shouldHaveBodyWithProperty('status', 'COLLECTION')
            .shouldHaveBodyWithProperty('name', imageMetadata.name)
            .shouldHaveBodyWithProperty('extension', imageMetadata.extension)
            .shouldHaveBodyWithProperty('mime', imageMetadata.mime)
            .shouldHaveBodyWithProperty('size', imageMetadata.size)
            .shouldHaveBodyWithProperty('hash', imageMetadata.hash)
            .shouldHaveBodyWithProperty('width', imageMetadata.width)
            .shouldHaveBodyWithProperty('height', imageMetadata.height)
            .shouldHaveBodyWithProperty('aspect', imageMetadata.aspect)
            .shouldHaveBodyWithProperty('created', imageMetadata.created.toISOString())
            .shouldNotHaveBodyWithProperty('updated', imageMetadata.updated.toISOString());
    });
    test('Client attempts to update the status of an image in a collection that doesn\'t exist', async () => {
        const updateRequest = {
            status: 'COLLECTION'
        };
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'non-existent-collection',
                imageId: '12345678-1234-4123-8123-123456789012'
            },
            body: updateRequest
        });
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Collection not found');
    });
    test('Client attempts to update the status of an image that doesn\'t exist', async () => {
        Collection.create('empty-collection');
        const updateRequest = {
            status: 'ARCHIVE'
        };
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'empty-collection',
                imageId: '98765432-4321-4321-8321-210987654321'
            },
            body: updateRequest
        });
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Image not found');
    });
    test('Client attempts to update the status of an image using an invalid image ID format', async () => {
        Collection.create('test-collection');
        const updateRequest = {
            status: 'INBOX'
        };
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'test-collection',
                imageId: 'invalid-uuid-format'
            },
            body: updateRequest
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid image ID format');
    });
    test('Client attempts to update the status of an image using an invalid status value', async () => {
        const collection = Collection.create('status-test-collection');
        const imageFixture = await getImageFixture({
            filename: 'status-test-image.png',
            width: 400,
            height: 300
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        const updateRequest = {
            status: 'INVALID_STATUS'
        };
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'status-test-collection',
                imageId: imageMetadata.id
            },
            body: updateRequest
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid status value');
    });
    test('Client sends a status update request with a missing request body', async () => {
        const collection = Collection.create('body-test-collection');
        const imageFixture = await getImageFixture({
            filename: 'body-test-image.webp',
            width: 500,
            height: 300
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'body-test-collection',
                imageId: imageMetadata.id
            }
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Request body is required');
    });
    test('Client sends a status update request with a malformed request body', async () => {
        const collection = Collection.create('malformed-test-collection');
        const imageFixture = await getImageFixture({
            filename: 'malformed-test-image.jpeg',
            width: 800,
            height: 600
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        const url = new URL(`${CONFIG.API_BASE_URL}/api/images/${collection.name}/${imageMetadata.id}`);
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: 'malformed json {'
        });
        const assertableResponse = await AssertableResponse.fromResponse(response);
        assertableResponse
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Malformed request body');
    });
    test('Client sends a status update request with a missing status field', async () => {
        const collection = Collection.create('missing-field-collection');
        const imageFixture = await getImageFixture({
            filename: 'missing-field-image.png',
            width: 300,
            height: 400
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'missing-field-collection',
                imageId: imageMetadata.id
            },
            body: {}
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Status field is required');
    });
    test('An internal error occurs when a client attempts to update an image status', async () => {
        const collection = Collection.create('error-test-collection');
        const imageFixture = await getImageFixture({
            filename: 'error-test-image.jpeg',
            width: 600,
            height: 400
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        corruptCollectionDB(collection);
        const updateRequest = {
            status: 'ARCHIVE'
        };
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'error-test-collection',
                imageId: imageMetadata.id
            },
            body: updateRequest
        });
        response
            .shouldHaveStatus(500)
            .shouldHaveBodyWithProperty('message', 'An error occurred whilst updating the image');
    });
});
