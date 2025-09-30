# Feature Notes - Client - Collection Page - Download Images

## Summary
Enables users to download images from their collection to their local filesystem. Single images download with their original filename via GET request, while multiple images download as a ZIP archive via POST request. The download button is located in the curation menu and follows the same loading state pattern as the upload feature.

## Executable Specification
Requirement File: `client/requirements/collection-page/downloading-images.feature`
Acceptance Test File: `client/tests/acceptance/specs/collection-page/downloading-images.spec.ts`

**Scenarios**
1. User views INBOX images with curate mode active
2. User views COLLECTION images with curate mode active
3. User views ARCHIVE images with curate mode active
4. User selects some images
5. User downloads a single image
6. User downloads multiple images
7. Download completes successfully
8. Download fails with API error

**Testing Notes**

### UI Model Enhancements
- Added `downloadButton` getter to `CurationMenu` component in `client/tests/ui-model/pages/collection.ts`
- Uses selector `[data-id="download-button"]`
- Leverages existing Element methods for state verification

### Test Implementation Strategy
- **Download Detection**: Uses Playwright's `page.waitForEvent('download')` to detect browser downloads without verifying file contents (API tests cover content validation)
- **Archive Naming**: Verifies ZIP filename format exactly as `[collection name]-[status]-images.zip` using `download.suggestedFilename()`
- **Loading States**: Uses `data-loading` attribute pattern consistent with upload feature:
  - `shouldHaveAttribute('data-loading', 'true')` for spinner visible
  - `shouldHaveAttribute('data-loading', 'false')` for spinner removed
- **Button States**: Tests enable/disable states based on image selection
- **Error Handling**: Mocks API 500 error using `page.route()` to test error display in curation menu
- **Cross-Status Testing**: Validates button visibility across all three status views (INBOX, COLLECTION, ARCHIVE)

### Fixture Usage
- Uses existing `download-test` collection fixture with mixed status images:
  - 2 INBOX images
  - 3 COLLECTION images
  - 2 ARCHIVE images
- Leverages `createCollectionFixture()` and `setupCollectionFixture()` patterns

### Key Test Patterns
- Download monitoring via Playwright's download event API
- Exact filename validation for single images (original name) and multiple images (archive format)
- Network request mocking for error scenarios
- Consistent with existing patterns from upload and delete features

## Interfaces
```ts
// Model State
interface CollectionPageData {
    // ... existing fields
    download: {
        isDownloading: boolean;
    };
}

// Model Methods
isDownloading(): boolean
setDownloading(isDownloading: boolean): void

// Controller Methods (private)
handleDownloadImages(): Promise<void>
downloadSingleImage(collectionName: string, imageId: string): Promise<void>
downloadMultipleImages(collectionName: string, imageIds: string[], archiveName: string): Promise<void>
```

## Implementation Summary
Client-side download functionality that triggers native browser downloads for single images or ZIP archives for multiple images. Single image downloads extract the filename from the API's Content-Disposition header, while batch downloads construct archive names in the format `{collectionName}-{status}-images.zip`. Download state is tracked in the model with loading indicators shown during the download process. The implementation uses fetch + blob + programmatic link click pattern for reliable cross-browser downloads without artificial delays.

## Technical Notes
- **Filename Extraction**: Single image downloads parse the Content-Disposition header using regex (`/filename="?([^"]+)"?/`) to extract the original filename with extension
- **Download Pattern**: Uses `fetch() → blob() → createObjectURL() → programmatic <a> click → revokeObjectURL()` for memory-efficient downloads
- **No Artificial Delays**: Production code has zero artificial delays; test timing is controlled via `page.route()` interception to observe loading states during network requests
- **API Bug Fix**: Fixed API endpoint to include file extension in Content-Disposition header (`${metadata.name}.${metadata.extension}` instead of just `${metadata.name}`)
- **Error Handling**: Download errors display "Unable to download image(s)" in the curation menu error area, consistent with other bulk operations
- **Loading State**: Uses `data-loading` attribute pattern matching Upload button implementation for visual consistency