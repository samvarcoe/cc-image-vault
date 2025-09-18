Feature: Domain - Images - Retrieval
    User Story: As a user, I want to retrieve specific images from my Collection, so that I can view and work with them

    Acceptance Criteria
      - AC1: Images can be retrieved by their unique ID from the Collection database
      - AC2: System validates image ID for safety and non-empty values
      - AC3: System throws specific errors for invalid IDs and internal failures
      - AC4: Retrieved images return complete ImageMetadata as defined in domain types

    Scenario: User retrieves image using a valid ID
        Given a Collection exists with name: [name]
        And an image exists in the Collection
        When the user retrieves the image using the correct ID
        Then the system returns the correct ImageMetadata for the image

    Scenario: User attempts to retrieve a non-existent image
        Given a Collection exists with name: [name]
        When the user attempts to retrieve an image with an [imageID] that does not exist
        Then the system throws "ImageRetrievalError: Unable to retrieve image: \"[imageID]\" from Collection: \"[name]\""
        And the error cause is: "ImageNotFoundError: Image not found with ID: \"[imageId]\""

    Scenario: User attempts to retrieve an image using an invalid ID
        Given a Collection exists with name: [name]
        When the user attempts to retrieve an image with an invalid ID containing unsafe characters
        Then the system throws "ImageRetrievalError: Unable to retrieve image: \"[imageID]\" from Collection: \"[name]\""
        And the error cause is: "Error: Invalid image ID"

    Scenario: An internal error occurs when retrieving an image
        Given a Collection exists with name: [name]
        And an image exists in the Collection
        When the user attempts to retrieve the image using the correct ID: [imageID]
        But there is an internal error
        Then the system throws "ImageRetrievalError: Unable to retrieve image: \"[imageID]\" from Collection: \"[name]\""