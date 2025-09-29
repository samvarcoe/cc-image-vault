import { suite, test } from 'mocha';
import { Collection } from '@/domain';
import { getImageFixture, corruptCollectionDB } from '@/utils';
import { useFakeTimers } from 'sinon';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

import { CollectionsAPI } from '../../../utils/collections-api-model';

const api = new CollectionsAPI(CONFIG.API_BASE_URL);

suite('API - Images - Batch Download', () => {
    test('Client downloads multiple images with unique filenames', async () => {
        // Given a collection exists with multiple images having unique original filenames
        const collection = Collection.create('batch-download-unique');

        const image1Fixture = await getImageFixture({
            id: 'photo-1',
            width: 1920,
            height: 1080,
            extension: 'jpeg'
        });
        const image1Metadata = await collection.addImage(image1Fixture.filePath);

        const image2Fixture = await getImageFixture({
            id: 'photo-2',
            width: 1024,
            height: 768,
            extension: 'png'
        });
        const image2Metadata = await collection.addImage(image2Fixture.filePath);

        const image3Fixture = await getImageFixture({
            id: 'photo-3',
            width: 800,
            height: 600,
            extension: 'webp'
        });
        const image3Metadata = await collection.addImage(image3Fixture.filePath);

        // When the client requests POST /api/images/:collectionId/download with valid imageIds array and archiveName
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-unique'
            },
            body: {
                imageIds: [image1Metadata.id, image2Metadata.id, image3Metadata.id],
                archiveName: 'vacation-photos'
            }
        });

        // Then the API returns 200 status code
        // And the API returns a ZIP archive file
        // And the API sets Content-Disposition header to attachment with archive named
        // And the API sets Content-Type header to application/zip
        // And the API sets Content-Length header with the archive size
        // And the ZIP archive contains all requested images with their original filenames
        response
            .shouldHaveStatus(200)
            .shouldHaveContentDispositionAttachment('vacation-photos.zip')
            .shouldHaveHeader('Content-Type', 'application/zip')
            .shouldHaveHeader('Content-Length')
            .shouldHaveZipContent([
                { name: `${image1Metadata.name}.${image1Metadata.extension}`, content: image1Fixture.buffer },
                { name: `${image2Metadata.name}.${image2Metadata.extension}`, content: image2Fixture.buffer },
                { name: `${image3Metadata.name}.${image3Metadata.extension}`, content: image3Fixture.buffer }
            ]);
    });

    test('Client downloads multiple images with duplicate filenames', async () => {
        // Given a collection exists with duplicated image names
        const clock = useFakeTimers();
        const collection = Collection.create('batch-download-duplicates');

        // Create three DIFFERENT images but give them the same filename
        // to test duplicate filename handling
        // ToDo: Improve fixture naming mechanism and update domain functions to take a buffer instead of a file
        const tempDir = join(tmpdir(), randomUUID());
        mkdirSync(tempDir, { recursive: true });

        const fixture1 = await getImageFixture({
            id: 'photo-1',
            width: 1920,
            height: 1080,
            extension: 'jpeg'
        });
        const tempPath1 = join(tempDir, 'photo.jpeg');
        writeFileSync(tempPath1, fixture1.buffer);
        const image1Metadata = await collection.addImage(tempPath1);
        clock.tick(1000); // Advance time

        const fixture2 = await getImageFixture({
            id: 'photo-2',
            width: 1024,
            height: 768,
            extension: 'jpeg'
        });
        const tempPath2 = join(tempDir, 'photo.jpeg');
        writeFileSync(tempPath2, fixture2.buffer);
        const image2Metadata = await collection.addImage(tempPath2);
        clock.tick(1000); // Advance time

        const fixture3 = await getImageFixture({
            id: 'photo-3',
            width: 800,
            height: 600,
            extension: 'jpeg'
        });
        const tempPath3 = join(tempDir, 'photo.jpeg');
        writeFileSync(tempPath3, fixture3.buffer);
        const image3Metadata = await collection.addImage(tempPath3);

        clock.restore();

        // When the client requests POST /api/images/:collectionId/download with all three imageIds
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-duplicates'
            },
            body: {
                imageIds: [image1Metadata.id, image2Metadata.id, image3Metadata.id],
                archiveName: 'duplicate-photos'
            }
        });

        // Then the API returns 200 status code
        // And the duplicated images have an index based suffix applied to their names
        // And the index is ordered based on the creation times of the images
        // And the order is from oldest to newest
        response
            .shouldHaveStatus(200)
            .shouldHaveZipContent([
                { name: `${image1Metadata.name}_001.${image1Metadata.extension}`, content: fixture1.buffer },
                { name: `${image2Metadata.name}_002.${image2Metadata.extension}`, content: fixture2.buffer },
                { name: `${image3Metadata.name}_003.${image3Metadata.extension}`, content: fixture3.buffer }
            ]);
    });

    test('Client attempts to download with duplicate image IDs in request', async () => {
        // Given a collection exists with images
        const collection = Collection.create('batch-download-dedup');

        const image1Fixture = await getImageFixture({
            id: 'unique-image',
            width: 1920,
            height: 1080,
            extension: 'jpeg'
        });
        const image1Metadata = await collection.addImage(image1Fixture.filePath);

        // When the client requests POST /api/images/:collectionId/download with the same imageId appearing multiple times
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-dedup'
            },
            body: {
                imageIds: [image1Metadata.id, image1Metadata.id, image1Metadata.id],
                archiveName: 'deduped-archive'
            }
        });

        // Then the API returns 200 status code
        // And each image only appears once in the archive
        response
            .shouldHaveStatus(200)
            .shouldHaveZipContent([
                { name: `${image1Metadata.name}.${image1Metadata.extension}`, content: image1Fixture.buffer }
            ]);
    });

    test('Client attempts to download from a non-existent collection', async () => {
        // Given no collection exists with the specified collection ID
        // (Collection.clear() is called in beforeEach hook)

        // When the client requests POST /api/images/:collectionId/download
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'non-existent-collection'
            },
            body: {
                imageIds: ['12345678-1234-4123-8123-123456789012'],
                archiveName: 'test-archive'
            }
        });

        // Then the API returns 404 status code
        // And the API returns error message indicating collection not found
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Collection not found');
    });

    test('Client attempts to download with non-existent image ID', async () => {
        // Given a collection exists but does not contain one of the specified image IDs
        Collection.create('batch-download-missing-image');

        // When the client requests POST /api/images/:collectionId/download with valid UUID formats but non-existent imageId
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-missing-image'
            },
            body: {
                imageIds: ['98765432-4321-4321-8321-210987654321'],
                archiveName: 'test-archive'
            }
        });

        // Then the API returns 404 status code
        // And the API returns error message indicating image not found
        response
            .shouldHaveStatus(404)
            .shouldHaveBodyWithProperty('message', 'Image not found');
    });

    test('Client attempts to download with empty imageIds array', async () => {
        // Given a collection exists
        Collection.create('batch-download-empty-ids');

        // When the client requests POST /api/images/:collectionId/download with an empty imageIds array
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-empty-ids'
            },
            body: {
                imageIds: [],
                archiveName: 'test-archive'
            }
        });

        // Then the API returns 400 status code
        // And the API returns error message indicating imageIds array cannot be empty
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'imageIds array cannot be empty');
    });

    test('Client attempts to download with invalid image ID format', async () => {
        // Given a collection exists
        Collection.create('batch-download-invalid-format');

        // When the client requests POST /api/images/:collectionId/download with an imageId that is not a valid UUID v4 format
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-invalid-format'
            },
            body: {
                imageIds: ['not-a-valid-uuid', '12345678-1234-4123-8123-123456789012'],
                archiveName: 'test-archive'
            }
        });

        // Then the API returns 400 status code
        // And the API returns error message indicating invalid image ID format
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid image ID format');
    });

    test('Client attempts to download with invalid archive name containing special characters', async () => {
        // Given a collection exists with images
        const collection = Collection.create('batch-download-invalid-name');
        const imageFixture = await getImageFixture({
            id: 'test-image',
            width: 800,
            height: 600,
            extension: 'jpeg'
        });
        const imageMetadata = await collection.addImage(imageFixture.filePath);

        // When the client requests POST /api/images/:collectionId/download with archiveName containing special characters
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-invalid-name'
            },
            body: {
                imageIds: [imageMetadata.id],
                archiveName: 'invalid@name!with$pecial'
            }
        });

        // Then the API returns 400 status code
        // And the API returns error message indicating invalid archive name format
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Invalid archive name format');
    });

    test('Client attempts to download with missing request body', async () => {
        // Given a collection exists
        Collection.create('batch-download-missing-body');

        // When the client requests POST /api/images/:collectionId/download with no request body
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-missing-body'
            },
            body: undefined as unknown as { imageIds: string[], archiveName: string }
        });

        // Then the API returns 400 status code
        // And the API returns error message indicating request body is required
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Request body is required');
    });

    test('Client attempts to download with missing archive name', async () => {
        // Given a collection exists
        const collection = Collection.create('batch-download-missing-archive-name-field');

        const imageFixture = await getImageFixture({
            id: 'photo',
            width: 1920,
            height: 1080,
            extension: 'jpeg'
        });
        const imageMetadata = await collection.addImage(imageFixture.filePath);

        // When the client requests POST /api/images/:collectionId/download with body missing archive name field
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-missing-archive-name-field'
            },
            body: {
                imageIds: [imageMetadata.id]
            } as unknown as { imageIds: string[], archiveName: string }
        });

        // Then the API returns 400 status code
        // And the API returns error message indicating archive name field is required
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'archive name field is required');
    });

    test('Client attempts to download with missing imageIds field', async () => {
        // Given a collection exists
        Collection.create('batch-download-missing-imageids-field');

        // When the client requests POST /api/images/:collectionId/download with body missing imageIds field
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-missing-imageids-field'
            },
            body: {
                archiveName: 'test-archive'
            } as unknown as { imageIds: string[], archiveName: string }
        });

        // Then the API returns 400 status code
        // And the API returns error message indicating imageIds field is required
        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'imageIds field is required');
    });

    test('Internal error occurs when creating the download archive', async () => {
        // Given a collection exists with images
        const collection = Collection.create('batch-download-error');
        const imageFixture = await getImageFixture({
            id: 'error-image',
            width: 800,
            height: 600,
            extension: 'jpeg'
        });
        const imageMetadata = await collection.addImage(imageFixture.filePath);

        // Corrupt the database to cause an internal error
        corruptCollectionDB(collection);

        // When the client requests POST /api/images/:collectionId/download
        // But there is an internal error creating the archive
        const response = await api['/api/images/:collectionId/download'].post({
            pathParams: {
                collectionId: 'batch-download-error'
            },
            body: {
                imageIds: [imageMetadata.id],
                archiveName: 'error-archive'
            }
        });

        // Then the API returns 500 status code
        // And the API returns error message indicating an error occurred whilst downloading images
        response
            .shouldHaveStatus(500)
            .shouldHaveBodyWithProperty('message', 'An error occurred whilst downloading images');
    });
});