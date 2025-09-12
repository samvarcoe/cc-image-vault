Feature: API - Collections - Retrieval
    User Story: As a client, I want to retrieve the list of Collections, so I can see what collections are available.

    Acceptance Criteria:
      - AC1: API returns list of collection names when collections exist
      - AC2: API returns empty array when no collections exist
      - AC3: API returns appropriate HTTP status codes for different scenarios
      - AC4: API handles internal errors gracefully

    Scenario: Client requests the collections list and some collections exist
        Given there are some Collections in the system
        When the client makes a GET request to "/api/collections"
        Then the API responds with status code 200
        And the response body contains an array of collection names

    Scenario: Client requests the collections list and no collections exist
        Given there are no Collections in the system
        When the client makes a GET request to "/api/collections"
        Then the API responds with status code 200
        And the response body contains an empty array

    Scenario: Internal error occurs when retrieving collections
        Given there are some Collections in the system
        When the client makes a GET request to "/api/collections"
        But there is an internal error accessing the collections
        Then the API responds with status code 500
        And the response body contains the error message: "An error occured whilst retrieving the Collections list"