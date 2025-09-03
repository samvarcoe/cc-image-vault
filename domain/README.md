# Collections 

## Collection Isolation
- Each collection is completely self-contained within its directory
- Uses separate SQLite database per collection for clean isolation and testability
- No cross-collection operations except potential future image transfer functionality
- Collections can be easily backed up, restored, or used as test fixtures

### Collection Registry
Collections are discovered by scanning the collections directory on request, eliminating the need for a global registry database while maintaining flexibility.

### File Structure
```bash
private/
├── collection-id-1/
│   ├── collection.db
│   └── images/
│       ├── original/     # UUID-named files with original extensions
│       └── thumbnails/   # UUID-named, 400px web-optimized
└── collection-id-2/
    ├── collection.db
    └── images/
        ├── original/
        └── thumbnails/
```

## Database Schema (Per Collection)

```sql
CREATE TABLE images (
  id TEXT PRIMARY KEY,                                                              -- UUID for filename
  collection TEXT NOT NULL,                                                         -- id of parent collection
  name TEXT NOT NULL,                                                               -- preserved original filename
  hash TEXT UNIQUE NOT NULL,                                                        -- SHA256 for duplicate detection within collection
  status TEXT CHECK(status IN ('INBOX', 'COLLECTION', 'ARCHIVE')) DEFAULT 'INBOX',
  size INTEGER NOT NULL,                                                            -- file size in bytes
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  aspect REAL NOT NULL,
  extension TEXT NOT NULL,                                                          -- original file extension
  mime TEXT NOT NULL,                                                               -- for proper content serving
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status ON images(status);
CREATE INDEX idx_updated_at ON images(updated_at);
```

### Image Processing
- **Thumbnail Generation**: Created on upload, 400px web-optimized, preserving aspect ratio
- **Duplicate Detection**: Full SHA256 hash calculated on upload prevents duplicates within collection
- **File Naming**: UUID-based filenames with original names preserved in metadata
- **Upload Processing**: Asynchronous processing with file-based queue for persistence