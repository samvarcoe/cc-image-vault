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
    }
    catch (error) {
        const message = error.message || 'Unable to list collections';
        const model = new HomePageModel({ error: message });
        const view = new HomePageView(model);
        res.send(view.render());
    }
});
routes.get('/collection/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const { status, curate } = req.query;
        const curateMode = curate === 'true';
        const curateParam = curate === undefined ? 'false' : curate;
        const urlParams = new URLSearchParams();
        const validStatuses = ['INBOX', 'COLLECTION', 'ARCHIVE'];
        const imageStatus = status || 'COLLECTION';
        if (!validStatuses.includes(imageStatus)) {
            urlParams.set('status', 'COLLECTION');
        }
        else {
            urlParams.set('status', imageStatus);
        }
        urlParams.set('curate', curateParam);
        const expectedQuery = urlParams.toString();
        const currentQuery = new URLSearchParams(req.query).toString();
        if (currentQuery !== expectedQuery) {
            return res.redirect(`/collection/${name}?${expectedQuery}`);
        }
        const collection = Collection.load(name);
        const model = new CollectionPageModel({
            name,
            status: urlParams.get('status'),
            curate: curateMode,
            images: await collection.getImages({ status: urlParams.get('status') })
        });
        const view = new CollectionPageView(model);
        return res.send(view.render());
    }
    catch (error) {
        if (error instanceof CollectionNotFoundError) {
            return res.status(404).send('Collection not found');
        }
        console.error(error);
        const model = new CollectionPageModel({
            name: req.params.name,
            status: req.query.status || 'COLLECTION',
            curate: req.query.curate === 'true',
            error: 'Error retrieving images'
        });
        const view = new CollectionPageView(model);
        return res.send(view.render());
    }
});
