export class CollectionNotFoundError extends Error {
    constructor(collectionName) {
        super(`No Collection found with name: "${collectionName}"`);
        this.name = 'CollectionNotFoundError';
    }
}
export class CollectionCreateError extends Error {
    constructor(collectionName, cause) {
        super(`Unable to create Collection: "${collectionName}"`);
        this.cause = cause;
        this.name = 'CollectionCreateError';
    }
}
export class CollectionListError extends Error {
    constructor(cause) {
        super(`Unable to list Collections`);
        this.cause = cause;
        this.name = 'CollectionListError';
    }
}
export class CollectionLoadError extends Error {
    constructor(collectionName, cause) {
        super(`Unable to load Collection: "${collectionName}"`);
        this.cause = cause;
        this.name = 'CollectionLoadError';
    }
}
export class CollectionDeleteError extends Error {
    constructor(collectionName, cause) {
        super(`Unable to delete Collection: "${collectionName}"`);
        this.cause = cause;
        this.name = 'CollectionDeleteError';
    }
}
export class CollectionClearError extends Error {
    constructor(cause) {
        super(`Unable to clear Collections`);
        this.cause = cause;
        this.name = 'CollectionClearError';
    }
}
export class ImageAdditionError extends Error {
    constructor(collectionName, cause) {
        super(`Unable to add image to Collection "${collectionName}"`);
        this.cause = cause;
        this.name = 'ImageAdditionError';
    }
}
export class ImageRetrievalError extends Error {
    constructor(collectionName, imageId, cause) {
        const message = imageId
            ? `Unable to retrieve image: "${imageId}" from Collection: "${collectionName}"`
            : `Unable to retrieve images from Collection "${collectionName}"`;
        super(message);
        this.cause = cause;
        this.name = 'ImageRetrievalError';
    }
}
export class ImageNotFoundError extends Error {
    constructor(imageId) {
        super(`Image not found with ID: "${imageId}"`);
        this.name = 'ImageNotFoundError';
    }
}
export class ImageUpdateError extends Error {
    constructor(collectionName, imageId, cause) {
        super(`Unable to update image: "${imageId}" in Collection: "${collectionName}"`);
        this.cause = cause;
        this.name = 'ImageUpdateError';
    }
}
export class ImageDeletionError extends Error {
    constructor(collectionName, imageId, cause) {
        super(`Unable to delete image: "${imageId}" from Collection: "${collectionName}"`);
        this.cause = cause;
        this.name = 'ImageDeletionError';
    }
}
export class PendingImplementationError extends Error {
    constructor(functionName) {
        super(`"${functionName} is not implemented yet`);
        this.functionName = functionName;
        this.name = 'PendingImplementationError';
    }
}
