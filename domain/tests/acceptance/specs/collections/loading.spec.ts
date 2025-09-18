import { suite, test } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { fsOps } from '../../../../src/fs-operations';

import { Collection } from '../../../../src/collection';
import { captureAssertableError } from '../../../utils';
import { CollectionLoadError, CollectionNotFoundError } from '../../../../errors';

const valid_name = 'test-collection';
const non_existent_collection = 'non-existent';

suite('Domain - Collections - Loading', () => {
    test('User loads Collection from filesystem', async () => {
        Collection.create(valid_name);

        expect(() => Collection.load(valid_name), `Collection.load("${valid_name}") should not throw`).not.to.throw();
        expect(Collection.load(valid_name).name, `Collection instance id mismatch for loaded Collection "${valid_name}"`).equals(valid_name);
        console.log(`✓ Collection "${valid_name}" loaded successfully`);
    });

    test('User attempts to load a non-existent Collection', async () => {
        console.log('Validating that the correct Error is thrown when attempting to load a Collection that doesn\'t exist');
        captureAssertableError(() => Collection.load(non_existent_collection))
            .shouldHaveType(CollectionNotFoundError)
            .shouldHaveMessage(`No Collection found with name: "${non_existent_collection}"`);

        console.log(`✓ Specific Error thrown for non-existent Collection`);
    });

    test('An internal error occurs when loading a Collection', async () => {
        Collection.create(valid_name);

        sinon.stub(fsOps, 'existsSync').throws(new Error('Filesystem error'));

        console.log('Validating that the correct Error is thrown when an internal error occurs when loading a Collection');
        captureAssertableError(() => Collection.load(valid_name))
            .shouldHaveType(CollectionLoadError)
            .shouldHaveMessage(`Unable to load Collection: "${valid_name}"`);
    });
});