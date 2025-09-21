Feature: API - Images - Updating Image Status
    User Story: As a client, I want to update image status via HTTP API, so that I can move images between INBOX, COLLECTION, and ARCHIVE states.

    Acceptance Criteria:
      - AC1: API provides PATCH endpoint to update image status by collection and image ID
      - AC2: API accepts JSON request body with status field containing valid ImageStatus values
      - AC3: API returns complete updated ImageMetadata with 200 status on successful update
      - AC4: API validates image ID format and returns 400 for invalid formats
      - AC5: API validates request body format and status values
      - AC6: API validates collection and image existence before updating
      - AC7: API returns appropriate HTTP status codes and error messages
      - AC8: API leverages domain layer validation and error handling

    Scenario: Client updates the status of an image
        Given a collection exists with an image
        When the client requests PATCH /api/images/:collectionId/:imageId with body containing valid status
        Then the API returns 200 status code
        And the API returns the complete updated ImageMetadata
        And the returned metadata reflects the new status

    Scenario: Client attempts to update the status of an image in a collection that doesn't exist
        Given no collection exists with a specific collection ID
        When the client requests PATCH /api/images/:collectionId/:imageId with that collection ID
        Then the API returns 404 status code
        And the API returns error message indicating collection not found

    Scenario: Client attempts to update the status of an image that doesn't exist 
        Given a collection exists that does not contain an image with a specific image ID
        When the client requests PATCH /api/images/:collectionId/:imageId with that image ID
        Then the API returns 404 status code
        And the API returns error message indicating image not found

    Scenario: Client attempts to update the status of an image using an invalid image ID format
        Given a collection exists
        When the client requests PATCH /api/images/:collectionId/:imageId with an invalid image ID format
        Then the API returns 400 status code
        And the API returns error message indicating invalid image ID format

    Scenario: Client attempts to update the status of an image using an invalid status value
        Given a collection exists with an image
        When the client requests PATCH /api/images/:collectionId/:imageId with body containing invalid status value
        Then the API returns 400 status code
        And the API returns error message indicating invalid status value

    Scenario: Client sends a status update request with a missing request body
        Given a collection exists with an image
        When the client requests PATCH /api/images/:collectionId/:imageId with no request body
        Then the API returns 400 status code
        And the API returns error message indicating request body is required

    Scenario: Client sends a status update request with a malformed request body
        Given a collection exists with an image
        When the client requests PATCH /api/images/:collectionId/:imageId with malformed request body
        Then the API returns 400 status code
        And the API returns error message indicating malformed request body

    Scenario: Client sends a status update request with a missing status field
        Given a collection exists with an image
        When the client requests PATCH /api/images/:collectionId/:imageId with body missing status field
        Then the API returns 400 status code
        And the API returns error message indicating status field is required

    Scenario: An internal error occurs when a client attempts to update an image status
        Given a collection exists with an image
        When the client requests PATCH /api/images/:collectionId/:imageId with body containing valid status
        But there is an internal error updating the image
        Then the API returns 500 status code
        And the API returns error message indicating an error occurred whilst updating the image