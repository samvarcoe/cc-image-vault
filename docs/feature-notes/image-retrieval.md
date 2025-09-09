# Feature Notes - Image Retrieval

## Summary
Implements the ability to retrieve specific images from a Collection by their unique ID, with comprehensive error handling for invalid IDs, missing images, and internal failures.

## Executable Specification
Requirement File: `domain/requirements/images/retrieval.feature`
Acceptance Test File: `domain/tests/acceptance/specs/images/retrieval.spec.ts`

**Scenarios**
- User retrieves image using a valid ID
- User attempts to retrieve a non-existent image
- User attempts to retrieve an image using an invalid ID
- User attempts to retrieve an image using an empty ID  
- An internal error occurs when retrieving an image

**Testing Notes**
- Added two new error types: `ImageRetrievalError` (wrapper) and `ImageNotFoundError` (specific cause)
- Tests follow 1:1 mapping with Gherkin scenarios
- Uses existing test utilities: `ImageUtils.assertImageMetadata()` and `validateAsyncError()`
- First test adds an image then retrieves it to verify complete metadata matching
- Error scenarios test proper error chaining with cause/message validation
- Internal error test uses sinon to mock database failure
- Tests expect `Collection.getImage()` method to be implemented (currently throws `PendingImplementationError`)