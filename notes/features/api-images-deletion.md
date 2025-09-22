# Feature Notes - API Images Deletion

## Summary
Implements HTTP DELETE endpoint for removing images from collections via the API layer, providing comprehensive error handling and leveraging the existing domain layer implementation.

## Executable Specification
Requirement File: api/requirements/images/deletion.feature
Acceptance Test File: api/tests/acceptance/specs/images/deletion.spec.ts

**Scenarios**
1. Client deletes an existing image from a collection
2. Client attempts to delete an image from a non-existent collection
3. Client attempts to delete a non-existent image from an existing collection
4. Client attempts to delete an image using an invalid image ID format
5. Internal error occurs when deleting an image

**Testing Notes**
The test implementation follows established patterns from existing API tests, using the CollectionsAPI model for HTTP requests and standard error handling validation. Key utilities used include:
- `getImageFixture()` for creating test images
- `corruptCollectionDB()` for simulating internal errors
- Standard assertion patterns with `.shouldHaveStatus()` and `.shouldHaveBodyWithProperty()`

The API route implementation leverages the existing domain layer `Collection.deleteImage()` method which was already fully implemented, including proper validation, file system cleanup, and database consistency. Error handling covers all specified scenarios with appropriate HTTP status codes (204, 400, 404, 500) and descriptive error messages.

All tests pass successfully, confirming the complete end-to-end functionality from HTTP API through to domain layer implementation.