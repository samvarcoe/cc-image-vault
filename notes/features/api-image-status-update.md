# Feature Notes - API Image Status Update

## Summary
REST API endpoint allowing clients to update image status values via HTTP PATCH requests with comprehensive validation and error handling.

## Executable Specification
Requirement File: api/requirements/images/status-update.feature
Acceptance Test File: api/tests/acceptance/specs/images/status-update.spec.ts

**Scenarios**
1. Client updates the status of an image
2. Client attempts to update the status of an image in a collection that doesn't exist
3. Client attempts to update the status of an image that doesn't exist
4. Client attempts to update the status of an image using an invalid image ID format
5. Client attempts to update the status of an image using an invalid status value
6. Client sends a status update request with a missing request body
7. Client sends a status update request with a malformed request body
8. Client sends a status update request with a missing status field
9. An internal error occurs when a client attempts to update an image status

**Testing Notes**
- Extended CollectionsAPI with PATCH endpoint supporting ImageUpdateRequest → ImageMetadata
- Added comprehensive validation scenarios covering all error conditions from Gherkin specs
- Used realistic image fixtures via getImageFixture() for test setup
- Implemented proper error simulation using sinon stubs for internal error testing
- Leveraged existing domain Collection objects for realistic test data orchestration
- All tests use AssertableResponse chain-based assertions with descriptive failure messages
- Tests follow 1-1 mapping with Gherkin scenarios as per project standards
- Successfully verified all tests fail appropriately (404 status) due to pending PATCH endpoint implementation

The specification provides comprehensive coverage of the image status update API contract including success cases, validation errors, and internal error handling while maintaining consistency with existing test patterns.