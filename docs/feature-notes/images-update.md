# Feature Notes - Images Update

## Summary
Allows users to update the status of images within Collections, enabling organization into different categories (INBOX, COLLECTION, ARCHIVE) as part of the image management workflow.

## Executable Specification
Requirement File: `domain/requirements/images/update.feature`
Acceptance Test File: `domain/tests/acceptance/specs/images/update.spec.ts`

**Scenarios**
- User updates the status of an image
- User attempts to update the status of a non-existent image  
- User attempts to update the status of an image using an invalid image ID
- User attempts to update the status of an image using an empty image ID
- User attempts to update the status of an image using an invalid status value
- An internal error occurs when the user attempts to update the status of an image

**Testing Notes**
The acceptance tests validate the complete error handling chain as specified in the requirements. Key implementation details:

- Added `ImageUpdateError` class to `domain/errors.ts` following existing error patterns with cause chaining
- Tests use existing infrastructure: `ImageUtils` for metadata validation, `validateAsyncError` for error testing, image fixtures for test data
- Error scenarios test proper error wrapping and cause chaining (ImageUpdateError wrapping specific causes like ImageNotFoundError)
- Security validation tests include path traversal attempts in invalid image ID scenario
- Tests leverage automatic setup/teardown hooks from `setup.ts` for isolated test environments
- All tests currently fail with `PendingImplementationError` as expected in TDD approach - implementation of `Collection.updateImage()` method required

The tests demonstrate proper validation of:
- Business logic (status updates with metadata verification)
- Input validation (empty IDs, invalid characters, invalid status values)  
- Error handling (non-existent images, internal failures)
- Security concerns (unsafe characters in image IDs)