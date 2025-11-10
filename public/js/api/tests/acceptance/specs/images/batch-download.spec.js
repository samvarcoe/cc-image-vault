import { suite, test } from 'mocha';
import { Collection } from '@/domain';
import { getImageFixture, corruptCollectionDB } from '@/utils';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { CollectionsAPI } from '../../../utils/collections-api-model';
const api = new CollectionsAPI(CONFIG.API_BASE_URL);
suite('API - Images - Batch Download', () => {
    test('Client downloads multiple images with unique filenames', async () => {
        const collection = Collection.create('batch-download-unique');
        const image1Fixture = await getImageFixture({
            filename: 'photo-1.jpeg',
            width: 1920,
            height: 1080
        });
        const image1Metadata = await collection.addImage(image1Fixture.filename, image1Fixture.buffer);
        const image2Fixture = await getImageFixture({
            filename: 'photo-2.png',
            width: 1024,
            height: 768
        });
        const image2Metadata = await collection.addImage(image2Fixture.filename, image2Fixture.buffer);
        const image3Fixture = await getImageFixture({
            filename: 'photo-3.webp',
            width: 800,
            height: 600
        });
        const image3Metadata = await collection.addImage(image3Fixture.filename, image3Fixture.buffer);
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-unique'
            },
            body: {
                imageIds: [image1Metadata.id, image2Metadata.id, image3Metadata.id],
                archiveName: 'vacation-photos'
            }
        });
        response
            .shouldHaveStatus(200)
            .shouldHaveContentDispositionAttachment('vacation-photos.zip')
            .shouldHaveHeader('Content-Type', 'application/zip')
            .shouldHaveZipContent([
            { name: `${image1Metadata.name}.${image1Metadata.extension}`, content: image1Fixture.buffer },
            { name: `${image2Metadata.name}.${image2Metadata.extension}`, content: image2Fixture.buffer },
            { name: `${image3Metadata.name}.${image3Metadata.extension}`, content: image3Fixture.buffer }
        ]);
    });
    test('Client downloads multiple images with duplicate filenames', async () => {
        const collection = Collection.create('batch-download-duplicates');
        const tempDir = join(tmpdir(), randomUUID());
        mkdirSync(tempDir, { recursive: true });
        const fixture1 = await getImageFixture({
            filename: 'photo-1.jpeg',
            width: 1920,
            height: 1080
        });
        const image1Metadata = await collection.addImage('photo.jpeg', fixture1.buffer);
        const fixture2 = await getImageFixture({
            filename: 'photo-2.jpeg',
            width: 1024,
            height: 768
        });
        const image2Metadata = await collection.addImage('photo.jpeg', fixture2.buffer);
        const fixture3 = await getImageFixture({
            filename: 'photo-3.jpeg',
            width: 800,
            height: 600
        });
        const image3Metadata = await collection.addImage('photo.jpeg', fixture3.buffer);
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-duplicates'
            },
            body: {
                imageIds: [image1Metadata.id, image2Metadata.id, image3Metadata.id],
                archiveName: 'duplicate-photos'
            }
        });
        response
            .shouldHaveStatus(200)
            .shouldHaveZipContent([
            { name: `${image1Metadata.name}.${image1Metadata.extension}`, content: fixture1.buffer },
            { name: `${image2Metadata.name}_001.${image2Metadata.extension}`, content: fixture2.buffer },
            { name: `${image3Metadata.name}_002.${image3Metadata.extension}`, content: fixture3.buffer }
        ]);
    });
    test('Client attempts to download with duplicate image IDs in request', async () => {
        const collection = Collection.create('batch-download-dedup');
        const image1Fixture = await getImageFixture({
            filename: 'unique-image.jpeg',
            width: 1920,
            height: 1080
        });
        const image1Metadata = await collection.addImage(image1Fixture.filename, image1Fixture.buffer);
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-dedup'
            },
            body: {
                imageIds: [image1Metadata.id, image1Metadata.id, image1Metadata.id],
                archiveName: 'deduped-archive'
            }
        });
        response
            .shouldHaveStatus(200)
            .shouldHaveZipContent([
            { name: `${image1Metadata.name}.${image1Metadata.extension}`, content: image1Fixture.buffer }
        ]);
    });
    test('Client attempts to download from a non-existent collection', async () => {
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'non-existent-collection'
            },
            body: {
                imageIds: ['12345678-1234-4123-8123-123456789012'],
                archiveName: 'test-archive'
            }
        });
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Collection not found');
    });
    test('Client attempts to download with non-existent image ID', async () => {
        Collection.create('batch-download-missing-image');
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-missing-image'
            },
            body: {
                imageIds: ['98765432-4321-4321-8321-210987654321'],
                archiveName: 'test-archive'
            }
        });
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Image not found');
    });
    test('Client attempts to download with empty imageIds array', async () => {
        Collection.create('batch-download-empty-ids');
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-empty-ids'
            },
            body: {
                imageIds: [],
                archiveName: 'test-archive'
            }
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'imageIds array cannot be empty');
    });
    test('Client attempts to download with invalid image ID format', async () => {
        Collection.create('batch-download-invalid-format');
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-invalid-format'
            },
            body: {
                imageIds: ['not-a-valid-uuid', '12345678-1234-4123-8123-123456789012'],
                archiveName: 'test-archive'
            }
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid image ID format');
    });
    test('Client attempts to download with invalid archive name containing special characters', async () => {
        const collection = Collection.create('batch-download-invalid-name');
        const imageFixture = await getImageFixture({
            filename: 'test-image.jpeg',
            width: 800,
            height: 600
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-invalid-name'
            },
            body: {
                imageIds: [imageMetadata.id],
                archiveName: 'invalid@name!with$pecial'
            }
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid archive name format');
    });
    test('Client attempts to download with missing request body', async () => {
        Collection.create('batch-download-missing-body');
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-missing-body'
            },
            body: undefined
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Request body is required');
    });
    test('Client attempts to download with missing archive name', async () => {
        const collection = Collection.create('batch-download-missing-archive-name-field');
        const imageFixture = await getImageFixture({
            filename: 'photo.jpeg',
            width: 1920,
            height: 1080
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-missing-archive-name-field'
            },
            body: {
                imageIds: [imageMetadata.id]
            }
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'archive name field is required');
    });
    test('Client attempts to download with missing imageIds field', async () => {
        Collection.create('batch-download-missing-imageids-field');
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-missing-imageids-field'
            },
            body: {
                archiveName: 'test-archive'
            }
        });
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'imageIds field is required');
    });
    test('Internal error occurs when creating the download archive', async () => {
        const collection = Collection.create('batch-download-error');
        const imageFixture = await getImageFixture({
            filename: 'error-image.jpeg',
            width: 800,
            height: 600
        });
        const imageMetadata = await collection.addImage(imageFixture.filename, imageFixture.buffer);
        corruptCollectionDB(collection);
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-error'
            },
            body: {
                imageIds: [imageMetadata.id],
                archiveName: 'error-archive'
            }
        });
        response
            .shouldHaveStatus(500)
            .shouldHaveBodyWithProperty('message', 'An error occurred whilst downloading images');
    });
});
