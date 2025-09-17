# Feature Notes - Image Serving

## Summary
API endpoints for serving original image files and thumbnails via HTTP with proper content negotiation, caching headers, and error handling for collection validation.

## Executable Specification
Requirement File: `api/requirements/images/serving.feature`
Acceptance Test File: `api/tests/acceptance/specs/images/serving.spec.ts`

**Scenarios**
- Original image serving with valid collection and image IDs
- Thumbnail image serving with valid collection and image IDs
- Image serving with non-existent collection

**Testing Notes**

### Test Implementation Approach
- **API Model Extension**: Extended existing `CollectionsAPI` class with image serving endpoints rather than creating separate class for consistency
- **Binary Response Handling**: Enhanced `AssertableResponse` with ArrayBuffer support and specialized image validation methods
- **Header Validation**: Added specific methods for Content-Type (MIME type), Content-Length, and Cache-Control header validation
- **Real Image Fixtures**: Used existing `getImageFixture()` utility to create actual image files for realistic testing

### Key Testing Utilities Added
- `shouldHaveImageContent(expectedBuffer?)`: Validates binary content presence, non-zero size, and optionally validates exact buffer content match
- `shouldHaveDifferentImageContent(originalBuffer)`: Validates that content differs from original (useful for thumbnails)
- `shouldHaveContentLength(expectedSize?)`: Validates Content-Length header with optional size verification
- `shouldHaveCacheHeaders()`: Validates cache control headers for immutable content
- `shouldHaveImageMimeType(expectedMime?)`: Validates image MIME types with optional specific type checking

### Implementation Status
- **API Routes**: Placeholder implementations added to `/api/src/routes.ts` returning 501 (Not Implemented)
- **Error Handling**: Proper error types with `PendingImplementationError` for development phase
- **Path Parameters**: Support for `:collectionId` and `:imageId` parameters in URL routing
- **Test Infrastructure**: Full test setup with proper collection/image fixtures and cleanup

### Collection/Image Setup Pattern
Tests use the established pattern:
1. Create collection via `Collection.create(name)`
2. Generate image fixture via `getImageFixture(options)` - now includes actual buffer data
3. Add image to collection via `collection.addImage(filePath)` - generates thumbnails automatically
4. Read thumbnail buffer from filesystem for validation using domain's path structure
5. Use returned image metadata for API calls with exact buffer content validation
6. Automatic cleanup via existing `mochaHooks`

### Enhanced Content Validation
- **Original Images**: Validates exact binary content match using fixture buffer with real MIME type from image metadata
- **Thumbnails**: Reads actual thumbnail file from `images/thumbnails/{imageId}.{extension}` and validates exact content
- **Content Differentiation**: Verifies thumbnails differ from original images while still being valid images
- **Real Values**: All assertions use actual metadata values (MIME type, file size) rather than generic validations
- **MIME Type Consistency**: Thumbnails maintain same format/MIME type as original images (Sharp preserves format)

### Error Handling Strategy
- Collection not found → 404 status (consistent with existing API patterns)
- Implementation pending → 501 status (development phase)
- Server errors → 500 status with generic messages
- All error responses include JSON message format

This executable specification follows TDD principles with tests that currently fail due to pending implementation (returning 501 status codes), ready for the implementation phase.

## Implementation Summary
Implemented HTTP endpoints for serving original and thumbnail images from collections with proper content negotiation, caching headers, and comprehensive error handling.

## Technical Notes
- Routes handle both original (`/api/images/:collectionId/:imageId`) and thumbnail (`/api/images/:collectionId/:imageId/thumbnail`) image requests
- Error handling properly unwraps `CollectionLoadError` to identify `CollectionNotFoundError` cases for 404 responses
- Content-Length header uses actual buffer length for thumbnails rather than stored metadata size
- Cache-Control headers set to `public, max-age=31536000, immutable` for efficient CDN and browser caching
- File paths constructed using domain conventions: `{COLLECTIONS_DIRECTORY}/{collectionId}/images/{original|thumbnails}/{imageId}.{extension}`
- All 3 test scenarios passing: original image serving, thumbnail serving, and collection not found error handling