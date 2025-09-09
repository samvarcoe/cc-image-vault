import { suite, test } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { fsOps } from '../../../../src/fs-operations';

import { Collection } from '../../../../src/collection';
import { validateError } from '../../../utils';
import { CollectionListError } from '../../../../errors';

const collection1 = 'collection-1';
const collection2 = 'collection-2';
const collection3 = 'collection-3';

suite('Collections - Listing', () => {
   test('User requests list of existing Collections and some Collections exist', async () => {
        Collection.create(collection1);
        Collection.create(collection2);
        Collection.create(collection3);

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

        console.log('Validating that the correct Error is thrown when An internal error occurs when listing Collections');
        validateError(() => Collection.list())
            .shouldHaveType(CollectionListError)
            .shouldHaveMessage('Unable to list Collections')
    });
});