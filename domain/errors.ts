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

export class PendingImplementationError extends Error {
  constructor(public functionName: string) {
    super(`"${functionName} is not implemented yet`);
    this.name = 'PendingImplementationError';
  }
}