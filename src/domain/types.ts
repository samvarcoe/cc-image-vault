export type ImageStatus = 'INBOX' | 'COLLECTION' | 'ARCHIVE';

// Image metadata interface
export interface ImageMetadata {
  id: string;
  originalName: string;
  fileHash: string;
  status: ImageStatus;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: number;
  extension: string;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}

// Query options for image retrieval
export interface QueryOptions {
  status?: ImageStatus;
  orderBy?: 'created_at' | 'updated_at';
  orderDirection?: 'ASC' | 'DESC';
}

// Main Collection interface
export interface ICollection {
  // Collection lifecycle methods
  static create(id: string, path: string): Promise<Collection>;
  static load(path: string): Promise<Collection>;
  
  // Image management methods
  addImage(filePath: string): Promise<ImageMetadata>;
  updateImageStatus(imageId: string, newStatus: ImageStatus): Promise<ImageMetadata>;
  deleteImage(imageId: string): Promise<boolean>;
  
  // Image retrieval methods
  getImages(options?: QueryOptions): Promise<ImageMetadata[]>;
  getImage(imageId: string): Promise<ImageMetadata>;
  
  // Collection properties
  readonly id: string;
  readonly basePath: string;
}

// Import the actual Collection class (this will be implemented)
export { Collection } from './collection';