# Feature Notes - API Images Batch Download

## Summary
HTTP API endpoint for downloading multiple images as a ZIP archive with original filenames and automatic handling of duplicate names through indexed suffixes ordered by creation time.

## Executable Specification
Requirement File: `api/requirements/images/batch-download.feature`
Acceptance Test File: `api/tests/acceptance/specs/images/batch-download.spec.ts`

**Scenarios**
- Client downloads multiple images with unique filenames
- Client downloads multiple images with duplicate filenames
- Client attempts to download with duplicate image IDs in request
- Client attempts to download from a non-existent collection
- Client attempts to download with non-existent image ID
- Client attempts to download with empty imageIds array
- Client attempts to download with invalid image ID format
- Client attempts to download with invalid archive name containing special characters
- Client attempts to download with missing archive name
- Client attempts to download with missing request body
- Client attempts to download with missing imageIds field
- Client attempts to download with malformed request body
- Internal error occurs when creating the download archive

**Testing Notes**

### Test Implementation Approach
- **API Model Extension**: Added POST endpoint `/api/images/:collectionId/download` to `CollectionsAPI` class for batch download functionality
- **Request Body Type**: Inline type definition `{ imageIds: string[], archiveName: string }` for request payload
- **Response Type**: `ArrayBuffer` for ZIP binary content
- **New ZIP Validation**: Created `shouldHaveZipContent(expectedFiles)` assertion method for validating ZIP archive structure and contents
- **Dependencies Added**: `archiver` (v7.0.1) for implementation, `adm-zip` (v0.5.16) for testing ZIP extraction and validation
- **Time Control**: Used `@sinonjs/fake-timers` to control creation timestamps for duplicate filename ordering tests

### Key Testing Utilities Added
- **`shouldHaveZipContent(expectedFiles: { name: string, content: Buffer }[])`**:
  - Extracts and validates ZIP archive contents
  - Verifies file count matches expected
  - Validates each file name and binary content exactly matches expected
  - Uses `adm-zip` library for ZIP extraction
  - Logs each validated file with size for debugging

### Duplicate Filename Handling
- Test creates three images with identical base names at different times using `useFakeTimers()`
- Uses `clock.tick(1000)` between image additions to create distinct creation timestamps
- Validates indexed suffixes (_001, _002, _003) are applied in creation time order (oldest first)
- Suffix format: three digits, zero-padded, inserted before file extension

### Request Deduplication
- Test sends same imageId multiple times in request array
- Validates each unique image appears exactly once in resulting archive
- Ensures no duplicate processing or multiple entries

### Validation Error Tests
- **Archive Name Format**: Only alphanumeric characters, dashes, and underscores allowed (no dots, special chars)
- **Empty ImageIds Array**: Returns 400 with message "imageIds array cannot be empty"
- **Invalid UUID Format**: Returns 400 with message "Invalid image ID format"
- **Non-existent Image**: Returns 404 with message "Image not found"
- **Non-existent Collection**: Returns 404 with message "Collection not found"
- **Missing Request Body**: Returns 400 with message "Request body is required"
- **Missing Archive Name Field**: Returns 400 with message "archive name field is required"
- **Missing imageIds Field**: Returns 400 with message "imageIds field is required"
- **Malformed JSON**: Returns 400 with message "Malformed request body" (tested with raw fetch)

### Error Testing Strategy
- **Internal Error Simulation**: Uses `corruptCollectionDB(collection)` utility to corrupt SQLite database
- Database corruption causes image retrieval to fail during archive creation
- Returns 500 status with message "An error occurred whilst downloading images"
- Validates error handling at archive creation stage (not just validation)

### Collection/Image Setup Pattern
Tests follow established patterns:
1. Create collection via `Collection.create(name)`
2. Generate image fixtures via `getImageFixture(options)` with actual buffer data
3. Add images to collection via `collection.addImage(filePath)`
4. Use returned image metadata IDs for API calls
5. Validate ZIP structure, headers, and binary content
6. Automatic cleanup via existing `mochaHooks`

### Content Validation
- **Binary Content**: Validates exact ZIP binary structure with proper archive format
- **Headers Validation**:
  - Content-Disposition: `attachment; filename="archiveName.zip"` (extension auto-appended)
  - Content-Type: `application/zip`
  - Content-Length: Archive size in bytes
- **Archive Contents**: Each file validated for correct name (including indexed suffixes) and exact binary content match
- **No Caching Headers**: Downloads are one-time actions, no Cache-Control headers needed

### Malformed JSON Test Note
- Test uses raw `fetch()` instead of API model since the model automatically handles JSON serialization
- Sends intentionally malformed JSON string to test middleware error handling
- Validates both status code (400) and error message
- Currently passes when endpoint doesn't exist (404) - will properly fail once route is implemented

### Technical Implementation Notes
- Endpoint accepts POST with JSON body (not multipart like upload)
- Archive name validation prevents filesystem issues and injection attacks
- All validation errors return 400 to fail fast before expensive archive creation
- Images can be downloaded regardless of status (INBOX/COLLECTION/ARCHIVE)
- Deduplication happens before archive creation for efficiency
- Indexed suffixes ensure no filename collisions in archive

This executable specification implements 13 comprehensive test scenarios covering all acceptance criteria, following TDD principles with tests ready for implementation.

## Implementation

**Status**: ✅ Complete

### API Layer (`api/src/routes.ts`)

Added POST `/api/images/:collectionId/download` endpoint after the individual download route:

**Request Processing**:
1. Validates request body existence and required fields (`imageIds`, `archiveName`)
2. Validates `imageIds` is non-empty array
3. Validates `archiveName` format using regex `/^[a-zA-Z0-9_-]+$/`
4. Validates all image IDs match UUID v4 format
5. Loads collection (handles CollectionNotFoundError)
6. Deduplicates image IDs using `Array.from(new Set(imageIds))`
7. Retrieves all image metadata (handles ImageNotFoundError)

**Archive Creation**:
1. Sorts images by `created` timestamp (ascending) for consistent duplicate ordering
2. Groups images by full filename (`${name}.${extension}`)
3. Creates `archiver` instance with maximum compression (level 9)
4. Buffers archive data using event listener on 'data' event
5. For each filename group:
   - Single file: uses original filename
   - Multiple files: applies `_001`, `_002`, `_003` suffixes (zero-padded, 3 digits)
6. Finalizes archive and combines chunks into single buffer
7. Sets response headers:
   - `Content-Type: application/zip`
   - `Content-Disposition: attachment; filename="${archiveName}.zip"`
   - `Content-Length: ${buffer.length}`
8. Returns 200 with ZIP buffer

**Error Handling**:
- 400: Validation errors (missing fields, invalid formats, empty arrays)
- 404: Collection or image not found
- 500: Archive creation errors with message "An error occurred whilst downloading images"

**Key Design Decisions**:
- Buffer-based approach (not streaming) to enable accurate Content-Length header
- Deduplication before metadata retrieval for efficiency
- Sort by creation time ensures deterministic suffix ordering
- Maximum compression balances file size vs processing time
- UUID v4 validation matches pattern from other endpoints

### Test Updates (`api/tests/acceptance/specs/images/batch-download.spec.ts`)

**Duplicate Filename Test Enhancement**:
- Fixed test setup to create actual duplicate filenames
- Uses temporary directory with `randomUUID()` for isolation
- Creates three different images with same filename 'photo.jpeg'
- Writes each fixture buffer to same temporary path before adding to collection
- Ensures images have distinct content but identical original filenames
- Properly tests indexed suffix ordering (_001, _002, _003) based on creation timestamps

### Technical Notes

**Dependencies**:
- `archiver@7.0.1`: Production dependency for ZIP creation
- `adm-zip@0.5.16`: Development dependency for test assertions

**Memory Considerations**:
- Archives buffered in memory before sending
- Suitable for typical image batch sizes (< 100MB archives)
- For larger archives, would need streaming approach with chunked transfer encoding

**Integration Points**:
- Uses existing domain methods: `Collection.load()`, `collection.getImage()`, `collection.getImageData()`
- Follows established error handling patterns from other routes
- Consistent with existing endpoint validation strategies