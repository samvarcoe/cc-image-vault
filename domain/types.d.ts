export type ImageStatus = 'INBOX' | 'COLLECTION' | 'ARCHIVE';

// Query options for image retrieval
export interface QueryOptions {
  status?: ImageStatus;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at';
  orderDirection?: 'ASC' | 'DESC';
}
