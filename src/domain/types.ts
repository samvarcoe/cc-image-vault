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


// Import the actual Collection class (this will be implemented)
export { Collection } from './collection';