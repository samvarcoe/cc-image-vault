# Feature Notes - Image Deletion

## Summary
Comprehensive image deletion functionality that allows users to permanently remove images from collections with atomic operations and proper error handling.

## Executable Specification
Requirement File: domain/requirements/images/deletion.feature
Acceptance Test File: domain/tests/acceptance/specs/images/deletion.spec.ts

**Scenarios**
- User deletes an image from a Collection
- User attempts to delete a non-existent image
- User attempts to delete an image using an invalid image ID
- An internal error occurs when deleting an image

**Testing Notes**
The acceptance tests validate the complete deletion workflow including filesystem cleanup, database metadata removal, and proper error handling. Key testing approaches:

- **Atomic Behavior Testing**: Tests verify that deletion operations are fully atomic - either complete success with all artifacts removed, or complete failure with no changes to the system.

- **Public Interface Only**: Tests interact exclusively through the Collection public API (`deleteImage`, `getImage`) without touching internal database state directly, following the established pattern.

- **Filesystem Validation**: Uses `ImageUtils.assertImageFileExists` and `assertImageFileDoesNotExist` to verify both original images and thumbnails are properly removed from the filesystem.

- **Error Chain Validation**: Tests verify proper error wrapping where `ImageDeletionError` contains appropriate cause errors (`ImageNotFoundError` for missing images, generic `Error` for invalid IDs).

- **Post-Deletion Verification**: Confirms deletion success by attempting to retrieve deleted images and validating that `ImageRetrievalError` with `ImageNotFoundError` cause is thrown.

- **Internal Error Simulation**: Uses sinon to mock database failures for testing atomic rollback behavior during internal errors.

The test implementation follows the 1:1 mapping requirement with feature scenarios and includes comprehensive validation of both success and failure paths while maintaining test isolation and cleanup.