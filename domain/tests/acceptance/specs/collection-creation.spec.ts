import { suite, test } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { fsOps } from '../../../src/fs-operations';

import { CONFIG } from '@/config';
import { Collection } from '../../../src/collection';
import { DirectoryFixtures } from '@/utils/fixtures/directory-fixtures';
import { CollectionUtils } from '../../utils/collection-utils';
import { validateError } from '../../utils';
import { CollectionCreateError } from '../../../errors';

const valid_name = 'test-collection';
const invalid_name = 'invalid@name!';
const existing_collection = 'existing-collection';

suite('Collection Creation', () => {
    test('User creates Collection with valid name', async () => {
        Collection.create(valid_name);

        await CollectionUtils.assertCollectionDirectoryExists(valid_name);
        await CollectionUtils.assertSqliteFileExists(valid_name);
        await CollectionUtils.assertFileStructureExists(valid_name);
    });

    test('User attempts to create a Collection with duplicate name', async () => {
       Collection.create(existing_collection); 

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
});