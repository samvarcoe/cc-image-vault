import express from 'express';
import { Collection } from '@/domain';

export const routes = express.Router();

routes.get('/health', (_, res) => {
    res.json({ status: 'ok' });
});

routes.get('/collections', (_, res) => {
    try {
        const collections = Collection.list();
        res.json(collections);
    } catch {
        res.status(500).json({ message: 'An error occured whilst retrieving the Collections list' });
    }
});