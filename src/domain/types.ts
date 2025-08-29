export type ImageStatus = 'INBOX' | 'COLLECTION' | 'ARCHIVE';

// Query options for image retrieval
export interface QueryOptions {
  status?: ImageStatus;
  orderBy?: 'created_at' | 'updated_at';
  orderDirection?: 'ASC' | 'DESC';
}


// Import the actual Collection class (this will be implemented)
export { Collection } from './collection';