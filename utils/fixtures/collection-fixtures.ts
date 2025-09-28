import { Collection } from "@/domain";
import { getImageFixture } from "./image-fixtures";
import { existsSync, cpSync } from "fs";
import { expect } from "chai";
import { error } from "console";

const CACHE_DIR = 'utils/fixtures/collections';

export const createCollectionFixture = async (name: string, count = 12): Promise<Collection> => {
    const cachedCollectionDirectory = `${CACHE_DIR}/${name}`;
    const activeCollectionDirectory = `${CONFIG.COLLECTIONS_DIRECTORY}/${name}`;

    if (existsSync(cachedCollectionDirectory)) {
         try {
            cpSync(cachedCollectionDirectory, activeCollectionDirectory, { recursive: true });

            const collection = Collection.load(name);

            LOGGER.log(`Collection fixture: "${name}" retrieved from cache`);
            return collection;

         } catch {
            console.error('Failed to load collection fixture from cache');
         }
    }

    try {
        LOGGER.log(`Creating Collection fixture "${name}" from scratch`);

        const collection = Collection.create(name);

        const width = { min: 600, max: 1800 };
        const height = { min: 600, max: 1200 }

        const x = (i: number, count: number) => Math.round(width.min + (i/count) * (width.max - width.min));
        const y = (i: number, count: number) => Math.round(height.max - (i/count) * (height.max - height.min));

        for (let i = 0; i < count; i++) {
            const inboxImage = await getImageFixture({id: `inbox-${i}`, width: x(i, count), height: y(i, count)});
            const collectionImage = await getImageFixture({id: `collection-${i}`, width: x(i, count), height: y(i, count)});
            const archiveImage = await getImageFixture({id: `archive-${i}`, width: x(i, count), height: y(i, count)});

            await collection.addImage(inboxImage.filePath);

            const collectionImageMetaData = await collection.addImage(collectionImage.filePath);
            await collection.updateImage(collectionImageMetaData.id, {status: "COLLECTION"});

            const archiveImageMetaData = await collection.addImage(archiveImage.filePath);
            await collection.updateImage(archiveImageMetaData.id, {status: "ARCHIVE"});
        }

        cpSync(activeCollectionDirectory, cachedCollectionDirectory, { recursive: true });

        return collection;

    } catch (error: unknown) {
        console.error("Error creating Collection fixture:", error);

        throw error;
    }
}

type CollectionFixtureOptions = {
    name: string;
    collectionCount: number;
    inboxCount: number;
    archiveCount: number;
}

export const buildCollectionFixture = async (options: CollectionFixtureOptions): Promise<Collection> => {
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

            LOGGER.log(`Collection fixture: "${name}" retrieved from cache`);
            return collection;

         } catch {
            console.error('Failed to load collection fixture from cache');
            throw error;
         }
    }

    try {
        LOGGER.log(`Creating Collection fixture "${name}" from scratch`);

        const collection = Collection.create(name);

        const width = { min: 600, max: 1800 };
        const height = { min: 600, max: 1200 }

        const x = (i: number, count: number) => Math.round(width.min + (i/count) * (width.max - width.min));
        const y = (i: number, count: number) => Math.round(height.max - (i/count) * (height.max - height.min));

        for (let i = 0; i < inboxCount; i++) {
            const inboxImage = await getImageFixture({id: `inbox-${i}`, width: x(i, inboxCount), height: y(i, inboxCount)});
            await collection.addImage(inboxImage.filePath);
        }

        for (let i = 0; i < collectionCount; i++) {
            const collectionImage = await getImageFixture({id: `collection-${i}`, width: x(i, collectionCount), height: y(i, collectionCount)});
            const collectionImageMetaData = await collection.addImage(collectionImage.filePath);
            await collection.updateImage(collectionImageMetaData.id, {status: "COLLECTION"});
        }

        for (let i = 0; i < archiveCount; i++) {
            const archiveImage = await getImageFixture({id: `archive-${i}`, width: x(i, archiveCount), height: y(i, archiveCount)});
            const archiveImageMetaData = await collection.addImage(archiveImage.filePath);
            await collection.updateImage(archiveImageMetaData.id, {status: "ARCHIVE"});
        }

        cpSync(activeCollectionDirectory, cachedCollectionDirectory, { recursive: true });

        return collection;

    } catch (error: unknown) {
        console.error("Error creating Collection fixture:", error);
        throw error;
    }
}