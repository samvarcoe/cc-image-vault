# Feature Notes - API Images Download

## Summary
HTTP API endpoint for downloading individual images with Content-Disposition attachment headers, triggering browser downloads with original filenames rather than inline display.

## Executable Specification
Requirement File: `api/requirements/images/download.feature`
Acceptance Test File: `api/tests/acceptance/specs/images/download.spec.ts`

**Scenarios**
- Client downloads an existing image with original filename
- Client attempts to download an image from a non-existent collection
- Client attempts to download a non-existent image from an existing collection
- Client attempts to download an image using an invalid image ID format
- Internal error occurs when downloading an image

**Testing Notes**

### Test Implementation Approach
- **API Model Extension**: Added `/api/images/:collectionId/:imageId/download` endpoint to `CollectionsAPI` class for download functionality
- **New Assertion Helper**: Created `shouldHaveContentDispositionAttachment(expectedFilename?)` in `AssertableResponse` for validating Content-Disposition headers with attachment directive and optional filename verification
- **Binary Response Handling**: Reused existing `shouldHaveImageContent()`, `shouldHaveContentLength()`, and `shouldHaveImageMimeType()` methods for complete download validation
- **Real Image Fixtures**: Used `getImageFixture()` utility to create actual test images with buffers for binary content verification

### Key Testing Utilities Added
- `shouldHaveContentDispositionAttachment(expectedFilename?)`: Validates Content-Disposition header contains "attachment" directive and optionally verifies the filename parameter matches expected value

### Implementation Details
- **Route Implementation**: Full implementation added to `api/src/routes.ts` at line 277-306
- **Content-Disposition Header**: Set to `attachment; filename="{metadata.name}"` to trigger browser download with original filename
- **Content Headers**: Includes Content-Type, Content-Length (same as serving endpoint)
- **Error Handling**: Comprehensive error handling for CollectionNotFoundError (404), ImageNotFoundError (404), ImageRetrievalError with invalid ID (400), and generic errors (500)
- **Domain Integration**: Uses `Collection.load()`, `collection.getImage()`, and `collection.getImageData()` following established patterns

### Collection/Image Setup Pattern
Tests follow the established pattern:
1. Create collection via `Collection.create(name)`
2. Generate image fixture via `getImageFixture(options)` with actual buffer data
3. Add image to collection via `collection.addImage(filePath)`
4. Use returned image metadata for API calls
5. Validate binary content, headers, and error responses
6. Automatic cleanup via existing `mochaHooks`

### Error Testing Strategy
- **Collection Not Found**: 404 status with "Collection not found" message
- **Image Not Found**: 404 status with "Image not found" message (valid UUID but non-existent)
- **Invalid Image ID Format**: 400 status with "Invalid image ID format" message
- **Internal Errors**: 500 status with "An error occurred whilst downloading the image" message
  - Simulated using `corruptCollectionDB(collection)` utility which corrupts SQLite database
  - Database corruption causes `collection.getImage()` to fail when retrieving metadata
  - More reliable than filesystem stubbing for async operations

### Content Validation
- **Binary Content**: Validates exact binary content match using fixture buffer
- **Headers Validation**: Verifies Content-Disposition (attachment), Content-Type (MIME), and Content-Length
- **Filename Preservation**: Confirms original filename is included in Content-Disposition header

### Technical Implementation Notes
- Route structure mirrors existing image serving endpoint with added Content-Disposition header
- No caching headers (Cache-Control) as downloads are one-time actions, not repeated requests
- Error handling chain matches established API patterns for consistency
- Uses same domain methods as serving endpoint (getImage, getImageData) ensuring consistency

This executable specification follows TDD principles with all 5 tests passing, ready for code review and documentation.