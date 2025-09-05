import { suite, test } from 'mocha';
import sinon from 'sinon';
import { fsOps } from '../../../src/fs-operations';

import { Collection } from '../../../src/collection';
import { CollectionUtils } from '../../utils/collection-utils';
import { validateError } from '../../utils';
import { CollectionDeleteError, CollectionNotFoundError } from '../../../errors';

const valid_name = 'test-collection';
const non_existent_collection = 'non-existent';

suite('Collection Deletion', () => {
    test('User deletes a Collection', async () => {
        Collection.create(valid_name);

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
        Collection.create(valid_name);

        sinon.stub(fsOps, 'rmSync').throws(new Error('Filesystem error'));

        console.log('Validating that the correct Error is thrown when An internal error occurs when deleting a Collection');
        validateError(() => Collection.delete(valid_name))
            .shouldHaveType(CollectionDeleteError)
            .shouldHaveMessage(`Unable to delete Collection: "${valid_name}"`)

        await CollectionUtils.assertCollectionRemains(valid_name);
    });
});