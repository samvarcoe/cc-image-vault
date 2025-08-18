# Feature Notes - Collections API Endpoint

## Summary
REST API endpoints for managing collections via HTTP, providing CRUD operations for collection lifecycle management with proper validation, error handling, and filesystem integration.

## Executable Specification
**Requirement File:** `requirements/api/collections-api-endpoint.feature`
**Acceptance Test File:** `tests/api/specs/collections-api-endpoint.spec.ts`

**Scenarios**
1. Collection listing with existing collections
2. Collection listing with no collections  
3. Collection creation with valid ID
4. Collection creation with duplicate ID
5. Collection creation with invalid ID
6. Collection retrieval with existing collection
7. Collection retrieval with non-existent collection
8. Collection deletion with existing collection
9. Collection deletion with non-existent collection
10. Collection creation with insufficient permissions
11. Collection listing with filesystem access issues

**Testing Notes**
- **Sequential Execution**: Tests run with 1 worker due to shared `./private/` filesystem state
- **Real Filesystem Operations**: Tests create/delete actual collection directories in `./private/`
- **No Mocking**: Tests exercise the complete stack including filesystem permissions
- **Server Integration**: Tests assume server running on `localhost:3000` (configurable)

**Utilities Added/Changed:**
- `CollectionsAPI` - API client extending APIModel with typed collections endpoints
- `CollectionsDirectoryFixtures` - Manages `./private/` directory state with realistic collections
- Updated `tests/api/playwright.config.ts` - Added `workers: 1` for sequential execution
- Added `api:tests` npm script for running API test suite

**Key Implementation Points:**
- Tests verify actual filesystem changes (directory creation/deletion)
- Permission error testing uses real filesystem permission changes
- Collection validation covers comprehensive invalid ID scenarios
- Error responses verify both HTTP status codes and error message content
- Fixtures provide realistic test data with proper cleanup

## Interfaces
```ts
// Request/Response types for Collections API
interface CreateCollectionRequest {
  id: string;
}

interface CollectionResponse {
  id: string;
}

interface ErrorResponse {
  error: string;
  message: string;
}

// Testing utilities interface
interface DirectoryState {
  privateDir: string;
  collectionDirs: string[];
}
```

## Implementation Summary
REST API endpoints for collections management providing CRUD operations with proper validation, error handling, and filesystem integration. All 11 test scenarios pass, covering success paths, error cases, and permission handling.

## Technical Notes
- **Server**: Express.js server with Helmet security middleware running on port 3000
- **Service Layer**: `CollectionsService` provides business logic and filesystem abstraction 
- **Domain Integration**: Uses existing `Collection` domain class for directory/database operations
- **Error Handling**: Structured error responses with appropriate HTTP status codes (400, 404, 409, 500)
- **Input Validation**: Filesystem-safe collection ID validation preventing path traversal attacks
- **Test Infrastructure**: Fixed APIModel to include Content-Type headers and added per-test cleanup for reliable test isolation
- **Key Fix**: Test APIModel required Content-Type: application/json header for Express body parsing