import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { promises as fs } from 'fs';
import { Collection } from '../domain/collection';
import {
  ImageQueryParams,
  validateCollectionId,
  listCollectionDirectories,
  collectionExists,
  collectionDirectoryExists,
  parseImageQueryParams,
  convertToApiResponse
} from './collection-utils';
import HomePageModel from '../ui/pages/home/model';
import HomePageView from '../ui/pages/home/view';
import CollectionPageModel , { CollectionPageData } from '../ui/pages/collection/model';
import CollectionPageView from '../ui/pages/collection/view';


const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'"],
      "script-src-attr": ["'unsafe-inline'"], // Allow inline event handlers
      "form-action": ["'self'"], // Allow form submissions to same origin
      // Disable upgrade-insecure-requests in development to avoid HTTPS protocol errors
      "upgrade-insecure-requests": process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
}));

// Parse JSON bodies
app.use(express.json());

app.use(compression());

// Serve static files
app.use('/css', express.static(path.join(__dirname, '../../public/css')));
app.use('/js', express.static(path.join(__dirname, '../../public/js')));

// Base path for collections
const basePath = path.resolve('./private');

// Error response helper
const sendError = (res: express.Response, statusCode: number, error: string, message: string) => {
  res.status(statusCode).json({ error, message });
};

// Home page route
app.get('/', async (req, res) => {
  try {
    const collections = await listCollectionDirectories(basePath);
    const model = new HomePageModel({collections});
    const view = new HomePageView(model);
    res.send(view.render());
  } catch (error: unknown) {
    console.error('Error rendering home page:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Collection page route
app.get('/collection/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const status = req.query.status as string;
    
    // Check if collection exists
    if (!await collectionDirectoryExists(basePath, id)) {
      // 404 page for non-existent collection
      const pageData: CollectionPageData = {
        collectionId: id,
        statusFilter: 'COLLECTION',
        images: [],
        loading: false,
        error: 'Collection not found'
      };

      const model = new CollectionPageModel(pageData);
      const view = new CollectionPageView(model);

      return res.status(404).send(view.render());
    }
    
    // Validate and normalize status parameter
    const validStatuses = ['INBOX', 'COLLECTION', 'ARCHIVE'];
    const normalizedStatus = validStatuses.includes(status) ? status : 'COLLECTION';
    
    // Load collection and get images
    const collectionPath = path.join(basePath, id);
    const collection = await Collection.load(collectionPath);
    const images = await collection.getImages({ status: normalizedStatus as 'INBOX' | 'COLLECTION' | 'ARCHIVE' });
    await collection.close();

    const data: CollectionPageData = {
      collectionId: id,
      statusFilter: normalizedStatus as 'INBOX' | 'COLLECTION' | 'ARCHIVE',
      images: images.map(img => ({
        id: img.id,
        thumbnailUrl: `/api/images/${id}/${img.id}/thumbnail`,
        originalName: img.originalName,
        status: img.status,
        dimensions: img.dimensions,
        aspectRatio: img.aspectRatio
      })),
      loading: false
    };
    
    // Create model and view
    const model = new CollectionPageModel(data);
    const view = new CollectionPageView(model);
    // const html = renderPage(model, view, 'collection');
    return res.send(view.render());
  } catch (error: unknown) {
    console.error('Error rendering collection page:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// GET /api/collections - List all collections
app.get('/api/collections', async (req, res) => {
  try {
    const collections = await listCollectionDirectories(basePath);
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
    
    // Validate collection ID
    try {
      validateCollectionId(id);
    } catch (error: unknown) {
      return sendError(res, 400, 'validation_error', (error as Error).message);
    }

    // Check if collection already exists
    if (await collectionExists(basePath, id)) {
      return sendError(res, 409, 'conflict_error', 'Duplicate collection ID');
    }

    // Create collection using domain layer
    const collection = await Collection.create(id, basePath);
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

// GET /api/collections/:id - Get specific collection
app.get('/api/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!await collectionExists(basePath, id)) {
      return sendError(res, 404, 'not_found_error', 'Collection not found');
    }
    
    res.json({ id });
  } catch {
    sendError(res, 500, 'server_error', 'Server error: failed to retrieve collection');
  }
});

// DELETE /api/collections/:id - Delete collection
app.delete('/api/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!await collectionExists(basePath, id)) {
      return sendError(res, 404, 'not_found_error', 'Collection not found');
    }

    const collectionPath = path.join(basePath, id);
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

// GET /api/collections/:id/images - List images in collection
app.get('/api/collections/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Parse and validate query parameters first
    const validatedOptions = parseImageQueryParams(req.query as ImageQueryParams);
    
    // Check if collection directory exists to distinguish between "not found" and "access issues"
    if (!await collectionDirectoryExists(basePath, id)) {
      return sendError(res, 404, 'not_found_error', 'Collection not found');
    }
    
    const collectionPath = path.join(basePath, id);
    
    // Load collection and get images
    const collection = await Collection.load(collectionPath);
    const images = await collection.getImages(validatedOptions);
    await collection.close();
    
    // Convert to API response format with pagination
    const response = convertToApiResponse(images, validatedOptions);
    res.json(response);
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

// GET /api/images/:collectionId/:imageId - Serve original image file
app.get('/api/images/:collectionId/:imageId', async (req, res) => {
  try {
    const { collectionId, imageId } = req.params;
    
    // Check if collection directory exists first
    if (!await collectionDirectoryExists(basePath, collectionId)) {
      return sendError(res, 404, 'not_found_error', 'Collection not found');
    }

    const collectionPath = path.join(basePath, collectionId);
    
    // Load collection and get image metadata and file path
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

// GET /api/images/:collectionId/:imageId/thumbnail - Serve thumbnail image file
app.get('/api/images/:collectionId/:imageId/thumbnail', async (req, res) => {
  try {
    const { collectionId, imageId } = req.params;
    
    // Check if collection directory exists first
    if (!await collectionDirectoryExists(basePath, collectionId)) {
      return sendError(res, 404, 'not_found_error', 'Collection not found');
    }

    const collectionPath = path.join(basePath, collectionId);
    
    // Load collection and get image metadata and thumbnail file path
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start HTTP server
app.listen(port, () => {
  console.log(`Image Vault API server running on http://localhost:${port}`);
});

export { app };