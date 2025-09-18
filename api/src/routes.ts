import express from 'express';
import { Collection, CollectionCreateError, CollectionNotFoundError, ImageNotFoundError } from '@/domain';

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
    if (!req.body) {
        return res.status(400).json({ message: 'Request body is required' });
    }

    if (!req.body.name || req.body.name === '') {
        return res.status(400).json({ message: 'Collection name is required' });
    }

    try {
        Collection.create(req.body.name);

        return res.status(201).send();

    } catch (error) {

        if (error instanceof CollectionCreateError && error.cause instanceof Error) {
            const message = error.cause.message;

            if (message.includes('There is already a Collection with name:')) {
                return res.status(409).json({ message });
            }

            if (message.includes('is not a valid Collection name')) {
                return res.status(400).json({ message });
            }
        }

        return res.status(500).json({ message: 'An error occurred whilst creating the Collection' });
    }
});

routes.get('/images/:collectionId/:imageId', async (req, res) => {
    try {
        const { collectionId, imageId } = req.params;

        const collection = Collection.load(collectionId);
        const metadata = await collection.getImage(imageId);

        res.set('Content-Type', metadata.mime);
        res.set('Content-Length', metadata.size.toString());
        res.set('Cache-Control', 'public, max-age=31536000, immutable');

        const buffer = await collection.getImageData(metadata.id);

        return res.status(200).send(buffer);

    } catch (error: unknown) {

        if (error instanceof CollectionNotFoundError) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        if (error instanceof ImageNotFoundError) {
            return res.status(404).json({ message: 'Image not found' });
        }

        return res.status(500).json({ message: 'An error occurred whilst serving the image' });
    }
});

routes.get('/images/:collectionId/:imageId/thumbnail', async (req, res) => {
    try {
        const { collectionId, imageId } = req.params;

        const collection = Collection.load(collectionId);
        const metadata = await collection.getImage(imageId);

        const buffer = await collection.getThumbnailData(metadata.id);

        res.set('Content-Type', metadata.mime);
        res.set('Content-Length', buffer.length.toString());
        res.set('Cache-Control', 'public, max-age=31536000, immutable');

        return res.status(200).send(buffer);

    } catch (error: unknown) {

        if (error instanceof CollectionNotFoundError) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        if (error instanceof ImageNotFoundError) {
            return res.status(404).json({ message: 'Image not found' });
        }

        return res.status(500).json({ message: 'An error occurred whilst serving the thumbnail' });
    }
});