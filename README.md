# Image Vault

## Problem Statement
Users have accumulated large collections of images across multiple directories that contain many duplicates and unwanted or low quality items. Currently, there's no efficient way to sort through these images to identify which are worth keeping and it's difficult to find images the user is interested in. Organising the images is an awkward and time-consuming manual process and as a result, the images are rarely viewed, negating the point of collecting or storing them.

## Solution Overview
A simple application that lets users upload their images and sort them into "collections". Bulk editing functionality is provided to quickly classify images and archive/restore/delete them as desired. Functionality for viewing and exploring the collections is also provided to allow users to use and enjoy them.

## Project Structure
image-vault/
├── docs/                              # Implementation plans and technical notes
├── requirements/                      # Product requirements and specifications
│   ├── features/                      # Gherkin feature files defining system behavior
│   └── guidelines/                    # Requirements documentation standards
├── public/                            # Static files served
├── src/                               # Source code for the implementation
└── tests/                             # Test infrastructure
    ├── acceptance/                    # End-to-end Playwright tests
    │   ├── playwright.config.ts       # Playwright configuration
    │   ├── specs/                     # Test specifications (1:1 with Gherkin scenarios)
    │   ├── fixtures/                  # Test data collections
    │   │   └── collections/           # Swappable photo collections for testing
    │   └── utils/                     # Test utilities
    └── scripts/                       # Test data generation scripts
```

## Architecture Overview

### File Structure
```
collections/
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

### Collection Isolation
- Each collection is completely self-contained within its directory
- Uses separate SQLite database per collection for clean isolation and testability
- No cross-collection operations except potential future image transfer functionality
- Collections can be easily backed up, restored, or used as test fixtures

### Collection Registry
Collections are discovered by scanning the collections directory on request, eliminating the need for a global registry database while maintaining flexibility.

## Image Management

### Image Status Workflow
Images follow a clear status progression:
- **Upload → INBOX** (always)
- **INBOX → COLLECTION** (user approval)
- **INBOX → ARCHIVE** (user rejection)
- **COLLECTION → ARCHIVE** (user changes mind)
- **ARCHIVE → COLLECTION** (user restores)
- **ARCHIVE → DELETE** (permanent removal)

### Image Processing
- **Thumbnail Generation**: Created on upload, 400px web-optimized, preserving aspect ratio
- **Duplicate Detection**: Full SHA256 hash calculated on upload prevents duplicates within collection
- **File Naming**: UUID-based filenames with original names preserved in metadata
- **Upload Processing**: Asynchronous processing with file-based queue for persistence

### Image Meta-Data Schema
```typescript
{
  "id": string,                                 // UUID used for filename
  "originalName": string,                       // preserved original filename
  "fileHash": string,                           // SHA256 for duplicate detection
  "status": "COLLECTION" | "INBOX" | "ARCHIVE",
  "size": number,                               // file size in bytes
  "dimensions": {
    "width": number,
    "height": number
  },
  "aspectRatio": number,
  "extension": string,                          // original file extension
  "mimeType": string,                           // for proper content serving
  "createdAt": timestamp,
  "updatedAt": timestamp
}
```

## Pages

### Navigation Structure
```
/ 
├── /collection/:id
│   ├── /collection/:id/inbox
│   ├── /collection/:id/archive
│   └── /collection/:id/slideshow
└── /settings
```

### Home Page (/)
- Displays the names of current collections with links to main collection pages
- Shows collection statistics (inbox count, collection count, archive count)
- User can create new collections from here

### Collection Page (/collection/:id)
- The main page for the collection
- Displays images with "COLLECTION" status
- Primary interface for viewing curated images

### Inbox Page (/collection/:id/inbox)
- Where images are initially placed before user decision
- Displays images with "INBOX" status
- Primary sorting and classification interface

### Archive Page (/collection/:id/archive)
- Where photos go when rejected from collection but not yet deleted
- Displays images with "ARCHIVE" status
- Allows restoration to collection or permanent deletion

### Slideshow Page (/collection/:id/slideshow)
- Cycles through images with "COLLECTION" status
- Implementation details TBD for future iteration

### Settings Page (/settings)
- Allows users to adjust product parameters
- Configuration options TBD for future iteration

## API Design

### Collections
```typescript
GET    /api/collections                   // Returns list of all collections
POST   /api/collections                   // Creates new collection
GET    /api/collections/:id               // Returns collection metadata  
DELETE /api/collections/:id               // Deletes entire collection
PATCH  /api/collections/:id               // Updates collection metadata
```

### Images
```typescript
GET    /api/collections/:id/images                    // Query params: ?status=INBOX&limit=50&offset=0
POST   /api/collections/:id/images                    // Upload image(s) - processes synchronously for MVP
GET    /api/images/:collectionId/:imageId             // Serves original image file
GET    /api/images/:collectionId/:imageId/thumbnail   // Serves thumbnail image
PATCH  /api/images/:collectionId/:imageId             // Updates single image metadata
DELETE /api/images/:collectionId/:imageId             // Deletes single image
```

### Bulk Operations
```typescript
PATCH  /api/collections/:id/images/bulk   // Bulk status updates
DELETE /api/collections/:id/images/bulk   // Bulk delete operations

// Request body format:
{
  "imageIds": ["uuid1", "uuid2", "uuid3"],
  "updates": { "status": "COLLECTION" }
}
```

## Database Schema (Per Collection)

```sql
CREATE TABLE images (
  id TEXT PRIMARY KEY,                                                                  -- UUID for filename
  original_name TEXT NOT NULL,                                                          -- preserved original filename
  file_hash TEXT UNIQUE NOT NULL,                                                       -- SHA256 for duplicate detection within collection
  status TEXT CHECK(status IN ('INBOX', 'COLLECTION', 'ARCHIVE')) DEFAULT 'INBOX',
  size INTEGER NOT NULL,                                                                -- file size in bytes
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  aspect_ratio REAL NOT NULL,
  extension TEXT NOT NULL,                                                               -- original file extension
  mime_type TEXT NOT NULL,                                                               -- for proper content serving
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status ON images(status);
CREATE INDEX idx_updated_at ON images(updated_at);

-- Future extensibility tables
CREATE TABLE image_tags (
  image_id TEXT,
  tag TEXT,
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
);
```

## Technical Implementation

### Technology Stack
- **Runtime**: Node.js 24
- **Framework**: Express server
- **Architecture**: MVC pattern utilizing vanilla JavaScript and string template literals for HTML components
- **Rendering**: Server-side initial rendering using same patterns as browser
- **Database**: SQLite per collection
- **Language**: TypeScript

### File Processing
- **Supported Formats**: JPG, JPEG, WebP, PNG
- **File Size Limit**: 25MB maximum per image
- **Collection Limit**: No maximum images per collection
- **Validation**: Client and server-side format and corruption validation
- **Error Handling**: Status codes for failed uploads with specific error types

### Upload Workflow
1. Client drag-and-drop multiple files (including directory contents)
2. Client-side validation for format and size
3. Server receives upload and validates
4. Returns success/error response
5. Files placed in queue for processing
6. Server calculates SHA256 hash for duplicate detection
7. Server generates 400px thumbnail preserving aspect ratio
8. Server moves files to collection directory
9. Server stores metadata in collection's SQLite database

### Future Extensibility Considerations
- Database schema includes tables for future image tagging functionality
- API design accommodates future tagging, sorting and ranking features
- File structure supports additional image processing operations
- Bulk operations API pattern can be extended for future batch operations

## Success Metrics (MVP)
- Users can successfully create collections and upload images
- Duplicate detection prevents redundant storage within collections
- Users can efficiently sort images between INBOX/COLLECTION/ARCHIVE statuses
- Bulk operations enable quick classification of multiple images
- Collections provide organized viewing experience for curated images