export type ImageStatus = 'INBOX' | 'COLLECTION' | 'ARCHIVE'

export type ImageUpdate = {
  status: ImageStatus
}

export interface QueryOptions {
  status?: ImageStatus;
}

type Extension = 'jpg' | 'png' | 'webp'

type Mime = 'image/jpeg' | 'image/png' | 'image/webp'

export type ImageMetadata = {
  id: string;
  collection: string;
  name: string;
  extension: Extension;
  mime: Mime;
  size: number;
  hash: string;
  width: number;
  height: number;
  aspect: number;
  status: ImageStatus;
  created: Date;
  updated: Date;
}

// Static methods interface
// enforce with const _: CollectionStatic = Collection;
interface CollectionStatic {
    create(id: string): Collection;
    load(id: string): Collection;
    delete(id: string): void;
    list(): string[];
    clear(): void;
}

interface CollectionInstance {
    readonly name: string;
    
    addImage(filePath: string): Promise<ImageMetadata>;
    getImage(imageId: string): Promise<ImageMetadata>;
    updateImage(imageId: string, status: ImageUpdate): Promise<ImageMetadata>;
    deleteImage(imageId: string): Promise<void>;

    getImages(options?: QueryOptions): Promise<ImageMetadata[]>;
    updateImages(updates: Record<string, Partial<ImageUpdate>>): Promise<ImageMetadata[]>;
    deleteImages(imageIds: string[]): Promise<void>;
}