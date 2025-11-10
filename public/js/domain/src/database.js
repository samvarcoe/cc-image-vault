import Database from 'better-sqlite3';
import path from 'path';
export function initializeCollectionDatabase(collectionPath) {
    const dbPath = path.join(collectionPath, 'collection.db');
    const db = new Database(dbPath);
    db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      collection TEXT NOT NULL,
      name TEXT NOT NULL,
      extension TEXT NOT NULL,
      mime TEXT NOT NULL,
      size INTEGER NOT NULL,
      hash TEXT NOT NULL UNIQUE,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      aspect REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'INBOX',
      created TEXT NOT NULL,
      updated TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
    CREATE INDEX IF NOT EXISTS idx_images_hash ON images(hash);
  `);
    db.close();
}
