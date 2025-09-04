/**
 * SQLite database utilities for Collection management
 */

import Database from 'better-sqlite3';
import path from 'path';

/**
 * Initialize a SQLite database for a collection with the required schema
 * Uses better-sqlite3 for true synchronous operations
 */
export function initializeCollectionDatabase(collectionPath: string): void {
  const dbPath = path.join(collectionPath, 'collection.db');
  
  // Create database with synchronous operations
  const db = new Database(dbPath);
  
  // Create the images table and indexes synchronously
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
  
  // Close database synchronously
  db.close();
}