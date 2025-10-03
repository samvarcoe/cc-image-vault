import express from 'express';
import multer from 'multer';
import { Collection, CollectionCreateError, CollectionNotFoundError, ImageNotFoundError, ImageRetrievalError, ImageUpdateError, ImageDeletionError, ImageAdditionError } from '@/domain';
import archiver from 'archiver';

// Configure multer for handling multipart form data uploads
const upload = multer({ storage: multer.memoryStorage() });

export const routes = express.Router();

routes.get('/health', (_, res) => {
    res.json({ status: 'ok' });
});

routes.get('/collections', (_, res) => {
    try {
        const collections = Collection.list();

        res.json(collections);

    } catch {
        res.status(500).json({ message: 'An error occured whilst retrieving the Collections list' });
    }
});

routes.post('/collections', (req, res) => {
    if (!req.body) {
        return res.status(400).json({ message: 'Request body is required' });
    }

    if (!req.body.name || req.body.name === '') {
        return res.status(400).json({ message: 'Collection name is required' });
    }

    try {
        Collection.create(req.body.name);

        return res.status(201).send();

    } catch (error) {

        if (error instanceof CollectionCreateError && error.cause instanceof Error) {
            const message = error.cause.message;

            if (message.includes('There is already a Collection with name:')) {
                return res.status(409).json({ message });
            }

            if (message.includes('is not a valid Collection name')) {
                return res.status(400).json({ message });
            }
        }

        return res.status(500).json({ message: 'An error occurred whilst creating the Collection' });
    }
});

routes.post('/images/:collectionId', upload.single('file'), async (req, res) => {
    try {
        const { collectionId } = req.params;

        // Validate required route parameter (guaranteed by Express routing)
        if (!collectionId) {
            return res.status(400).json({ message: 'Collection ID is required' });
        }

        // Validate file was provided
        if (!req.file) {
            return res.status(400).json({ message: 'File is required' });
        }

        // Load collection (this will throw CollectionNotFoundError if not found)
        const collection = Collection.load(collectionId!);

        // Get original filename
        const originalName = req.file.originalname || 'upload';

        // Add image through domain layer using buffer directly
        const metadata = await collection.addImage(originalName, req.file.buffer);

        // Return created image metadata with 201 status
        return res.status(201).json(metadata);

    } catch (error: unknown) {
        if (error instanceof CollectionNotFoundError) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        if (error instanceof ImageAdditionError && error.cause instanceof Error) {
            const causeMessage = error.cause.message;

            // Map domain validation errors to 400 status
            if (causeMessage.includes('Unsupported file type') ||
                causeMessage.includes('Invalid or corrupted image file') ||
                causeMessage.includes('Unsafe or invalid filename') ||
                causeMessage.includes('Filename exceeds 256 characters') ||
                causeMessage.includes('Image already exists in Collection')) {
                return res.status(400).json({ message: causeMessage });
            }
        }

        // All other errors return 500 with generic message
        return res.status(500).json({ message: 'An error occurred whilst uploading the image' });
    }
});

routes.get('/images/:collectionId/:imageId', async (req, res) => {
    try {
        const { collectionId, imageId } = req.params;

        const collection = Collection.load(collectionId!);
        const metadata = await collection.getImage(imageId);

        res.set('Content-Type', metadata.mime);
        res.set('Content-Length', metadata.size.toString());
        res.set('Cache-Control', 'public, max-age=31536000, immutable');

        const buffer = await collection.getImageData(metadata.id);

        return res.status(200).send(buffer);

    } catch (error: unknown) {
        if (error instanceof CollectionNotFoundError) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        if (error instanceof ImageNotFoundError) {
            return res.status(404).json({ message: 'Image not found' });
        }

        if (error instanceof ImageRetrievalError && error.cause instanceof Error && error.cause.message === 'Invalid imageID') {
            return res.status(400).json({ message: 'Invalid image ID format' });
        }

        return res.status(500).json({ message: 'An error occurred whilst serving the image' });
    }
});

routes.get('/images/:collectionId/:imageId/thumbnail', async (req, res) => {
    try {
        const { collectionId, imageId } = req.params;

        const collection = Collection.load(collectionId!);
        const metadata = await collection.getImage(imageId);

        const buffer = await collection.getThumbnailData(metadata.id);

        res.set('Content-Type', metadata.mime);
        res.set('Content-Length', buffer.length.toString());
        res.set('Cache-Control', 'public, max-age=31536000, immutable');

        return res.status(200).send(buffer);

    } catch (error: unknown) {

        if (error instanceof CollectionNotFoundError) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        if (error instanceof ImageNotFoundError) {
            return res.status(404).json({ message: 'Image not found' });
        }

        if (error instanceof ImageRetrievalError) {
            // Check if the cause is a validation error (invalid image ID format)
            if (error.cause instanceof Error && error.cause.message === 'Invalid imageID') {
                return res.status(400).json({ message: 'Invalid image ID format' });
            }
            // For other retrieval errors, return 500
            return res.status(500).json({ message: 'An error occurred whilst serving the thumbnail' });
        }

        return res.status(500).json({ message: 'An error occurred whilst serving the thumbnail' });
    }
});

routes.patch('/images/:collectionId/:imageId', async (req, res) => {
    try {
        const { collectionId, imageId } = req.params;

        // Validate request body exists
        if (!req.body) {
            return res.status(400).json({ message: 'Request body is required' });
        }

        const body = req.body
        // Validate status field exists
        if (!Object.prototype.hasOwnProperty.call(body, 'status') || !body.status) {
            return res.status(400).json({ message: 'Status field is required' });
        }

        const status = body.status;

        // Validate status value
        if (!['INBOX', 'COLLECTION', 'ARCHIVE'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const collection = Collection.load(collectionId!);
        const updatedMetadata = await collection.updateImage(imageId, { status });

        return res.status(200).json(updatedMetadata);

    } catch (error: unknown) {
        if (error instanceof CollectionNotFoundError) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        if (error instanceof ImageNotFoundError) {
            return res.status(404).json({ message: 'Image not found' });
        }

        if (error instanceof ImageUpdateError && error.cause instanceof Error) {
            if (error.cause.message === 'Invalid imageID') {
                return res.status(400).json({ message: 'Invalid image ID format' });
            }
            if (error.cause.message === 'Invalid status') {
                return res.status(400).json({ message: 'Invalid status value' });
            }
        }

        return res.status(500).json({ message: 'An error occurred whilst updating the image' });
    }
});

routes.delete('/images/:collectionId/:imageId', async (req, res) => {
    try {
        const { collectionId, imageId } = req.params;

        const collection = Collection.load(collectionId!);
        await collection.deleteImage(imageId);

        return res.status(204).send();

    } catch (error: unknown) {
        if (error instanceof CollectionNotFoundError) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        if (error instanceof ImageNotFoundError) {
            return res.status(404).json({ message: 'Image not found' });
        }

        if (error instanceof ImageDeletionError && error.cause instanceof Error) {
            if (error.cause.message === 'Invalid imageID') {
                return res.status(400).json({ message: 'Invalid image ID format' });
            }
        }

        return res.status(500).json({ message: 'An error occurred whilst deleting the image' });
    }
});

routes.get('/images/:collectionId/:imageId/download', async (req, res) => {
    try {
        const { collectionId, imageId } = req.params;

        const collection = Collection.load(collectionId!);
        const metadata = await collection.getImage(imageId);
        const buffer = await collection.getImageData(metadata.id);

        res.set('Content-Type', metadata.mime);
        res.set('Content-Length', metadata.size.toString());
        res.set('Content-Disposition', `attachment; filename="${metadata.name}.${metadata.extension}"`);

        return res.status(200).send(buffer);

    } catch (error: unknown) {
        if (error instanceof CollectionNotFoundError) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        if (error instanceof ImageNotFoundError) {
            return res.status(404).json({ message: 'Image not found' });
        }

        if (error instanceof ImageRetrievalError && error.cause instanceof Error && error.cause.message === 'Invalid imageID') {
            return res.status(400).json({ message: 'Invalid image ID format' });
        }

        return res.status(500).json({ message: 'An error occurred whilst downloading the image' });
    }
});

routes.post('/images/:collectionId/download', async (req, res) => {
    try {
        const { collectionId } = req.params;

        // Validate request body exists
        if (!req.body) {
            return res.status(400).json({ message: 'Request body is required' });
        }

        // Validate imageIds field exists
        if (!Object.prototype.hasOwnProperty.call(req.body, 'imageIds')) {
            return res.status(400).json({ message: 'imageIds field is required' });
        }

        // Validate archiveName field exists
        if (!Object.prototype.hasOwnProperty.call(req.body, 'archiveName')) {
            return res.status(400).json({ message: 'archive name field is required' });
        }

        let { imageIds } = req.body;
        const { archiveName } = req.body;

        // Normalize imageIds to array (handles both JSON array and form-encoded comma-separated string)
        if (typeof imageIds === 'string') {
            // Form-encoded comma-separated list
            imageIds = imageIds.split(',').map(id => id.trim()).filter(id => id.length > 0);
        }

        // Validate imageIds is an array and not empty
        if (!Array.isArray(imageIds) || imageIds.length === 0) {
            return res.status(400).json({ message: 'imageIds array cannot be empty' });
        }

        // Validate archive name format (alphanumeric, dash, underscore only)
        const archiveNamePattern = /^[a-zA-Z0-9_-]+$/;
        if (!archiveNamePattern.test(archiveName)) {
            return res.status(400).json({ message: 'Invalid archive name format' });
        }

        // Validate all image IDs are valid UUID v4 format
        const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        for (const imageId of imageIds) {
            if (!uuidV4Pattern.test(imageId)) {
                return res.status(400).json({ message: 'Invalid image ID format' });
            }
        }

        console.log(`Preparing to download ${imageIds.length} images from collection ${collectionId} as archive "${archiveName}.zip"`);

        // Load collection (throws CollectionNotFoundError if not found)
        const collection = Collection.load(collectionId!);

        // Deduplicate image IDs while preserving request order
        const uniqueImageIds = Array.from(new Set(imageIds));

        // Set response headers and start streaming immediately
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename="${archiveName}.zip"`);

        // Create archive and pipe directly to response for immediate streaming
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression for best file size
        });

        // Pipe archive to response stream - download starts immediately
        archive.pipe(res);

        // Handle archive errors
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            // If headers not sent yet, send error response
            if (!res.headersSent) {
                res.status(500).json({ message: 'An error occurred whilst downloading images' });
            }
        });

        // Track seen filenames for duplicate handling
        const seenFilenames = new Map<string, number>(); // filename -> count

        // Process images sequentially in request order
        for (const imageId of uniqueImageIds) {
            // Fetch metadata for this image (throws ImageNotFoundError if not found)
            const metadata = await collection.getImage(imageId);

            // Determine filename with duplicate handling
            const baseFilename = `${metadata.name}.${metadata.extension}`;
            const count = seenFilenames.get(baseFilename) || 0;

            let finalFilename: string;
            if (count === 0) {
                // First occurrence - use original filename
                finalFilename = baseFilename;
            } else {
                // Subsequent occurrence - add indexed suffix
                const suffix = String(count).padStart(3, '0');
                finalFilename = `${metadata.name}_${suffix}.${metadata.extension}`;
            }

            // Update seen count
            seenFilenames.set(baseFilename, count + 1);

            // Fetch image data and append to archive
            const imageData = await collection.getImageData(metadata.id);
            archive.append(imageData, { name: finalFilename });
        }

        // Finalize archive - this will complete the stream
        await archive.finalize();

        // Response is already being streamed via pipe, no need to send explicitly
        // The stream will automatically close when finalized
        return;

    } catch (error: unknown) {
        // If streaming has already started (headers sent), we can't send a JSON error response
        if (res.headersSent) {
            console.error('Error during batch download streaming:', error);
            // The stream will be terminated with an error
            // Client will receive incomplete data and can detect the error
            return;
        }

        // Headers not sent yet - can send normal error responses
        if (error instanceof CollectionNotFoundError) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        if (error instanceof ImageNotFoundError) {
            return res.status(404).json({ message: 'Image not found' });
        }

        if (error instanceof ImageRetrievalError && error.cause instanceof Error && error.cause.message === 'Invalid imageID') {
            return res.status(400).json({ message: 'Invalid image ID format' });
        }

        return res.status(500).json({ message: 'An error occurred whilst downloading images' });
    }
});