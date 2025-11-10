import { Collection } from "@/domain";
import { getImageFixture } from "./image-fixtures";
import { existsSync, rmSync, cpSync } from "fs";
import { expect } from "chai";
const CACHE_DIR = 'utils/fixtures/collections';
export const createCollectionFixture = async (options) => {
    const { name, collectionCount, inboxCount, archiveCount } = options;
    const cachedCollectionDirectory = `${CACHE_DIR}/${name}`;
    const activeCollectionDirectory = `${CONFIG.COLLECTIONS_DIRECTORY}/${name}`;
    if (existsSync(cachedCollectionDirectory)) {
        try {
            cpSync(cachedCollectionDirectory, activeCollectionDirectory, { recursive: true });
            const collection = Collection.load(name);
            expect(await collection.getImages({ status: "INBOX" })).to.have.lengthOf(inboxCount);
            expect(await collection.getImages({ status: "COLLECTION" })).to.have.lengthOf(collectionCount);
            expect(await collection.getImages({ status: "ARCHIVE" })).to.have.lengthOf(archiveCount);
            LOGGER.log(`Successfully validated cached copy of Collection fixture: "${name}"`);
            return;
        }
        catch (_a) {
            LOGGER.log(`Unable to validate cached copy of Collection fixture: "${name}"`);
        }
    }
    try {
        LOGGER.log(`Creating Collection fixture "${name}" from scratch`);
        const collection = Collection.create(name);
        const width = { min: 600, max: 1800 };
        const height = { min: 600, max: 1200 };
        const x = (i, count) => Math.round(width.min + (i / count) * (width.max - width.min));
        const y = (i, count) => Math.round(height.max - (i / count) * (height.max - height.min));
        for (let i = 0; i < inboxCount; i++) {
            const inboxImage = await getImageFixture({ filename: `inbox-${i}.jpeg`, width: x(i, inboxCount), height: y(i, inboxCount) });
            await collection.addImage(inboxImage.filename, inboxImage.buffer);
        }
        for (let i = 0; i < collectionCount; i++) {
            const collectionImage = await getImageFixture({ filename: `collection-${i}.jpeg`, width: x(i, collectionCount), height: y(i, collectionCount) });
            const collectionImageMetaData = await collection.addImage(collectionImage.filename, collectionImage.buffer);
            await collection.updateImage(collectionImageMetaData.id, { status: "COLLECTION" });
        }
        for (let i = 0; i < archiveCount; i++) {
            const archiveImage = await getImageFixture({ filename: `archive-${i}.jpeg`, width: x(i, archiveCount), height: y(i, archiveCount) });
            const archiveImageMetaData = await collection.addImage(archiveImage.filename, archiveImage.buffer);
            await collection.updateImage(archiveImageMetaData.id, { status: "ARCHIVE" });
        }
        rmSync(cachedCollectionDirectory, { recursive: true, force: true });
        cpSync(activeCollectionDirectory, cachedCollectionDirectory, { recursive: true });
    }
    catch (error) {
        console.error("Error creating Collection fixture:", error);
        throw error;
    }
};
export const setupCollectionFixture = (name) => {
    const cachedCollectionDirectory = `${CACHE_DIR}/${name}`;
    const activeCollectionDirectory = `${CONFIG.COLLECTIONS_DIRECTORY}/${name}`;
    LOGGER.log(`Setting up Collection fixture: "${name}"`);
    if (!existsSync(cachedCollectionDirectory)) {
        throw new Error(`Collection fixture: "${name}" does not exist`);
    }
    ;
    try {
        cpSync(cachedCollectionDirectory, activeCollectionDirectory, { recursive: true });
    }
    catch (error) {
        throw new Error(`Unable to copy Collection fixture: "${name}": ${error.message}`);
    }
    return Collection.load(name);
};
