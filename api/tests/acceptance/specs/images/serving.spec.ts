import { suite, test } from 'mocha';
import { promises as fs } from 'fs';
import path from 'path';
import { Collection } from '@/domain';
import { getImageFixture } from '@/utils';

import { CollectionsAPI } from '../../../utils/collections-api-model';

const api = new CollectionsAPI(CONFIG.API_BASE_URL);

suite('API - Images - Serving', () => {
    test('Original image serving with valid collection and image IDs', async () => {
        // Given a collection exists with an image
        const collection = Collection.create('nature-photos');
        const imageFixture = await getImageFixture({
            id: 'landscape',
            width: 800,
            height: 600,
            extension: 'jpeg'
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);

        // When the client requests GET /api/images/:collectionId/:imageId
        const response = await api['/api/images/:collectionId/:imageId'].get({
            pathParams: {
                collectionId: 'nature-photos',
                imageId: imageMetadata.id
            }
        });

        // Then the API returns 200 status code
        // And the API returns the original image file content
        // And the API sets Content-Type header matching the image MIME type
        // And the API sets Content-Length header with the file size
        // And the API sets cache headers for immutable content
        response
            .shouldHaveStatus(200)
            .shouldHaveImageContent(imageFixture.buffer)
            .shouldHaveImageMimeType(imageMetadata.mime)
            .shouldHaveContentLength(imageMetadata.size)
            .shouldHaveCacheHeaders();
    });

    test('Thumbnail image serving with valid collection and image IDs', async () => {
        // Given a collection exists with an image that has a thumbnail
        const collection = Collection.create('portrait-shots');
        const imageFixture = await getImageFixture({
            id: 'headshot',
            width: 1200,
            height: 1600,
            extension: 'png'
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);

        // Read the actual thumbnail buffer from filesystem
        const thumbnailPath = path.join(
            CONFIG.COLLECTIONS_DIRECTORY,
            'portrait-shots',
            'images',
            'thumbnails',
            `${imageMetadata.id}.${imageMetadata.extension}`
        );
        const thumbnailBuffer = await fs.readFile(thumbnailPath);

        // When the client requests GET /api/images/:collectionId/:imageId/thumbnail
        const response = await api['/api/images/:collectionId/:imageId/thumbnail'].get({
            pathParams: {
                collectionId: 'portrait-shots',
                imageId: imageMetadata.id
            }
        });

        // Then the API returns 200 status code
        // And the API returns the thumbnail image file content
        // And the API sets Content-Type header for the thumbnail format
        // And the API sets Content-Length header with the thumbnail file size
        // And the API sets cache headers for immutable content
        response
            .shouldHaveStatus(200)
            .shouldHaveImageContent(thumbnailBuffer)
            .shouldHaveImageMimeType(imageMetadata.mime) // Thumbnail keeps same format as original
            .shouldHaveContentLength(thumbnailBuffer.length)
            .shouldHaveCacheHeaders();
    });

    test('Image serving with non-existent collection', async () => {
        // Given no collection exists with the specified collection ID
        // (Collection.clear() is called in beforeEach hook)

        // When the client requests GET /api/images/:collectionId/:imageId
        const response = await api['/api/images/:collectionId/:imageId'].get({
            pathParams: {
                collectionId: 'non-existent-collection',
                imageId: 'any-image-id'
            }
        });

        // Then the API returns 404 status code
        // And the API returns error message indicating collection not found
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Collection not found');
    });

    test('Image serving with non-existent image in existing collection', async () => {
        // Given a collection exists but does not contain the specified image ID
        Collection.create('empty-collection');

        // When the client requests GET /api/images/:collectionId/:imageId
        const response = await api['/api/images/:collectionId/:imageId'].get({
            pathParams: {
                collectionId: 'empty-collection',
                imageId: '12345678-1234-4123-8123-123456789012' // Valid UUID format but non-existent
            }
        });

        // Then the API returns 404 status code
        // And the API returns error message indicating image not found
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Image not found');
    });

    test('Image serving with invalid image ID format', async () => {
        // Given a collection exists
        Collection.create('test-collection');

        // When the client requests GET /api/images/:collectionId/:imageId with an invalid image ID format
        const response = await api['/api/images/:collectionId/:imageId'].get({
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

    test('Thumbnail serving with non-existent image in existing collection', async () => {
        // Given a collection exists but does not contain the specified image ID
        Collection.create('empty-thumbnail-collection');

        // When the client requests GET /api/images/:collectionId/:imageId/thumbnail
        const response = await api['/api/images/:collectionId/:imageId/thumbnail'].get({
            pathParams: {
                collectionId: 'empty-thumbnail-collection',
                imageId: '98765432-4321-4321-8321-210987654321' // Valid UUID format but non-existent
            }
        });

        // Then the API returns 404 status code
        // And the API returns error message indicating image not found
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Image not found');
    });

    test('Thumbnail serving with invalid image ID format', async () => {
        // Given a collection exists
        Collection.create('test-thumbnail-collection');

        // When the client requests GET /api/images/:collectionId/:imageId/thumbnail with an invalid image ID format
        const response = await api['/api/images/:collectionId/:imageId/thumbnail'].get({
            pathParams: {
                collectionId: 'test-thumbnail-collection',
                imageId: 'invalid-thumbnail-uuid'
            }
        });

        // Then the API returns 400 status code
        // And the API returns error message indicating invalid image ID format
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid image ID format');
    });
});