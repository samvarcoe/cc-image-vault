Feature: Collection Creation
    User Story: As a user, I want to create Collections, so that I can begin organising my images.

    Acceptance Criteria
      - AC1: Collections can be created with valid names (letters, numbers, hyphens only)
      - AC2: Collections are created in the configured Collections directory
      - AC3: Collection class ensures atomic directory and database creation
      - AC4: Collection class throws general errors for fs failures during operations
      - AC5: Collection names are validated for JSON and HTML safety

    Scenario: User creates Collection with valid name
        Given the Collections directory exists
        When the user creates a Collection with a valid name: <name>
        Then the system creates a directory <name> in the Collections directory
        And the system creates a SQLite database file "Collection.db" with the defined schema
        And the system creates the defined file structure

    Scenario: User attempts to create a Collection with duplicate name
        Given a Collection already exists
        When the user creates a Collection with same name
        Then the system throws "CollectionCreateError: Unable to create Collection \"<name>\""
        And the error cause is: "Error: There is already a Collection with name: \"<name>\""
        And the system creates no new Collection directory

    Scenario: User attempts to create a Collection with invalid name
        Given the Collections directory exists
        When the user creates a Collection with an invalid name: <name>
        Then the system throws "Error: \"<name>\" is not a valid Collection name"
        And the Collection directory is not created

    Scenario: An internal error occurs when creating a Collection
        Given the Collections directory exists
        When the user creates a Collection with a valid name: <name>
        But there is an internal error
        Then the system throws "CollectionCreateError: Unable to create Collection \"<name>\""
        And the system leaves no partial Collection artifacts behind