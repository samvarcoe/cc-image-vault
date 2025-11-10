import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
const CACHE_DIR = 'utils/fixtures/images';
const extractExtension = (filename) => {
    var _a;
    const extension = (_a = filename.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!extension || !validExtensions.includes(extension)) {
        throw new Error(`Invalid or missing file extension in filename: ${filename}. Supported extensions: ${validExtensions.join(', ')}`);
    }
    return extension;
};
const getCacheKey = (options, extension) => {
    const content = `${options.filename}-${options.width}x${options.height}.${extension}`;
    return createHash('md5').update(content).digest('hex');
};
const createTestImage = (options, extension) => {
    const { filename, width, height } = options;
    const randomColor1 = Math.floor(Math.random() * 256);
    const randomColor2 = Math.floor(Math.random() * 256);
    const randomColor3 = Math.floor(Math.random() * 256);
    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:rgb(${randomColor1},100,150);stop-opacity:1" />
                    <stop offset="50%" style="stop-color:rgb(100,${randomColor2},200);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgb(150,200,${randomColor3});stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg)"/>
            <circle cx="${width / 2}" cy="${height / 2}" r="${(Math.min(width, height) / 2) - 2}" fill="#fff" opacity="0.2"/>
            <circle cx="${width / 2}" cy="${height / 2}" r="${(Math.max(width, height) / 2) - 2}" fill="#fff" opacity="0.2"/>
            <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="Arial" font-size="16" fill="#010101ff">${filename}</text>
            <text x="${width / 2}" y="${(height / 2) + 24}" text-anchor="middle" font-family="Arial" font-size="16" fill="#000000ff">${width}x${height}</text>
        </svg>
    `;
    const sharpInstance = sharp(Buffer.from(svg));
    switch (extension) {
        case 'jpg':
            return sharpInstance.jpeg({ quality: 80 }).toBuffer();
        case 'jpeg':
            return sharpInstance.jpeg({ quality: 80 }).toBuffer();
        case 'png':
            return sharpInstance.png().toBuffer();
        case 'webp':
            return sharpInstance.webp({ quality: 80 }).toBuffer();
        default:
            throw new Error(`Unsupported extension: ${extension}`);
    }
};
export const getImageFixture = async (options = {}) => {
    const { filename = `test-image-${Date.now()}.jpeg`, width = 600, height = 400 } = options;
    const extension = extractExtension(filename);
    const filenameWithoutExtension = filename.substring(0, filename.lastIndexOf('.'));
    const cacheKey = getCacheKey({ filename: filenameWithoutExtension, width, height }, extension);
    const cacheFile = `${cacheKey}.${extension}`;
    const cachePath = `${CACHE_DIR}/${cacheFile}`;
    const size = await fs.stat(cachePath).then((x) => x.size).catch(() => null);
    if (cachePath && size) {
        const buffer = await fs.readFile(cachePath);
        return { filename, size, width, height, buffer };
    }
    try {
        const buffer = await createTestImage({ filename: filenameWithoutExtension, width, height }, extension);
        const size = buffer.length;
        await fs.writeFile(cachePath, buffer);
        return { filename, size, width, height, buffer };
    }
    catch (error) {
        throw new Error(`Failed to create or access cached image at ${cachePath}: ${error.message}`);
    }
};
export const getCorruptedImageFixture = async (extension = 'jpg') => {
    const corruptedFileName = `corrupted-image.${extension}`;
    const filePath = path.join(CACHE_DIR, corruptedFileName);
    const corruptedData = Buffer.from('this is not a valid image file', 'utf-8');
    try {
        await fs.writeFile(filePath, corruptedData);
        return filePath;
    }
    catch (error) {
        throw new Error(`Failed to create corrupted image at ${filePath}: ${error.message}`);
    }
};
export const getUnsupportedFileFixture = async () => {
    const unsupportedFileName = 'test-file.txt';
    const filePath = path.join(CACHE_DIR, unsupportedFileName);
    const textData = Buffer.from('This is a text file, not an image', 'utf-8');
    try {
        await fs.writeFile(filePath, textData);
        return filePath;
    }
    catch (error) {
        throw new Error(`Failed to create unsupported file at ${filePath}: ${error.message}`);
    }
};
