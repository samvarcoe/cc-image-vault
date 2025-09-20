import express from 'express';
import { Collection, CollectionNotFoundError } from '@/domain';

import HomePageModel from './pages/home/model';
import HomePageView from './pages/home/view';
import CollectionPageModel from './pages/collection/model';
import CollectionPageView from './pages/collection/view';

export const routes = express.Router();

routes.get('/', async (_, res) => {
    try {          
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

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
        const { status, curate } = req.query;

        // Parse curate parameter - default to false if not provided
        const curateMode = curate === 'true';
        const curateParam = curate === undefined ? 'false' : curate;

        // Build URL params
        const urlParams = new URLSearchParams();

        // Handle status parameter
        const validStatuses: ImageStatus[] = ['INBOX', 'COLLECTION', 'ARCHIVE'];
        const imageStatus = (status as ImageStatus) || 'COLLECTION';
        if (!validStatuses.includes(imageStatus)) {
            urlParams.set('status', 'COLLECTION');
        } else {
            urlParams.set('status', imageStatus);
        }

        // Add curate parameter
        urlParams.set('curate', curateParam as string);

        // Redirect if URL doesn't match expected format
        const expectedQuery = urlParams.toString();
        const currentQuery = new URLSearchParams(req.query as Record<string, string>).toString();
        if (currentQuery !== expectedQuery) {
            return res.redirect(`/collection/${name}?${expectedQuery}`);
        }

        const collection = Collection.load(name);

        const model = new CollectionPageModel({
            name,
            status: urlParams.get('status') as ImageStatus,
            curate: curateMode,
            images: await collection.getImages({ status: urlParams.get('status') as ImageStatus })
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
            curate: req.query.curate === 'true',
            error: 'Error retrieving images'
        });

        const view = new CollectionPageView(model);

        return res.send(view.render());
    }
});