import { suite, test } from 'mocha';
import { Collection } from '@/domain';
import { getImageFixture, corruptCollectionDB } from '@/utils';
import { CollectionsAPI } from '../../../utils/collections-api-model';
const api = new CollectionsAPI(CONFIG.API_BASE_URL);
suite('API - Images - Individual Download', () => {
    test('Client downloads an existing image with original filename', async () => {
        const collection = Collection.create('vacation-photos');
        const imageFixture = await getImageFixture({
            filename: 'sunset-beach.jpeg',
            width: 1920,
            height: 1080
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        const response = await api['/api/images/:collectionId/:imageId/download'].get({
            pathParams: {
                collectionId: 'vacation-photos',
                imageId: imageMetadata.id
            }
        });
        response
            .shouldHaveStatus(200)
            .shouldHaveImageContent(imageFixture.buffer)
            .shouldHaveContentDispositionAttachment(`${imageMetadata.name}.${imageMetadata.extension}`)
            .shouldHaveImageMimeType(imageMetadata.mime)
            .shouldHaveContentLength(imageMetadata.size);
    });
    test('Client attempts to download an image from a non-existent collection', async () => {
        const response = await api['/api/images/:collectionId/:imageId/download'].get({
            pathParams: {
                collectionId: 'non-existent-collection',
                imageId: '12345678-1234-4123-8123-123456789012'
            }
        });
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Collection not found');
    });
    test('Client attempts to download a non-existent image from an existing collection', async () => {
        Collection.create('empty-downloads-collection');
        const response = await api['/api/images/:collectionId/:imageId/download'].get({
            pathParams: {
                collectionId: 'empty-downloads-collection',
                imageId: '98765432-4321-4321-8321-210987654321'
            }
        });
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Image not found');
    });
    test('Client attempts to download an image using an invalid image ID format', async () => {
        Collection.create('format-test-collection');
        const response = await api['/api/images/:collectionId/:imageId/download'].get({
            pathParams: {
                collectionId: 'format-test-collection',
                imageId: 'invalid-uuid-format'
            }
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid image ID format');
    });
    test('Internal error occurs when downloading an image', async () => {
        const collection = Collection.create('error-test-collection');
        const imageFixture = await getImageFixture({
            filename: 'error-image.png',
            width: 800,
            height: 600
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        corruptCollectionDB(collection);
        const response = await api['/api/images/:collectionId/:imageId/download'].get({
            pathParams: {
                collectionId: 'error-test-collection',
                imageId: imageMetadata.id
            }
        });
        response
            .shouldHaveStatus(500)
            .shouldHaveBodyWithProperty('message', 'An error occurred whilst downloading the image');
    });
});
