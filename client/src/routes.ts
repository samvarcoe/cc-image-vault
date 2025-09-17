import express from 'express';
import { Collection } from '@/domain';

import HomePageModel from './pages/home/model';
import HomePageView from './pages/home/view';

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