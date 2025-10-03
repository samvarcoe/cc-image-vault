import { suite, test } from 'mocha';
import { Collection } from '@/domain';
import { getImageFixture, corruptCollectionDB } from '@/utils';

import { CollectionsAPI } from '../../../utils/collections-api-model';

const api = new CollectionsAPI(CONFIG.API_BASE_URL);

suite('API - Images - Upload', () => {
    test('Successful image upload to existing collection', async () => {
        // Given a collection exists
        Collection.create('test-upload-collection');
        const imageFixture = await getImageFixture({
            filename: 'upload-test.jpeg',
            width: 800,
            height: 600
        });

        // When the client uploads an image file via POST /api/images/:collectionId
        const formData = new FormData();
        formData.append('file', new Blob([imageFixture.buffer.buffer as ArrayBuffer], { type: 'image/jpeg' }), 'test-image.jpeg');

        const response = await api['/api/images/:collectionId'].post({
            pathParams: {
                collectionId: 'test-upload-collection'
            },
            body: formData
        });

        // Then the API returns 201 status code
        // And the API returns the created image metadata with generated ID
        // And the image metadata includes collection, name, extension, mime, size, dimensions, and timestamps
        response
            .shouldHaveStatus(201)
            .shouldHaveBodyWithProperty('id')
            .shouldHaveBodyWithProperty('collection', 'test-upload-collection')
            .shouldHaveBodyWithProperty('name', 'test-image')
            .shouldHaveBodyWithProperty('extension', 'jpg')
            .shouldHaveBodyWithProperty('mime', 'image/jpeg')
            .shouldHaveBodyWithProperty('size')
            .shouldHaveBodyWithProperty('width')
            .shouldHaveBodyWithProperty('height')
            .shouldHaveBodyWithProperty('status', 'INBOX')
            .shouldHaveBodyWithProperty('created')
            .shouldHaveBodyWithProperty('updated');

        
        const getResponse = await api['/api/images/:collectionId/:imageId'].get({
            pathParams: {
                collectionId: 'test-upload-collection',
                imageId: response.body!.id
            }
        });

        getResponse
            .shouldHaveStatus(200)
            .shouldHaveImageContent(imageFixture.buffer)
    });

    test('Image upload with no file provided', async () => {
        // Given a collection exists
        Collection.create('no-file-collection');

        // When the client sends POST /api/images/:collectionId without a file
        const response = await api['/api/images/:collectionId'].post({
            pathParams: {
                collectionId: 'no-file-collection'
            },
            body: new FormData() // Empty form data
        });

        // Then the API returns 400 status code
        // And the API returns error message indicating file is required
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'File is required');
    });

    test('Image upload to non-existent collection', async () => {
        // Given no collection exists with the specified collection ID
        // (Collection.clear() is called in beforeEach hook)
        const imageFixture = await getImageFixture({
            filename: 'nonexistent-collection-test.jpg'
        });

        // When the client uploads an image file via POST /api/images/:collectionId
        const formData = new FormData();
        formData.append('file', new Blob([imageFixture.buffer.buffer as ArrayBuffer], { type: 'image/jpeg' }), 'test.jpg');

        const response = await api['/api/images/:collectionId'].post({
            pathParams: {
                collectionId: 'non-existent-collection'
            },
            body: formData
        });

        // Then the API returns 404 status code
        // And the API returns error message indicating collection not found
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Collection not found');
    });

    test('Image upload with unsupported file type', async () => {
        // Given a collection exists
        Collection.create('unsupported-file-collection');

        // When the client uploads a non-image file via POST /api/images/:collectionId
        const textContent = 'This is not an image file';
        const formData = new FormData();
        formData.append('file', new Blob([textContent], { type: 'text/plain' }), 'document.txt');

        const response = await api['/api/images/:collectionId'].post({
            pathParams: {
                collectionId: 'unsupported-file-collection'
            },
            body: formData
        });

        // Then the API returns 400 status code
        // And the API returns error message from domain layer validation
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message');

        // The exact message will come from domain layer validation
    });

    test('Image upload with corrupted file', async () => {
        // Given a collection exists
        Collection.create('corrupted-file-collection');

        // When the client uploads a corrupted image file via POST /api/images/:collectionId
        const corruptedImageData = Buffer.from('corrupted-image-data-not-valid');
        const formData = new FormData();
        formData.append('file', new Blob([corruptedImageData], { type: 'image/jpeg' }), 'corrupted.jpg');

        const response = await api['/api/images/:collectionId'].post({
            pathParams: {
                collectionId: 'corrupted-file-collection'
            },
            body: formData
        });

        // Then the API returns 400 status code
        // And the API returns error message from domain layer validation
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message');

        // The exact message will come from domain layer validation
    });

    test('Internal server error during image processing', async () => {
        // Given a collection exists
        const collection = Collection.create('internal-error-collection');
        const imageFixture = await getImageFixture({
            filename: 'internal-error-test.png'
        });

        // Corrupt the collection database to simulate internal error
        corruptCollectionDB(collection);

        // When the client uploads an image file and the domain layer encounters an internal error
        const formData = new FormData();
        formData.append('file', new Blob([imageFixture.buffer.buffer as ArrayBuffer], { type: 'image/png' }), 'test.png');

        const response = await api['/api/images/:collectionId'].post({
            pathParams: {
                collectionId: 'internal-error-collection'
            },
            body: formData
        });

        // Then the API returns 500 status code
        // And the API returns generic error message without exposing internal details
        response
            .shouldHaveStatus(500)
            .shouldHaveBodyWithProperty('message', 'An error occurred whilst uploading the image');
    });
});