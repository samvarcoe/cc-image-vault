import { expect } from '@playwright/test';
import crypto from 'crypto';

export interface BinaryResponseValidation {
  expectedSize?: number;
  expectedContentType?: string;
  expectedCacheControl?: string;
  expectedContentLength?: string;
  shouldMatchSourceFile?: string;
}

export class BinaryResponseUtils {
  static async validateImageResponse(
    response: Response, 
    validation: BinaryResponseValidation = {}
  ): Promise<Buffer | undefined> {
    const endpoint = this.getEndpointDescription(response);
    let responseBuffer: Buffer | undefined;

    if (validation.expectedContentType) {
      const actualContentType = response.headers.get('content-type');
      expect(actualContentType, {
        message: `${endpoint} Content-Type header mismatch. Expected: ${validation.expectedContentType}, Got: ${actualContentType}`
      }).toBe(validation.expectedContentType);
      console.log(`✓ ${endpoint} Content-Type header correct: ${validation.expectedContentType}`);
    }

    if (validation.expectedCacheControl) {
      const actualCacheControl = response.headers.get('cache-control');
      expect(actualCacheControl, {
        message: `${endpoint} Cache-Control header mismatch. Expected: ${validation.expectedCacheControl}, Got: ${actualCacheControl}`
      }).toBe(validation.expectedCacheControl);
      console.log(`✓ ${endpoint} Cache-Control header correct: ${validation.expectedCacheControl}`);
    }

    if (validation.expectedContentLength !== undefined) {
      const actualContentLength = response.headers.get('content-length');
      expect(actualContentLength, {
        message: `${endpoint} Content-Length header mismatch. Expected: ${validation.expectedContentLength}, Got: ${actualContentLength}`
      }).toBe(validation.expectedContentLength);
      console.log(`✓ ${endpoint} Content-Length header correct: ${validation.expectedContentLength}`);
    }

    if (validation.expectedSize !== undefined) {
      const buffer = await response.arrayBuffer();
      responseBuffer = Buffer.from(buffer);
      const actualSize = responseBuffer.byteLength;
      expect(actualSize, {
        message: `${endpoint} response size mismatch. Expected: ${validation.expectedSize} bytes, Got: ${actualSize} bytes`
      }).toBe(validation.expectedSize);
      console.log(`✓ ${endpoint} response size correct: ${actualSize} bytes`);
    }

    if (validation.shouldMatchSourceFile) {
      responseBuffer = await this.validateFileContentMatch(response, validation.shouldMatchSourceFile, endpoint);
    }

    return responseBuffer;
  }

  static async validateFileContentMatch(
    response: Response, 
    sourceFilePath: string, 
    endpoint: string
  ): Promise<Buffer> {
    const responseBuffer = await response.arrayBuffer();
    const responseBufferNode = Buffer.from(responseBuffer);
    const responseHash = crypto.createHash('sha256').update(responseBufferNode).digest('hex');

    const fs = await import('fs');
    const sourceBuffer = await fs.promises.readFile(sourceFilePath);
    const sourceHash = crypto.createHash('sha256').update(sourceBuffer).digest('hex');

    expect(responseHash, {
      message: `${endpoint} response content differs from source file. Response hash: ${responseHash}, Source hash: ${sourceHash}`
    }).toBe(sourceHash);
    
    console.log(`✓ ${endpoint} response content matches source file (SHA256: ${sourceHash.substring(0, 16)}...)`);
    
    return responseBufferNode;
  }

  static async validateBinaryContent(
    response: Response,
    expectedContentStart?: Buffer
  ): Promise<void> {
    const endpoint = this.getEndpointDescription(response);
    const buffer = await response.arrayBuffer();
    const responseBuffer = Buffer.from(buffer);

    expect(responseBuffer.length, {
      message: `${endpoint} returned empty binary content`
    }).toBeGreaterThan(0);

    if (expectedContentStart) {
      const actualStart = responseBuffer.subarray(0, expectedContentStart.length);
      expect(actualStart.equals(expectedContentStart), {
        message: `${endpoint} binary content does not start with expected bytes. Expected: ${expectedContentStart.toString('hex')}, Got: ${actualStart.toString('hex')}`
      }).toBe(true);
      console.log(`✓ ${endpoint} binary content starts with expected signature`);
    }

    console.log(`✓ ${endpoint} returned valid binary content (${responseBuffer.length} bytes)`);
  }

  static async getResponseSize(response: Response): Promise<number> {
    const buffer = await response.arrayBuffer();
    return buffer.byteLength;
  }

  static async validateIsValidImage(response: Response, expectedFormat?: 'jpeg' | 'png' | 'webp'): Promise<void> {
    const endpoint = this.getEndpointDescription(response);
    const buffer = await response.arrayBuffer();
    const responseBuffer = Buffer.from(buffer);

    this.validateImageFormatFromBuffer(responseBuffer, expectedFormat, endpoint);
  }

  static validateImageFormatFromBuffer(responseBuffer: Buffer, expectedFormat: 'jpeg' | 'png' | 'webp' | undefined, endpoint: string): void {
    expect(responseBuffer.length, {
      message: `${endpoint} returned empty image data`
    }).toBeGreaterThan(0);

    const signatures: Record<string, Buffer> = {
      jpeg: Buffer.from([0xFF, 0xD8, 0xFF]),
      png: Buffer.from([0x89, 0x50, 0x4E, 0x47]),
      webp: Buffer.from([0x52, 0x49, 0x46, 0x46])
    };

    if (expectedFormat) {
      const expectedSignature = signatures[expectedFormat];
      const actualStart = responseBuffer.subarray(0, expectedSignature.length);
      
      expect(actualStart.equals(expectedSignature), {
        message: `${endpoint} does not contain valid ${expectedFormat.toUpperCase()} signature. Expected: ${expectedSignature.toString('hex')}, Got: ${actualStart.toString('hex')}`
      }).toBe(true);
      
      console.log(`✓ ${endpoint} contains valid ${expectedFormat.toUpperCase()} image data`);
    } else {
      const isValidImage = Object.entries(signatures).some(([, signature]) => {
        const actualStart = responseBuffer.subarray(0, signature.length);
        return actualStart.equals(signature);
      });

      expect(isValidImage, {
        message: `${endpoint} does not contain valid image data (no recognized image signature found)`
      }).toBe(true);
      
      console.log(`✓ ${endpoint} contains valid image data`);
    }
  }

  private static getEndpointDescription(response: Response): string {
    const url = new URL(response.url);
    return `${url.pathname}${url.search}`;
  }
}