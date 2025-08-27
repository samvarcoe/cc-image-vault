import { expect } from '@playwright/test';
import { ImageMetadataResponse } from './collections-api-model';
import { ImageStatus } from '../../../src/domain/types';
import { AssertableResponse } from './assertable-response';

/**
 * Utility functions for Collections Images API testing
 * Provides helpers for query parameter construction and image metadata validation
 */
export class CollectionsImagesAPIUtils {

  /**
   * Builds query parameters object from individual options
   */
  static buildQueryParams(options: {
    status?: ImageStatus;
    limit?: number;
    offset?: number;
    orderBy?: 'created_at' | 'updated_at';
    orderDirection?: 'ASC' | 'DESC';
  } = {}): Record<string, string> {
    const queryParams: Record<string, string> = {};

    if (options.status) {
      queryParams.status = options.status;
    }
    if (options.limit !== undefined) {
      queryParams.limit = options.limit.toString();
    }
    if (options.offset !== undefined) {
      queryParams.offset = options.offset.toString();
    }
    if (options.orderBy) {
      queryParams.orderBy = options.orderBy;
    }
    if (options.orderDirection) {
      queryParams.orderDirection = options.orderDirection;
    }

    return queryParams;
  }

  /**
   * Validates that an image metadata object contains all required fields
   */
  static assertValidImageMetadata(imageData: ImageMetadataResponse, context: string = ''): void {
    const contextPrefix = context ? `${context}: ` : '';

    expect(imageData, { message: `${contextPrefix}Image metadata object is missing` }).toBeDefined();
    
    // Required string fields
    expect(imageData.id, { message: `${contextPrefix}Image ID is missing or invalid` }).toBeTruthy();
    expect(typeof imageData.id, { message: `${contextPrefix}Image ID should be string but is ${typeof imageData.id}` }).toBe('string');
    
    expect(imageData.originalName, { message: `${contextPrefix}Image originalName is missing` }).toBeTruthy();
    expect(typeof imageData.originalName, { message: `${contextPrefix}Image originalName should be string` }).toBe('string');
    
    expect(imageData.fileHash, { message: `${contextPrefix}Image fileHash is missing` }).toBeTruthy();
    expect(typeof imageData.fileHash, { message: `${contextPrefix}Image fileHash should be string` }).toBe('string');
    
    expect(imageData.extension, { message: `${contextPrefix}Image extension is missing` }).toBeTruthy();
    expect(typeof imageData.extension, { message: `${contextPrefix}Image extension should be string` }).toBe('string');
    
    expect(imageData.mimeType, { message: `${contextPrefix}Image mimeType is missing` }).toBeTruthy();
    expect(typeof imageData.mimeType, { message: `${contextPrefix}Image mimeType should be string` }).toBe('string');

    // Status validation
    expect(['INBOX', 'COLLECTION', 'ARCHIVE'], { 
      message: `${contextPrefix}Image status "${imageData.status}" is not a valid ImageStatus` 
    }).toContain(imageData.status);

    // Numeric fields
    expect(typeof imageData.size, { message: `${contextPrefix}Image size should be number but is ${typeof imageData.size}` }).toBe('number');
    expect(imageData.size, { message: `${contextPrefix}Image size should be positive but is ${imageData.size}` }).toBeGreaterThan(0);
    
    expect(typeof imageData.aspectRatio, { message: `${contextPrefix}Image aspectRatio should be number` }).toBe('number');
    expect(imageData.aspectRatio, { message: `${contextPrefix}Image aspectRatio should be positive` }).toBeGreaterThan(0);

    // Dimensions validation
    expect(imageData.dimensions, { message: `${contextPrefix}Image dimensions object is missing` }).toBeDefined();
    expect(typeof imageData.dimensions.width, { message: `${contextPrefix}Image width should be number` }).toBe('number');
    expect(imageData.dimensions.width, { message: `${contextPrefix}Image width should be positive` }).toBeGreaterThan(0);
    expect(typeof imageData.dimensions.height, { message: `${contextPrefix}Image height should be number` }).toBe('number');
    expect(imageData.dimensions.height, { message: `${contextPrefix}Image height should be positive` }).toBeGreaterThan(0);

    // Timestamp validation (ISO 8601 format)
    expect(imageData.createdAt, { message: `${contextPrefix}Image createdAt timestamp is missing` }).toBeTruthy();
    expect(() => new Date(imageData.createdAt), { 
      message: `${contextPrefix}Image createdAt "${imageData.createdAt}" is not a valid ISO 8601 timestamp` 
    }).not.toThrow();
    
    expect(imageData.updatedAt, { message: `${contextPrefix}Image updatedAt timestamp is missing` }).toBeTruthy();
    expect(() => new Date(imageData.updatedAt), { 
      message: `${contextPrefix}Image updatedAt "${imageData.updatedAt}" is not a valid ISO 8601 timestamp` 
    }).not.toThrow();

    console.log(`✓ Image metadata validation passed for image ${imageData.id} (${imageData.originalName})`);
  }

  /**
   * Validates that all images in response have the expected status
   */
  static assertImagesHaveStatus(images: ImageMetadataResponse[], expectedStatus: ImageStatus, collectionId: string): void {
    expect(images, { 
      message: `Collection ${collectionId} images array is missing when filtering by status ${expectedStatus}` 
    }).toBeDefined();

    images.forEach((image, index) => {
      expect(image.status, {
        message: `Collection ${collectionId} image ${index + 1} (${image.originalName}) has status "${image.status}" instead of expected "${expectedStatus}"`
      }).toBe(expectedStatus);
    });

    const uniqueStatuses = [...new Set(images.map(img => img.status))];
    expect(uniqueStatuses, {
      message: `Collection ${collectionId} contains images with mixed statuses [${uniqueStatuses.join(', ')}] when filtering by ${expectedStatus}`
    }).toEqual([expectedStatus]);

    console.log(`✓ All ${images.length} images in collection ${collectionId} have status ${expectedStatus}`);
  }

  /**
   * Validates pagination results
   */
  static assertPaginationResults(images: ImageMetadataResponse[], expectedCount: number, offset: number, collectionId: string): void {
    expect(images.length, {
      message: `Collection ${collectionId} returned ${images.length} images instead of expected ${expectedCount} with offset ${offset}`
    }).toBe(expectedCount);

    // Verify images have unique IDs (no duplicates in pagination)
    const imageIds = images.map(img => img.id);
    const uniqueIds = new Set(imageIds);
    expect(uniqueIds.size, {
      message: `Collection ${collectionId} pagination returned duplicate images: found ${imageIds.length} images but only ${uniqueIds.size} unique IDs`
    }).toBe(images.length);

    console.log(`✓ Pagination returned correct count ${expectedCount} for collection ${collectionId} at offset ${offset}`);
  }

  /**
   * Validates that images are sorted according to specified criteria
   */
  static assertImagesSorted(images: ImageMetadataResponse[], orderBy: 'created_at' | 'updated_at', orderDirection: 'ASC' | 'DESC', collectionId: string): void {
    if (images.length < 2) {
      console.log(`✓ Collection ${collectionId} has ${images.length} images - sorting validation skipped`);
      return;
    }

    const timestamps = images.map(img => new Date(orderBy === 'created_at' ? img.createdAt : img.updatedAt).getTime());
    
    for (let i = 1; i < timestamps.length; i++) {
      const previous = timestamps[i - 1];
      const current = timestamps[i];
      
      if (orderDirection === 'ASC') {
        expect(current, {
          message: `Collection ${collectionId} images not sorted by ${orderBy} ASC: image ${i} (${images[i]?.originalName}) has earlier ${orderBy} than image ${i-1} (${images[i-1]?.originalName})`
        }).toBeGreaterThanOrEqual(previous!);
      } else {
        expect(current, {
          message: `Collection ${collectionId} images not sorted by ${orderBy} DESC: image ${i} (${images[i]?.originalName}) has later ${orderBy} than image ${i-1} (${images[i-1]?.originalName})`
        }).toBeLessThanOrEqual(previous!);
      }
    }

    console.log(`✓ Collection ${collectionId} images correctly sorted by ${orderBy} ${orderDirection}`);
  }

  /**
   * Validates error response structure and content
   */
  static assertValidErrorResponse(response: AssertableResponse<unknown>, expectedStatus: number, expectedErrorType: string): void {
    response.shouldHaveStatus(expectedStatus);

    expect(response.body, { 
      message: `Error response body is missing for ${expectedStatus} status` 
    }).toBeDefined();

    const errorBody = response.body as Record<string, unknown>;
    expect(errorBody.error, { 
      message: `Error response missing 'error' field for ${expectedStatus} status` 
    }).toBeDefined();
    
    const errorResponse = errorBody as { error?: string; message?: string };
    
    expect(errorResponse.message, { 
      message: `Error response missing 'message' field for ${expectedStatus} status` 
    }).toBeDefined();

    expect(errorResponse.message?.toLowerCase(), {
      message: `Error message "${errorResponse.message}" does not contain expected error type "${expectedErrorType}"`
    }).toContain(expectedErrorType.toLowerCase());

    console.log(`✓ Error response has correct structure and contains "${expectedErrorType}" message`);
  }

  /**
   * Creates test query parameters for invalid scenarios
   */
  static getInvalidQueryParams(): Array<{ params: Record<string, string>; description: string }> {
    return [
      {
        params: { status: 'INVALID_STATUS' },
        description: 'invalid status value'
      },
      {
        params: { limit: '-1' },
        description: 'negative limit'
      },
      {
        params: { limit: '0' },
        description: 'zero limit'
      },
      {
        params: { limit: '1001' },
        description: 'limit exceeding maximum'
      },
      {
        params: { offset: '-1' },
        description: 'negative offset'
      },
      {
        params: { orderBy: 'invalid_field' },
        description: 'invalid orderBy field'
      },
      {
        params: { orderDirection: 'INVALID' },
        description: 'invalid orderDirection value'
      },
      {
        params: { limit: 'not_a_number' },
        description: 'non-numeric limit'
      },
      {
        params: { offset: 'not_a_number' },
        description: 'non-numeric offset'
      }
    ];
  }
}