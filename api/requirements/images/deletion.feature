Feature: API - Images - Delete
    User Story: As a client application, I want to delete images from collections via HTTP API, so that users can curate their collections by removing unwanted images.

    Acceptance Criteria:
      - AC1: API provides DELETE endpoint to remove images by collection and image ID
      - AC2: API returns 204 No Content status on successful deletion
      - AC3: API validates image ID format and returns 400 for invalid formats
      - AC4: API validates collection and image existence before deletion
      - AC5: API returns appropriate HTTP status codes and error messages
      - AC6: API leverages domain layer Collection.deleteImage() method
      - AC7: Deleted images are completely removed from collection (database and files)

    Scenario: Client deletes an existing image from a collection
        Given a collection exists with an image
        When the client requests DELETE /api/images/:collectionId/:imageId
        Then the API returns 204 status code
        And subsequent requests for the image return 404

    Scenario: Client attempts to delete an image from a non-existent collection
        Given no collection exists with the specified collection ID
        When the client requests DELETE /api/images/:collectionId/:imageId
        Then the API returns 404 status code
        And the API returns error message indicating collection not found

    Scenario: Client attempts to delete a non-existent image from an existing collection
        Given a collection exists but does not contain the specified image ID
        When the client requests DELETE /api/images/:collectionId/:imageId with a valid UUID format
        Then the API returns 404 status code
        And the API returns error message indicating image not found

    Scenario: Client attempts to delete an image using an invalid image ID format
        Given a collection exists
        When the client requests DELETE /api/images/:collectionId/:imageId with an invalid image ID format
        Then the API returns 400 status code
        And the API returns error message indicating invalid image ID format

    Scenario: Internal error occurs when deleting an image
        Given a collection exists with an image
        When the client requests DELETE /api/images/:collectionId/:imageId
        But there is an internal error deleting the image
        Then the API returns 500 status code
        And the API returns error message indicating an error occurred whilst deleting the image