import { expect } from "chai";
import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";

import chaiMatchPattern from 'chai-match-pattern';
const _ = chaiMatchPattern.getLodashModule();

import { DirectoryFixtures } from "@/utils";
import { CONFIG } from "@/config";
import { ImageMetadata } from "../../types";

export class ImageUtils {
    static getImagePath = (collectionName: string, imageName: string, type: 'original' | 'thumbnail' = 'original'): string => {
        return path.join(CONFIG.COLLECTIONS_DIRECTORY, collectionName, 'images', type, imageName);
    };

    static calculateImageHash = async (filePath: string): Promise<string> => {
        const data = await fs.readFile(filePath);
        return crypto.createHash('sha256').update(data).digest('hex');
    };

    static assertImageFileExists = async (collectionName: string, imageName: string, type: 'original' | 'thumbnail' = 'original'): Promise<void> => {
        const imagePath = this.getImagePath(collectionName, imageName, type);
        const exists = await DirectoryFixtures.exists(imagePath);
        expect(exists, `${type} image "${imageName}" not found in Collection "${collectionName}"`).true;
        console.log(`✓ ${type} image "${imageName}" exists in Collection "${collectionName}"`);
    };

    static assertImageFileDoesNotExist = async (collectionName: string, imageName: string, type: 'original' | 'thumbnail' = 'original'): Promise<void> => {
        const imagePath = this.getImagePath(collectionName, imageName, type);
        const exists = await DirectoryFixtures.exists(imagePath);
        expect(exists, `${type} image "${imageName}" should not exist in Collection "${collectionName}"`).false;
        console.log(`✓ ${type} image "${imageName}" does not exist in Collection "${collectionName}"`);
    };

    static assertNoImageFilesCreated = async (collectionName: string): Promise<void> => {
        const originalDir = path.join(CONFIG.COLLECTIONS_DIRECTORY, collectionName, 'images', 'original');
        const thumbnailDir = path.join(CONFIG.COLLECTIONS_DIRECTORY, collectionName, 'images', 'thumbnails');
        
        const originalFiles = await DirectoryFixtures.listFiles(originalDir);
        const thumbnailFiles = await DirectoryFixtures.listFiles(thumbnailDir);
        
        expect(originalFiles, `Original image files were created in Collection "${collectionName}" after error`).deep.equals([]);
        expect(thumbnailFiles, `Thumbnail files were created in Collection "${collectionName}" after error`).deep.equals([]);
        console.log(`✓ No image files were created in Collection "${collectionName}"`);
    };

    static assertImageMetadata = (metadata: ImageMetadata, expected: Partial<ImageMetadata>): void => {
        const pattern = {
            id: expected.id || _.isString,
            collection: expected.collection || _.isString,
            name: expected.name || _.isString,
            extension: expected.extension ||  ((x: string) => ['.jpg', '.png', '.webp'].includes(x)),
            mime: expected.mime || ((x: string) => ['image/jpeg', 'image/png', 'image/webp'].includes(x)),
            size: expected.size || _.isNumber,
            hash: expected.hash || _.isString,
            width: expected.width || _.isNumber,
            height: expected.height || _.isNumber,
            aspect: expected.aspect || _.isNumber,
            status: expected.status || _.isString,
            created: expected.created || _.isDate,
            updated: expected.updated || _.isDate
        };

        expect(metadata, 'The Image MetaData did not match the expected values').to.matchPattern(pattern);
        console.log(`✓ Image metadata validated for image ${metadata.id}`);
    };

    static assertImageStatus = (metadata: ImageMetadata, expectedStatus: string): void => {
        expect(metadata.status, `Image ${metadata.id} status after addition to Collection "${metadata.collection}"`).equals(expectedStatus);
        console.log(`✓ Image ${metadata.id} has expected status "${expectedStatus}"`);
    };
}