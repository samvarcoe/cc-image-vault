import { suite, test } from 'mocha';
import { promises as fs } from 'fs';
import path from 'path';
import { Collection } from '@/domain';
import { getImageFixture } from '@/utils';
import { CollectionsAPI } from '../../../utils/collections-api-model';
const api = new CollectionsAPI(CONFIG.API_BASE_URL);
suite('API - Images - Serving', () => {
    test('Original image serving with valid collection and image IDs', async () => {
        const collection = Collection.create('nature-photos');
        const imageFixture = await getImageFixture({
            filename: 'landscape.jpeg',
            width: 800,
            height: 600
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        const response = await api['/api/images/:collectionId/:imageId'].get({
            pathParams: {
                collectionId: 'nature-photos',
                imageId: imageMetadata.id
            }
        });
        response
            .shouldHaveStatus(200)
            .shouldHaveImageContent(imageFixture.buffer)
            .shouldHaveImageMimeType(imageMetadata.mime)
            .shouldHaveContentLength(imageMetadata.size)
            .shouldHaveCacheHeaders();
    });
    test('Thumbnail image serving with valid collection and image IDs', async () => {
        const collection = Collection.create('portrait-shots');
        const imageFixture = await getImageFixture({
            filename: 'headshot.png',
            width: 1200,
            height: 1600
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        const thumbnailPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, 'portrait-shots', 'images', 'thumbnails', `${imageMetadata.id}.${imageMetadata.extension}`);
        const thumbnailBuffer = await fs.readFile(thumbnailPath);
        const response = await api['/api/images/:collectionId/:imageId/thumbnail'].get({
            pathParams: {
                collectionId: 'portrait-shots',
                imageId: imageMetadata.id
            }
        });
        response
            .shouldHaveStatus(200)
            .shouldHaveImageContent(thumbnailBuffer)
            .shouldHaveImageMimeType(imageMetadata.mime)
            .shouldHaveContentLength(thumbnailBuffer.length)
            .shouldHaveCacheHeaders();
    });
    test('Image serving with non-existent collection', async () => {
        const response = await api['/api/images/:collectionId/:imageId'].get({
            pathParams: {
                collectionId: 'non-existent-collection',
                imageId: 'any-image-id'
            }
        });
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Collection not found');
    });
    test('Image serving with non-existent image in existing collection', async () => {
        Collection.create('empty-collection');
        const response = await api['/api/images/:collectionId/:imageId'].get({
            pathParams: {
                collectionId: 'empty-collection',
                imageId: '12345678-1234-4123-8123-123456789012'
            }
        });
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Image not found');
    });
    test('Image serving with invalid image ID format', async () => {
        Collection.create('test-collection');
        const response = await api['/api/images/:collectionId/:imageId'].get({
            pathParams: {
                collectionId: 'test-collection',
                imageId: 'invalid-uuid-format'
            }
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid image ID format');
    });
    test('Thumbnail serving with non-existent image in existing collection', async () => {
        Collection.create('empty-thumbnail-collection');
        const response = await api['/api/images/:collectionId/:imageId/thumbnail'].get({
            pathParams: {
                collectionId: 'empty-thumbnail-collection',
                imageId: '98765432-4321-4321-8321-210987654321'
            }
        });
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Image not found');
    });
    test('Thumbnail serving with invalid image ID format', async () => {
        Collection.create('test-thumbnail-collection');
        const response = await api['/api/images/:collectionId/:imageId/thumbnail'].get({
            pathParams: {
                collectionId: 'test-thumbnail-collection',
                imageId: 'invalid-thumbnail-uuid'
            }
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid image ID format');
    });
});
