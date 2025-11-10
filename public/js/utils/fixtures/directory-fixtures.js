import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { Fixtures } from './base-fixtures';
export class DirectoryFixtures extends Fixtures {
    static async create(options) {
        const { path: dirPath, permissions = 0o755, recursive = true } = options;
        await fs.mkdir(dirPath, { recursive, mode: permissions });
        const state = {
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
    static async createTemporary(options = {}) {
        const { prefix = 'test-dir-', baseDir = tmpdir() } = options;
        const dirPath = await fs.mkdtemp(path.join(baseDir, prefix));
        const state = {
            path: dirPath,
            isTemporary: true
        };
        const cleanup = async () => {
            await fs.rm(dirPath, { recursive: true, force: true });
        };
        this.addCleanup(cleanup);
        return state;
    }
    static async createMultipleDirectories(options) {
        const { directoryNames, basePath = await fs.mkdtemp(path.join(tmpdir(), 'multi-directories-')) } = options;
        const states = [];
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
    static async ensureExists(dirPath) {
        let existed = true;
        try {
            const stat = await fs.stat(dirPath);
            if (!stat.isDirectory()) {
                throw new Error('Path exists but is not a directory');
            }
        }
        catch (_a) {
            existed = false;
            await fs.mkdir(dirPath, { recursive: true });
        }
        const state = {
            path: dirPath,
            isTemporary: false
        };
        if (!existed) {
            const cleanup = async () => {
                await fs.rm(dirPath, { recursive: true, force: true });
            };
            this.addCleanup(cleanup);
        }
        return state;
    }
    static async clearContents(dirPath) {
        try {
            const contents = await fs.readdir(dirPath);
            for (const item of contents) {
                const itemPath = path.join(dirPath, item);
                await fs.rm(itemPath, { recursive: true, force: true });
            }
        }
        catch (_a) {
        }
    }
    static async exists(dirPath) {
        try {
            const stat = await fs.stat(dirPath);
            return stat.isDirectory();
        }
        catch (_a) {
            return false;
        }
    }
    static async listContents(dirPath) {
        try {
            return await fs.readdir(dirPath);
        }
        catch (_a) {
            return [];
        }
    }
    static async listContentsRecursive(dirPath) {
        try {
            const items = [];
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
        }
        catch (_a) {
            return [];
        }
    }
    static async countDirectories(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            return entries.filter(entry => entry.isDirectory()).length;
        }
        catch (_a) {
            return 0;
        }
    }
    static async listDirectoryNames(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            return entries
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name)
                .sort();
        }
        catch (_a) {
            return [];
        }
    }
    static async listFiles(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            return entries
                .filter(entry => entry.isFile())
                .map(entry => entry.name)
                .sort();
        }
        catch (_a) {
            return [];
        }
    }
}
