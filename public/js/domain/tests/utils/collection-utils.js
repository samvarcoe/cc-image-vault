var _a;
import { expect } from "chai";
import path from "path";
import { DirectoryFixtures } from "@/utils";
import { fsOps } from "../../src/fs-operations";
export class CollectionUtils {
}
_a = CollectionUtils;
CollectionUtils.getCollectionDirectory = (name) => path.join(CONFIG.COLLECTIONS_DIRECTORY, name);
CollectionUtils.assertCollectionDirectoryExists = async (name) => {
    const collectionPath = _a.getCollectionDirectory(name);
    expect(await DirectoryFixtures.exists(collectionPath), `Collection directory "${name}" not created in Collections directory`).true;
    LOGGER.log(`✓ Collection directory "${name}" exists`);
};
CollectionUtils.assertSqliteFileExists = async (name) => {
    const dbPath = path.join(CONFIG.COLLECTIONS_DIRECTORY, name, 'collection.db');
    expect(fsOps.statSync(dbPath).isFile(), `SQLite database file not created for Collection "${name}"`).true;
    LOGGER.log(`✓ SQLite database file exists for Collection "${name}"`);
};
CollectionUtils.assertFileStructureExists = async (name) => {
    const collectionPath = _a.getCollectionDirectory(name);
    const imagesPath = path.join(collectionPath, 'images');
    const originalPath = path.join(imagesPath, 'original');
    const thumbnailsPath = path.join(imagesPath, 'thumbnails');
    expect(await DirectoryFixtures.exists(imagesPath), `Images directory not created for Collection "${name}"`).true;
    expect(await DirectoryFixtures.exists(originalPath), `Original images directory not created for Collection "${name}"`).true;
    expect(await DirectoryFixtures.exists(thumbnailsPath), `Thumbnails directory not created for Collection "${name}"`).true;
    LOGGER.log(`✓ File structure created for Collection "${name}"`);
};
CollectionUtils.assertCollectionDirectoryDoesNotExist = async (name) => {
    const collectionPath = _a.getCollectionDirectory(name);
    expect(await DirectoryFixtures.exists(collectionPath), `Collection directory "${name}" should not have been created`).false;
    LOGGER.log(`✓ Collection directory "${name}" was not created`);
};
CollectionUtils.assertDirectoryIsClean = async (name) => {
    const collectionPath = _a.getCollectionDirectory(name);
    expect(await DirectoryFixtures.exists(collectionPath), `Partial Collection artifacts remain for "${name}" after error`).false;
    LOGGER.log(`✓ No partial artifacts remain for Collection "${name}"`);
};
CollectionUtils.assertCollectionDoesNotExist = async (name) => {
    const collectionPath = _a.getCollectionDirectory(name);
    expect(await DirectoryFixtures.exists(collectionPath), `Collection "${name}" should have been removed from filesystem`).false;
    LOGGER.log(`✓ Collection "${name}" removed from filesystem`);
};
CollectionUtils.assertCollectionRemains = async (name) => {
    const collectionPath = _a.getCollectionDirectory(name);
    const exists = await DirectoryFixtures.exists(collectionPath);
    expect(exists, `Collection "${name}" should remain unchanged after error`).true;
    LOGGER.log(`✓ Collection "${name}" remains unchanged`);
};
