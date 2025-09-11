# Domain Module

## Collection Management
Complete CRUD operations for isolated image collections with comprehensive error handling and validation.

## Exports
```typescript
export { Collection } from './src/collection';
export type * from './types';
```

### Architecture
- **Self-contained collections**: Each collection has its own directory and SQLite database
- **Dynamic discovery**: Collections found by filesystem scan, no global registry required
- **Atomic operations**: Database and directory creation with automatic cleanup on failure
- **Type-safe errors**: Specific error types for all failure scenarios

### Collection Structure
```text
private/collections/
├── collection-name-1/
│   ├── collection.db        # SQLite database
│   └── images/
│       ├── original/        # UUID-named files with original extensions  
│       └── thumbnails/      # 400px web-optimized thumbnails
└── collection-name-2/
    ├── collection.db
    └── images/...
```

### Database Schema
```sql
CREATE TABLE images (
  id TEXT PRIMARY KEY,           -- UUID for filename
  collection TEXT NOT NULL,      -- parent collection name
  name TEXT NOT NULL,            -- preserved original filename
  extension TEXT NOT NULL,       -- original file extension
  mime TEXT NOT NULL,           -- content type for serving
  size INTEGER NOT NULL,        -- file size in bytes
  hash TEXT NOT NULL UNIQUE,    -- SHA256 for duplicate detection
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  aspect REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'INBOX', -- INBOX|COLLECTION|ARCHIVE
  created TEXT NOT NULL,        -- ISO timestamp
  updated TEXT NOT NULL         -- ISO timestamp
);

CREATE INDEX idx_images_status ON images(status);
CREATE INDEX idx_images_hash ON images(hash);
```

## Implementation Status
- ✅ **Collection CRUD**: Create, load, delete, list, clear operations complete
- ✅ **Image Addition**: Add images to collections with validation, duplicate detection, and thumbnail generation
- ✅ **Image Retrieval**: Get image metadata by ID with comprehensive validation and error handling
- ✅ **Image Status Updates**: Update individual image status (INBOX → COLLECTION → ARCHIVE) with validation
- ⏳ **Image Management**: Delete, bulk operations pending implementation

## Validation & Error Handling
- **Collection names**: Letters, numbers, hyphens only (`^[a-zA-Z0-9-]+$`)
- **Image filenames**: Alphanumeric and `()._-` characters only, max 256 chars
- **Image IDs**: UUID v4 format validation with security redaction for invalid IDs
- **Image status**: Must be one of INBOX, COLLECTION, ARCHIVE
- **Specific error types**: 
  - Collection: `CollectionCreateError`, `CollectionLoadError`, `CollectionDeleteError`, `CollectionListError`, `CollectionClearError`, `CollectionNotFoundError`
  - Images: `ImageAdditionError`, `ImageRetrievalError`, `ImageNotFoundError`, `ImageUpdateError`
- **Atomic cleanup**: Failed operations leave no partial artifacts

## Testing
### Test Setup
- Test isolation is achieved by stubbing the configuration before each test so that each test has it's own temporary collections directory
- All stubs and fixtures are automatically cleared up after each tests
- Hooks are implemented in `domain/tests/acceptance/setup.ts` alongside the test preparation and config

