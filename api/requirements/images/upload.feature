Feature: API - Images - Upload
    User Story: As a client, I want to upload image files to a collection via HTTP API, so that I can add new images to my collections.

    Acceptance Criteria
      - AC1: API provides POST endpoint to upload image files to a collection by collection ID
      - AC2: API accepts multipart form data with a single file in the "file" field
      - AC3: API validates collection existence before accepting uploads
      - AC4: API returns created image metadata with 201 status on successful upload
      - AC5: API returns appropriate HTTP status codes and error messages for errors
      - AC6: API relies on domain layer for file type validation and processing
      - AC7: API generates unique image ID via domain layer Collection.addImage() method

    Scenario: Successful image upload to existing collection
        Given a collection exists
        When the client uploads an image file via POST /api/images/:collectionId
        Then the API returns 201 status code
        And the API returns the created image metadata with generated ID
        And the image metadata includes collection, name, extension, mime, size, dimensions, and timestamps
        And subsequent requests for the image return 200 with the image data

    Scenario: Image upload with no file provided
        Given a collection exists
        When the client sends POST /api/images/:collectionId without a file
        Then the API returns 400 status code
        And the API returns error message indicating file is required

    Scenario: Image upload to non-existent collection
        Given no collection exists with the specified collection ID
        When the client uploads an image file via POST /api/images/:collectionId
        Then the API returns 404 status code
        And the API returns error message indicating collection not found

    Scenario: Image upload with unsupported file type
        Given a collection exists
        When the client uploads a non-image file via POST /api/images/:collectionId
        Then the API returns 400 status code
        And the API returns error message from domain layer validation

    Scenario: Image upload with corrupted file
        Given a collection exists
        When the client uploads a corrupted image file via POST /api/images/:collectionId
        Then the API returns 400 status code
        And the API returns error message from domain layer validation

    Scenario: Internal server error during image processing
        Given a collection exists
        When the client uploads an image file and the domain layer encounters an internal error
        Then the API returns 500 status code
        And the API returns generic error message without exposing internal details