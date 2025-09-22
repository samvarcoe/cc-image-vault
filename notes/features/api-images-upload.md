# Feature Notes - API Images Upload

## Summary
HTTP API endpoint for uploading image files to collections via POST requests with multipart form data. Provides comprehensive validation, error handling, and integration with the domain layer for file processing and metadata generation.

## Executable Specification
Requirement File: `api/requirements/images/upload.feature`
Acceptance Test File: `api/tests/acceptance/specs/images/upload.spec.ts`

**Scenarios**
1. Successful image upload to existing collection
2. Image upload with no file provided
3. Image upload to non-existent collection
4. Image upload with unsupported file type
5. Image upload with corrupted file
6. Internal server error during image processing

**Testing Notes**
- **API Model Extension**: Extended `CollectionsAPI` class with POST endpoint for `/api/images/:collectionId` supporting FormData requests
- **FormData Handling**: Updated base `APIModel` to properly handle FormData vs JSON request bodies, allowing multipart file uploads without Content-Type headers
- **Multer Integration**: Added multer middleware configuration for memory storage to handle multipart form uploads
- **Error Scenarios**: Comprehensive coverage of validation errors (missing file, wrong field name), domain errors (unsupported/corrupted files), and internal errors
- **File Format Handling**: Tests use proper ArrayBuffer conversion from image fixture buffers to create Blob objects for FormData
- **Database Corruption**: Leverages existing `corruptCollectionDB()` utility to simulate internal database errors for comprehensive error testing
- **Domain Integration**: Tests expect integration with `Collection.addImage()` method for business logic and file processing
- **Response Validation**: Tests validate complete ImageMetadata response structure including ID generation, collection assignment, and timestamps

**Implementation Status**: ✅ Complete - Full feature implementation with all tests passing

## Interfaces
```ts
// POST /api/images/:collectionId
// Request: multipart/form-data with 'file' field
// Response: ImageMetadata (201) or error message (400/404/500)

interface ImageUploadEndpoint {
  method: 'POST';
  path: '/api/images/:collectionId';
  contentType: 'multipart/form-data';
  requestBody: FormData; // with 'file' field
  responses: {
    201: ImageMetadata;
    400: { message: string }; // Missing file, validation errors
    404: { message: string }; // Collection not found
    500: { message: string }; // Internal errors
  };
}
```

## Implementation Summary
Complete HTTP API endpoint for uploading images to collections with comprehensive validation, error handling, and seamless domain integration.

## Technical Notes
- **Temporary File Strategy**: Creates UUID-based temp directories to avoid conflicts while preserving original filenames for domain layer processing
- **Extension Normalization**: Domain layer normalizes `.jpeg` to `.jpg` - tests updated to match this behavior
- **Memory Efficiency**: Uses multer memory storage with immediate cleanup via `rmSync()` for both success and error scenarios
- **Error Translation**: Maps domain `ImageAdditionError` causes to appropriate HTTP status codes for client-friendly responses
- **FormData Integration**: Seamless handling of multipart uploads through existing API model testing infrastructure