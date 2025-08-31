import express from 'express';
import path from "path";
import { promises as fs } from 'fs';

import { CONFIG } from "../../config";
import { Collection } from "../domain/collection";
import { validateCollectionId, parseImageQueryParams, ImageQueryParams } from "./collection-utils";

export const routes = express.Router();

// Error response helper
const sendError = (res: express.Response, statusCode: number, error: string, message: string) => {
  res.status(statusCode).json({ error, message });
};

routes.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /collections - List all collections
routes.get('/collections', async (req, res) => {
  try {
    const collections = await Collection.list();
    res.json(collections);
  } catch (error: unknown) {
    if ((error as Error).message.includes('Server error')) {
      sendError(res, 500, 'server_error', (error as Error).message);
    } else {
      sendError(res, 500, 'server_error', 'Server error: failed to list collections');
    }
  }
});

// POST /collections - Create new collection
routes.post('/collections', async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return sendError(res, 400, 'validation_error', 'Invalid collection ID format: ID is required');
    }
    
    // Validate collection ID
    try {
      validateCollectionId(id);
    } catch (error: unknown) {
      return sendError(res, 400, 'validation_error', (error as Error).message);
    }

    // Check if collection already exists
    if (await Collection.exists(id)) {
      return sendError(res, 409, 'conflict_error', 'Duplicate collection ID');
    }

    // Create collection using domain layer
    const collection = await Collection.create(id);
    await collection.close();
    
    res.status(201).json({ id });
  } catch (error: unknown) {
    if ((error as Error).message.includes('insufficient permissions')) {
      sendError(res, 500, 'server_error', 'Server error: insufficient permissions to create collection');
    } else if ((error as Error).message.includes('Unable to create Collection')) {
      sendError(res, 500, 'server_error', 'Server error: failed to create collection');
    } else {
      console.error('Unexpected collection creation error:', (error as Error).message);
      sendError(res, 500, 'server_error', 'Server error: ' + (error as Error).message);
    }
  }
});

// GET /collections/:id - Get specific collection
routes.get('/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!await Collection.exists(id)) {
      return sendError(res, 404, 'not_found_error', 'Collection not found');
    }
    
    res.json({ id });
  } catch {
    sendError(res, 500, 'server_error', 'Server error: failed to retrieve collection');
  }
});

// DELETE /collections/:id - Delete collection
routes.delete('/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!await Collection.exists(id)) {
      return sendError(res, 404, 'not_found_error', 'Collection not found');
    }

    const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, id);
    await fs.rm(collectionPath, { recursive: true, force: true });
    
    res.status(204).send();
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'EACCES' || (error as NodeJS.ErrnoException).code === 'EPERM') {
      sendError(res, 500, 'server_error', 'Server error: insufficient permissions to delete collection');
    } else {
      sendError(res, 500, 'server_error', 'Server error: failed to delete collection');
    }
  }
});

// GET /collections/:id/images - List images in collection
routes.get('/collections/:id/images', async (req, res) => {


  try {
    const { id } = req.params;
    const validatedOptions = parseImageQueryParams(req.query as ImageQueryParams);

    if (!await Collection.exists(id)) {
      return sendError(res, 404, 'not_found_error', 'Collection not found');
    }

    const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, id);
    const collection = await Collection.load(collectionPath);
    const images = await collection.getImages(validatedOptions);
    await collection.close();

    res.json(images);
  } catch (error: unknown) {
    if ((error as Error).message.includes('Invalid')) {
      sendError(res, 400, 'validation_error', (error as Error).message);
    } else if ((error as Error).message.includes('Collection not found')) {
      sendError(res, 404, 'not_found_error', 'Collection not found');
    } else if ((error as NodeJS.ErrnoException).code === 'EACCES' || (error as NodeJS.ErrnoException).code === 'EPERM' || (error as Error).message.includes('permission')) {
      sendError(res, 500, 'server_error', 'Server error: insufficient permissions to access collection');
    } else {
      sendError(res, 500, 'server_error', 'Server error: failed to retrieve collection images');
    }
  }
});

// GET /images/:collectionId/:imageId - Serve original image file
routes.get('/images/:collectionId/:imageId', async (req, res) => {
  try {
    const { collectionId, imageId } = req.params;
    
    if (!await Collection.exists(collectionId)) {
      return sendError(res, 404, 'not_found_error', 'Collection not found');
    }

    // Load collection and get image metadata and file path
    const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, collectionId);
    const collection = await Collection.load(collectionPath);
    
    try {
      const metadata = await collection.getImageMetadata(imageId);
      const filePath = await collection.getImageFilePath(imageId);
      await collection.close();
      
      // Set cache headers for immutable content (1 year)
      res.set('Cache-Control', 'max-age=31536000');
      
      // Set content type based on image metadata
      res.set('Content-Type', metadata.mimeType);
      
      // Set content length
      res.set('Content-Length', metadata.size.toString());
      
      // Send the file
      res.sendFile(filePath);
    } catch (error: unknown) {
      await collection.close();
      throw error;
    }
  } catch (error: unknown) {
    if ((error as Error).message.includes('Collection not found')) {
      sendError(res, 404, 'not_found_error', 'Collection not found');
    } else if ((error as Error).message.includes('Image not found')) {
      sendError(res, 404, 'not_found_error', 'Image not found');
    } else if ((error as Error).message.includes('Image file not found on filesystem')) {
      sendError(res, 404, 'not_found_error', 'Image not found');
    } else if ((error as Error).message.includes('Image file access denied due to insufficient permissions')) {
      sendError(res, 500, 'server_error', 'Server error: insufficient permissions to access image file');
    } else if ((error as NodeJS.ErrnoException).code === 'EACCES' || (error as NodeJS.ErrnoException).code === 'EPERM' || (error as Error).message.includes('permission')) {
      sendError(res, 500, 'server_error', 'Server error: insufficient permissions to access image file');
    } else {
      sendError(res, 500, 'server_error', 'Server error: failed to serve image');
    }
  }
});

// GET /images/:collectionId/:imageId/thumbnail - Serve thumbnail image file
routes.get('/images/:collectionId/:imageId/thumbnail', async (req, res) => {
  try {
    const { collectionId, imageId } = req.params;
    
    // Check if collection directory exists first
    if (!await Collection.exists(collectionId)) {
      return sendError(res, 404, 'not_found_error', 'Collection not found');
    }
    
    // Load collection and get image metadata and thumbnail file path
    const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, collectionId);
    const collection = await Collection.load(collectionPath);
    
    try {
      await collection.getImageMetadata(imageId); // Verify image exists
      const filePath = await collection.getThumbnailFilePath(imageId);
      await collection.close();
      
      // Set cache headers for immutable content (1 year)
      res.set('Cache-Control', 'max-age=31536000');
      
      // Thumbnails are always JPEG format (as per Collection.generateThumbnail)
      res.set('Content-Type', 'image/jpeg');
      
      // Get file stats for content length
      const stats = await fs.stat(filePath);
      res.set('Content-Length', stats.size.toString());
      
      // Send the file
      res.sendFile(filePath);
    } catch (error: unknown) {
      await collection.close();
      throw error;
    }
  } catch (error: unknown) {
    if ((error as Error).message.includes('Collection not found')) {
      sendError(res, 404, 'not_found_error', 'Collection not found');
    } else if ((error as Error).message.includes('Image not found')) {
      sendError(res, 404, 'not_found_error', 'Image not found');
    } else if ((error as Error).message.includes('Thumbnail file not found on filesystem')) {
      sendError(res, 404, 'not_found_error', 'Thumbnail not found');
    } else if ((error as Error).message.includes('Thumbnail file access denied due to insufficient permissions')) {
      sendError(res, 500, 'server_error', 'Server error: insufficient permissions to access thumbnail file');
    } else if ((error as NodeJS.ErrnoException).code === 'EACCES' || (error as NodeJS.ErrnoException).code === 'EPERM' || (error as Error).message.includes('permission')) {
      sendError(res, 500, 'server_error', 'Server error: insufficient permissions to access thumbnail file');
    } else {
      sendError(res, 500, 'server_error', 'Server error: failed to serve thumbnail');
    }
  }
});
