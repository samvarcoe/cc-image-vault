import { promises as fs } from 'fs';
import path from 'path';
import { Database } from 'sqlite3';

export class Collection {
  public readonly id: string;
  public readonly basePath: string;
  private db: Database;

  private constructor(id: string, basePath: string, db: Database) {
    this.id = id;
    this.basePath = basePath;
    this.db = db;
  }

  static async create(id: string, basePath: string): Promise<Collection> {
    // Validate input parameters
    if (!id || !basePath) {
      throw new Error('Collection ID and base path are required');
    }

    // Check if base path is accessible
    try {
      await fs.access(basePath);
    } catch (error) {
      throw new Error('Unable to create Collection: invalid path');
    }

    const collectionPath = path.join(basePath, id);
    let createdDirectories: string[] = [];

    try {
      // Create collection directory structure
      await fs.mkdir(collectionPath, { recursive: true });
      createdDirectories.push(collectionPath);

      const imagesPath = path.join(collectionPath, 'images');
      await fs.mkdir(imagesPath, { recursive: true });
      createdDirectories.push(imagesPath);

      const originalPath = path.join(imagesPath, 'original');
      await fs.mkdir(originalPath, { recursive: true });
      createdDirectories.push(originalPath);

      const thumbnailsPath = path.join(imagesPath, 'thumbnails');
      await fs.mkdir(thumbnailsPath, { recursive: true });
      createdDirectories.push(thumbnailsPath);

      // Create and initialize database
      const databasePath = path.join(collectionPath, 'collection.db');
      const db = await Collection.initializeDatabase(databasePath);

      return new Collection(id, basePath, db);

    } catch (error: any) {
      // Clean up any created directories on failure
      try {
        // Remove the entire collection directory if it was created
        const collectionExists = await Collection.directoryExists(collectionPath);
        if (collectionExists) {
          await fs.rm(collectionPath, { recursive: true, force: true });
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      if (error.code === 'EACCES' || error.code === 'EPERM') {
        throw new Error('Unable to create Collection: insufficient permissions');
      }
      
      throw new Error('Unable to create Collection: ' + error.message);
    }
  }

  static async load(collectionPath: string): Promise<Collection> {
    try {
      // Verify collection directory exists
      const stat = await fs.stat(collectionPath);
      if (!stat.isDirectory()) {
        throw new Error('Collection path is not a directory');
      }

      // Extract collection ID from path
      const id = path.basename(collectionPath);
      const basePath = path.dirname(collectionPath);

      // Verify database exists and connect
      const databasePath = path.join(collectionPath, 'collection.db');
      const db = await Collection.connectToDatabase(databasePath);

      return new Collection(id, basePath, db);

    } catch (error: any) {
      throw new Error('Unable to load Collection: ' + error.message);
    }
  }

  private static async initializeDatabase(databasePath: string): Promise<Database> {
    return new Promise((resolve, reject) => {
      try {
        const db = new Database(databasePath, (err) => {
          if (err) {
            reject(new Error('Database initialization failed: ' + err.message));
          } else {
            resolve(db);
          }
        });
      } catch (error: any) {
        reject(new Error('Database initialization failed: ' + error.message));
      }
    });
  }

  private static async connectToDatabase(databasePath: string): Promise<Database> {
    // Check if database file exists
    try {
      await fs.access(databasePath);
    } catch (error) {
      throw new Error('database file not found');
    }

    return new Promise((resolve, reject) => {
      try {
        const db = new Database(databasePath, (err) => {
          if (err) {
            reject(new Error('database connection failed: ' + err.message));
          } else {
            resolve(db);
          }
        });
      } catch (error: any) {
        reject(new Error('database access error: ' + error.message));
      }
    });
  }

  private static async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}