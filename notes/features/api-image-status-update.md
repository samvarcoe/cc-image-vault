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
- Implemented proper error simulation using corruptCollectionDB() utility for database error testing
- Leveraged existing domain Collection objects for realistic test data orchestration
- All tests use AssertableResponse chain-based assertions with descriptive failure messages
- Tests follow 1-1 mapping with Gherkin scenarios as per project standards
- Fixed logical flaw in date validation (updated timestamp should differ from created timestamp)
- Used proper TypeScript typing and null safety for response body validation

The specification provides comprehensive coverage of the image status update API contract including success cases, validation errors, and internal error handling while maintaining consistency with existing test patterns.

## Interfaces
```ts
type ImageUpdateRequest = {
  status: string;
};

type ImageMetadata = {
  id: string;
  collection: string;
  name: string;
  extension: string;
  mime: string;
  size: number;
  hash: string;
  width: number;
  height: number;
  aspect: number;
  status: string;
  created: Date;
  updated: Date;
};
```

## Implementation Summary
REST API PATCH endpoint for updating image status values (INBOX, COLLECTION, ARCHIVE) with comprehensive validation, error handling, and proper HTTP response codes. Integrates with domain layer Collection.updateImage() method and follows existing API patterns.

## Technical Notes
- Added JSON parsing error middleware to server.ts for malformed request body handling
- Uses Object.prototype.hasOwnProperty.call() to avoid ESLint no-prototype-builtins warnings
- Maps domain ImageUpdateError exceptions to appropriate HTTP status codes (400/500)
- Returns complete ImageMetadata object with updated timestamp reflecting modification time
- Validates UUID v4 format for image IDs and ensures status values are from allowed enum
- Maintains existing error response format: {"message": "Error description"}
- Database corruption testing uses corruptCollectionDB() utility instead of sinon stubbing