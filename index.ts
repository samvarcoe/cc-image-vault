import hnswlib from 'hnswlib-node';
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from './config';
import { Collection } from './domain';

(async () => {
    const collection = Collection.load('elite');
    const images = await collection.getImages();

    // Load existing index
    const indexDir = `${CONFIG.COLLECTIONS_DIRECTORY}/${collection.name}/index`;
    const { HierarchicalNSW } = hnswlib;
    const index = new HierarchicalNSW('cosine', 512);
    index.readIndexSync(path.join(indexDir, 'hnsw.index'));

    const mapping = JSON.parse(fs.readFileSync(path.join(indexDir, 'id-mapping.json'), 'utf-8'));
    const idToIndex = new Map(Object.entries(mapping.idToIndex));
    const indexToId = mapping.indexToId;

    // Query by image ID
    const image = images[0]!;
    console.log(image.id);
    const queryIndex = Number(idToIndex.get(image.id));
    const result = index.searchKnn(index.getPoint(queryIndex), 25);
    const neighbours = result
        .neighbors
        .map(x => indexToId[x]);

    const targetImage = await collection.getImageData(image.id);
    const neighbourThumbnails = await Promise.allSettled(
        neighbours.map(x => collection.getThumbnailData(x))
    )

    console.log(targetImage);
    console.log(neighbourThumbnails);
})()
