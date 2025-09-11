export class CollectionNotFoundError extends Error {
  constructor(collectionName: string) {
    super(`No Collection found with name: "${collectionName}"`);
    this.name = 'CollectionNotFoundError';
  }
}

export class CollectionCreateError extends Error {
  constructor(collectionName: string, public cause: unknown) {
    super(`Unable to create Collection: "${collectionName}"`);
    this.name = 'CollectionCreateError';
  }
}

export class CollectionListError extends Error {
  constructor(public cause: unknown) {
    super(`Unable to list Collections`);
    this.name = 'CollectionListError';
  }
}

export class CollectionLoadError extends Error {
  constructor(collectionName: string, public cause: unknown) {
    super(`Unable to load Collection: "${collectionName}"`);
    this.name = 'CollectionLoadError';
  }
}

export class CollectionDeleteError extends Error {
  constructor(collectionName: string, public cause: unknown) {
    super(`Unable to delete Collection: "${collectionName}"`);
    this.name = 'CollectionDeleteError';
  }
}

export class CollectionClearError extends Error {
  constructor(public cause: unknown) {
    super(`Unable to clear Collections`);
    this.name = 'CollectionClearError';
  }
}

export class ImageAdditionError extends Error {
  constructor(collectionName: string, public cause: unknown) {
    super(`Unable to add image to Collection "${collectionName}"`);
    this.name = 'ImageAdditionError';
  }
}

export class ImageRetrievalError extends Error {
  constructor(collectionName: string, imageId: string, public cause: unknown) {
    super(`Unable to retrieve image: "${imageId}" from Collection: "${collectionName}"`);
    this.name = 'ImageRetrievalError';
  }
}

export class ImageNotFoundError extends Error {
  constructor(imageId: string) {
    super(`Image not found with ID: "${imageId}"`);
    this.name = 'ImageNotFoundError';
  }
}

export class ImageUpdateError extends Error {
  constructor(collectionName: string, imageId:string, public cause: unknown) {
    super(`Unable to update image: "${imageId}" in Collection: "${collectionName}"`);
    this.name = 'ImageUpdateError';
  }
}

export class ImageDeletionError extends Error {
  constructor(collectionName: string, imageId: string, public cause: unknown) {
    super(`Unable to delete image: "${imageId}" from Collection: "${collectionName}"`);
    this.name = 'ImageDeletionError';
  }
}

export class PendingImplementationError extends Error {
  constructor(public functionName: string) {
    super(`"${functionName} is not implemented yet`);
    this.name = 'PendingImplementationError';
  }
}