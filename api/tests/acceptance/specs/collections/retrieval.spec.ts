import { suite, test } from 'mocha';
import sinon from 'sinon';
import { Collection } from '@/domain';
import { fsOps } from '@/domain/src/fs-operations';

import { CollectionsAPI } from '../../../utils/collections-api-model';

const api = new CollectionsAPI(CONFIG.API_BASE_URL);

suite('API - Collections - Retrieval', () => {
    test('Client requests the collections list and some collections exist', async () => {
        Collection.create('vacation-photos');
        Collection.create('family-portraits');
        Collection.create('nature-shots');

        const response = await api['/api/collections'].get({});

        response
            .shouldHaveStatus(200)
            .shouldHaveBody(['family-portraits', 'nature-shots', 'vacation-photos']);
    });

    test('Client requests the collections list and no collections exist', async () => {
        const response = await api['/api/collections'].get({});

        response
            .shouldHaveStatus(200)
            .shouldHaveBody([]);
    });

    test('Internal error occurs when retrieving collections', async () => {
        Collection.create('test-collection');

        sinon.stub(fsOps, 'readdirSync').throws(new Error('Filesystem error'));

        const response = await api['/api/collections'].get({
            headers: {
                'x-force-fs-error': 'Forced FS Error'
            }
        });

        response
            .shouldHaveStatus(500)
            .shouldHaveBodyWithProperty('message', 'An error occured whilst retrieving the Collections list');
    });
});