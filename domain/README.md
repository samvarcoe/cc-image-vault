# Domain Module

## Business Logic Layer
Core business logic for image collection management providing comprehensive CRUD operations, validation, image processing, and data persistence with isolated collections and robust error handling.

## Exports
```typescript
export { Collection } from './src/collection';
export {
    CollectionCreateError,
    CollectionLoadError,
    CollectionDeleteError,
    CollectionListError,
    CollectionClearError,
    CollectionNotFoundError,
    ImageAdditionError,
    ImageRetrievalError,
    ImageUpdateError,
    ImageDeletionError,
    ImageNotFoundError,
    PendingImplementationError
} from './errors';
export type * from './types';
```

## Architecture Principles
- **Self-contained Collections**: Each collection has its own directory and SQLite database
- **Dynamic Discovery**: Collections found by filesystem scan, no global registry required
- **Atomic Operations**: Database and directory creation with automatic cleanup on failure
- **Type-safe Errors**: Specific error types for all failure scenarios with cause chaining
- **Validation Pipeline**: Multi-stage validation for all inputs with security focus
- **Immutable Interfaces**: Read-only data structures prevent accidental mutations

## File System Organization
```text
private/collections/
├── collection-name-1/
│   ├── collection.db        # SQLite database with images table
│   └── images/
│       ├── original/        # UUID-named files with original extensions
│       └── thumbnails/      # 400px web-optimized thumbnails (Sharp-generated)
└── collection-name-2/
    ├── collection.db
    └── images/
        ├── original/
        └── thumbnails/
```

## Database Schema
```sql
CREATE TABLE images (
  id TEXT PRIMARY KEY,           -- UUID v4 for filename
  collection TEXT NOT NULL,      -- parent collection name
  name TEXT NOT NULL,            -- preserved original filename
  extension TEXT NOT NULL,       -- original file extension (.jpg, .png, .webp)
  mime TEXT NOT NULL,           -- content type for HTTP serving
  size INTEGER NOT NULL,        -- file size in bytes
  hash TEXT NOT NULL UNIQUE,    -- SHA256 for duplicate detection
  width INTEGER NOT NULL,       -- image width in pixels
  height INTEGER NOT NULL,      -- image height in pixels
  aspect REAL NOT NULL,         -- width/height ratio
  status TEXT NOT NULL DEFAULT 'INBOX', -- INBOX|COLLECTION|ARCHIVE
  created TEXT NOT NULL,        -- ISO timestamp
  updated TEXT NOT NULL         -- ISO timestamp for status changes
);

CREATE INDEX idx_images_status ON images(status);
CREATE INDEX idx_images_hash ON images(hash);
```

## Current Implementation Status

### ✅ Complete Feature Coverage
**12 Total Features**: All business requirements implemented with full test coverage

### ✅ Fully Implemented Features

#### Collection Management
- **`Collection.create(name)`**: Create new collections with validation and atomic setup
- **`Collection.load(name)`**: Load existing collections with error handling
- **`Collection.delete(name)`**: Remove collections with complete cleanup
- **`Collection.list()`**: Discover all collections via filesystem scan
- **`Collection.clear()`**: Remove all collections (testing utility)

#### Image Operations
- **`collection.addImage(filePath)`**: Add images with comprehensive validation pipeline
- **`collection.getImage(imageId)`**: Retrieve image metadata with validation
- **`collection.updateImageStatus(imageId, status)`**: Change image status with validation
- **`collection.deleteImage(imageId)`**: Remove images with atomic file and database cleanup
- **`collection.getImages(options?)`**: List images with optional status filtering
- **`collection.getImageData(imageId)`**: Retrieve original image file data as Buffer
- **`collection.getThumbnailData(imageId)`**: Retrieve thumbnail image data as Buffer

### ⏳ Pending Implementation
- **Collection Metadata**: Update collection name and properties
- **Advanced Filtering**: Date ranges, size filters, format filters

## Validation & Security

### Collection Name Validation
- **Pattern**: `^[a-zA-Z0-9-]+$` (letters, numbers, hyphens only)
- **Purpose**: Filesystem safety and URL compatibility
- **Security**: Prevents path traversal and injection attacks

### Image Filename Security
- **Allowed Characters**: Alphanumeric and `()._-` only
- **Maximum Length**: 256 characters
- **XSS Prevention**: Blocks `javascript:`, `<script>`, `iframe`, and similar patterns
- **Path Safety**: No directory traversal characters allowed

### Image Processing Pipeline
1. **Format Validation**: Supports JPG/JPEG, PNG, WebP (JPEG normalized to JPG)
2. **File Existence**: Source file validation before processing
3. **Integrity Check**: Sharp-based validation detects corrupted images
4. **Duplicate Detection**: SHA256 hash prevents redundant storage per collection
5. **Metadata Extraction**: Width, height, aspect ratio, file size
6. **Thumbnail Generation**: 400px width preserving aspect ratio using Sharp
7. **Database Storage**: Atomic transaction with rollback on failure

### Data Access & Retrieval
- **Single Image Retrieval**: `getImage(imageId)` returns complete ImageMetadata
- **Batch Image Retrieval**: `getImages(options?)` with optional status filtering
- **Original File Access**: `getImageData(imageId)` returns full-resolution Buffer
- **Thumbnail Access**: `getThumbnailData(imageId)` returns optimized Buffer
- **Status Filtering**: Filter by INBOX, COLLECTION, or ARCHIVE status
- **Empty Collection Handling**: Returns empty arrays for collections with no images

## Error Handling Strategy

### Comprehensive Error Types
**Collection Errors:**
- `CollectionCreateError`: Collection creation failures
- `CollectionLoadError`: Collection loading failures (wraps `CollectionNotFoundError`)
- `CollectionDeleteError`: Collection deletion failures
- `CollectionListError`: Collection discovery failures
- `CollectionClearError`: Bulk collection removal failures
- `CollectionNotFoundError`: Specific not-found scenarios

**Image Errors:**
- `ImageAdditionError`: Image upload and processing failures
- `ImageRetrievalError`: Image metadata retrieval failures (wraps `ImageNotFoundError`)
- `ImageUpdateError`: Image status update failures
- `ImageNotFoundError`: Specific image not-found scenarios

### Error Context & Chaining
- **Cause Chaining**: All errors wrap underlying causes for debugging
- **Business Context**: Error messages focus on user scenarios, not technical details
- **Security Redaction**: Invalid UUIDs redacted to prevent information disclosure
- **Atomic Cleanup**: Failed operations leave no partial artifacts

## Image Status Management

### Status Workflow
```
INBOX → COLLECTION → ARCHIVE
  ↓         ↓          ↓
(new)   (curated)  (stored)
```

### Status Validation
- **Valid Values**: `INBOX`, `COLLECTION`, `ARCHIVE` only
- **Default Status**: All new images start as `INBOX`
- **Transition Rules**: Any status can transition to any other status
- **Timestamp Updates**: `updated` field modified on status changes

## Testing 

### Test Philosophy
- **Executable Specifications**: Gherkin scenarios mirror test implementations
- **Real System Testing**: Tests against actual SQLite and filesystem operations
- **Minimal Mocking**: Only filesystem operations mocked for error simulation
- **Test Isolation**: Each test gets its own temporary collections directory
- **Business Assertions**: Error messages provide user context

### Test Architecture
- **DirectoryFixtures**: Automatic test environment setup and cleanup
- **CollectionUtils**: Helper utilities for collection lifecycle in tests
- **ImageUtils**: Domain-specific assertions for image validation
- **Configuration Mocking**: Redirects operations to test directories
- **Error Simulation**: Sinon stubs for filesystem failure scenarios

### Test Data Strategy
- **Unique Names**: Each test uses unique collection names for parallel execution
- **Real Images**: Actual image fixtures with proper metadata and content
- **Complete Cleanup**: Automatic teardown prevents test pollution
- **State Verification**: Helper functions validate filesystem state after operations

## Performance Considerations
- **SQLite Transactions**: Atomic operations prevent partial state
- **Sharp Processing**: High-performance image processing and thumbnail generation
- **Lazy Loading**: Collections discovered on-demand, not pre-loaded
- **Index Strategy**: Database indexes on frequently queried columns
- **File Organization**: UUID-based naming prevents filesystem bottlenecks

