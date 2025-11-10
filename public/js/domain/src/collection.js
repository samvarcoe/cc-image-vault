import path from 'path';
import { validateCollectionName } from './collection-utils';
import { initializeCollectionDatabase } from './database';
import { fsOps } from './fs-operations';
import sharp from 'sharp';
import crypto from 'crypto';
import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import { CollectionClearError, CollectionCreateError, CollectionDeleteError, CollectionListError, CollectionLoadError, CollectionNotFoundError, ImageAdditionError, ImageDeletionError, ImageRetrievalError, ImageNotFoundError, ImageUpdateError } from '../errors';
export class Collection {
    constructor(name) {
        this.name = name;
    }
    getDatabase() {
        const databasePath = path.join(CONFIG.COLLECTIONS_DIRECTORY, this.name, 'collection.db');
        return new Database(databasePath);
    }
    static create(name) {
        try {
            validateCollectionName(name);
            const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, name);
            if (fsOps.existsSync(collectionPath) && fsOps.statSync(collectionPath).isDirectory()) {
                throw new Error(`There is already a Collection with name: "${name}"`);
            }
            try {
                fsOps.mkdirSync(collectionPath, { recursive: true });
                const imagesPath = path.join(collectionPath, 'images');
                fsOps.mkdirSync(imagesPath, { recursive: true });
                fsOps.mkdirSync(path.join(imagesPath, 'original'), { recursive: true });
                fsOps.mkdirSync(path.join(imagesPath, 'thumbnails'), { recursive: true });
                initializeCollectionDatabase(collectionPath);
                return new Collection(name);
            }
            catch (error) {
                try {
                    fsOps.rmSync(collectionPath, { recursive: true, force: true });
                }
                catch (error) {
                    console.error(`Error cleaning up partial creation artifacts: ${error.message} `);
                }
                throw error;
            }
        }
        catch (error) {
            throw new CollectionCreateError(name, error);
        }
    }
    static load(name) {
        try {
            validateCollectionName(name);
            const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, name);
            if (!fsOps.existsSync(collectionPath)) {
                throw new CollectionNotFoundError(name);
            }
            return new Collection(name);
        }
        catch (error) {
            if (error instanceof CollectionNotFoundError) {
                throw error;
            }
            throw new CollectionLoadError(name, error);
        }
    }
    static delete(name) {
        try {
            validateCollectionName(name);
            const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, name);
            if (!fsOps.existsSync(collectionPath)) {
                throw new CollectionNotFoundError(name);
            }
            fsOps.rmSync(collectionPath, { recursive: true, force: true });
        }
        catch (error) {
            throw new CollectionDeleteError(name, error);
        }
    }
    static list() {
        try {
            return fsOps.readdirSync(CONFIG.COLLECTIONS_DIRECTORY, { withFileTypes: true })
                .filter((entry) => entry.isDirectory())
                .map((entry) => entry.name)
                .sort();
        }
        catch (error) {
            throw new CollectionListError(error);
        }
    }
    static clear() {
        try {
            if (fsOps.existsSync(CONFIG.COLLECTIONS_DIRECTORY)) {
                fsOps.rmSync(CONFIG.COLLECTIONS_DIRECTORY, {
                    recursive: true,
                    force: true
                });
                fsOps.mkdirSync(CONFIG.COLLECTIONS_DIRECTORY, { recursive: true });
            }
        }
        catch (error) {
            throw new CollectionClearError(error);
        }
    }
    async addImage(filename, buffer) {
        try {
            const { extension, mime } = this.validateAndNormalizeFormat(filename);
            const filenameWithoutExtension = this.extractFilename(filename);
            this.validateFilename(filenameWithoutExtension);
            const hash = await this.calculateImageHash(buffer);
            await this.validateNoDuplicate(hash);
            const imageInfo = await this.validateAndGetImageInfo(buffer);
            const imageId = randomUUID();
            await this.processAndStoreImage(buffer, imageId, extension);
            const now = new Date();
            const metadata = {
                id: imageId,
                collection: this.name,
                name: filenameWithoutExtension,
                extension: extension,
                mime: mime,
                size: buffer.length,
                hash,
                width: imageInfo.width,
                height: imageInfo.height,
                aspect: imageInfo.width / imageInfo.height,
                status: 'INBOX',
                created: now,
                updated: now
            };
            await this.storeImageMetadata(metadata);
            return metadata;
        }
        catch (error) {
            throw new ImageAdditionError(this.name, error);
        }
    }
    validateImageExists(imageId) {
        const database = this.getDatabase();
        try {
            const row = database.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
            if (row == undefined) {
                throw new ImageNotFoundError(imageId);
            }
        }
        finally {
            database.close();
        }
    }
    async getImage(imageId) {
        try {
            this.validateImageId(imageId);
            const database = this.getDatabase();
            try {
                const row = database
                    .prepare('SELECT * FROM images WHERE id = ?')
                    .get(imageId);
                if (!row) {
                    throw new ImageNotFoundError(imageId);
                }
                const metadata = {
                    id: row.id,
                    collection: row.collection,
                    name: row.name,
                    extension: row.extension,
                    mime: row.mime,
                    size: row.size,
                    hash: row.hash,
                    width: row.width,
                    height: row.height,
                    aspect: row.aspect,
                    status: row.status,
                    created: new Date(row.created),
                    updated: new Date(row.updated)
                };
                return metadata;
            }
            finally {
                database.close();
            }
        }
        catch (error) {
            if (error instanceof ImageNotFoundError) {
                throw error;
            }
            ;
            throw new ImageRetrievalError(this.name, imageId, error);
        }
    }
    async updateImage(imageId, update) {
        try {
            this.validateImageId(imageId);
            this.validateImageExists(imageId);
            this.validateImageStatus(update.status);
            const image = await this.getImage(imageId);
            const database = this.getDatabase();
            const now = new Date();
            try {
                database
                    .prepare('UPDATE images SET status = ?, updated = ? WHERE id = ?')
                    .run(update.status, now.toISOString(), imageId);
                const updatedMetadata = Object.assign(Object.assign({}, image), { status: update.status, updated: now });
                return updatedMetadata;
            }
            finally {
                database.close();
            }
        }
        catch (error) {
            if (error instanceof ImageNotFoundError) {
                throw error;
            }
            ;
            throw new ImageUpdateError(this.name, imageId, error);
        }
    }
    async deleteImage(imageId) {
        try {
            this.validateImageId(imageId);
            const imageMetadata = await this.getImage(imageId);
            const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, this.name);
            const originalPath = path.join(collectionPath, 'images', 'original', `${imageId}.${imageMetadata.extension}`);
            const thumbnailPath = path.join(collectionPath, 'images', 'thumbnails', `${imageId}.${imageMetadata.extension}`);
            const database = this.getDatabase();
            let imageRemoved = false;
            try {
                database.prepare('DELETE FROM images WHERE id = ?').run(imageId);
                imageRemoved = true;
                await fsOps.unlink(originalPath);
                await fsOps.unlink(thumbnailPath);
            }
            catch (fileError) {
                if (imageRemoved) {
                    try {
                        database
                            .prepare(`INSERT INTO images (
                                    id, collection, name, extension, mime, size, hash,
                                    width, height, aspect, status, created, updated
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                            .run(imageMetadata.id, imageMetadata.collection, imageMetadata.name, imageMetadata.extension, imageMetadata.mime, imageMetadata.size, imageMetadata.hash, imageMetadata.width, imageMetadata.height, imageMetadata.aspect, imageMetadata.status, imageMetadata.created.toISOString(), imageMetadata.updated.toISOString());
                    }
                    catch (rollbackError) {
                        console.error(`Failed to rollback database deletion for image ${imageId}:`, rollbackError);
                    }
                }
                throw fileError;
            }
            finally {
                database.close();
            }
        }
        catch (error) {
            if (error instanceof ImageNotFoundError) {
                throw error;
            }
            ;
            throw new ImageDeletionError(this.name, imageId, error);
        }
    }
    async getImages(options) {
        try {
            if (options === null || options === void 0 ? void 0 : options.status) {
                this.validateImageStatus(options.status);
            }
            const database = this.getDatabase();
            try {
                let query = 'SELECT * FROM images';
                const params = [];
                if (options === null || options === void 0 ? void 0 : options.status) {
                    query += ' WHERE status = ?';
                    params.push(options.status);
                }
                query += ' ORDER BY created ASC';
                const rows = database
                    .prepare(query)
                    .all(...params);
                const images = rows.map(row => ({
                    id: row.id,
                    collection: row.collection,
                    name: row.name,
                    extension: row.extension,
                    mime: row.mime,
                    size: row.size,
                    hash: row.hash,
                    width: row.width,
                    height: row.height,
                    aspect: row.aspect,
                    status: row.status,
                    created: new Date(row.created),
                    updated: new Date(row.updated)
                }));
                return images;
            }
            finally {
                database.close();
            }
        }
        catch (error) {
            throw new ImageRetrievalError(this.name, undefined, error);
        }
    }
    async getImageData(imageId) {
        try {
            this.validateImageId(imageId);
            const imageMetadata = await this.getImage(imageId);
            const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, this.name);
            const originalPath = path.join(collectionPath, 'images', 'original', `${imageId}.${imageMetadata.extension}`);
            const imageData = await fsOps.readFile(originalPath);
            return imageData;
        }
        catch (error) {
            if (error instanceof ImageNotFoundError) {
                throw error;
            }
            ;
            throw new ImageRetrievalError(this.name, imageId, error);
        }
    }
    async getThumbnailData(imageId) {
        try {
            this.validateImageId(imageId);
            const imageMetadata = await this.getImage(imageId);
            const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, this.name);
            const thumbnailPath = path.join(collectionPath, 'images', 'thumbnails', `${imageId}.${imageMetadata.extension}`);
            const thumbnailData = await fsOps.readFile(thumbnailPath);
            return thumbnailData;
        }
        catch (error) {
            if (error instanceof ImageNotFoundError) {
                throw error;
            }
            ;
            throw new ImageRetrievalError(this.name, imageId, error);
        }
    }
    validateImageStatus(status) {
        const validStatuses = ['INBOX', 'COLLECTION', 'ARCHIVE'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }
    }
    validateAndNormalizeFormat(filename) {
        const ext = path.extname(filename).toLowerCase();
        switch (ext) {
            case '.jpg':
                return { extension: 'jpg', mime: 'image/jpeg' };
            case '.jpeg':
                return { extension: 'jpg', mime: 'image/jpeg' };
            case '.png':
                return { extension: 'png', mime: 'image/png' };
            case '.webp':
                return { extension: 'webp', mime: 'image/webp' };
            default:
                throw new Error('Unsupported file type, must be image file with extension jpg/jpeg/png/webp');
        }
    }
    extractFilename(filename) {
        const extension = path.extname(filename);
        return filename.slice(0, filename.length - extension.length);
    }
    validateFilename(filename) {
        if (filename.length > 256) {
            throw new Error('Filename exceeds 256 characters');
        }
        const pattern = /^[A-Za-z0-9()._-]+$/;
        if (!pattern.test(filename)) {
            throw new Error('Unsafe or invalid filename');
        }
    }
    validateImageId(imageID) {
        const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!pattern.test(imageID)) {
            throw new Error('Invalid imageID');
        }
    }
    async calculateImageHash(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }
    async validateNoDuplicate(hash) {
        const database = this.getDatabase();
        try {
            const existing = database.prepare('SELECT id FROM images WHERE hash = ?').get(hash);
            if (existing) {
                throw new Error('Image already exists in Collection');
            }
        }
        finally {
            database.close();
        }
    }
    async validateAndGetImageInfo(buffer) {
        try {
            const imageInfo = await sharp(buffer).metadata();
            if (!imageInfo.width || !imageInfo.height) {
                throw new Error('Invalid or corrupted image file');
            }
            return imageInfo;
        }
        catch (_a) {
            throw new Error('Invalid or corrupted image file');
        }
    }
    async processAndStoreImage(buffer, imageID, extension) {
        const collectionPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, this.name);
        const originalPath = path.join(collectionPath, 'images', 'original', `${imageID}.${extension}`);
        const thumbnailPath = path.join(collectionPath, 'images', 'thumbnails', `${imageID}.${extension}`);
        await fsOps.writeFile(originalPath, buffer);
        await sharp(buffer)
            .resize(CONFIG.THUMBNAIL_WIDTH, null, {
            withoutEnlargement: true,
            fit: 'inside'
        })
            .toFile(thumbnailPath);
    }
    async storeImageMetadata(metadata) {
        const database = this.getDatabase();
        try {
            database
                .prepare(`INSERT INTO images (
                        id, collection, name, extension, mime, size, hash,
                        width, height, aspect, status, created, updated
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                .run(metadata.id, metadata.collection, metadata.name, metadata.extension, metadata.mime, metadata.size, metadata.hash, metadata.width, metadata.height, metadata.aspect, metadata.status, metadata.created.toISOString(), metadata.updated.toISOString());
        }
        finally {
            database.close();
        }
    }
}
