# Feature Notes - Image Retrieval

## Summary
✅ **COMPLETE** - Implements the ability to retrieve specific images from a Collection by their unique ID, with comprehensive error handling for invalid IDs, missing images, and internal failures.

## Executable Specification
Requirement File: `domain/requirements/images/retrieval.feature`
Acceptance Test File: `domain/tests/acceptance/specs/images/retrieval.spec.ts`

**Scenarios** - All ✅ Passing
- ✅ User retrieves image using a valid ID
- ✅ User attempts to retrieve a non-existent image
- ✅ User attempts to retrieve an image using an invalid ID
- ✅ User attempts to retrieve an image using an empty ID  
- ✅ An internal error occurs when retrieving an image

**Testing Notes**
- Added two new error types: `ImageRetrievalError` (wrapper) and `ImageNotFoundError` (specific cause)
- Tests follow 1:1 mapping with Gherkin scenarios
- Uses existing test utilities: `ImageUtils.assertImageMetadata()` and `validateAsyncError()`
- First test adds an image then retrieves it to verify complete metadata matching
- Error scenarios test proper error chaining with cause/message validation
- Internal error test uses sinon to mock database failure
- `Collection.getImage()` method fully implemented and tested

## Interfaces
```ts
// Collection class method
async getImage(imageId: string): Promise<ImageMetadata>

// Error types 
class ImageRetrievalError extends Error {
  constructor(collectionName: string, public cause: unknown)
}

class ImageNotFoundError extends Error {
  constructor(imageId: string)
}

// Helper validation method
private validateImageId(imageId: string): void
```

## Implementation Summary
The `Collection.getImage()` method retrieves image metadata by ID with comprehensive validation and error handling. Implementation includes ID validation (empty/unsafe characters), database queries with proper type casting, and structured error handling with cause chaining.

## Technical Notes
- Uses SQLite prepared statements with parameter binding for security
- Proper TypeScript type casting from database strings to union types (Extension, Mime, ImageStatus)
- Database connection cleanup in finally blocks ensures no resource leaks
- ID validation follows same patterns as existing filename validation
- Error handling wraps all exceptions in `ImageRetrievalError` with original cause preserved