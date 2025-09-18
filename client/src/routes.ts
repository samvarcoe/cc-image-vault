import express from 'express';
import { Collection, CollectionNotFoundError } from '@/domain';

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

        const collection = Collection.load(collectionName);

        const model = new CollectionPageModel({
            name: collectionName,
            images: await collection.getImages({ status: 'COLLECTION' })
        });

        const view = new CollectionPageView(model);
         
        return res.send(view.render());

    } catch (error: unknown) {

        if (error instanceof CollectionNotFoundError) {
            return res.status(404).send('Collection not found');
        }

        const model = new CollectionPageModel({
            name: req.params.collectionName,
            error: 'Error retrieving images'
        });

        const view = new CollectionPageView(model);

        return res.send(view.render());
    }
});