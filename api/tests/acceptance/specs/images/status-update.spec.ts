import { suite, test } from 'mocha';
import { Collection } from '@/domain';
import { getImageFixture, corruptCollectionDB } from '@/utils';

import { CollectionsAPI, ImageUpdateRequest } from '../../../utils/collections-api-model';
import { AssertableResponse } from '../../../utils/assertable-response';

const api = new CollectionsAPI(CONFIG.API_BASE_URL);

suite('API - Images - Updating Image Status', () => {
    test('Client updates the status of an image', async () => {
        // Given a collection exists with an image
        const collection = Collection.create('test-collection');
        const imageFixture = await getImageFixture({
            id: 'test-image',
            width: 600,
            height: 400,
            extension: 'jpeg'
        });

        const imageMetadata = await collection.addImage(imageFixture.filePath);

        const updateRequest: ImageUpdateRequest = {
            status: 'COLLECTION'
        };

        // When the client requests PATCH /api/images/:collectionId/:imageId with body containing valid status
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'test-collection',
                imageId: imageMetadata.id
            },
            body: updateRequest
        });

        // Then the API returns 200 status code
        // And the API returns the complete updated ImageMetadata
        // And the returned metadata reflects the new status
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
        // Given no collection exists with a specific collection ID
        // (Collection.clear() is called in beforeEach hook)

        const updateRequest: ImageUpdateRequest = {
            status: 'COLLECTION'
        };

        // When the client requests PATCH /api/images/:collectionId/:imageId with that collection ID
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'non-existent-collection',
                imageId: '12345678-1234-4123-8123-123456789012'
            },
            body: updateRequest
        });

        // Then the API returns 404 status code
        // And the API returns error message indicating collection not found
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Collection not found');
    });

    test('Client attempts to update the status of an image that doesn\'t exist', async () => {
        // Given a collection exists that does not contain an image with a specific image ID
        Collection.create('empty-collection');

        const updateRequest: ImageUpdateRequest = {
            status: 'ARCHIVE'
        };

        // When the client requests PATCH /api/images/:collectionId/:imageId with that image ID
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'empty-collection',
                imageId: '98765432-4321-4321-8321-210987654321'
            },
            body: updateRequest
        });

        // Then the API returns 404 status code
        // And the API returns error message indicating image not found
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Image not found');
    });

    test('Client attempts to update the status of an image using an invalid image ID format', async () => {
        // Given a collection exists
        Collection.create('test-collection');

        const updateRequest: ImageUpdateRequest = {
            status: 'INBOX'
        };

        // When the client requests PATCH /api/images/:collectionId/:imageId with an invalid image ID format
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'test-collection',
                imageId: 'invalid-uuid-format'
            },
            body: updateRequest
        });

        // Then the API returns 400 status code
        // And the API returns error message indicating invalid image ID format
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid image ID format');
    });

    test('Client attempts to update the status of an image using an invalid status value', async () => {
        // Given a collection exists with an image
        const collection = Collection.create('status-test-collection');
        const imageFixture = await getImageFixture({
            id: 'status-test-image',
            width: 400,
            height: 300,
            extension: 'png'
        });
        const imageMetadata = await collection.addImage(imageFixture.filePath);

        const updateRequest: ImageUpdateRequest = {
            status: 'INVALID_STATUS'
        };

        // When the client requests PATCH /api/images/:collectionId/:imageId with body containing invalid status value
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'status-test-collection',
                imageId: imageMetadata.id
            },
            body: updateRequest
        });

        // Then the API returns 400 status code
        // And the API returns error message indicating invalid status value
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid status value');
    });

    test('Client sends a status update request with a missing request body', async () => {
        // Given a collection exists with an image
        const collection = Collection.create('body-test-collection');
        const imageFixture = await getImageFixture({
            id: 'body-test-image',
            width: 500,
            height: 300,
            extension: 'webp'
        });
        const imageMetadata = await collection.addImage(imageFixture.filePath);

        // When the client requests PATCH /api/images/:collectionId/:imageId with no request body
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'body-test-collection',
                imageId: imageMetadata.id
            }
            // No body provided
        });

        // Then the API returns 400 status code
        // And the API returns error message indicating request body is required
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Request body is required');
    });

    test('Client sends a status update request with a malformed request body', async () => {
        // Given a collection exists with an image
        const collection = Collection.create('malformed-test-collection');
        const imageFixture = await getImageFixture({
            id: 'malformed-test-image',
            width: 800,
            height: 600,
            extension: 'jpeg'
        });
        const imageMetadata = await collection.addImage(imageFixture.filePath);

        // When the client requests PATCH /api/images/:collectionId/:imageId with malformed request body
        // We'll simulate this by sending non-JSON content
        const url = new URL(`${CONFIG.API_BASE_URL}/api/images/${collection.name}/${imageMetadata.id}`);

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: 'malformed json {'
        });

        const assertableResponse = await AssertableResponse.fromResponse(response);

        // Then the API returns 400 status code
        // And the API returns error message indicating malformed request body
        assertableResponse
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Malformed request body');
    });

    test('Client sends a status update request with a missing status field', async () => {
        // Given a collection exists with an image
        const collection = Collection.create('missing-field-collection');
        const imageFixture = await getImageFixture({
            id: 'missing-field-image',
            width: 300,
            height: 400,
            extension: 'png'
        });
        const imageMetadata = await collection.addImage(imageFixture.filePath);

        // When the client requests PATCH /api/images/:collectionId/:imageId with body missing status field
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'missing-field-collection',
                imageId: imageMetadata.id
            },
            body: {} as ImageUpdateRequest  // Empty body missing status field
        });

        // Then the API returns 400 status code
        // And the API returns error message indicating status field is required
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Status field is required');
    });

    test('An internal error occurs when a client attempts to update an image status', async () => {
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

        const updateRequest: ImageUpdateRequest = {
            status: 'ARCHIVE'
        };

        // When the client requests PATCH /api/images/:collectionId/:imageId with body containing valid status
        // But there is an internal error updating the image
        const response = await api['/api/images/:collectionId/:imageId'].patch({
            pathParams: {
                collectionId: 'error-test-collection',
                imageId: imageMetadata.id
            },
            body: updateRequest
        });

        // Then the API returns 500 status code
        // And the API returns error message indicating an error occurred whilst updating the image
        response
            .shouldHaveStatus(500)
            .shouldHaveBodyWithProperty('message', 'An error occurred whilst updating the image');
    });
});