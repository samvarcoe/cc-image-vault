import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import sharp from 'sharp';
import { Fixtures } from './base-fixtures';

export interface ImageFile {
  filePath: string;
  originalName: string;
  size: number;
  dimensions: { width: number; height: number };
  mimeType: string;
  extension: string;
}

/**
 * Image fixtures for creating realistic test images with actual visual content
 */
export class ImageFixtures extends Fixtures<ImageFile> {
  static async create(options: {
    width?: number;
    height?: number;
    quality?: number;
    originalName?: string;
    extension?: 'jpeg' | 'png' | 'webp';
    includeVisualContent?: boolean;
    simulateCorruption?: boolean;
  } = {}): Promise<ImageFile> {

    const {
      width = 200,
      height = 600,
      quality = 80,
      originalName = `test-photo-${Date.now()}`,
      extension = 'jpeg',
      includeVisualContent = true, // TODO: implement visual content generation
      simulateCorruption = false
    } = options;

    // Temporarily suppress unused variable warning for future implementation
    void includeVisualContent;

    const tempDir = await fs.mkdtemp(path.join(tmpdir(), 'image-fixture-'));
    const filePath = path.join(tempDir, `${originalName}.${extension}`);

    let imageBuffer: Buffer;

    // if (includeVisualContent && !simulateCorruption) {
    //   // Create a colorful test pattern with gradients and shapes
    //   imageBuffer = await this.createTestPattern(width, height, extension, quality);
    // } else if (simulateCorruption) {
    if (simulateCorruption) {
      // Create corrupt image data
      imageBuffer = await this.createCorruptImage(extension);
    }
    
    else {
      // Create minimal valid image
      imageBuffer = await this.createMinimalImage(width, height, extension, quality);
    }

    await fs.writeFile(filePath, imageBuffer);

    const stats = await fs.stat(filePath);
    const mimeType = this.getMimeType(extension);

    const imageFile: ImageFile = {
      filePath,
      originalName,
      size: stats.size,
      dimensions: { width, height },
      mimeType,
      extension
    };

    const cleanup = async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    };

    this.addCleanup(cleanup);

    return imageFile;
  }

  /**
   * Creates a batch of test images with different characteristics
   */
  static async createBatch(options: {
    count?: number;
    formats?: Array<'jpeg' | 'png' | 'webp'>;
    sizes?: Array<{ width: number; height: number }>;
    includeCorrupt?: boolean;
  } = {}): Promise<ImageFile[]> {

    const {
      count = 3,
      formats = ['jpeg', 'png', 'webp'],
      sizes = [
        { width: 400, height: 300 },
        { width: 800, height: 600 },
        { width: 1200, height: 800 }
      ],
      includeCorrupt = false
    } = options;

    const images: ImageFile[] = [];

    for (let i = 0; i < count; i++) {
      const format = formats[i % formats.length];
      const size = sizes[i % sizes.length];
      const shouldCorrupt = includeCorrupt && i === count - 1;

      if (!size) {
        throw new Error(`Unable to get size at index ${i % sizes.length}`);
      }

      const image = await this.create({
        width: size.width,
        height: size.height,
        originalName: `test-photo-${i + 1}`,
        extension: format,
        simulateCorruption: shouldCorrupt
      });

      images.push(image);
    }

    return images;
  }

  /**
   * Creates duplicate images (same visual content, different files)
   */
  static async createDuplicates(options: {
    originalImage?: ImageFile;
    count?: number;
    differentNames?: boolean;
  } = {}): Promise<ImageFile[]> {

    const { count = 2, differentNames = true } = options;
    let { originalImage } = options;

    // Create original if not provided
    if (!originalImage) {
      originalImage = await this.create({
        originalName: 'original-photo',
        width: 600,
        height: 400
      });
    }

    const duplicates: ImageFile[] = [originalImage];

    for (let i = 1; i < count; i++) {
      const duplicateName = differentNames 
        ? `duplicate-${i}-photo.jpg`
        : originalImage.originalName;

      // Copy the original file to create exact duplicate
      const tempDir = await fs.mkdtemp(path.join(tmpdir(), 'duplicate-fixture-'));
      const duplicatePath = path.join(tempDir, duplicateName);
      
      await fs.copyFile(originalImage.filePath, duplicatePath);

      const stats = await fs.stat(duplicatePath);

      const duplicate: ImageFile = {
        filePath: duplicatePath,
        originalName: duplicateName,
        size: stats.size,
        dimensions: originalImage.dimensions,
        mimeType: originalImage.mimeType,
        extension: originalImage.extension
      };

      const cleanup = async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      };

      this.addCleanup(cleanup);
      duplicates.push(duplicate);
    }

    return duplicates;
  }

  private static async createTestPattern(width: number, height: number, format: 'jpeg' | 'png' | 'webp', quality: number): Promise<Buffer> {
    // Create unique content by adding timestamp and random elements to ensure different hashes
    const uniqueId = Date.now() + Math.random();
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
        <circle cx="${width/4}" cy="${height/4}" r="${Math.min(width, height)/8}" fill="#fff" opacity="0.8"/>
        <rect x="${width/2}" y="${height/2}" width="${width/4}" height="${height/4}" fill="#333" opacity="0.6"/>
        <text x="${width/2}" y="${height-40}" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">Test Image ${width}x${height}</text>
        <text x="${width/2}" y="${height-20}" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">ID: ${uniqueId}</text>
      </svg>
    `;

    const sharpInstance = sharp(Buffer.from(svg));

    switch (format) {
      case 'jpeg':
        return sharpInstance.jpeg({ quality }).toBuffer();
      case 'png':
        return sharpInstance.png().toBuffer();
      case 'webp':
        return sharpInstance.webp({ quality }).toBuffer();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private static async createMinimalImage(width: number, height: number, format: 'jpeg' | 'png' | 'webp', quality: number): Promise<Buffer> {
    // Create unique solid color minimal image with random variation
    const randomR = Math.floor(Math.random() * 100) + 100; // 100-199
    const randomG = Math.floor(Math.random() * 100) + 100; // 100-199  
    const randomB = Math.floor(Math.random() * 100) + 100; // 100-199
    
    const sharpInstance = sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: randomR, g: randomG, b: randomB }
      }
    });

    switch (format) {
      case 'jpeg':
        return sharpInstance.jpeg({ quality }).toBuffer();
      case 'png':
        return sharpInstance.png().toBuffer();
      case 'webp':
        return sharpInstance.webp({ quality }).toBuffer();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private static async createCorruptImage(format: 'jpeg' | 'png' | 'webp'): Promise<Buffer> {
    // Create invalid image data that will fail processing
    const corruptData = Buffer.from('INVALID_IMAGE_DATA_' + format.toUpperCase());
    return corruptData;
  }

  private static getMimeType(format: 'jpeg' | 'png' | 'webp'): string {
    const mimeTypes = {
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp'
    };
    return mimeTypes[format];
  }
}