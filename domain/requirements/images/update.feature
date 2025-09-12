Feature: Domain - Images - Update
    User Story: As a user, I want to update the images in my Collection, so that I can organize them into different categories (INBOX, COLLECTION, ARCHIVE)

    Acceptance Criteria
      - AC1: Images can have their status updated to any valid ImageStatus (INBOX, COLLECTION, ARCHIVE)
      - AC2: System validates image ID for safety and non-empty values
      - AC3: System validates that the new status is a valid ImageStatus value
      - AC4: System throws specific errors for invalid IDs, missing images, invalid status, and internal failures
      - AC5: Updated images return complete ImageMetadata with the new status
      - AC6: Updates with the same status are permissible

    Scenario: User updates the status of an image
        Given a Collection exists with name: [name]
        And an image exists in the Collection
        When the user updates the image status
        Then the system returns the updated ImageMetadata
        And subsequent attempts to retrieve the image return the updated ImageMetadata

    Scenario: User attempts to update the status of a non-existent image
        Given a Collection exists with name: [name]
        When the user attempts to update the status of an image with a valid imageId: [imageId] that does not exist
        Then the system throws "ImageUpdateError: Unable to update image: \"[imageID]\" in Collection: \"[name]\""
        And the error cause is: "ImageNotFoundError: Image not found with ID: \"[imageId]\""

    Scenario: User attempts to update the status of an image using an invalid image ID
        Given a Collection exists with name: [name]
        When the user attempts to update an image with an invalid ID containing unsafe characters
        Then the system throws "ImageUpdateError: Unable to update image: \"[imageID]\" in Collection: \"[name]\""
        And the error cause is: "Error: Invalid image ID"

    Scenario: User attempts to update the status of an image using an invalid status value
        Given a Collection exists with name: [name]
        And an image exists in the Collection
        When the user attempts to update the image with an invalid status value
        Then the system throws "ImageUpdateError: Unable to update image: \"[imageID]\" in Collection: \"[name]\""
        And the error cause is: "Error: Invalid status value"

    Scenario: An internal error occurs when the user attempts to update the status of an image
        Given a Collection exists with name: [name]
        And an image exists in the Collection
        When the user attempts to update the image status
        But there is an internal error
        Then the system throws "ImageUpdateError: Unable to update image: \"[imageID]\" in Collection: \"[name]\""