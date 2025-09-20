# API Module

## HTTP Interface Layer
REST API endpoints providing HTTP access to domain operations with comprehensive error handling, content negotiation, and proper caching strategies.

## Exports (index.ts)
```typescript
export { routes } from './src/routes';
```

## Architecture
- **Express Router**: Modular route definitions with middleware support
- **Domain Integration**: Translates HTTP requests to domain operations and vice versa
- **Standard HTTP**: RESTful endpoints with appropriate status codes and headers
- **Error Translation**: Domain exceptions mapped to HTTP error responses
- **Content Negotiation**: Proper MIME types and caching headers for different content types

## Response Format Standards
- **Success**: JSON responses with appropriate 2xx status codes
- **Errors**: JSON error messages with appropriate 4xx/5xx status codes
- **Content-Type**: `application/json` for API responses, proper MIME types for images
- **Caching**: Immutable content headers for images (`Cache-Control: public, max-age=31536000, immutable`)

## Error Handling Strategy
- **HTTP Status Codes**: Standard RESTful status code usage
- **Domain Error Translation**: Comprehensive mapping of domain exceptions to HTTP responses
- **Collection Not Found**: 404 status for missing collections
- **Internal Errors**: 500 status with generic messages (no information leakage)
- **Implementation Pending**: 501 status during development phase

### Error Response Format
```json
{
  "message": "Error message"
}
```

## Content Serving Features
- **Binary Content**: Efficient ArrayBuffer handling for image data
- **Content Headers**: Proper Content-Type, Content-Length, and Cache-Control
- **Path Security**: URL parameter validation and sanitization
- **File System Integration**: Direct integration with domain file structure

##  Endpoints

### Health Check
**`GET /api/health`**
- Simple health check endpoint returning system status
- Status 200: Success with `{"status": "ok"}`
- No error conditions - always returns 200
- Used for monitoring and load balancer health checks

### Collections Retrieval
**`GET /api/collections`**
- Returns array of collection names as strings
- Status 200: Success with collection names (empty array if none exist)
- Status 500: Internal server error with message "An error occurred whilst retrieving the Collections list"
- Uses domain `Collection.list()` method

### Collection Creation
**`POST /api/collections`**
- Creates new collection with provided name in request body
- Expects JSON body: `{"name": "collection-name"}`
- Status 201: Success (no response body)
- Status 400: Bad request for invalid names, missing name, or malformed requests
  - "Collection name is required" (missing or empty name)
  - "Request body is required" (no body)
  - `"[name]" is not a valid Collection name` (invalid format/length)
- Status 409: Conflict when collection already exists
  - `There is already a Collection with name: "[name]"`
- Status 500: Internal server error with message "An error occurred whilst creating the Collection"
- Uses domain `Collection.create()` method

### Image Serving
**`GET /api/images/:collectionId/:imageId`**
- Serves original image files with proper MIME types
- Content-Length header for exact file size
- Cache-Control headers for optimal CDN/browser caching
- Status 200: Success with binary image data
- Status 400: Invalid image ID format ("Invalid image ID format")
- Status 404: Collection not found ("Collection not found") or Image not found ("Image not found")
- Status 500: Internal server error with message "An error occurred whilst serving the image"

**`GET /api/images/:collectionId/:imageId/thumbnail`**
- Serves 400px thumbnails preserving aspect ratio
- Same caching and content headers as originals
- Status 400: Invalid image ID format ("Invalid image ID format")
- Status 404: Collection not found ("Collection not found") or Image not found ("Image not found")
- Status 500: Internal server error with message "An error occurred whilst serving the thumbnail"
- Thumbnail-specific validation with content differentiation

## Testing Infrastructure

### Test Architecture
- **API Model Extensions**: Enhanced `CollectionsAPI` class with image serving capabilities
- **Binary Response Handling**: `AssertableResponse` with ArrayBuffer support
- **Real Image Fixtures**: Actual image files for realistic testing scenarios
- **Content Validation**: Exact buffer matching and MIME type verification

### Key Testing Utilities
- `shouldHaveImageContent(expectedBuffer)`: Binary content validation with exact buffer matching
- `shouldHaveContentLength(expectedSize)`: Content-Length header validation with size verification
- `shouldHaveCacheHeaders()`: Cache-Control header validation for immutable content
- `shouldHaveImageMimeType(expectedMime?)`: Content-Type header validation for image MIME types
- `shouldHaveBodyWithProperty(key, value?)`: JSON response property validation
- `shouldHaveStatus(statusCode)`: HTTP status code verification

### Test Setup
- Test isolation through API model abstractions and domain fixtures
- Integration tests against live HTTP endpoints
- Comprehensive error scenario coverage
- Hooks in `api/tests/acceptance/setup.ts`

### Error Simulation
Filesystem operations can be forced to fail using test headers for error scenario testing:
```typescript
const response = await api['/api/collections'].get({
    headers: { 'x-force-fs-error': 'Forced FS Error' }
});
```
This triggers filesystem error conditions in the domain layer for testing error handling paths.

## Security Considerations
- **Parameter Validation**: URL parameters validated for format and safety
- **Error Information**: Generic error messages prevent information disclosure
- **File Access**: Controlled access through domain layer validation
- **Cache Headers**: Immutable content reduces unnecessary requests