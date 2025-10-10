import express from 'express';
import hnswlib from 'hnswlib-node';
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from './config';
import { Collection } from './domain';

const app = express();
const PORT = 3001;

// Initialize collection and index
let collection: Collection;
let index: hnswlib.HierarchicalNSW;
let idToIndex: Map<string, string>;
let indexToId: string[];

async function initializeIndex() {
    collection = Collection.load('elite');
    
    const indexDir = `${CONFIG.COLLECTIONS_DIRECTORY}/${collection.name}/index`;
    const { HierarchicalNSW } = hnswlib;
    
    index = new HierarchicalNSW('cosine', 512);
    index.readIndexSync(path.join(indexDir, 'hnsw.index'));
    
    const mapping = JSON.parse(
        fs.readFileSync(path.join(indexDir, 'id-mapping.json'), 'utf-8')
    );
    
    idToIndex = new Map(Object.entries(mapping.idToIndex));
    indexToId = mapping.indexToId;
    
    console.log('Index initialized successfully');
}

// Serve image by ID
app.get('/image/:id', async (req, res) => {
    try {
        const imageData = await collection.getImageData(req.params.id);
        return res.type('image/jpeg').send(imageData);
    } catch {
        return res.status(404).send('Image not found');
    }
});

// Serve thumbnail by ID
app.get('/thumbnail/:id', async (req, res) => {
    try {
        const thumbnailData = await collection.getThumbnailData(req.params.id);
        return res.type('image/jpeg').send(thumbnailData);
    } catch {
        return res.status(404).send('Thumbnail not found');
    }
});

// Main page showing image and similar neighbors
app.get('/:imageId', async (req, res) => {
    try {
        const { imageId } = req.params;
        
        // Get query index
        const queryIndex = Number(idToIndex.get(imageId));
        if (isNaN(queryIndex)) {
            return res.status(404).send('Image ID not found in index');
        }
        
        // Search for neighbors
        const result = index.searchKnn(index.getPoint(queryIndex), 100);
        const neighbors = result.neighbors.map(x => indexToId[x]);
        
        // Generate HTML
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Image ${imageId}</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .target-image {
            width: 100%;
            max-width: 800px;
            margin: 20px auto;
            display: block;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h2 {
            color: #666;
            margin-top: 40px;
            margin-bottom: 20px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        .grid-item {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .grid-item:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .grid-item img {
            width: 100%;
            display: block;
        }
        @media (max-width: 768px) {
            .grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        @media (max-width: 480px) {
            .grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <h1>Image: ${imageId}</h1>
    <img src="/image/${imageId}" alt="Target image" class="target-image">
    
    <h2>Similar Images</h2>
    <div class="grid">
        ${neighbors.map(neighborId => `
            <a href="/${neighborId}" class="grid-item">
                <img src="/thumbnail/${neighborId}" alt="Similar image ${neighborId}">
            </a>
        `).join('')}
    </div>
</body>
</html>
        `;
        
        return res.send(html);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error loading image and neighbors');
    }
});

// Start server
initializeIndex().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize index:', err);
    process.exit(1);
});