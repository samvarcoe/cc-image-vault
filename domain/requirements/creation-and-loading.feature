Feature: Collections - Creation and Loading 
    User Story: As a user, I want to create and load Collection instances, so that I can manage isolated image collections.

    Acceptance Criteria
      - AC1: Collection class provides constructor for new collections with ID and path parameters
      - AC2: Collection class provides static load method for existing collections
      - AC3: Collection class establishes persistent database connections
      - AC4: Collection class ensures atomic directory and database creation
      - AC5: Collection class throws meaningful errors for creation and loading failures

    # Positive Scenarios

    Scenario: Collection creation with valid parameters
        Given the user provides a valid collection ID and base path
        When the user creates a new Collection instance
        Then the collection initializes with the provided ID and path
        And the collection creates the necessary directory structure
        And the collection creates the database file 

    Scenario: Collection loading from existing directory
        Given a collection exists at the specified path with valid database
        When the user calls Collection.load() with the collection path
        Then the system returns a Collection instance

    # Negative Scenarios

    Scenario: Collection creation with invalid path
        Given the user provides an invalid or inaccessible base path
        When the user attempts to create a new Collection instance
        Then the collection throws a meaningful error about invalid path
        And the collection creates no files or directories

    Scenario: Collection creation with insufficient permissions
        Given the user provides a path with insufficient write permissions
        When the user attempts to create a new Collection instance
        Then the collection throws "Unable to create Collection" error
        And the collection creates no partial directory structure

    Scenario: Collection creation with database failure
        Given the user provides a valid path but database initialization fails
        When the user attempts to create a new Collection instance
        Then the collection throws a "Unable to create Collection" error
        And the collection removes any partially created directories
        And the collection leaves the filesystem in its original state

    Scenario: Collection loading with access issues
        Given a collection directory exists with database or permission problems
        When the user calls Collection.load() with the collection path
        Then the collection throws a "Unable to load Collection" error
        And the error message indicates the specific access issue