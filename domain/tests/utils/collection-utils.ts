import { expect } from "chai";
import path from "path";

import { DirectoryFixtures } from "@/utils";
import { CONFIG } from "@/config";
import { fsOps } from "../../src/fs-operations";

export class CollectionUtils {
    static getCollectionDirectory = (name: string) => path.join(CONFIG.COLLECTIONS_DIRECTORY, name);

    static assertCollectionDirectoryExists = async (name: string): Promise<void> => {
        const collectionPath = this.getCollectionDirectory(name);
        expect(await DirectoryFixtures.exists(collectionPath), `Collection directory "${name}" not created in Collections directory`).true;
        console.log(`✓ Collection directory "${name}" exists`);
    };

    static assertSqliteFileExists = async (name: string): Promise<void> => {
        const dbPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, name, 'collection.db');
        expect(fsOps.statSync(dbPath).isFile(), `SQLite database file not created for Collection "${name}"`).true;
        console.log(`✓ SQLite database file exists for Collection "${name}"`)
    };

    static assertFileStructureExists = async (name: string): Promise<void> => {
        const collectionPath = this.getCollectionDirectory(name);
        const imagesPath = path.join(collectionPath, 'images');
        const originalPath = path.join(imagesPath, 'original');
        const thumbnailsPath = path.join(imagesPath, 'thumbnails');

        expect(await DirectoryFixtures.exists(imagesPath), `Images directory not created for Collection "${name}"`).true;
        expect(await DirectoryFixtures.exists(originalPath), `Original images directory not created for Collection "${name}"`).true;
        expect(await DirectoryFixtures.exists(thumbnailsPath), `Thumbnails directory not created for Collection "${name}"`).true;
        
        console.log(`✓ File structure created for Collection "${name}"`);
    };

    static assertCollectionDirectoryDoesNotExist = async (name: string): Promise<void> => {
        const collectionPath = this.getCollectionDirectory(name);
        expect(await DirectoryFixtures.exists(collectionPath), `Collection directory "${name}" should not have been created`).false;
        console.log(`✓ Collection directory "${name}" was not created`);
    };

    static assertDirectoryIsClean = async (name: string): Promise<void> => {
        const collectionPath = this.getCollectionDirectory(name);
        expect(await DirectoryFixtures.exists(collectionPath), `Partial Collection artifacts remain for "${name}" after error`).false;
        console.log(`✓ No partial artifacts remain for Collection "${name}"`);
    };

    static assertCollectionDoesNotExist = async (name: string): Promise<void> => {
        const collectionPath = this.getCollectionDirectory(name);
        expect(await DirectoryFixtures.exists(collectionPath), `Collection "${name}" should have been removed from filesystem`).false;
        console.log(`✓ Collection "${name}" removed from filesystem`);
    };

    static assertCollectionRemains = async (name: string): Promise<void> => {
        const collectionPath = this.getCollectionDirectory(name);
        const exists = await DirectoryFixtures.exists(collectionPath);
        expect(exists, `Collection "${name}" should remain unchanged after error`).true;
        console.log(`✓ Collection "${name}" remains unchanged`);
    };
}
