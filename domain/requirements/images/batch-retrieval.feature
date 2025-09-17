Feature: Domain - Images - Retrieve Batch
    User Story: As a user, I want to retrieve multiple images from my Collection, so that I can view and work with them efficiently

    Acceptance Criteria:
      - AC1: Images can be retrieved from the Collection database in batch operations
      - AC2: System supports filtering images by status (INBOX, COLLECTION, ARCHIVE)
      - AC3: System validates status filter values for safety
      - AC4: System throws specific errors for invalid parameters and internal failures
      - AC5: Retrieved images return complete ImageMetadata as defined in domain types

    Notes:
      - This is the batch equivalent of single image retrieval
      - Supports the API endpoint pattern: GET /api/collections/:id/images?status=INBOX
      - Status filtering is optional - omitting status returns all images

    Scenario: User retrieves all images from Collection
        Given a Collection exists with name: [name]
        And the Collection contains multiple images with different statuses
        When the user retrieves without a filter 
        Then the system returns an array with ImageMetadata for all images

    Scenario: User retrieves images filtered by INBOX status
        Given a Collection exists with name: [name]
        And the Collection contains multiple images with different statuses
        When the user retrieves images with a status filter 
        Then the system returns an array with ImageMetadata for all images with that status
        And no other images are included

    Scenario: User retrieves images from empty Collection
        Given a Collection exists with name: [name]
        And the Collection contains no images
        When the user retrieves all images from the Collection
        Then the system returns an empty array

    Scenario: User retrieves images with status filter that matches no images
        Given a Collection exists with name: [name]
        And the Collection contains images with INBOX status only
        When the user retrieves images filtered by COLLECTION status
        Then the system returns an empty array

    Scenario: User attempts to retrieve images with invalid status filter
        Given a Collection exists with name: [name]
        When the user attempts to retrieve images with an invalid status: [invalidStatus]
        Then the system throws "ImageRetrievalError: Unable to retrieve images from Collection \"[name]\""
        And the error cause is: "Error: Invalid status filter: \"[invalidStatus]\""

    Scenario: An internal error occurs when retrieving images
        Given a Collection exists with name: [name]
        And the Collection contains images
        When the user attempts to retrieve images from the Collection
        But there is an internal error
        Then the system throws "ImageRetrievalError: Unable to retrieve images from Collection \"[name]\""