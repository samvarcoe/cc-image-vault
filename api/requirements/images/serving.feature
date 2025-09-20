Feature: API - Images - Serving
    User Story: As a client application, I want to retrieve individual image files via HTTP API, so that I can display original images and thumbnails in the user interface.

    Acceptance Criteria
      - AC1: API provides GET endpoint to serve original image files by collection and image ID
      - AC2: API provides GET endpoint to serve thumbnail image files by collection and image ID
      - AC3: API validates image ID format and returns 400 for invalid formats
      - AC4: API validates collection and image existence before serving files
      - AC5: API returns appropriate HTTP status codes and error messages
      - AC6: API sets correct Content-Type headers based on image MIME types
      - AC7: API sets cache headers for efficient browser caching of immutable images
      - AC8: API returns file size information in Content-Length header

    Scenario: Original image serving with valid collection and image IDs
        Given a collection exists with an image
        When the client requests GET /api/images/:collectionId/:imageId
        Then the API returns 200 status code
        And the API returns the original image file content
        And the API sets Content-Type header matching the image MIME type
        And the API sets Content-Length header with the file size
        And the API sets cache headers for immutable content

    Scenario: Thumbnail image serving with valid collection and image IDs
        Given a collection exists with an image that has a thumbnail
        When the client requests GET /api/images/:collectionId/:imageId/thumbnail
        Then the API returns 200 status code
        And the API returns the thumbnail image file content
        And the API sets Content-Type header for the thumbnail format
        And the API sets Content-Length header with the thumbnail file size
        And the API sets cache headers for immutable content

    Scenario: Image serving with non-existent collection
        Given no collection exists with the specified collection ID
        When the client requests GET /api/images/:collectionId/:imageId
        Then the API returns 404 status code
        And the API returns error message indicating collection not found

    Scenario: Image serving with non-existent image in existing collection
        Given a collection exists but does not contain the specified image ID
        When the client requests GET /api/images/:collectionId/:imageId with a valid UUID format
        Then the API returns 404 status code
        And the API returns error message indicating image not found

    Scenario: Image serving with invalid image ID format
        Given a collection exists
        When the client requests GET /api/images/:collectionId/:imageId with an invalid image ID format
        Then the API returns 400 status code
        And the API returns error message indicating invalid image ID format

    Scenario: Thumbnail serving with non-existent image in existing collection
        Given a collection exists but does not contain the specified image ID
        When the client requests GET /api/images/:collectionId/:imageId/thumbnail with a valid UUID format
        Then the API returns 404 status code
        And the API returns error message indicating image not found

    Scenario: Thumbnail serving with invalid image ID format
        Given a collection exists
        When the client requests GET /api/images/:collectionId/:imageId/thumbnail with an invalid image ID format
        Then the API returns 400 status code
        And the API returns error message indicating invalid image ID format