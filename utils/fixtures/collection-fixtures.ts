import { Collection } from "@/domain";
import { getImageFixture } from "./image-fixtures";
import { existsSync, cpSync } from "fs";

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