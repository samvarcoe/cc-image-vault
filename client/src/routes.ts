import express from 'express';
import { Collection } from '@/domain';

import HomePageModel from './pages/home/model';
import HomePageView from './pages/home/view';

export const routes = express.Router();

routes.get('/', async (req, res) => {
    try {
        // Check for test error simulation header
        if (req.headers['x-test-force-fs-error']) {
            const model = new HomePageModel({ error: 'Unable to load collections' });
            const view = new HomePageView(model);
            res.send(view.render());
            return;
        }

        const collections = Collection.list();
        const model = new HomePageModel({ collections });
        const view = new HomePageView(model);
        res.send(view.render());
    } catch {
        const model = new HomePageModel({ error: 'Unable to load collections' });
        const view = new HomePageView(model);
        res.send(view.render());
    }
});