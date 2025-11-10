import express from 'express';
import multer from 'multer';
import { Collection, CollectionCreateError, CollectionNotFoundError, ImageNotFoundError, ImageRetrievalError, ImageUpdateError, ImageDeletionError, ImageAdditionError } from '@/domain';
import archiver from 'archiver';
const upload = multer({ storage: multer.memoryStorage() });
export const routes = express.Router();
routes.get('/health', (_, res) => {
    res.json({ status: 'ok' });
});
routes.get('/collections', (_, res) => {
    try {
        const collections = Collection.list();
        res.json(collections);
    }
    catch (_a) {
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
    }
    catch (error) {
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
        if (!collectionId) {
            return res.status(400).json({ message: 'Collection ID is required' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'File is required' });
        }
        const collection = Collection.load(collectionId);
        const originalName = req.file.originalname || 'upload';
        const metadata = await collection.addImage(originalName, req.file.buffer);
        return res.status(201).json(metadata);
    }
    catch (error) {
        if (error instanceof CollectionNotFoundError) {
            return res.status(404).json({ message: 'Collection not found' });
        }
        if (error instanceof ImageAdditionError && error.cause instanceof Error) {
            const causeMessage = error.cause.message;
            if (causeMessage.includes('Unsupported file type') ||
                causeMessage.includes('Invalid or corrupted image file') ||
                causeMessage.includes('Unsafe or invalid filename') ||
                causeMessage.includes('Filename exceeds 256 characters') ||
                causeMessage.includes('Image already exists in Collection')) {
                return res.status(400).json({ message: causeMessage });
            }
        }
        return res.status(500).json({ message: 'An error occurred whilst uploading the image' });
    }
});
routes.get('/images/:collectionId/:imageId', async (req, res) => {
    try {
        const { collectionId, imageId } = req.params;
        const collection = Collection.load(collectionId);
        const metadata = await collection.getImage(imageId);
        res.set('Content-Type', metadata.mime);
        res.set('Content-Length', metadata.size.toString());
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        const buffer = await collection.getImageData(metadata.id);
        return res.status(200).send(buffer);
    }
    catch (error) {
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
        const collection = Collection.load(collectionId);
        const metadata = await collection.getImage(imageId);
        const buffer = await collection.getThumbnailData(metadata.id);
        res.set('Content-Type', metadata.mime);
        res.set('Content-Length', buffer.length.toString());
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        return res.status(200).send(buffer);
    }
    catch (error) {
        if (error instanceof CollectionNotFoundError) {
            return res.status(404).json({ message: 'Collection not found' });
        }
        if (error instanceof ImageNotFoundError) {
            return res.status(404).json({ message: 'Image not found' });
        }
        if (error instanceof ImageRetrievalError) {
            if (error.cause instanceof Error && error.cause.message === 'Invalid imageID') {
                return res.status(400).json({ message: 'Invalid image ID format' });
            }
            return res.status(500).json({ message: 'An error occurred whilst serving the thumbnail' });
        }
        return res.status(500).json({ message: 'An error occurred whilst serving the thumbnail' });
    }
});
routes.patch('/images/:collectionId/:imageId', async (req, res) => {
    try {
        const { collectionId, imageId } = req.params;
        if (!req.body) {
            return res.status(400).json({ message: 'Request body is required' });
        }
        const body = req.body;
        if (!Object.prototype.hasOwnProperty.call(body, 'status') || !body.status) {
            return res.status(400).json({ message: 'Status field is required' });
        }
        const status = body.status;
        if (!['INBOX', 'COLLECTION', 'ARCHIVE'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        const collection = Collection.load(collectionId);
        const updatedMetadata = await collection.updateImage(imageId, { status });
        return res.status(200).json(updatedMetadata);
    }
    catch (error) {
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
        const collection = Collection.load(collectionId);
        await collection.deleteImage(imageId);
        return res.status(204).send();
    }
    catch (error) {
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
        const collection = Collection.load(collectionId);
        const metadata = await collection.getImage(imageId);
        const buffer = await collection.getImageData(metadata.id);
        res.set('Content-Type', metadata.mime);
        res.set('Content-Length', metadata.size.toString());
        res.set('Content-Disposition', `attachment; filename="${metadata.name}.${metadata.extension}"`);
        return res.status(200).send(buffer);
    }
    catch (error) {
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
        if (!req.body) {
            return res.status(400).json({ message: 'Request body is required' });
        }
        if (!Object.prototype.hasOwnProperty.call(req.body, 'imageIds')) {
            return res.status(400).json({ message: 'imageIds field is required' });
        }
        if (!Object.prototype.hasOwnProperty.call(req.body, 'archiveName')) {
            return res.status(400).json({ message: 'archive name field is required' });
        }
        let { imageIds } = req.body;
        const { archiveName } = req.body;
        if (typeof imageIds === 'string') {
            imageIds = imageIds.split(',').map(id => id.trim()).filter(id => id.length > 0);
        }
        if (!Array.isArray(imageIds) || imageIds.length === 0) {
            return res.status(400).json({ message: 'imageIds array cannot be empty' });
        }
        const archiveNamePattern = /^[a-zA-Z0-9_-]+$/;
        if (!archiveNamePattern.test(archiveName)) {
            return res.status(400).json({ message: 'Invalid archive name format' });
        }
        const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        for (const imageId of imageIds) {
            if (!uuidV4Pattern.test(imageId)) {
                return res.status(400).json({ message: 'Invalid image ID format' });
            }
        }
        console.log(`Preparing to download ${imageIds.length} images from collection ${collectionId} as archive "${archiveName}.zip"`);
        const collection = Collection.load(collectionId);
        const uniqueImageIds = Array.from(new Set(imageIds));
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename="${archiveName}.zip"`);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });
        archive.pipe(res);
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) {
                res.status(500).json({ message: 'An error occurred whilst downloading images' });
            }
        });
        const seenFilenames = new Map();
        for (const imageId of uniqueImageIds) {
            const metadata = await collection.getImage(imageId);
            const baseFilename = `${metadata.name}.${metadata.extension}`;
            const count = seenFilenames.get(baseFilename) || 0;
            let finalFilename;
            if (count === 0) {
                finalFilename = baseFilename;
            }
            else {
                const suffix = String(count).padStart(3, '0');
                finalFilename = `${metadata.name}_${suffix}.${metadata.extension}`;
            }
            seenFilenames.set(baseFilename, count + 1);
            const imageData = await collection.getImageData(metadata.id);
            archive.append(imageData, { name: finalFilename });
        }
        await archive.finalize();
        return;
    }
    catch (error) {
        if (res.headersSent) {
            console.error('Error during batch download streaming:', error);
            return;
        }
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
