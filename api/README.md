# API Module

## Collection Management HTTP Interface
REST API endpoints for collection operations with standardized HTTP responses and error handling.

## Exports
```typescript
export { routes } from './src/routes';
```

### Architecture
- **Express Router**: Modular route definitions with middleware support
- **Domain Integration**: Translates HTTP requests to domain operations
- **Standard HTTP**: RESTful endpoints with appropriate status codes
- **Error Translation**: Domain exceptions mapped to HTTP error responses

### Endpoints
```text
GET /api/health        # Health check endpoint
GET /api/collections   # Retrieve list of collection names
```

### Response Format
- **Success**: JSON responses with appropriate 2xx status codes
- **Errors**: JSON error messages with appropriate 4xx/5xx status codes
- **Content-Type**: `application/json` for all responses

## Implementation Status
- ✅ **Health Check**: Basic health endpoint for service monitoring
- ✅ **Collections Retrieval**: List all available collections with error handling
- ⏳ **Collection CRUD**: Create, update, delete operations pending implementation
- ⏳ **Image Operations**: Image upload, retrieval, management endpoints pending implementation

### Collections Retrieval Details
The `GET /api/collections` endpoint:
- Returns an array of collection names as strings
- Status 200: Success with collection names array (empty array if no collections)
- Status 500: Internal server error with error message
- Uses domain layer `Collection.list()` method
- All acceptance tests passing (3 scenarios)

## Error Handling
- **HTTP Status Codes**: Standard RESTful status code usage
- **Error Messages**: Consistent error response format
- **Internal Errors**: 500 status with generic error messages to avoid information leakage
- **Domain Error Translation**: Domain exceptions mapped to appropriate HTTP responses

## Testing
### Test Setup
- Test isolation achieved through API model abstractions and domain fixtures
- Assertable response wrappers for HTTP response validation
- Integration tests execute against live HTTP endpoints
- Hooks implemented in `api/tests/acceptance/setup.ts`

### Forcing an Internal Error
FS operations are wrapped in `domain/src/fs-operations.ts`, request headers can be used to force fs operations to fail:
```ts
    const response = await api['/api/collections'].get({
        headers: { 'x-force-fs-error': 'Forced FS Error' }
    });
```