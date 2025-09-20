Feature: Domain - Images - Get Thumbnail Data
    User Story: As a user, I want to retrieve thumbnail image data from my Collection, so that I can serve and display optimized thumbnail images

    Acceptance Criteria
      - AC1: Thumbnail data can be retrieved by their unique ID from the Collection filesystem
      - AC2: System validates image ID for safety and non-empty values
      - AC3: System throws specific errors for invalid IDs and internal failures
      - AC4: Retrieved thumbnail data returns the thumbnail image file as Buffer

    Scenario: User retrieves thumbnail data using a valid ID
        Given a Collection exists with name: [name]
        And an image exists in the Collection
        When the user retrieves the thumbnail data using the correct ID
        Then the system returns the thumbnail image file as Buffer

    Scenario: User attempts to retrieve thumbnail data for a non-existent image
        Given a Collection exists with name: [name]
        When the user attempts to retrieve thumbnail data with an [imageID] that does not exist
        Then the system throws "ImageNotFoundError: Image not found with ID: \"[imageId]\""

    Scenario: User attempts to retrieve thumbnail data using an invalid ID
        Given a Collection exists with name: [name]
        When the user attempts to retrieve thumbnail data with an invalid ID containing unsafe characters
        Then the system throws "ImageRetrievalError: Unable to retrieve image: \"[imageID]\" from Collection: \"[name]\""
        And the error cause is: "Error: Invalid imageID"

    Scenario: An internal error occurs when retrieving thumbnail data
        Given a Collection exists with name: [name]
        And an image exists in the Collection
        When the user attempts to retrieve the thumbnail data using the correct ID: [imageID]
        But there is an internal error
        Then the system throws "ImageRetrievalError: Unable to retrieve image: \"[imageID]\" from Collection: \"[name]\""