import { Collection } from "@/domain";
import { getImageFixture } from "./image-fixtures";

export const createCollectionFixture = async (name: string): Promise<Collection> => {
    try {
        const collection = Collection.create(name);

        const width = { min: 600, max: 1800 };
        const height = { min: 600, max: 1200 }

        const count = 12;

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

        return collection;

    } catch (error: unknown) {
        console.error("Error populating collection fixture:", error);

        throw error;
    }
}