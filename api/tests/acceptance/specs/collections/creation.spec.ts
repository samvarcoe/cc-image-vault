import { suite, test } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { Collection } from '@/domain';
import { fsOps } from '@/domain/src/fs-operations';

import { CollectionsAPI } from '../../../utils/collections-api-model';

const api = new CollectionsAPI(CONFIG.API_BASE_URL);

suite('API - Collections - Creation', () => {
    test('Client creates collection with valid name', async () => {
        const response = await api['/api/collections'].post({
            body: { name: 'vacation-photos' }
        });

        response
            .shouldHaveStatus(201);

        const collectionsResponse = await api['/api/collections'].get({});
        collectionsResponse
            .shouldHaveStatus(200)
            .shouldHaveBody(['vacation-photos']);
    });

    test('Client attempts to create collection with duplicate name', async () => {
        Collection.create('existing-collection');

        const response = await api['/api/collections'].post({
            body: { name: 'existing-collection' }
        });

        response
            .shouldHaveStatus(409)
            .shouldHaveBodyWithProperty('message', 'There is already a Collection with name: "existing-collection"');

        // Verify no additional collection was created
        const collections = Collection.list();
        expect(collections).to.have.lengthOf(1);
    });

    test('Client attempts to create collection with invalid name', async () => {
        const response = await api['/api/collections'].post({
            body: { name: 'invalid name!' }
        });

        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', '"invalid name!" is not a valid Collection name');

        // Verify no collection was created
        const collections = Collection.list();
        expect(collections).to.have.lengthOf(0);
    });

    test('Client attempts to create collection with name exceeding maximum length', async () => {
        const longName = 'a'.repeat(257);

        const response = await api['/api/collections'].post({
            body: { name: longName }
        });

        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', `"${longName}" is not a valid Collection name`);

        // Verify no collection was created
        const collections = Collection.list();
        expect(collections).to.have.lengthOf(0);
    });

    test('Client sends request without name field', async () => {
        const response = await api['/api/collections'].post({
            body: {} as unknown as { name: string }
        });

        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Collection name is required');
    });

    test('Client sends request with empty name', async () => {
        const response = await api['/api/collections'].post({
            body: { name: '' }
        });

        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Collection name is required');
    });

    test('Client sends request without body', async () => {
        const response = await api['/api/collections'].post({
            body: undefined as unknown as { name: string }
        });

        response
            .shouldHaveStatus(400)
            .shouldHaveBodyWithProperty('message', 'Request body is required');
    });

    test('Internal error occurs when creating collection', async () => {
        sinon.stub(fsOps, 'mkdirSync').throws(new Error('Filesystem error'));

        const response = await api['/api/collections'].post({
            body: { name: 'test-collection' },
            headers: { 'x-force-fs-error': 'Forced FS Error' }
        });

        response
            .shouldHaveStatus(500)
            .shouldHaveBodyWithProperty('message', 'An error occurred whilst creating the Collection');

        // Verify no collection artifacts were left behind
        const collections = Collection.list();
        expect(collections).to.have.lengthOf(0);
    });
});