Feature: Domain - Collections - Clearing 
    User Story: As a user, I want to clear Collections, so that I can discard everything and start fresh

    Acceptance Criteria
      - AC1: Existing Collections can be cleared
      - AC2: Collection class ensures atomic directory and database operations
      - AC3: Collection class throws general errors for fs failures during operations

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
        Then the system throws: "CollectionClearError: Unable to clear the Collections"
        And existing Collections remain unchanged
