Feature: Images - Delete
    User Story: As a user, I want to delete unwanted images from my collection, so that I can keep my collection clean and organized

    Acceptance Criteria:
      - AC1: Images can be permanently deleted by their unique ID
      - AC2: System validates image ID for safety and non-empty values
      - AC3: System removes both original image file and thumbnail from filesystem
      - AC4: System removes image metadata from the Collection database
      - AC5: Deletion operations are atomic - either complete success or no changes
      - AC6: System throws specific errors for invalid IDs, missing images, and internal failures

    Scenario: User deletes an image from a Collection
        Given a Collection exists with name: [name]
        And an image exists in the Collection
        When the user deletes the image using the correct ID
        Then the system removes the original image file from the Collection's images/original directory
        And the system removes the thumbnail file from the Collection's images/thumbnails directory
        And the system removes the image metadata from the Collection database
        And subsequent attempts to retrieve the image throw "ImageNotFoundError"

    Scenario: User attempts to delete a non-existent image
        Given a Collection exists with name: [name]
        When the user attempts to delete an image with a valid imageId: [imageId] that does not exist
        Then the system throws "ImageDeletionError: Unable to delete image: \"[imageId]\" from Collection: \"[name]\""
        And the error cause is: "ImageNotFoundError: Image not found with ID: \"[imageId]\""

    Scenario: User attempts to delete an image using an invalid image ID
        Given a Collection exists with name: [name]
        When the user attempts to delete an image with an invalid ID: [imageId] containing unsafe characters
        Then the system throws "ImageDeletionError: Unable to delete image: \"[imageId]\" from Collection: \"[name]\""
        And the error cause is: "Error: Invalid image ID"

    Scenario: An internal error occurs when deleting an image
        Given a Collection exists with name: [name]
        And an image exists in the Collection
        When the user attempts to delete the image using the correct ID: [imageId]
        But there is an internal error
        Then the system throws "ImageDeletionError: Unable to delete image: \"[imageId]\" from Collection: \"[name]\""
        And no image files are removed
        And the Collection remains unchanged