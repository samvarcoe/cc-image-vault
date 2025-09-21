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
The acceptance tests validate the complete error handling chain as specified in the requirements. All tests pass successfully.

## Implementation Summary ✅
Feature successfully implemented with comprehensive error handling and validation.

**Core Implementation**
- `Collection.updateImage(imageId: string, update: ImageUpdate): Promise<ImageMetadata>` in `domain/src/collection.ts`
- Validates image ID format using UUID validation with security redaction for invalid IDs
- Validates status values against allowed types: INBOX, COLLECTION, ARCHIVE
- Updates database with new status and updated timestamp
- Returns complete updated metadata object

**Error Handling**
- `ImageUpdateError` class updated to include imageId in error messages for better traceability
- Proper error cause chaining maintained through all validation layers
- Database operation error wrapping for internal failures

**Validation Coverage**
- ✅ Business logic (status updates with metadata verification)
- ✅ Input validation (UUID format validation, invalid status values)  
- ✅ Error handling (non-existent images, internal database failures)

## Technical Notes
- Enhanced UUID validation replaces generic pattern matching for improved security
- Error message format updated to include specific image IDs for better debugging
- Database operations use atomic transactions with proper connection cleanup
- All existing functionality remains unaffected (no regressions)