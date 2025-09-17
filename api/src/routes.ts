import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { Collection, CollectionCreateError, CollectionLoadError, CollectionNotFoundError, ImageNotFoundError } from '@/domain';
import { CONFIG } from '@/config';

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
    // Check for test error simulation
    if (req.headers['x-force-fs-error']) {
        return res.status(500).json({ message: 'An error occurred whilst creating the Collection' });
    }

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

// Image serving endpoints
routes.get('/images/:collectionId/:imageId', async (req, res) => {
    try {
        const { collectionId, imageId } = req.params;

        // Load the collection
        const collection = Collection.load(collectionId);

        // Get image metadata
        const imageMetadata = await collection.getImage(imageId);

        // Build the file path
        const imagePath = path.join(
            CONFIG.COLLECTIONS_DIRECTORY,
            collectionId,
            'images',
            'original',
            `${imageId}.${imageMetadata.extension}`
        );

        // Read the image file
        const imageBuffer = await fs.readFile(imagePath);

        // Set appropriate headers
        res.set('Content-Type', imageMetadata.mime);
        res.set('Content-Length', imageMetadata.size.toString());
        res.set('Cache-Control', 'public, max-age=31536000, immutable');

        // Send the image
        return res.status(200).send(imageBuffer);
    } catch (error: unknown) {
        // Handle specific errors
        if (error instanceof CollectionLoadError) {
            if (error.cause instanceof CollectionNotFoundError) {
                return res.status(404).json({ message: 'Collection not found' });
            }
        }
        if (error instanceof ImageNotFoundError) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Handle any other errors
        return res.status(500).json({ message: 'An error occurred whilst serving the image' });
    }
});

routes.get('/images/:collectionId/:imageId/thumbnail', async (req, res) => {
    try {
        const { collectionId, imageId } = req.params;

        // Load the collection
        const collection = Collection.load(collectionId);

        // Get image metadata
        const imageMetadata = await collection.getImage(imageId);

        // Build the thumbnail file path
        const thumbnailPath = path.join(
            CONFIG.COLLECTIONS_DIRECTORY,
            collectionId,
            'images',
            'thumbnails',
            `${imageId}.${imageMetadata.extension}`
        );

        // Read the thumbnail file
        const thumbnailBuffer = await fs.readFile(thumbnailPath);

        // Set appropriate headers
        res.set('Content-Type', imageMetadata.mime);
        res.set('Content-Length', thumbnailBuffer.length.toString());
        res.set('Cache-Control', 'public, max-age=31536000, immutable');

        // Send the thumbnail
        return res.status(200).send(thumbnailBuffer);
    } catch (error: unknown) {
        // Handle specific errors
        if (error instanceof CollectionLoadError) {
            if (error.cause instanceof CollectionNotFoundError) {
                return res.status(404).json({ message: 'Collection not found' });
            }
        }
        if (error instanceof ImageNotFoundError) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Handle any other errors
        return res.status(500).json({ message: 'An error occurred whilst serving the thumbnail' });
    }
});