import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

const CACHE_DIR = 'utils/fixtures/images';

interface ImageFixtureOptions {
    id: string;
    width: number;
    height: number;
    extension: 'jpg' | 'jpeg' | 'png' | 'webp';
}

interface ImageFixture {
    filePath: string;
    filename: string;
    size: number;
    width: number;
    height: number;
    extension: string;
}

const getCacheKey = (options: ImageFixtureOptions): string => {
    const content = `${options.id}-${options.width}x${options.height}.${options.extension}`;
    const hash = createHash('md5').update(content).digest('hex');
    return `_${hash}.(-)`
}

const createTestImage = (options: ImageFixtureOptions): Promise<Buffer> => {
    const { id: name, width, height, extension } = options;

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
        <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="Arial" font-size="16" fill="#010101ff">${name}</text>
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
}

/**
 * Image fixtures for creating realistic test images with actual visual content
 */
export const getImageFixture = async (options: Partial<ImageFixtureOptions> = {}): Promise<ImageFixture> => {
    const {
        id = `test-image-${Date.now()}`,
        width = 600,
        height = 400,
        extension = 'jpeg'
    } = options;

    const filename = getCacheKey({ id, width, height, extension });
    const filePath = `${CACHE_DIR}/${filename}.${extension}`
    const size = await fs.stat(filePath).then((x) => x.size).catch(() => null);

    if (filePath && size) {
        return { filePath, filename, size, width, height, extension };
    }

    try {
        const imageBuffer = await createTestImage({ id, width, height, extension });
        const size = imageBuffer.length;
        await fs.writeFile(filePath, imageBuffer);
        return { filePath, filename, size, width, height, extension };
        
    } catch (error: unknown) {
        throw new Error(`Failed to create or access cached image at ${filePath}: ${(error as Error).message}`);
    }      
}

/**
 * Create a corrupted image file for testing error handling
 */
export const getCorruptedImageFixture = async (extension: 'jpg' | 'jpeg' | 'png' | 'webp' = 'jpg'): Promise<string> => {
    const corruptedFileName = `corrupted-image.${extension}`;
    const filePath = path.join(CACHE_DIR, corruptedFileName);
    
    // Create corrupted image data (invalid header)
    const corruptedData = Buffer.from('this is not a valid image file', 'utf-8');
    
    try {
        await fs.writeFile(filePath, corruptedData);
        return filePath;
    } catch (error: unknown) {
        throw new Error(`Failed to create corrupted image at ${filePath}: ${(error as Error).message}`);
    }
}

/**
 * Create a file with unsupported extension for testing
 */
export const getUnsupportedFileFixture = async (): Promise<string> => {
    const unsupportedFileName = 'test-file.txt';
    const filePath = path.join(CACHE_DIR, unsupportedFileName);
    
    const textData = Buffer.from('This is a text file, not an image', 'utf-8');
    
    try {
        await fs.writeFile(filePath, textData);
        return filePath;
    } catch (error: unknown) {
        throw new Error(`Failed to create unsupported file at ${filePath}: ${(error as Error).message}`);
    }
}