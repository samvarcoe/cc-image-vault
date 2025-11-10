var _a;
import { expect } from "chai";
import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";
import chaiMatchPattern from 'chai-match-pattern';
const _ = chaiMatchPattern.getLodashModule();
import { DirectoryFixtures } from "@/utils";
export class ImageUtils {
}
_a = ImageUtils;
ImageUtils.getImagePath = (collectionName, imageName, type = 'original') => {
    const directoryName = type === 'thumbnail' ? 'thumbnails' : type;
    return path.join(CONFIG.COLLECTIONS_DIRECTORY, collectionName, 'images', directoryName, imageName);
};
ImageUtils.calculateImageHash = async (filePath) => {
    const data = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(data).digest('hex');
};
ImageUtils.assertImageFileExists = async (collectionName, imageName, type = 'original') => {
    const imagePath = _a.getImagePath(collectionName, imageName, type);
    let exists = false;
    try {
        const stat = await fs.stat(imagePath);
        exists = stat.isFile();
    }
    catch (_b) {
        exists = false;
    }
    expect(exists, `${type} image file for: "${imageName}" does not exist at "${imagePath}"`).true;
    LOGGER.log(`✓ ${type} image file for: "${imageName}" exists at "${imagePath}"`);
};
ImageUtils.assertImageFileDoesNotExist = async (collectionName, imageName, type = 'original') => {
    const imagePath = _a.getImagePath(collectionName, imageName, type);
    let exists = false;
    try {
        const stat = await fs.stat(imagePath);
        exists = stat.isFile();
    }
    catch (_b) {
        exists = false;
    }
    expect(exists, `${type} image file for: "${imageName}" should not exist at "${imagePath}"`).false;
    LOGGER.log(`✓ ${type} image file for: "${imageName}" does not exist at "${imagePath}"`);
};
ImageUtils.assertNoImageFilesCreated = async (collectionName) => {
    const originalDir = path.join(CONFIG.COLLECTIONS_DIRECTORY, collectionName, 'images', 'original');
    const thumbnailDir = path.join(CONFIG.COLLECTIONS_DIRECTORY, collectionName, 'images', 'thumbnails');
    const originalFiles = await DirectoryFixtures.listFiles(originalDir);
    const thumbnailFiles = await DirectoryFixtures.listFiles(thumbnailDir);
    expect(originalFiles, `Original image files were created in Collection "${collectionName}" after error`).deep.equals([]);
    expect(thumbnailFiles, `Thumbnail files were created in Collection "${collectionName}" after error`).deep.equals([]);
    LOGGER.log(`✓ No image files were created in Collection "${collectionName}"`);
};
ImageUtils.assertImageMetadata = (metadata, expected) => {
    const pattern = {
        id: expected.id || _.isString,
        collection: expected.collection || _.isString,
        name: expected.name || _.isString,
        extension: expected.extension || ((x) => ['jpg', 'png', 'webp'].includes(x)),
        mime: expected.mime || ((x) => ['image/jpeg', 'image/png', 'image/webp'].includes(x)),
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
    LOGGER.log(`✓ Image metadata validated for image ${metadata.id}`);
};
ImageUtils.assertImageStatus = (metadata, expectedStatus) => {
    expect(metadata.status, `Image ${metadata.id} status after addition to Collection "${metadata.collection}"`).equals(expectedStatus);
    LOGGER.log(`✓ Image ${metadata.id} has expected status "${expectedStatus}"`);
};
