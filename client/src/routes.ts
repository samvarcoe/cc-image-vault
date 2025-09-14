import express from 'express';

import HomePageModel from './pages/home/model';
import HomePageView from './pages/home/view';

export const routes = express.Router();

routes.get('/', async (_, res) => {
    const model = new HomePageModel({});
    const view = new HomePageView(model);
    res.send(view.render());
});