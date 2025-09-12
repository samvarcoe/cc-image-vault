import { suite, test } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { fsOps } from '../../../../src/fs-operations';

import { CONFIG } from '@/config';
import { Collection } from '../../../../src/collection';
import { DirectoryFixtures } from '@/utils/fixtures/directory-fixtures';
import { CollectionUtils } from '../../../utils/collection-utils';
import { captureAssertableError } from '../../../utils';
import { CollectionClearError } from '../../../../errors';

const collection1 = 'collection-1';
const collection2 = 'collection-2';

suite('Domain - Collections - Clearing', () => {
    test('User clears Collections', async () => {
        Collection.create(collection1);
        Collection.create(collection2);

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
        Collection.create(collection1);

        sinon.stub(fsOps, 'readdirSync').throws(new Error('Filesystem error'));

        console.log('Validating that the correct Error is thrown when An internal error occurs when clearing Collections');
        captureAssertableError(() => Collection.clear())
            .shouldHaveType(CollectionClearError)
            .shouldHaveMessage('Unable to clear Collections')

        await CollectionUtils.assertCollectionRemains(collection1);
        console.log('✓ Internal clear error properly handled with Collections preserved');
    });
});