import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { Fixtures } from './base-fixtures';

export interface DirectoryState {
  path: string;
  isTemporary: boolean;
  originalPermissions?: number;
}

/**
 * DirectoryFixtures consolidates all filesystem setup/teardown logic
 * Provides unified directory management for testing across all layers
 */
export class DirectoryFixtures extends Fixtures<DirectoryState> {

  /**
   * Creates a directory at a specific path with optional permissions
   */
  static async create(options: {
    path: string;
    permissions?: number;
    recursive?: boolean;
  }): Promise<DirectoryState> {
    const {
      path: dirPath,
      permissions = 0o755,
      recursive = true
    } = options;

    await fs.mkdir(dirPath, { recursive, mode: permissions });

    const state: DirectoryState = {
      path: dirPath,
      isTemporary: false,
      originalPermissions: permissions
    };

    const cleanup = async () => {
      await fs.rm(dirPath, { recursive: true, force: true });
    };

    this.addCleanup(cleanup);
    return state;
  }

  /**
   * Creates a temporary directory for testing
   */
  static async createTemporary(options: {
    prefix?: string;
    baseDir?: string;
  } = {}): Promise<DirectoryState> {
    const {
      prefix = 'test-dir-',
      baseDir = tmpdir()
    } = options;

    const dirPath = await fs.mkdtemp(path.join(baseDir, prefix));

    const state: DirectoryState = {
      path: dirPath,
      isTemporary: true
    };

    const cleanup = async () => {
      await fs.rm(dirPath, { recursive: true, force: true });
    };

    this.addCleanup(cleanup);
    return state;
  }

  /**
   * Creates multiple directories with given names
   */
  static async createMultipleDirectories(options: {
    directoryNames: string[];
    basePath?: string;
  }): Promise<DirectoryState[]> {
    const {
      directoryNames,
      basePath = await fs.mkdtemp(path.join(tmpdir(), 'multi-directories-'))
    } = options;

    const states: DirectoryState[] = [];

    for (const dirName of directoryNames) {
      const dirPath = path.join(basePath, dirName);
      await fs.mkdir(dirPath, { recursive: true });

      states.push({
        path: dirPath,
        isTemporary: true
      });
    }

    const cleanup = async () => {
      await fs.rm(basePath, { recursive: true, force: true });
    };

    this.addCleanup(cleanup);
    return states;
  }

  /**
   * Ensures a directory exists, creating it if necessary
   */
  static async ensureExists(dirPath: string): Promise<DirectoryState> {
    let existed = true;
    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) {
        throw new Error('Path exists but is not a directory');
      }
    } catch {
      existed = false;
      await fs.mkdir(dirPath, { recursive: true });
    }

    const state: DirectoryState = {
      path: dirPath,
      isTemporary: false
    };

    // Only clean up if we created it
    if (!existed) {
      const cleanup = async () => {
        await fs.rm(dirPath, { recursive: true, force: true });
      };
      this.addCleanup(cleanup);
    }

    return state;
  }

  /**
   * Clears all contents of a directory without removing the directory itself
   */
  static async clearContents(dirPath: string): Promise<void> {
    try {
      const contents = await fs.readdir(dirPath);
      for (const item of contents) {
        const itemPath = path.join(dirPath, item);
        await fs.rm(itemPath, { recursive: true, force: true });
      }
    } catch {
      // Directory might not exist or be accessible
    }
  }

  /**
   * Checks if a directory exists
   */
  static async exists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Lists all items in a directory
   */
  static async listContents(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch {
      return [];
    }
  }

  /**
   * Recursively lists all files and directories in a path
   */
  static async listContentsRecursive(dirPath: string): Promise<string[]> {
    try {
      const items: string[] = [];
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        items.push(fullPath);
        
        if (entry.isDirectory()) {
          const subItems = await this.listContentsRecursive(fullPath);
          items.push(...subItems);
        }
      }
      
      return items;
    } catch {
      return [];
    }
  }

  /**
   * Counts directories in a path (non-recursive)
   */
  static async countDirectories(dirPath: string): Promise<number> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.filter(entry => entry.isDirectory()).length;
    } catch {
      return 0;
    }
  }

  /**
   * Lists directory names in a path
   */
  static async listDirectoryNames(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();
    } catch {
      return [];
    }
  }
}