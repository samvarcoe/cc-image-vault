Feature: API - Images - Batch Download
    User Story: As a client application, I want to download multiple images as a ZIP archive with original filenames via HTTP API, so that users can efficiently save multiple images to their local filesystem.

    Acceptance Criteria:
      - AC1: API provides POST endpoint to download multiple images by collection ID and array of image IDs
      - AC2: API accepts JSON request body with imageIds array and archiveName string
      - AC3: API returns ZIP archive with Content-Disposition header set to attachment
      - AC4: API includes archive name in Content-Disposition header with .zip extension
      - AC5: API uses original filenames from metadata for files in the archive
      - AC6: API appends indexed suffix to images with duplicate original filenames
      - AC7: Indexed suffixes are ordered by image creation time (earliest first)
      - AC8: API validates archive name contains only alphanumeric characters, dashes, and underscores
      - AC9: API validates imageIds array is not empty
      - AC10: API validates all image IDs have valid UUID v4 format
      - AC11: API validates all image IDs exist in the collection
      - AC12: API validates collection existence before processing download
      - AC13: API returns appropriate HTTP status codes and error messages
      - AC14: API sets correct Content-Type (application/zip) and Content-Length headers
      - AC15: Downloaded images in archive are identical to original uploaded files

    Notes:
      - Indexed suffix format: _001, _002, _003 (three digits, zero-padded, starting from 1)
      - Suffix is inserted before the file extension: photo_001.jpg, photo_002.jpg
      - Creation time ordering ensures consistent, predictable naming
      - Archive name validation prevents filesystem issues and injection attacks
      - All validation errors return 400 status to fail fast before archive creation
      - Images can be downloaded regardless of their status (INBOX/COLLECTION/ARCHIVE)

    Scenario: Client downloads multiple images with unique filenames
        Given a collection exists with multiple images having unique original filenames
        When the client requests POST /api/images/:collectionId/download with valid imageIds array and archiveName
        Then the API returns 200 status code
        And the API returns a ZIP archive file
        And the API sets Content-Disposition header to attachment with archive named
        And the API sets Content-Type header to application/zip
        And the API sets Content-Length header with the archive size
        And the ZIP archive contains all requested images with their original filenames

    Scenario: Client downloads multiple images with duplicate filenames
        Given a collection exists with duplicated image names
        When the client requests POST /api/images/:collectionId/download with all three imageIds
        Then the API returns 200 status code
        And the duplicated images have an index based suffix applied to their names
        And the index is ordered based on the creation times of the images
        And the order is from oldest to newest

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