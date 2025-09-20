# Feature Notes - Collections Creation

## Summary
API endpoint for creating new collections with proper validation and error handling.

## Executable Specification
Requirement File: `/workspace/projects/image-vault/api/requirements/collections/creation.feature`
Acceptance Test File: `/workspace/projects/image-vault/api/tests/acceptance/specs/collections/creation.spec.ts`

**Scenarios**
- Client creates collection with valid name
- Client attempts to create collection with duplicate name
- Client attempts to create collection with invalid name
- Client attempts to create collection with name exceeding maximum length
- Client sends request without name field
- Client sends request with empty name
- Client sends request without body
- Internal error occurs when creating collection

**Testing Notes**
The test implementation follows the existing patterns from the Collections Retrieval tests. Key points:
- Extended CollectionsAPI model with POST endpoint and CreateCollectionRequest type
- Tests verify proper HTTP status codes and error messages
- Uses Collection.create() and Collection.list() from domain layer for setup and verification
- Implements x-force-fs-error header pattern for internal error testing with sinon stub
- All tests currently fail with 404 (endpoint not implemented) as expected in TDD approach
- Validation rules: names must contain only alphanumeric characters and hyphens, max 256 chars