Feature: API - Collections - Creation
    User Story: As a client, I want to create a new Collection via the API, so that I can start organizing images.

    Acceptance Criteria:
      - AC1: API creates collections with valid names via POST request
      - AC2: API returns 201 Created status on successful creation
      - AC3: API returns 400 Bad Request for invalid collection names
      - AC4: API returns 409 Conflict when collection already exists
      - AC5: API returns 400 Bad Request for malformed requests
      - AC6: API returns 500 Internal Server Error for system failures
      - AC7: Created collections are immediately available via the retrieval endpoint

    Scenario: Client creates collection with valid name
        Given there are no Collections in the system
        When the client makes a POST request to "/api/collections" with a body that includes a valid name
        Then the API responds with status code 201
        And subsequent calls to GET "/api/collections" include the new collection

    Scenario: Client attempts to create collection with duplicate name
        Given a collection named "existing-collection" exists
        When the client makes a POST request to "/api/collections" with a body that includes a duplicate name
        Then the API responds with status code 409
        And the response body contains the error message: "There is already a Collection with name: \"[name]\""
        And no additional collection is created

    Scenario: Client attempts to create collection with invalid name
        Given there are no Collections in the system
        When the client makes a POST request to "/api/collections" with a body that includes an invalid name
        Then the API responds with status code 400
        And the response body contains the error message: "\"[invalid name]\" is not a valid Collection name"
        And no collection directory is created

    Scenario: Client attempts to create collection with name exceeding maximum length
        Given there are no Collections in the system
        When the client makes a POST request to "/api/collections" with body containing a name longer than 256 characters
        Then the API responds with status code 400
        And the response body contains the error message: "\"[name]\" is not a valid Collection name"
        And no collection directory is created

    Scenario: Client sends request without name field
        Given there are no Collections in the system
        When the client makes a POST request to "/api/collections" with body that does not include a name
        Then the API responds with status code 400
        And the response body contains the error message: "Collection name is required"

    Scenario: Client sends request with empty name
        Given there are no Collections in the system
        When the client makes a POST request to "/api/collections" with a body that includes an empty name
        Then the API responds with status code 400
        And the response body contains the error message: "Collection name is required"

    Scenario: Client sends request without body
        Given there are no Collections in the system
        When the client makes a POST request to "/api/collections" with no body
        Then the API responds with status code 400
        And the response body contains the error message: "Request body is required"

    Scenario: Internal error occurs when creating collection
        Given there are no Collections in the system
        When the client makes a POST request to "/api/collections" with a body that includes a valid name
        But there is an internal error creating the collection
        Then the API responds with status code 500
        And the response body contains the error message: "An error occurred whilst creating the Collection"
        And no collection artifacts are left behind