# Image Vault

## Problem Statement
Users have accumulated large collections of images across multiple directories that contain many duplicates and unwanted or low quality items. Currently, there's no efficient way to sort through these images to identify which are worth keeping and it's difficult to find images the user is interested in. Organising the images is an awkward and time-consuming manual process and as a result, the images are rarely viewed, negating the point of collecting or storing them.

## Solution Overview
A simple application that lets users upload their images and sort them into "collections". Bulk editing functionality is provided to quickly classify images and archive/restore/delete them as desired. Functionality for viewing and exploring the collections is also provided to allow users to use and enjoy them.

## Pages

### Navigation Structure
```bash
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
- Displays images according to their status
- Primary interface for viewing curated images

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

## Technical Implementation

### Technology Stack
- **Runtime**: Node.js 24
- **Framework**: Express server
- **Architecture**: MVC pattern utilizing vanilla JavaScript and string template literals for HTML components
- **Rendering**: Server-side initial rendering using same patterns as browser
- **Database**: SQLite per collection
- **Language**: TypeScript

### File Processing ✅
- **Supported Formats**: JPG, JPEG, WebP, PNG (jpeg normalized to jpg)
- **File Size Limit**: 25MB maximum per image
- **Collection Limit**: No maximum images per collection
- **Validation**: Format, integrity, filename safety, and duplicate detection
- **Security**: XSS-safe filename validation, 256-char limit
- **Error Handling**: Comprehensive error types with atomic cleanup

### Upload Workflow ✅
1. Client drag-and-drop multiple files (including directory contents)
2. Client-side validation for format and size
3. Server receives upload and validates (format, integrity, safety, duplicates)
4. Server calculates SHA256 hash for duplicate detection
5. Server generates 400px thumbnail preserving aspect ratio using Sharp
6. Server stores original and thumbnail in collection directory structure
7. Server stores complete metadata in collection's SQLite database
8. Returns success/error response with specific error types

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