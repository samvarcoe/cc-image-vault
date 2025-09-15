import express from 'express';
import { Collection, CollectionCreateError } from '@/domain';

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

routes.post('/collections', (req, res) => {
    // Validate request body exists
    if (!req.body) {
        return res.status(400).json({ message: 'Request body is required' });
    }

    // Validate name field exists and is not empty
    if (!req.body.name || req.body.name === '') {
        return res.status(400).json({ message: 'Collection name is required' });
    }

    try {
        // Delegate all business validation to domain layer
        Collection.create(req.body.name);
        return res.status(201).send();
    } catch (error) {
        // Handle domain errors and map to appropriate HTTP responses
        if (error instanceof CollectionCreateError && error.cause) {
            const errorMessage = (error.cause as Error).message;

            // Check for duplicate collection error
            if (errorMessage.includes('There is already a Collection with name:')) {
                return res.status(409).json({ message: errorMessage });
            }

            // Check for validation error (invalid name)
            if (errorMessage.includes('is not a valid Collection name')) {
                return res.status(400).json({ message: errorMessage });
            }
        }

        // All other errors are internal server errors
        return res.status(500).json({ message: 'An error occurred whilst creating the Collection' });
    }
});