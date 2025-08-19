Feature: Collections Images API Endpoint
    User Story: As a client application, I want to retrieve images from collections via HTTP API, so that I can display and manage images within specific collections.

    Acceptance Criteria
      - AC1: API provides GET endpoint to list images within a specific collection
      - AC2: API supports filtering images by status (INBOX, COLLECTION, ARCHIVE)
      - AC3: API supports pagination with limit and offset parameters
      - AC4: API supports ordering by created_at or updated_at with direction control
      - AC5: API returns appropriate HTTP status codes and error messages
      - AC6: API validates collection existence before processing image requests
      - AC7: API returns consistent image metadata structure

    Scenario: Image listing with existing collection and images
        Given a collection exists with images in various statuses
        When the client requests GET /api/collections/:id/images
        Then the API returns 200 status code
        And the API returns array of image metadata objects
        And each image object contains id, originalName, status, size, dimensions, and timestamps

    Scenario: Image listing with empty collection
        Given a collection exists with no images
        When the client requests GET /api/collections/:id/images
        Then the API returns 200 status code
        And the API returns empty array

    Scenario: Image listing with non-existent collection
        Given no collection exists with the specified ID
        When the client requests GET /api/collections/:id/images
        Then the API returns 404 status code
        And the API returns error message indicating collection not found

    Scenario: Image filtering by status
        Given a collection exists with images in multiple statuses
        When the client requests GET /api/collections/:id/images with a specific status filter
        Then the API returns 200 status code
        And the API returns only images matching the specified status
        And the API excludes images with other statuses

    Scenario: Image listing with pagination
        Given a collection exists with multiple images
        When the client requests GET /api/collections/:id/images with limit and offset parameters
        Then the API returns 200 status code
        And the API returns the specified number of image objects
        And the API returns the correct subset of images based on offset

    Scenario: Image listing with custom ordering
        Given a collection exists with images created at different times
        When the client requests GET /api/collections/:id/images with custom ordering parameters
        Then the API returns 200 status code
        And the API returns images ordered according to the specified criteria

    Scenario: Image listing with invalid status filter
        Given a collection exists with images
        When the client requests GET /api/collections/:id/images with an invalid status parameter
        Then the API returns 400 status code
        And the API returns error message indicating invalid status value

    Scenario: Image listing with invalid pagination parameters
        Given a collection exists with images
        When the client requests GET /api/collections/:id/images with invalid limit or offset parameters
        Then the API returns 400 status code
        And the API returns error message indicating invalid pagination parameters

    Scenario: Image listing with collection access issues
        Given a collection exists but has permission issues
        When the client requests GET /api/collections/:id/images
        Then the API returns 500 status code
        And the API returns error message indicating server error