import express from 'express';
import multer from 'multer';
import { Collection, CollectionCreateError, CollectionNotFoundError, ImageNotFoundError, ImageRetrievalError, ImageUpdateError, ImageDeletionError, ImageAdditionError } from '@/domain';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

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
    let tempDir: string | null = null;

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

        // Create temporary file for domain processing
        // Use original filename to preserve the name/extension the domain layer expects
        const originalName = req.file.originalname || 'upload';
        // Use a UUID for the directory to avoid conflicts while preserving original filename
        tempDir = join(tmpdir(), randomUUID());
        const tempFilePath = join(tempDir, originalName);

        // Create temp directory and write buffer to temporary file
        mkdirSync(tempDir, { recursive: true });
        writeFileSync(tempFilePath, req.file.buffer);

        // Add image through domain layer
        const metadata = await collection.addImage(tempFilePath);

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

    } finally {
        // Clean up temporary directory and file
        if (tempDir) {
            try {
                rmSync(tempDir, { recursive: true, force: true });
            } catch {
                // Ignore cleanup errors
            }
        }
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
        res.set('Content-Disposition', `attachment; filename="${metadata.name}"`);

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