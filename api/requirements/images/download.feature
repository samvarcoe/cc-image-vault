Feature: API - Images - Individual Download
    User Story: As a client application, I want to download individual images with their original filenames via HTTP API, so that users can save images to their local filesystem.

    Acceptance Criteria:
      - AC1: API provides GET endpoint to download original images by collection and image ID
      - AC2: API returns image file with Content-Disposition header set to attachment
      - AC3: API includes original filename from metadata in Content-Disposition header
      - AC4: API validates image ID format and returns 400 for invalid formats
      - AC5: API validates collection and image existence before serving download
      - AC6: API returns appropriate HTTP status codes and error messages
      - AC7: API sets correct Content-Type and Content-Length headers for downloaded images
      - AC8: Downloaded images are identical to original uploaded files

    Scenario: Client downloads an existing image with original filename
        Given a collection exists with an image
        When the client requests GET /api/images/:collectionId/:imageId/download
        Then the API returns 200 status code
        And the API returns the original image file content
        And the API sets Content-Disposition header to attachment with original filename
        And the API sets Content-Type header matching the image MIME type
        And the API sets Content-Length header with the file size

    Scenario: Client attempts to download an image from a non-existent collection
        Given no collection exists with the specified collection ID
        When the client requests GET /api/images/:collectionId/:imageId/download
        Then the API returns 404 status code
        And the API returns error message indicating collection not found

    Scenario: Client attempts to download a non-existent image from an existing collection
        Given a collection exists but does not contain the specified image ID
        When the client requests GET /api/images/:collectionId/:imageId/download with a valid UUID format
        Then the API returns 404 status code
        And the API returns error message indicating image not found

    Scenario: Client attempts to download an image using an invalid image ID format
        Given a collection exists
        When the client requests GET /api/images/:collectionId/:imageId/download with an invalid image ID format
        Then the API returns 400 status code
        And the API returns error message indicating invalid image ID format

    Scenario: Internal error occurs when downloading an image
        Given a collection exists with an image
        When the client requests GET /api/images/:collectionId/:imageId/download
        But there is an internal error serving the image
        Then the API returns 500 status code
        And the API returns error message indicating an error occurred whilst downloading the image