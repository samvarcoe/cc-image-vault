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

routes.get('/collection/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const { status } = req.query;

        // Redirect to default status if none provided
        if (!status) {
            return res.redirect(`/collection/${name}?status=COLLECTION`);
        }

        // Validate status parameter
        const validStatuses: ImageStatus[] = ['INBOX', 'COLLECTION', 'ARCHIVE'];
        const imageStatus = status as ImageStatus;
        if (!validStatuses.includes(imageStatus)) {
            return res.redirect(`/collection/${name}?status=COLLECTION`);
        }

        const collection = Collection.load(name);

        const model = new CollectionPageModel({
            name,
            status: imageStatus,
            images: await collection.getImages({ status: imageStatus })
        });

        const view = new CollectionPageView(model);

        return res.send(view.render());

    } catch (error: unknown) {

        if (error instanceof CollectionNotFoundError) {
            return res.status(404).send('Collection not found');
        }

        const model = new CollectionPageModel({
            name: req.params.name,
            status: (req.query.status as ImageStatus) || 'COLLECTION',
            error: 'Error retrieving images'
        });

        const view = new CollectionPageView(model);

        return res.send(view.render());
    }
});