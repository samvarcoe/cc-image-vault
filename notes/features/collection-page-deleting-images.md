# Feature Notes - Collection Page Deleting Images

## Summary
Image deletion functionality for permanently removing unwanted images from the archive. Users can select multiple archive images and delete them via a confirmation dialog workflow, with immediate UI feedback and comprehensive error handling.

## Executable Specification
Requirement File: client/requirements/collection-page/deleting-images.feature
Acceptance Test File: client/tests/acceptance/specs/collection-page/deleting-images.spec.ts

**Scenarios**
- User views ARCHIVE images with curate mode active
- User views COLLECTION images with curate mode active
- User views INBOX images with curate mode active
- User initiates delete operation
- User cancels delete operation
- User confirms delete operation
- Delete operation completes successfully
- Delete operation fails partially
- Delete operation fails completely
- User deletes a large number of images

**Testing Notes**
The acceptance tests follow the established pattern from image-status-updates.spec.ts with route interception for immediate UI feedback. Key testing components implemented:

1. **UI Model Extensions**: Added `deleteButton` to `CurationMenu` class and created `ConfirmationDialog` component with message, cancel, and delete button selectors.

2. **Test Architecture**:
   - DELETE button visibility tests for different image statuses (only shown for ARCHIVE)
   - Confirmation dialog workflow with proper message validation
   - Route interception for DELETE `/api/images/:collectionId/:imageId` requests
   - Immediate UI feedback patterns (hide images, show placeholders)
   - Error handling for partial and complete failures
   - Batch deletion testing with API call count verification

3. **Key Testing Patterns**:
   - Images are immediately hidden when delete is confirmed
   - Image cards remain as placeholders during deletion
   - Failed images are unhidden and remain selected
   - Error messages display in curation menu on failure
   - Confirmation dialog prevents accidental deletion
   - User selection is preserved when canceling operation

4. **Implementation Requirements**: Tests expect DELETE HTTP method to `/api/images/:collectionId/:imageId` endpoint, batched processing for large deletions, and error handling that matches existing status-update patterns.

The test suite consists of 10 scenarios with all tests now passing after implementation completion.

## Interfaces
```ts
// Model Layer - Extended CollectionPageData interface
interface CollectionPageData {
    confirmationDialog?: {
        visible: boolean;
        message?: string;
    };
}

// View Layer - Enhanced curation menu for ARCHIVE status
// DELETE button appears alongside Restore button for ARCHIVE images
// Confirmation dialog modal with proper message and action buttons

// Controller Layer - Deletion workflow
// handleDeleteButtonClick() -> showConfirmationDialog()
// handleConfirmDelete() -> batched DELETE requests -> removeImages()
// handleCancelDelete() -> hideConfirmationDialog()
```

## Implementation Summary
Complete image deletion workflow for ARCHIVE status images with confirmation dialog, batched API requests, optimistic UI updates, and comprehensive error handling following established MVC patterns.

## Technical Notes
1. **Batching Logic**: DELETE requests processed in batches of 10 concurrent requests to prevent server overload
2. **Error Handling**: Partial failures leave failed images selected and visible with appropriate error messages
3. **UI Optimization**: Hidden images during deletion don't load thumbnail URLs to prevent 404 errors
4. **Test Framework**: Fixed erroneous network failure tracking in test suite that was causing false positives
5. **State Management**: Confirmation dialog state properly integrated into existing model architecture
6. **DELETE API**: Leverages existing `/api/images/:collectionId/:imageId` endpoint with DELETE method