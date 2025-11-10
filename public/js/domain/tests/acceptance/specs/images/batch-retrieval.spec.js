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
        const imageFixture1 = await getImageFixture({ filename: 'batch-test-1.jpg' });
        const imageFixture2 = await getImageFixture({ filename: 'batch-test-2.png' });
        const imageFixture3 = await getImageFixture({ filename: 'batch-test-3.webp' });
        const addedMetadata1 = await collection.addImage(imageFixture1.filename, imageFixture1.buffer);
        const addedMetadata2 = await collection.addImage(imageFixture2.filename, imageFixture2.buffer);
        const addedMetadata3 = await collection.addImage(imageFixture3.filename, imageFixture3.buffer);
        await collection.updateImage(addedMetadata2.id, { status: 'COLLECTION' });
        await collection.updateImage(addedMetadata3.id, { status: 'ARCHIVE' });
        const retrievedImages = await collection.getImages();
        expect(retrievedImages).to.have.length(3);
        const image1 = retrievedImages.find(img => img.id === addedMetadata1.id);
        const image2 = retrievedImages.find(img => img.id === addedMetadata2.id);
        const image3 = retrievedImages.find(img => img.id === addedMetadata3.id);
        expect(image1).to.exist;
        expect(image2).to.exist;
        expect(image3).to.exist;
        ImageUtils.assertImageMetadata(image1, {
            id: addedMetadata1.id,
            collection: testCollectionName,
            status: 'INBOX'
        });
        ImageUtils.assertImageMetadata(image2, {
            id: addedMetadata2.id,
            collection: testCollectionName,
            status: 'COLLECTION'
        });
        ImageUtils.assertImageMetadata(image3, {
            id: addedMetadata3.id,
            collection: testCollectionName,
            status: 'ARCHIVE'
        });
        LOGGER.log(`✓ Retrieved ${retrievedImages.length} images with all different statuses`);
    });
    test('User retrieves images filtered by INBOX status', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture1 = await getImageFixture({ filename: 'filtered-test-1.jpg' });
        const imageFixture2 = await getImageFixture({ filename: 'filtered-test-2.png' });
        const imageFixture3 = await getImageFixture({ filename: 'filtered-test-3.webp' });
        const addedMetadata1 = await collection.addImage(imageFixture1.filename, imageFixture1.buffer);
        const addedMetadata2 = await collection.addImage(imageFixture2.filename, imageFixture2.buffer);
        const addedMetadata3 = await collection.addImage(imageFixture3.filename, imageFixture3.buffer);
        await collection.updateImage(addedMetadata2.id, { status: 'COLLECTION' });
        const retrievedImages = await collection.getImages({ status: 'INBOX' });
        expect(retrievedImages).to.have.length(2);
        retrievedImages.forEach(image => {
            ImageUtils.assertImageStatus(image, 'INBOX');
        });
        const imageIds = retrievedImages.map(img => img.id);
        expect(imageIds).to.include(addedMetadata1.id);
        expect(imageIds).to.include(addedMetadata3.id);
        expect(imageIds).to.not.include(addedMetadata2.id);
        LOGGER.log(`✓ Retrieved ${retrievedImages.length} images with INBOX status filter`);
    });
    test('User retrieves images from empty Collection', async () => {
        const collection = Collection.create(testCollectionName);
        const retrievedImages = await collection.getImages();
        expect(retrievedImages).to.be.an('array');
        expect(retrievedImages).to.have.length(0);
        LOGGER.log(`✓ Retrieved empty array from empty Collection`);
    });
    test('User retrieves images with status filter that matches no images', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture1 = await getImageFixture({ filename: 'no-match-test-1.jpg' });
        const imageFixture2 = await getImageFixture({ filename: 'no-match-test-2.png' });
        await collection.addImage(imageFixture1.filename, imageFixture1.buffer);
        await collection.addImage(imageFixture2.filename, imageFixture2.buffer);
        const retrievedImages = await collection.getImages({ status: 'COLLECTION' });
        expect(retrievedImages).to.be.an('array');
        expect(retrievedImages).to.have.length(0);
        LOGGER.log(`✓ Retrieved empty array when status filter matches no images`);
    });
    test('User attempts to retrieve images with invalid status filter', async () => {
        const collection = Collection.create(testCollectionName);
        const invalidStatus = 'INVALID_STATUS';
        LOGGER.log('Validating that the correct Error is thrown when attempting to retrieve images with invalid status filter');
        const error = await captureAssertableAsyncError(() => collection.getImages({ status: invalidStatus }));
        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve images from Collection "${testCollectionName}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage('Invalid status');
    });
    test('An internal error occurs when retrieving images', async () => {
        const collection = Collection.create(testCollectionName);
        const imageFixture = await getImageFixture({ filename: 'internal-error-batch.jpg' });
        await collection.addImage(imageFixture.filename, imageFixture.buffer);
        sinon.stub(collection, 'getDatabase').throws(new Error('Database connection failed'));
        LOGGER.log('Validating that the correct Error is thrown when internal error occurs during batch image retrieval');
        const error = await captureAssertableAsyncError(() => collection.getImages());
        error
            .shouldHaveType(ImageRetrievalError)
            .shouldHaveMessage(`Unable to retrieve images from Collection "${testCollectionName}"`);
    });
});
