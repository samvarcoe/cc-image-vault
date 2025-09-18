import express from 'express';
import { Collection, CollectionLoadError, CollectionNotFoundError } from '@/domain';

import HomePageModel from './pages/home/model';
import HomePageView from './pages/home/view';
import CollectionPageModel from './pages/collection/model';
import CollectionPageView from './pages/collection/view';

export const routes = express.Router();

routes.get('/', async (_, res) => {
    try {
        const collections = Collection.list();
        const model = new HomePageModel({ collections });
        const view = new HomePageView(model);
        res.send(view.render());

    } catch (error: unknown ){
        const message = (error as Error).message || 'Unable to list collections'
        const model = new HomePageModel({ error: message});
        const view = new HomePageView(model);
        res.send(view.render());
    }
});

routes.get('/collection/:collectionName', async (req, res) => {
    try {
        const { collectionName } = req.params;

        // Load the collection
        const collection = Collection.load(collectionName);

        // Get images with "COLLECTION" status
        const images = await collection.getImages({ status: 'COLLECTION' });

        // Create the model and view
        const model = new CollectionPageModel({
            name: collectionName,
            images
        });
        const view = new CollectionPageView(model);
        return res.send(view.render());

    } catch (error: unknown) {
        // Check if it's a collection not found error
        if (error instanceof CollectionLoadError) {
            if ((error.cause as Error) instanceof CollectionNotFoundError) {
                return res.status(404).send('Collection not found');
            }
        }

        // Handle other errors - use generic message for any error
        const message = 'Error retrieving images';
        const model = new CollectionPageModel({
            name: req.params.collectionName,
            error: message
        });
        const view = new CollectionPageView(model);
        return res.send(view.render());
    }
});