Feature: Domain - Collections - Loading
    User Story: As a user, I want to load Collections, so that I can continue to curate and explore my images

    Acceptance Criteria
      - AC1: Collections can be loaded from the filesystem
      - AC2: Collection class throws general errors for fs failures during operations
      - AC3: Collection names are validated for JSON and HTML safety

    Scenario: User loads Collection from filesystem
        Given a Collection exists in the Collections directory
        When the user loads the Collection
        Then the system returns a Collection instance that corresponds with the Collection

    Scenario: User attempts to load a non-existent Collection
        Given the Collections directory exists
        When the user loads a Collection that does not exist
        Then the system throws "CollectionLoadError: Unable to load Collection \"<name>\""
        And the error cause is: "Error: No Collection exists with name: \"<name>\""

    Scenario: An internal error occurs when loading a Collection
        Given a Collection exists
        When the user loads the Collection
        But there is an internal error
        Then the system throws: "CollectionLoadError: Unable to load Collection \"<name>\""