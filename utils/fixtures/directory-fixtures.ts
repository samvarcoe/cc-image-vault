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
   * Creates a directory with read-only permissions for testing access issues
   */
  static async createReadOnly(options: {
    basePath?: string;
    dirName?: string;
  } = {}): Promise<DirectoryState> {
    const {
      basePath = await fs.mkdtemp(path.join(tmpdir(), 'readonly-test-')),
      dirName = 'readonly'
    } = options;

    const readOnlyPath = path.join(basePath, dirName);
    await fs.mkdir(readOnlyPath, { recursive: true });
    await fs.chmod(readOnlyPath, 0o444); // Read-only permissions

    const state: DirectoryState = {
      path: readOnlyPath,
      isTemporary: true,
      originalPermissions: 0o444
    };

    const cleanup = async () => {
      try {
        // Restore permissions before cleanup
        await fs.chmod(readOnlyPath, 0o755);
        await fs.rm(basePath, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
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
   * Creates a directory that simulates permission issues
   */
  static async createWithPermissionIssues(options: {
    basePath?: string;
  } = {}): Promise<DirectoryState> {
    const basePath = options.basePath || await fs.mkdtemp(path.join(tmpdir(), 'permission-test-'));
    
    // Create the directory first
    await fs.mkdir(basePath, { recursive: true });
    
    // Remove write permissions
    await fs.chmod(basePath, 0o444);

    // Verify that permission restrictions work
    try {
      const testPath = path.join(basePath, 'permission-test-' + Date.now());
      await fs.mkdir(testPath);
      // If we get here, permissions aren't being enforced
      console.warn('Warning: Filesystem permissions not enforced in this environment');
      await fs.chmod(basePath, 0o755); // Restore permissions
      throw new Error('SKIP_PERMISSION_TEST: Filesystem permissions not enforced');
    } catch (error) {
      if ((error as Error).message.startsWith('SKIP_PERMISSION_TEST')) {
        throw error;
      }
      // Permission restriction is working as expected
    }

    const state: DirectoryState = {
      path: basePath,
      isTemporary: true,
      originalPermissions: 0o444
    };

    const cleanup = async () => {
      try {
        // Restore permissions before cleanup
        await fs.chmod(basePath, 0o755);
        await fs.rm(basePath, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    };

    this.addCleanup(cleanup);
    return state;
  }

  /**
   * Creates a directory and replaces it with a file to simulate write failures
   */
  static async createBlockingFile(options: {
    targetPath: string;
    blockingContent?: string;
  }): Promise<DirectoryState> {
    const {
      targetPath,
      blockingContent = 'blocking file for test simulation'
    } = options;

    // If directory exists, we need to handle it
    let wasDirectory = false;
    let originalContents: string[] = [];

    try {
      const stat = await fs.stat(targetPath);
      if (stat.isDirectory()) {
        wasDirectory = true;
        originalContents = await fs.readdir(targetPath);
        await fs.rm(targetPath, { recursive: true });
      }
    } catch {
      // Path doesn't exist, that's fine
    }

    // Create blocking file
    await fs.writeFile(targetPath, blockingContent);

    const state: DirectoryState = {
      path: targetPath,
      isTemporary: false
    };

    const cleanup = async () => {
      try {
        // Remove blocking file
        await fs.unlink(targetPath);
        
        // Restore directory if it was one before
        if (wasDirectory) {
          await fs.mkdir(targetPath, { recursive: true });
          // Note: We don't restore contents as that would be complex and typically not needed
        }
      } catch {
        // Ignore cleanup errors
      }
    };

    this.addCleanup(cleanup);
    return state;
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

  // Utility methods for common directory operations

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

  /**
   * Validates that a directory has the expected structure
   */
  static async validateStructure(
    dirPath: string, 
    expectedPaths: Array<{ path: string; type: 'file' | 'directory'; name: string }>
  ): Promise<void> {
    for (const { path: relativePath, type, name } of expectedPaths) {
      const fullPath = path.resolve(dirPath, relativePath);
      
      try {
        const stat = await fs.stat(fullPath);
        const isCorrectType = type === 'directory' ? stat.isDirectory() : stat.isFile();
        
        if (!isCorrectType) {
          throw new Error(`Directory structure validation failed: ${name} at "${fullPath}" is not a ${type}`);
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new Error(`Directory structure validation failed: ${name} missing at "${fullPath}"`);
        }
        throw error;
      }
    }
  }

  /**
   * Captures the state of a directory for comparison in tests
   */
  static async captureState(dirPath: string): Promise<string[]> {
    return this.listContentsRecursive(dirPath);
  }

  /**
   * Compares two directory states to check if they're identical
   */
  static compareStates(stateBefore: string[], stateAfter: string[]): boolean {
    if (stateBefore.length !== stateAfter.length) {
      return false;
    }

    const sortedBefore = [...stateBefore].sort();
    const sortedAfter = [...stateAfter].sort();

    return sortedBefore.every((path, index) => path === sortedAfter[index]);
  }
}