Feature: Domain - Collections - Listing
    User Story: As a user, I want to list Collections, so that I can what is available and select the collection I am interested in

    Acceptance Criteria
      - AC1: Existing Collections can be listed
      - AC2: Collection class throws general errors for fs failures during operations

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
        Then the system throws: "CollectionListError: Unable to list Collections"