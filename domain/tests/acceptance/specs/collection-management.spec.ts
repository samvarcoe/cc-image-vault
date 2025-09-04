import { suite, test } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { fsOps } from '../../../src/fs-operations';

import { CONFIG } from '@/config';
import { Collection } from '../../../src/collection';
import { DirectoryFixtures } from '@/utils/fixtures/directory-fixtures';
import { CollectionUtils } from '../../utils/collection-utils';
import { validateError } from '../../utils';
import {
    CollectionClearError,
    CollectionCreateError,
    CollectionDeleteError,
    CollectionListError,
    CollectionLoadError,
    CollectionNotFoundError
} from '../../../errors';

const valid_name = 'test-collection';
const invalid_name = 'invalid@name!';
const existing_collection = 'existing-collection';
const non_existent_collection = 'non-existent';
const collection1 = 'collection-1';
const collection2 = 'collection-2';
const collection3 = 'collection-3';

suite('Collection Management', () => {
    beforeEach(async () => {
        const tmpDir = await DirectoryFixtures.createTemporary({ prefix: 'collections-test-' });
        sinon.stub(CONFIG, 'COLLECTIONS_DIRECTORY').value(tmpDir.path);
    })

    afterEach(async () => {
        sinon.restore();
        await DirectoryFixtures.cleanup();
    })

    test('User creates Collection with valid name', async () => {
        Collection.create(valid_name);

        await CollectionUtils.assertCollectionDirectoryExists(valid_name);
        await CollectionUtils.assertSqliteFileExists(valid_name);
        await CollectionUtils.assertFileStructureExists(valid_name);
    });

    test('User attempts to create a Collection with duplicate name', async () => {
        await CollectionUtils.createExistingCollection(existing_collection);

        console.log('Validating that the correct Error is thrown when attempting to create a Collection with a duplicate name');
        validateError(() => Collection.create(existing_collection))
            .shouldHaveType(CollectionCreateError)
            .shouldHaveMessage(`Unable to create Collection: "${existing_collection}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage(`There is already a Collection with name: "${existing_collection}"`);

        const collections = await DirectoryFixtures.listDirectoryNames(CONFIG.COLLECTIONS_DIRECTORY);

        expect(collections, `The existing Collection list has changed`).deep.equals([existing_collection])
        console.log(`✓ Duplicate Collection creation prevented for "${existing_collection}"`);
    });

    test('User attempts to create a Collection with invalid name', async () => {
        console.log('Validating that the correct Error is thrown when attempting to create a Collection with an invalid name');
        validateError(() => Collection.create(invalid_name))
            .shouldHaveType(CollectionCreateError)
            .shouldHaveMessage(`Unable to create Collection: "${invalid_name}"`)
            .shouldHaveCause(Error)
            .shouldHaveCauseMessage(`"${invalid_name}" is not a valid Collection name`);

        await CollectionUtils.assertCollectionDirectoryDoesNotExist(invalid_name);
    });

    test('An internal error occurs when creating a Collection', async () => {
        sinon.stub(fsOps, 'mkdirSync').throws(new Error('Filesystem error'));

        validateError(() => Collection.create(valid_name))
            .shouldHaveType(CollectionCreateError)
            .shouldHaveMessage(`Unable to create Collection: "${valid_name}"`)

        await CollectionUtils.assertDirectoryIsClean(valid_name);
    });

    test('User loads Collection from filesystem', async () => {
        await CollectionUtils.createExistingCollection(valid_name);

        expect(() => Collection.load(valid_name), `Collection.load("${valid_name}") should not throw`).not.to.throw();
        expect(Collection.load(valid_name).name, `Collection instance id mismatch for loaded Collection "${valid_name}"`).equals(valid_name);
        console.log(`✓ Collection "${valid_name}" loaded successfully`);
    });

    test('User attempts to load a non-existent Collection', async () => {
        console.log('Validating that the correct Error is thrown when attempting to load a Collection that doesn\'t exist');
        validateError(() => Collection.load(non_existent_collection))
            .shouldHaveType(CollectionLoadError)
            .shouldHaveMessage(`Unable to load Collection: "${non_existent_collection}"`)
            .shouldHaveCause(CollectionNotFoundError)
            .shouldHaveCauseMessage(`No Collection found with name: "${non_existent_collection}"`);

        console.log(`✓ Specific Error thrown for non-existent Collection`);
    });

    test('An internal error occurs when loading a Collection', async () => {
        await CollectionUtils.createExistingCollection(valid_name);

        sinon.stub(fsOps, 'existsSync').throws(new Error('Filesystem error'));

        console.log('Validating that the correct Error is thrown when an internal error occurs when loading a Collection');
        validateError(() => Collection.load(valid_name))
            .shouldHaveType(CollectionLoadError)
            .shouldHaveMessage(`Unable to load Collection: "${valid_name}"`);
    });

    test('User deletes a Collection', async () => {
        await CollectionUtils.createExistingCollection(valid_name);

        Collection.delete(valid_name);

        await CollectionUtils.assertCollectionDoesNotExist(valid_name);
    });

    test('User attempts to delete a Collection that does not exist', async () => {
        console.log('Validating that the correct Error is thrown when attempting to delete a Collection that doesn\'t exist');
        validateError(() => Collection.delete(non_existent_collection))
            .shouldHaveType(CollectionDeleteError)
            .shouldHaveMessage(`Unable to delete Collection: "${non_existent_collection}"`)
            .shouldHaveCause(CollectionNotFoundError)
            .shouldHaveCauseMessage(`No Collection found with name: "${non_existent_collection}"`);
    });

    test('An internal error occurs when deleting a Collection', async () => {
        await CollectionUtils.createExistingCollection(valid_name);

        sinon.stub(fsOps, 'rmSync').throws(new Error('Filesystem error'));

        console.log('Validating that the correct Error is thrown when an internal errors occurs when deleting a Collection');
        validateError(() => Collection.delete(valid_name))
            .shouldHaveType(CollectionDeleteError)
            .shouldHaveMessage(`Unable to delete Collection: "${valid_name}"`)

        await CollectionUtils.assertCollectionRemains(valid_name);
    });

    test('User requests list of existing Collections and some Collections exist', async () => {
        await CollectionUtils.createExistingCollection(collection1);
        await CollectionUtils.createExistingCollection(collection2);
        await CollectionUtils.createExistingCollection(collection3);

        const collections = Collection.list();

        expect(collections, 'The Collection list does not contain the correct items').to.have.members([
            collection1,
            collection2,
            collection3
        ]);
        console.log(`✓ Collection list returned the correct Collections`);
    });

    test('User requests list of existing Collections and no Collections exist', async () => {
        expect(Collection.list(), 'The Collection list is not an empty array').deep.equals([]);
        console.log('✓ Collection list returned an empty array');
    });

    test('An internal error occurs when listing Collections', async () => {
        sinon.stub(fsOps, 'readdirSync').throws(new Error('Filesystem error'));

        console.log('Validating that the correct Error is thrown when an internal errors occurs when listing Collections');
        validateError(() => Collection.list())
            .shouldHaveType(CollectionListError)
            .shouldHaveMessage('Unable to list Collections')
    });

    test('User clears Collections', async () => {
        await CollectionUtils.createExistingCollection(collection1);
        await CollectionUtils.createExistingCollection(collection2);

        expect(() => Collection.clear(), 'Collection.clear() should not have thrown an error').not.throws();

        const remainingCollections = await DirectoryFixtures.listDirectoryNames(CONFIG.COLLECTIONS_DIRECTORY);

        expect(remainingCollections.length, 'There are still subdirectories present in the Collections directory').equals(0);
        expect(Collection.list(), 'The Collection list is not an empty array').deep.equals([]);
        console.log('✓ Collections successfully cleared');
    });

    test('User attempts to clear an empty Collections directory', async () => {
        expect(() => Collection.clear(), 'Collection.clear() should not have thrown an error').not.throws()
        expect(Collection.list(), 'The Collection list is not an empty array').deep.equals([]);
        console.log('✓ Empty Collections directory cleared without error');
    });

    test('An internal error occurs when the user attempts to clear the Collections directory', async () => {
        await CollectionUtils.createExistingCollection(existing_collection);

        sinon.stub(fsOps, 'readdirSync').throws(new Error('Filesystem error'));

        console.log('Validating that the correct Error is thrown when an internal errors occurs when clearing Collections');
        validateError(() => Collection.clear())
            .shouldHaveType(CollectionClearError)
            .shouldHaveMessage('Unable to clear Collections')

        await CollectionUtils.assertCollectionRemains(existing_collection);
        console.log('✓ Internal clear error properly handled with Collections preserved');
    });
});