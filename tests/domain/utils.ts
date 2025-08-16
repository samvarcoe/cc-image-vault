import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

/**
 * Test utilities for domain layer tests
 */
export class TestUtils {
  /**
   * Creates a directory with read-only permissions to simulate access issues
   */
  static async createReadOnlyDirectory(basePath: string): Promise<string> {
    const readOnlyDir = path.join(basePath, 'readonly');
    await fs.mkdir(readOnlyDir, { recursive: true });
    await fs.chmod(readOnlyDir, 0o444); // Read-only permissions
    return readOnlyDir;
  }

  /**
   * Creates an invalid path that cannot be accessed
   */
  static getInvalidPath(): string {
    return '/nonexistent/invalid/path/that/does/not/exist';
  }

  /**
   * Creates a path with insufficient permissions for writing
   */
  static async createNoWritePermissionPath(): Promise<string> {
    // Create a path that points to a file instead of a directory
    // This will cause fs.access to succeed but mkdir to fail
    const tempFile = await fs.mkdtemp(path.join(tmpdir(), 'no-write-'));
    const filePath = path.join(tempFile, 'not-a-directory');
    await fs.writeFile(filePath, 'blocking file');
    return filePath;
  }

  /**
   * Simulates database corruption by creating an invalid SQLite file
   */
  static async corruptDatabase(dbPath: string): Promise<void> {
    // Delete the database file to make it inaccessible
    await fs.unlink(dbPath);
  }

  /**
   * Checks if a directory exists
   */
  static async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Checks if a file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(filePath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Recursively lists all files and directories in a path
   */
  static async listContents(dirPath: string): Promise<string[]> {
    try {
      const items: string[] = [];
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        items.push(fullPath);
        
        if (entry.isDirectory()) {
          const subItems = await this.listContents(fullPath);
          items.push(...subItems);
        }
      }
      
      return items;
    } catch {
      return [];
    }
  }
}