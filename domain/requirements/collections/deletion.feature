Feature: Collections - Deletion
    User Story: As a user, I want to delete Collections, so that I can discard them I'm no longer interested in.

    Acceptance Criteria
      - AC1: Collection class ensures atomic directory and database operations
      - AC2: Collection class throws general errors for fs failures during operations
      - AC3: Collection names are validated for JSON and HTML safety

    Scenario: User deletes a Collection
        Given a Collection exists
        When the user deletes the Collection
        Then the Collection is removed from the filesystem

    Scenario: User attempts to delete a Collection that does not exist
        Given there are no Collections with name: "<name>"
        When the user attempts to delete a Collection with name "<name>"
        Then the system throws "CollectionDeleteError: Unable to delete Collection \"<name>\""
        Then the error cause is: "Error: No Collection with name: \"<name>\""

    Scenario: An internal error occurs when deleting a Collection
        Given a Collection exists
        When the user attempts to delete the Collection
        But there is an internal error
        Then the system throws "CollectionDeleteError: Unable to delete Collection \"<name>\""
        And the Collection remain unchanged 
