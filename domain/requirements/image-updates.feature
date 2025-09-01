Feature: Collections - Image Updates
    User Story: As a developer, I want to update and delete images in collections, so that I can manage image lifecycle and status transitions atomically.

    Acceptance Criteria
      - AC1: Collection class handles all image status transitions atomically
      - AC2: Collection class validates status transitions before updates
      - AC3: Collection class updates timestamps for all image modifications
      - AC4: Collection class performs complete file and database cleanup on deletion
      - AC5: Collection class throws meaningful errors for invalid operations
      - AC6: Collection class ensures atomicity with rollback on any failure

    # Positive Scenarios

    Scenario: Image status update with valid transition
        Given a Collection instance contains an image in the current status
        When the developer updates the image status to a new valid status
        Then the collection updates the image record in the database atomically
        And the collection sets the updated_at timestamp
        And the collection returns the updated image metadata

    Scenario: Image deletion from archive status
        Given a Collection instance contains an image in ARCHIVE status
        When the developer deletes the image
        Then the collection removes the image record from the database
        And the collection deletes the original image file
        And the collection deletes the thumbnail image file
        And the collection commits all changes atomically
        And the collection returns confirmation of deletion

    # Negative Scenarios

    Scenario: Image update with non-existent identifier
        Given a Collection instance exists
        When the developer attempts to update an image that does not exist
        Then the collection throws a "Image not found" error
        And the error message includes the attempted image identifier
        And the database remains unchanged

    Scenario: Image update with invalid status
        Given a Collection instance contains an image in a specific status
        When the developer attempts to update to an invalid status value
        Then the collection throws a "Image status not valid" error
        And the error message includes valid status options
        And the database remains unchanged

    Scenario: Image update with database constraint violation
        Given a Collection instance exists and a database constraint prevents the update
        When the developer attempts to update the image status
        Then the collection throws a meaningful error about constraint violation
        And the collection rolls back the database transaction

    Scenario: Image deletion with non-existent identifier
        Given a Collection instance exists
        When the developer attempts to delete an image that does not exist
        Then the collection throws a "Image not found" error
        And the error message includes the attempted image identifier
        And the database remains unchanged

    Scenario: Image deletion with file system failure
        Given a Collection instance contains an image and file operations fail
        When the developer attempts to delete the image
        Then the collection throws a "Unable to process file change" failure
        And the collection rolls back any database changes
        And the database record remains intact