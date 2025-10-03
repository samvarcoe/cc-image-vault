Feature: API - Images - Batch Download
    User Story: As a client application, I want to download multiple images as a ZIP archive with original filenames via HTTP API, so that users can efficiently save multiple images to their local filesystem.

    Acceptance Criteria:
      - AC1: API provides POST endpoint to download multiple images by collection ID and array of image IDs
      - AC2: API accepts JSON request body with imageIds array and archiveName string
      - AC3: API returns ZIP archive with Content-Disposition header set to attachment
      - AC4: API includes archive name in Content-Disposition header with .zip extension
      - AC5: API uses original filenames from metadata for files in the archive
      - AC6: API handles duplicate filenames: first occurrence uses original name, subsequent occurrences get indexed suffix (_001, _002, etc.)
      - AC7: Images are processed in request array order for optimal streaming performance
      - AC8: API validates archive name contains only alphanumeric characters, dashes, and underscores
      - AC9: API validates imageIds array is not empty
      - AC10: API validates all image IDs have valid UUID v4 format
      - AC11: API validates all image IDs exist in the collection
      - AC12: API validates collection existence before processing download
      - AC13: API returns appropriate HTTP status codes and error messages
      - AC14: API sets correct Content-Type (application/zip) header and streams response using chunked transfer encoding
      - AC15: Downloaded images in archive are identical to original uploaded files

    Notes:
      - Indexed suffix format: _001, _002, _003 (three digits, zero-padded, starting from 1)
      - Suffix is inserted before the file extension: photo.jpg (first), photo_001.jpg (second), photo_002.jpg (third)
      - First occurrence of a filename uses the original name with no suffix
      - Request array order determines which image is "first" for duplicate handling
      - Archive name validation prevents filesystem issues and injection attacks
      - All validation errors return 400 status to fail fast before archive creation
      - Images can be downloaded regardless of their status (INBOX/COLLECTION/ARCHIVE)
      - ZIP archive is streamed as it's created, enabling immediate download start in the browser
      - Images are processed sequentially to minimize delay before streaming begins
      - Chunked transfer encoding is used automatically when no Content-Length header is set

    Scenario: Client downloads multiple images with unique filenames
        Given a collection exists with multiple images having unique original filenames
        When the client requests POST /api/images/:collectionId/download with valid imageIds array and archiveName
        Then the API returns 200 status code
        And the API returns a ZIP archive file
        And the API sets Content-Disposition header to attachment with archive named
        And the API sets Content-Type header to application/zip
        And the API streams the ZIP archive using chunked transfer encoding
        And the ZIP archive contains all requested images with their original filenames

    Scenario: Client downloads multiple images with duplicate filenames
        Given a collection exists with duplicated image names
        When the client requests POST /api/images/:collectionId/download with all three imageIds
        Then the API returns 200 status code
        And the first occurrence uses the original filename
        And subsequent occurrences have indexed suffixes (_001, _002, etc.)
        And the order follows the request array order

    Scenario: Client attempts to download with duplicate image IDs in request
        Given a collection exists with images
        When the client requests POST /api/images/:collectionId/download with the same imageId appearing multiple times
        Then the API returns 200 status code
        And each image only appears once in the archive

    Scenario: Client attempts to download from a non-existent collection
        Given no collection exists with the specified collection ID
        When the client requests POST /api/images/:collectionId/download
        Then the API returns 404 status code
        And the API returns error message indicating collection not found

    Scenario: Client attempts to download with non-existent image ID
        Given a collection exists but does not contain one of the specified image IDs
        When the client requests POST /api/images/:collectionId/download with valid UUID formats but non-existent imageId
        Then the API returns 404 status code
        And the API returns error message indicating image not found

    Scenario: Client attempts to download with empty imageIds array
        Given a collection exists
        When the client requests POST /api/images/:collectionId/download with an empty imageIds array
        Then the API returns 400 status code
        And the API returns error message indicating imageIds array cannot be empty

    Scenario: Client attempts to download with invalid image ID format
        Given a collection exists
        When the client requests POST /api/images/:collectionId/download with an imageId that is not a valid UUID v4 format
        Then the API returns 400 status code
        And the API returns error message indicating invalid image ID format

    Scenario: Client attempts to download with invalid archive name containing special characters
        Given a collection exists with images
        When the client requests POST /api/images/:collectionId/download with archiveName containing special characters
        Then the API returns 400 status code
        And the API returns error message indicating invalid archive name format

    Scenario: Client attempts to download with missing archive name
        Given a collection exists
        When the client requests POST /api/images/:collectionId/download with body missing archive name field
        Then the API returns 400 status code
        And the API returns error message indicating archive name field is required

    Scenario: Client attempts to download with missing request body
        Given a collection exists
        When the client requests POST /api/images/:collectionId/download with no request body
        Then the API returns 400 status code
        And the API returns error message indicating request body is required

    Scenario: Client attempts to download with missing imageIds field
        Given a collection exists
        When the client requests POST /api/images/:collectionId/download with body missing imageIds field
        Then the API returns 400 status code
        And the API returns error message indicating imageIds field is required

    Scenario: Internal error occurs when creating the download archive
        Given a collection exists with images
        When the client requests POST /api/images/:collectionId/download
        But there is an internal error creating the archive
        Then the API returns 500 status code
        And the API returns error message indicating an error occurred whilst downloading images