Feature: Collections API Endpoint
    User Story: As a client application, I want to manage collections via HTTP API, so that I can create, list, retrieve, and delete image collections.

    Acceptance Criteria
      - AC1: API provides GET endpoint to list all collections with basic metadata
      - AC2: API provides POST endpoint to create new collections with user-provided IDs
      - AC3: API provides GET endpoint to retrieve individual collection metadata
      - AC4: API provides DELETE endpoint to remove collections with cascade deletion
      - AC5: API validates collection IDs are filesystem-safe and unique
      - AC6: API returns appropriate HTTP status codes and error messages

    Scenario: Collection listing with existing collections
        Given multiple collections exist in the private directory
        When the client requests GET /api/collections
        Then the API returns 200 status code
        And the API returns array of collection objects with id property

    Scenario: Collection listing with no collections
        Given no collections exist in the private directory
        When the client requests GET /api/collections
        Then the API returns 200 status code
        And the API returns empty array

    Scenario: Collection creation with valid ID
        Given the client provides a filesystem-safe collection ID
        And no collection exists with that ID
        When the client requests POST /api/collections with the ID
        Then the API returns 201 status code
        And the API creates collection directory in ./private
        And the API returns created collection object with id property

    Scenario: Collection creation with duplicate ID
        Given a collection already exists with the provided ID
        When the client requests POST /api/collections with the duplicate ID
        Then the API returns 409 status code
        And the API returns error message indicating duplicate ID
        And the API creates no new files or directories

    Scenario: Collection creation with invalid ID
        Given the client provides an invalid filesystem ID
        When the client requests POST /api/collections with the invalid ID
        Then the API returns 400 status code
        And the API returns error message indicating invalid ID format
        And the API creates no new files or directories

    Scenario: Collection retrieval with existing collection
        Given a collection exists with the specified ID
        When the client requests GET /api/collections/:id
        Then the API returns 200 status code
        And the API returns collection object with id property

    Scenario: Collection retrieval with non-existent collection
        Given no collection exists with the specified ID
        When the client requests GET /api/collections/:id
        Then the API returns 404 status code
        And the API returns error message indicating collection not found

    Scenario: Collection deletion with existing collection
        Given a collection exists with images in various statuses
        When the client requests DELETE /api/collections/:id
        Then the API returns 204 status code
        And the API removes all collection files and directories
        And the API deletes all associated images and thumbnails

    Scenario: Collection deletion with non-existent collection
        Given no collection exists with the specified ID
        When the client requests DELETE /api/collections/:id
        Then the API returns 404 status code
        And the API returns error message indicating collection not found

    Scenario: Collection creation with insufficient permissions
        Given the client provides valid collection ID
        And the API lacks write permissions to private directory
        When the client requests POST /api/collections
        Then the API returns 500 status code
        And the API returns error message indicating server error