#!/usr/bin/env npx tsx

import { promises as fs } from 'fs';
import path from 'path';
import { Collection } from '@/domain';

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

interface ScriptOptions {
    directoryPath: string;
    collectionName: string;
}

async function parseArguments(): Promise<ScriptOptions> {
    const args = process.argv.slice(2);

    const [directoryPath, collectionName] = args;

    if (!directoryPath || !collectionName) {
        console.error('Usage: npx tsx utils/scripts/populate-collection.ts <directory-path> <collection-name>');
        console.error('');
        console.error('Arguments:');
        console.error('  directory-path  Path to directory containing images');
        console.error('  collection-name Name for the new collection (letters, numbers, hyphens only)');
        console.error('');
        console.error('Example:');
        console.error('  npx tsx utils/scripts/populate-collection.ts ./my-photos my-photos-collection');
        process.exit(1);
    }

    return {
        directoryPath: path.resolve(directoryPath),
        collectionName
    };
}

async function findImageFiles(directoryPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
        const entries = await fs.readdir(directoryPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(directoryPath, entry.name);

            if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (SUPPORTED_EXTENSIONS.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }

        return files.sort();
    } catch (error) {
        throw new Error(`Failed to read directory "${directoryPath}": ${(error as Error).message}`);
    }
}

async function validateDirectory(directoryPath: string): Promise<void> {
    try {
        const stats = await fs.stat(directoryPath);
        if (!stats.isDirectory()) {
            throw new Error(`"${directoryPath}" is not a directory`);
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
            throw new Error(`Directory "${directoryPath}" does not exist`);
        }
        throw error;
    }
}

async function main(): Promise<void> {
    try {
        const { directoryPath, collectionName } = await parseArguments();

        LOGGER.log(`Populating collection "${collectionName}" with images from "${directoryPath}"`);
        LOGGER.log('');

        // Validate directory exists
        await validateDirectory(directoryPath);

        // Find all image files
        LOGGER.log('Scanning for images...');
        const imageFiles = await findImageFiles(directoryPath);

        if (imageFiles.length === 0) {
            LOGGER.log('No supported image files found in directory');
            LOGGER.log(`Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`);
            return;
        }

        LOGGER.log(`Found ${imageFiles.length} image(s):\n`);

        // Create collection
        LOGGER.log(`Creating collection "${collectionName}"...`);
        const collection = Collection.create(collectionName);
        LOGGER.log('Collection created successfully');
        LOGGER.log('');

        // Add images to collection
        LOGGER.log('Adding images to collection...');
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < imageFiles.length; i++) {
            const filePath = imageFiles[i]!;
            const fileName = path.basename(filePath);

            try {
                LOGGER.log(`  [${i + 1}/${imageFiles.length}] Adding ${fileName}...`);
                const buffer = await fs.readFile(filePath);
                const metadata = await collection.addImage(buffer, fileName);
                await collection.updateImage(metadata.id, { status: "COLLECTION"});
                LOGGER.log(`    ✓ Added as ${metadata.id} (${metadata.width}x${metadata.height})`);
                successCount++;
            } catch (error) {
                LOGGER.log(`    ✗ Failed: ${(error as Error).message}`);
                errorCount++;
            }
        }

        LOGGER.log('');
        LOGGER.log('Summary:');
        LOGGER.log(`  Collection: ${collectionName}`);
        LOGGER.log(`  Images processed: ${imageFiles.length}`);
        LOGGER.log(`  Successfully added: ${successCount}`);
        LOGGER.log(`  Errors: ${errorCount}`);

        if (successCount > 0) {
            LOGGER.log('');
            LOGGER.log('Collection populated successfully!');
        }

    } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
    }
}

// Run the script
main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
});