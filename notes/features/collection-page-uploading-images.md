# Feature Notes - Client Images Upload

## Summary
Adds an image upload feature to the collection page header, allowing users to upload multiple images to their collection's INBOX for curation. The feature includes a file browser dialog, batch processing with concurrency limits, progress indicators, and navigation warnings during upload.

## Executable Specification
Requirement File: `client/requirements/collection-page/uploading-images.feature`
Acceptance Test File: `client/tests/acceptance/specs/collection-page/uploading-images.spec.ts`

**Scenarios**
- User views Collection page header
- User opens upload dialog
- User submits images for upload
- User cancels file selection
- Upload completes successfully
- Upload fails partially
- Upload fails completely
- User attempts to navigate during upload
- User chooses to stay during upload
- User chooses to leave during upload
- User uploads large number of files
- User uploads invalid file type

**Testing Notes**
The test implementation follows full-system acceptance testing principles and leverages existing patterns:

1. **UI Model Extensions**: Added `uploadButton` to the Header class and created a new `UploadDialog` component with file input, cancel, and add buttons.

2. **File Upload Testing**: Uses Playwright's `setInputFiles()` method with the existing `getImageFixture()` utility to create test image buffers. Tests handle multiple file formats (JPG, PNG, WebP) and invalid file types.

3. **Full System Testing**: Tests interact with the real API endpoints and system behavior. Only mocks external systems or uses route interception for timing control (delays) and specific error scenarios that cannot be reliably reproduced otherwise.

4. **Spinner State Testing**: Tests verify the upload button spinner state using `data-loading` attribute rather than text changes, properly reflecting the visual loading indicator as specified in the requirements.

5. **Navigation Warning**: Tests browser beforeunload events using Playwright's dialog handlers to verify navigation warnings appear during active uploads and test both "stay" and "leave" user choices.

6. **Batch Processing**: Tests validate that large file uploads (15+ files) are handled correctly by the real system, validating the batching requirement of maximum 10 concurrent requests.

7. **Error Handling**: Tests both partial and complete upload failures using route interception only for error scenarios, ensuring error messages are displayed appropriately and the upload button returns to its normal state.

The tests are designed to fail initially due to pending implementation and will pass once the upload feature is implemented according to the specification. They provide comprehensive coverage while maintaining the integrity of full-system acceptance testing.