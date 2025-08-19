import express from 'express';
import helmet from 'helmet';
import { CollectionsService } from './collections-service';

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Parse JSON bodies
app.use(express.json());

// Initialize collections service
const collectionsService = new CollectionsService('./private');

// Error response helper
const sendError = (res: express.Response, statusCode: number, error: string, message: string) => {
  res.status(statusCode).json({ error, message });
};

// GET /api/collections - List all collections
app.get('/api/collections', async (req, res) => {
  try {
    const collections = await collectionsService.listCollections();
    res.json(collections);
  } catch (error: unknown) {
    if ((error as Error).message.includes('Server error')) {
      sendError(res, 500, 'server_error', (error as Error).message);
    } else {
      sendError(res, 500, 'server_error', 'Server error: failed to list collections');
    }
  }
});

// POST /api/collections - Create new collection
app.post('/api/collections', async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return sendError(res, 400, 'validation_error', 'Invalid collection ID format: ID is required');
    }
    
    const collection = await collectionsService.createCollection(id);
    res.status(201).json(collection);
  } catch (error: unknown) {
    if ((error as Error).message.includes('Invalid collection ID format')) {
      sendError(res, 400, 'validation_error', (error as Error).message);
    } else if ((error as Error).message.includes('Duplicate collection ID')) {
      sendError(res, 409, 'conflict_error', (error as Error).message);
    } else if ((error as Error).message.includes('Server error')) {
      sendError(res, 500, 'server_error', (error as Error).message);
    } else {
      console.error('Unexpected collection creation error:', (error as Error).message);
      sendError(res, 500, 'server_error', 'Server error: failed to create collection');
    }
  }
});

// GET /api/collections/:id - Get specific collection
app.get('/api/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await collectionsService.getCollection(id);
    res.json(collection);
  } catch (error: unknown) {
    if ((error as Error).message.includes('Collection not found')) {
      sendError(res, 404, 'not_found_error', (error as Error).message);
    } else if ((error as Error).message.includes('Server error')) {
      sendError(res, 500, 'server_error', (error as Error).message);
    } else {
      sendError(res, 500, 'server_error', 'Server error: failed to retrieve collection');
    }
  }
});

// DELETE /api/collections/:id - Delete collection
app.delete('/api/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await collectionsService.deleteCollection(id);
    res.status(204).send();
  } catch (error: unknown) {
    if ((error as Error).message.includes('Collection not found')) {
      sendError(res, 404, 'not_found_error', (error as Error).message);
    } else if ((error as Error).message.includes('Server error')) {
      sendError(res, 500, 'server_error', (error as Error).message);
    } else {
      sendError(res, 500, 'server_error', 'Server error: failed to delete collection');
    }
  }
});

// GET /api/collections/:id/images - List images in collection
app.get('/api/collections/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const images = await collectionsService.getCollectionImages(id, req.query);
    res.json(images);
  } catch (error: unknown) {
    if ((error as Error).message.includes('Collection not found')) {
      sendError(res, 404, 'not_found_error', (error as Error).message);
    } else if ((error as Error).message.includes('Invalid')) {
      sendError(res, 400, 'validation_error', (error as Error).message);
    } else if ((error as Error).message.includes('Server error')) {
      sendError(res, 500, 'server_error', (error as Error).message);
    } else {
      sendError(res, 500, 'server_error', 'Server error: failed to retrieve collection images');
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Image Vault API server running on http://localhost:${port}`);
});

export { app };