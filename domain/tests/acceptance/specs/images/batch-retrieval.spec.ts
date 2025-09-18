import { suite, test } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { Collection } from '../../../../src/collection';
import { ImageUtils } from '../../../utils/image-utils';
import { captureAssertableAsyncError } from '../../../utils';
import { ImageRetrievalError } from '../../../../errors';

import { getImageFixture } from '@/utils/fixtures/image-fixtures';

const testCollectionName = 'test-batch-image-retrieval';

suite('Domain - Images - Retrieve Batch', () => {
    test('User retrieves all images from Collection', async () => {
        const collection = Collection.create(testCollectionName);

        // Add multiple images with different statuses
        const imageFixture1 = await getImageFixture({ id: 'batch-test-1', extension: 'jpg' });
        const imageFixture2 = await getImageFixture({ id: 'batch-test-2', extension: 'png' });
        const imageFixture3 = await getImageFixture({ id: 'batch-test-3', extension: 'webp' });

        const addedMetadata1 = await collection.addImage(imageFixture1.filePath);
        const addedMetadata2 = await collection.addImage(imageFixture2.filePath);
        const addedMetadata3 = await collection.addImage(imageFixture3.filePath);

        // Update status of second image to COLLECTION
        await collection.updateImage(addedMetadata2.id, { status: 'COLLECTION' });
        // Update status of third image to ARCHIVE
        await collection.updateImage(addedMetadata3.id, { status: 'ARCHIVE' });

        // Retrieve all images without filter
        const retrievedImages = await collection.getImages();

        // Verify we get all 3 images
        expect(retrievedImages).to.have.length(3);

        // Verify each image metadata
        const image1 = retrievedImages.find(img => img.id === addedMetadata1.id);
        const image2 = retrievedImages.find(img => img.id === addedMetadata2.id);
        const image3 = retrievedImages.find(img => img.id === addedMetadata3.id);

        expect(image1).to.exist;
        expect(image2).to.exist;
        expect(image3).to.exist;

        ImageUtils.assertImageMetadata(image1!, {
            id: addedMetadata1.id,
            collection: testCollectionName,
            status: 'INBOX'
        });

        ImageUtils.assertImageMetadata(image2!, {
            id: addedMetadata2.id,
            collection: testCollectionName,
            status: 'COLLECTION'
        });

        ImageUtils.assertImageMetadata(image3!, {
            id: addedMetadata3.id,
            collection: testCollectionName,
            status: 'ARCHIVE'
        });

        console.log(`✓ Retrieved ${retrievedImages.length} images with all different statuses`);
    });

    test('User retrieves images filtered by INBOX status', async () => {
        const collection = Collection.create(testCollectionName);

        // Add multiple images with different statuses
        const imageFixture1 = await getImageFixture({ id: 'filtered-test-1', extension: 'jpg' });
        const imageFixture2 = await getImageFixture({ id: 'filtered-test-2', extension: 'png' });
        const imageFixture3 = await getImageFixture({ id: 'filtered-test-3', extension: 'webp' });

        const addedMetadata1 = await collection.addImage(imageFixture1.filePath);
        const addedMetadata2 = await collection.addImage(imageFixture2.filePath);
        const addedMetadata3 = await collection.addImage(imageFixture3.filePath);

        // Update status of second image to COLLECTION, leave first and third as INBOX
        await collection.updateImage(addedMetadata2.id, { status: 'COLLECTION' });

        // Retrieve images filtered by INBOX status
        const retrievedImages = await collection.getImages({ status: 'INBOX' });

        // Verify we get only the 2 INBOX images
        expect(retrievedImages).to.have.length(2);

        // Verify all returned images have INBOX status
        retrievedImages.forEach(image => {
            ImageUtils.assertImageStatus(image, 'INBOX');
        });

        // Verify specific images are included/excluded
        const imageIds = retrievedImages.map(img => img.id);
        expect(imageIds).to.include(addedMetadata1.id);
        expect(imageIds).to.include(addedMetadata3.id);
        expect(imageIds).to.not.include(addedMetadata2.id);

        console.log(`✓ Retrieved ${retrievedImages.length} images with INBOX status filter`);
    });

    test('User retrieves images from empty Collection', async () => {
        const collection = Collection.create(testCollectionName);

        // Retrieve all images from empty collection
        const retrievedImages = await collection.getImages();

        // Verify we get an empty array
        expect(retrievedImages).to.be.an('array');
        expect(retrievedImages).to.have.length(0);

        console.log(`✓ Retrieved empty array from empty Collection`);
    });

    test('User retrieves images with status filter that matches no images', async () => {
        const collection = Collection.create(testCollectionName);

        // Add images with INBOX status only
        const imageFixture1 = await getImageFixture({ id: 'no-match-test-1', extension: 'jpg' });
        const imageFixture2 = await getImageFixture({ id: 'no-match-test-2', extension: 'png' });

        await collection.addImage(imageFixture1.filePath);
        await collection.addImage(imageFixture2.filePath);

        // Retrieve images filtered by COLLECTION status (none exist)
        const retrievedImages = await collection.getImages({ status: 'COLLECTION' });

        // Verify we get an empty array
        expect(retrievedImages).to.be.an('array');
        expect(retrievedImages).to.have.length(0);

        console.log(`✓ Retrieved empty array when status filter matches no images`);
    });

    test('User attempts to retrieve images with invalid status filter', async () => {
        const collection = Collection.create(testCollectionName);
        const invalidStatus = 'INVALID_STATUS';

        console.log('Validating that the correct Error is thrown when attempting to retrieve images with invalid status filter');
        const error = await captureAssertableAsyncError(() => collection.getImages({ status: invalidStatus as ImageStatus }));

        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve images from Collection "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage(`Invalid status filter: "${invalidStatus}"`);
    });

    test('An internal error occurs when retrieving images', async () => {
        const collection = Collection.create(testCollectionName);

        // Add an image to the collection
        const imageFixture = await getImageFixture({ id: 'internal-error-batch', extension: 'jpg' });
        await collection.addImage(imageFixture.filePath);

        // Mock database operation to simulate internal error
        sinon.stub(collection as unknown as { getDatabase: () => unknown }, 'getDatabase').throws(new Error('Database connection failed'));

        console.log('Validating that the correct Error is thrown when internal error occurs during batch image retrieval');
        const error = await captureAssertableAsyncError(() => collection.getImages());

        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve images from Collection "${testCollectionName}"`);
    });
});