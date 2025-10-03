import { suite, test } from 'mocha';
import { Collection } from '@/domain';
import { getImageFixture, corruptCollectionDB } from '@/utils';

import { CollectionsAPI } from '../../../utils/collections-api-model';

const api = new CollectionsAPI(CONFIG.API_BASE_URL);

suite('API - Images - Individual Download', () => {
    test('Client downloads an existing image with original filename', async () => {
        // Given a collection exists with an image
        const collection = Collection.create('vacation-photos');
        const imageFixture = await getImageFixture({
            filename: 'sunset-beach.jpeg',
            width: 1920,
            height: 1080
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);

        // When the client requests GET /api/images/:collectionId/:imageId/download
        const response = await api['/api/images/:collectionId/:imageId/download'].get({
            pathParams: {
                collectionId: 'vacation-photos',
                imageId: imageMetadata.id
            }
        });

        // Then the API returns 200 status code
        // And the API returns the original image file content
        // And the API sets Content-Disposition header to attachment with original filename
        // And the API sets Content-Type header matching the image MIME type
        // And the API sets Content-Length header with the file size
        response
            .shouldHaveStatus(200)
            .shouldHaveImageContent(imageFixture.buffer)
            .shouldHaveContentDispositionAttachment(`${imageMetadata.name}.${imageMetadata.extension}`)
            .shouldHaveImageMimeType(imageMetadata.mime)
            .shouldHaveContentLength(imageMetadata.size);
    });

    test('Client attempts to download an image from a non-existent collection', async () => {
        // Given no collection exists with the specified collection ID
        // (Collection.clear() is called in beforeEach hook)

        // When the client requests GET /api/images/:collectionId/:imageId/download
        const response = await api['/api/images/:collectionId/:imageId/download'].get({
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

    test('Client attempts to download a non-existent image from an existing collection', async () => {
        // Given a collection exists but does not contain the specified image ID
        Collection.create('empty-downloads-collection');

        // When the client requests GET /api/images/:collectionId/:imageId/download with a valid UUID format
        const response = await api['/api/images/:collectionId/:imageId/download'].get({
            pathParams: {
                collectionId: 'empty-downloads-collection',
                imageId: '98765432-4321-4321-8321-210987654321' // Valid UUID format but non-existent
            }
        });

        // Then the API returns 404 status code
        // And the API returns error message indicating image not found
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Image not found');
    });

    test('Client attempts to download an image using an invalid image ID format', async () => {
        // Given a collection exists
        Collection.create('format-test-collection');

        // When the client requests GET /api/images/:collectionId/:imageId/download with an invalid image ID format
        const response = await api['/api/images/:collectionId/:imageId/download'].get({
            pathParams: {
                collectionId: 'format-test-collection',
                imageId: 'invalid-uuid-format'
            }
        });

        // Then the API returns 400 status code
        // And the API returns error message indicating invalid image ID format
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid image ID format');
    });

    test('Internal error occurs when downloading an image', async () => {
        // Given a collection exists with an image
        const collection = Collection.create('error-test-collection');
        const imageFixture = await getImageFixture({
            filename: 'error-image.png',
            width: 800,
            height: 600
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);

        // Corrupt the database to cause an internal error when reading image metadata
        corruptCollectionDB(collection);

        // When the client requests GET /api/images/:collectionId/:imageId/download
        // But there is an internal error serving the image
        const response = await api['/api/images/:collectionId/:imageId/download'].get({
            pathParams: {
                collectionId: 'error-test-collection',
                imageId: imageMetadata.id
            }
        });

        // Then the API returns 500 status code
        // And the API returns error message indicating an error occurred whilst downloading the image
        response
            .shouldHaveStatus(500)
            .shouldHaveBodyWithProperty('message', 'An error occurred whilst downloading the image');
    });
});