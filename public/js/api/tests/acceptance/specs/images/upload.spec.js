import { suite, test } from 'mocha';
import { Collection } from '@/domain';
import { getImageFixture, corruptCollectionDB } from '@/utils';
import { CollectionsAPI } from '../../../utils/collections-api-model';
const api = new CollectionsAPI(CONFIG.API_BASE_URL);
suite('API - Images - Upload', () => {
    test('Successful image upload to existing collection', async () => {
        Collection.create('test-upload-collection');
        const imageFixture = await getImageFixture({
            filename: 'upload-test.jpeg',
            width: 800,
            height: 600
        });
        const formData = new FormData();
        formData.append('file', new Blob([imageFixture.buffer.buffer], { type: 'image/jpeg' }), 'test-image.jpeg');
        const response = await api['/api/images/:collectionId'].post({
            pathParams: {
                collectionId: 'test-upload-collection'
            },
            body: formData
        });
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
                imageId: response.body.id
            }
        });
        getResponse
            .shouldHaveStatus(200)
            .shouldHaveImageContent(imageFixture.buffer);
    });
    test('Image upload with no file provided', async () => {
        Collection.create('no-file-collection');
        const response = await api['/api/images/:collectionId'].post({
            pathParams: {
                collectionId: 'no-file-collection'
            },
            body: new FormData()
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'File is required');
    });
    test('Image upload to non-existent collection', async () => {
        const imageFixture = await getImageFixture({
            filename: 'nonexistent-collection-test.jpg'
        });
        const formData = new FormData();
        formData.append('file', new Blob([imageFixture.buffer.buffer], { type: 'image/jpeg' }), 'test.jpg');
        const response = await api['/api/images/:collectionId'].post({
            pathParams: {
                collectionId: 'non-existent-collection'
            },
            body: formData
        });
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Collection not found');
    });
    test('Image upload with unsupported file type', async () => {
        Collection.create('unsupported-file-collection');
        const textContent = 'This is not an image file';
        const formData = new FormData();
        formData.append('file', new Blob([textContent], { type: 'text/plain' }), 'document.txt');
        const response = await api['/api/images/:collectionId'].post({
            pathParams: {
                collectionId: 'unsupported-file-collection'
            },
            body: formData
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message');
    });
    test('Image upload with corrupted file', async () => {
        Collection.create('corrupted-file-collection');
        const corruptedImageData = Buffer.from('corrupted-image-data-not-valid');
        const formData = new FormData();
        formData.append('file', new Blob([corruptedImageData], { type: 'image/jpeg' }), 'corrupted.jpg');
        const response = await api['/api/images/:collectionId'].post({
            pathParams: {
                collectionId: 'corrupted-file-collection'
            },
            body: formData
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message');
    });
    test('Internal server error during image processing', async () => {
        const collection = Collection.create('internal-error-collection');
        const imageFixture = await getImageFixture({
            filename: 'internal-error-test.png'
        });
        corruptCollectionDB(collection);
        const formData = new FormData();
        formData.append('file', new Blob([imageFixture.buffer.buffer], { type: 'image/png' }), 'test.png');
        const response = await api['/api/images/:collectionId'].post({
            pathParams: {
                collectionId: 'internal-error-collection'
            },
            body: formData
        });
        response
            .shouldHaveStatus(500)
            .shouldHaveBodyWithProperty('message', 'An error occurred whilst uploading the image');
    });
});
