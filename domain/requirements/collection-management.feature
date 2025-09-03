Feature: Collection Management
    User Story: As a user, I want to create, load, remove and delete Collection instances, so that I can manage isolated image Collections.

    Acceptance Criteria
      - AC1: Collections can be created with valid names (letters, numbers, hyphens only)
      - AC2: Collections are created in the configured Collections directory
      - AC3: Collections can be loaded from the filesystem
      - AC4: Existing Collections can be listed
      - AC5: Existing Collections can be cleared
      - AC6: Collection class ensures atomic directory and database creation
      - AC7: Collection class throws general errors for fs failures during operations
      - AC8: Collection names are validated for JSON and HTML safety

    Scenario: User creates Collection with valid name
        Given the Collections directory exists
        When the user creates a Collection with a valid name: <name>
        Then the system creates a directory <name> in the Collections directory
        And the system creates a SQLite database file "Collection.db" with the defined schema
        And the system creates the defined file structure

    Scenario: User attempts to create a Collection with duplicate name
        Given a Collection already exists
        When the user creates a Collection with same name
        Then the system throws "Error: There is already a Collection with name: \"<name>\""
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
        Then the system throws: "Error: Unable to create Collection \"<name>\""
        And the system leaves no partial Collection artifacts behind

    Scenario: User loads Collection from filesystem
        Given a Collection exists in the Collections directory
        When the user loads the Collection
        Then the system returns a Collection instance that corresponds with the Collection

    Scenario: User attempts to load a non-existent Collection
        Given the Collections directory exists
        When the user loads a Collection that does not exist
        Then the system throws: "Error: No Collection exists with name: \"<name>\""

    Scenario: An internal error occurs when loading a Collection
        Given a Collection exists
        When the user loads the Collection
        But there is an internal error
        Then the system throws: "Error: Unable to load Collection: \"<name>\""

    Scenario: User deletes a Collection
        Given a Collection exists
        When the user deletes the Collection
        Then the Collection is removed from the filesystem

    Scenario: User attempts to delete a Collection that does not exist
        Given there are no Collections with name: "<name>"
        When the user attempts to delete a Collection with name "<name>"
        Then the system throws: "Error: No Collection with name: \"<name>\""

    Scenario: An internal error occurs when deleting a Collection
        Given a Collection exists
        When the user attempts to delete the Collection
        But there is an internal error
        Then the system throws: "Error: Unable to delete Collection: \"<name>\""
        And the Collection remain unchanged 

    Scenario: User requests list of existing Collections and some Collections exist
        Given there are some Collections in the Collections directory
        When the user requests the list of Collections
        Then the system returns the correct list of Collections

    Scenario: User requests list of existing Collections and no Collections exist
        Given there are no Collections in the Collections directory
        When the user requests the list of Collections
        Then the system returns an empty array

    Scenario: An internal error occurs when listing Collections
        Given the user has requested the list of Collections
        When there is an internal error
        Then the system throws: "Error: Unable to list the Collections"

    Scenario: User clears Collections
        Given Collections exist in the Collections directory
        When the user clears the Collections 
        Then the system removes the Collection directories
        And the Collection list returns empty

    Scenario: User attempts to clear an empty Collections directory
        Given there are no Collections in the Collections directory
        When the user clears the Collections 
        Then no error occurs
        And the Collection list returns empty

    Scenario: An internal error occurs when the user attempts to clear the Collections directory
        Given the user has attempted to clear the Collections directory
        When an internal error occurs
        Then the system throws: "Error: Unable to clear the Collections directory"
        And existing Collections remain unchanged
