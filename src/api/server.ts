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

// GET /api/images/:collectionId/:imageId - Serve original image file
app.get('/api/images/:collectionId/:imageId', async (req, res) => {
  try {
    const { collectionId, imageId } = req.params;
    const { filePath, metadata } = await collectionsService.serveOriginalImage(collectionId, imageId);
    
    // Set cache headers for immutable content (1 year)
    res.set('Cache-Control', 'max-age=31536000');
    
    // Set content type based on image metadata
    res.set('Content-Type', metadata.mimeType);
    
    // Set content length
    res.set('Content-Length', metadata.size.toString());
    
    // Send the file
    res.sendFile(filePath);
  } catch (error: unknown) {
    if ((error as Error).message.includes('Collection not found')) {
      sendError(res, 404, 'not_found_error', (error as Error).message);
    } else if ((error as Error).message.includes('Image not found')) {
      sendError(res, 404, 'not_found_error', (error as Error).message);
    } else if ((error as Error).message.includes('Server error')) {
      sendError(res, 500, 'server_error', (error as Error).message);
    } else {
      sendError(res, 500, 'server_error', 'Server error: failed to serve image');
    }
  }
});

// GET /api/images/:collectionId/:imageId/thumbnail - Serve thumbnail image file
app.get('/api/images/:collectionId/:imageId/thumbnail', async (req, res) => {
  try {
    const { collectionId, imageId } = req.params;
    const { filePath } = await collectionsService.serveThumbnailImage(collectionId, imageId);
    
    // Set cache headers for immutable content (1 year)
    res.set('Cache-Control', 'max-age=31536000');
    
    // Thumbnails are always JPEG format (as per Collection.generateThumbnail)
    res.set('Content-Type', 'image/jpeg');
    
    // Get file stats for content length
    const fs = await import('fs');
    const stats = await fs.promises.stat(filePath);
    res.set('Content-Length', stats.size.toString());
    
    // Send the file
    res.sendFile(filePath);
  } catch (error: unknown) {
    if ((error as Error).message.includes('Collection not found')) {
      sendError(res, 404, 'not_found_error', (error as Error).message);
    } else if ((error as Error).message.includes('Image not found')) {
      sendError(res, 404, 'not_found_error', (error as Error).message);
    } else if ((error as Error).message.includes('Thumbnail not found')) {
      sendError(res, 404, 'not_found_error', (error as Error).message);
    } else if ((error as Error).message.includes('Server error')) {
      sendError(res, 500, 'server_error', (error as Error).message);
    } else {
      sendError(res, 500, 'server_error', 'Server error: failed to serve thumbnail');
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