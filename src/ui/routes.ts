import express from 'express';
import path from 'path';

import { CONFIG } from '../../config';
import { Collection } from '../domain/collection';
import CollectionPageModel from './pages/collection/model';
import CollectionPageView from './pages/collection/view';
import HomePageModel from './pages/home/model';
import HomePageView from './pages/home/view';

export const routes = express.Router();


const validateStatus = (status: string): status is 'INBOX' | 'COLLECTION' | 'ARCHIVE' => {
  return ['INBOX', 'COLLECTION', 'ARCHIVE'].includes(status);
}

routes.get('/', async (req, res) => {
  try {
    const collections = await Collection.list();
    const model = new HomePageModel({collections});
    const view = new HomePageView(model);
    res.send(view.render());
  } catch (error: unknown) {
    console.error('Error rendering home page:', error);
    res.status(500).send('Internal Server Error');
  }
});

routes.get('/collection/:id', async (req, res) => {
  const { id } = req.params;
  const status = req.query.status as string;
  const statusFilter: ImageStatus = validateStatus(status) ? status : 'COLLECTION';

  try {
    if (!await Collection.exists(id)) {
      const model = new CollectionPageModel();
      const view = new CollectionPageView(model);
      return res.status(404).send(view.render());
    }
    
    const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, id);
    const collection = await Collection.load(collectionPath);
    const images = await collection.getImages({ status: statusFilter });
    await collection.close();
    
    const model = new CollectionPageModel({
      collectionId: id,
      statusFilter,
      images,
    });

    const view = new CollectionPageView(model);

    return res.send(view.render());
  } catch (error: unknown) {
    console.error('Error rendering collection page:', error);
    return res.status(500).send('Internal Server Error');
  }
});