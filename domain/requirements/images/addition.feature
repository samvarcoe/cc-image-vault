Feature: Images - Addition
    User Story: As a user, I want to add images to my Collection, so that I can manage and organize them effectively.

    Acceptance Criteria
        - AC1: Images are validated for format (jpg/jpeg/png/webp only) and file integrity
        - AC2: Image filenames are sanitised to be filesystem-safe, HTML-safe, JSON-safe and under 256 characters
        - AC3: Images are processed with SHA256 hash calculation for duplicate detection
        - AC4: Original images are stored in the images/original directory
        - AC5: Thumbnails are generated using Sharp and stored in images/thumbnails directory
        - AC6: Images are added with "INBOX" status by default
        - AC7: Image metadata is stored in the Collection database with atomic transactions
        - AC8: Collection class throws specific errors for different failure scenarios

    Scenario: User adds a jpg image to a Collection
        Given a Collection exists
        When the user adds a jpg image to the Collection
        Then the system copies the original image to the Collection's images/original directory
        And the system generates a thumbnail in the Collection's images/thumbnails directory
        And the system returns the correct image metadata
        And the image status is set to "INBOX"

    Scenario: User adds a jpg image with "jpeg" extension to a Collection
        Given a Collection exists
        When the user adds a jpg image to the Collection that has a "jpeg" extension
        Then the system copies the original image to the Collection's images/original directory with "jpg" extension
        And the system generates a thumbnail in the Collection's images/thumbnails directory
        And the system returns the correct image metadata
        And the image status is set to "INBOX"

    Scenario: User adds a png image to a Collection
        Given a Collection exists
        When the user adds a png image to the Collection
        Then the system copies the original image to the Collection's images/original directory
        And the system generates a thumbnail in the Collection's images/thumbnails directory
        And the system returns the correct image metadata
        And the image status is set to "INBOX"

    Scenario: User adds a webp image to a Collection
        Given a Collection exists
        When the user adds a webp image to the Collection
        Then the system copies the original image to the Collection's images/original directory
        And the system generates a thumbnail in the Collection's images/thumbnails directory
        And the system returns the correct image metadata
        And the image status is set to "INBOX"

    Scenario: User attempts to add an image to a Collection using a path that does not exist
        Given a Collection exists with name: [name]
        And path: [path] does not point to a file
        When the user attempts to add an image using [path]
        Then the system throws "ImageAdditionError: Unable to add image to Collection \"[name]\""
        And the error cause is: "Error: \"[path]\" is not a file"
        And no new image files are created

    Scenario: User attempts to add a duplicate image to Collection
        Given a Collection exists with name: [name]
        And an image has been added to the Collection
        When user attempts to add a duplicate image file with the same hash to the Collection
        Then the system throws "ImageAdditionError: Unable to add image to Collection \"[name]\""
        And the error cause is: "Error: Image already exists in Collection"
        And no new image files are created

    Scenario: User attempts to add an image with unsupported format
        Given a Collection exists with name: [name]
        When the user attempts to add an unsupported file type image to the Collection
        Then the system throws "ImageAdditionError: Unable to add image to Collection \"[name]\""
        And the error cause is: "Error: Unsupported file type, must be image file with extension jpg/jpeg/png/webp"
        And no image files are created

    Scenario: User attempts to add a corrupted image file
        Given a Collection exists with name: [name]
        When user attempts to add a corrupted image to the Collection
        Then the system throws "ImageAdditionError: Unable to add image to Collection \"[name]\""
        And the error cause is: "Error: Invalid or corrupted image file"
        And no image files are created

    Scenario: User attempts to add an image with unsafe filename
        Given no Collection exists with name: [name]
        When the user attempts to adds an image with an unsafe filename
        Then the system throws "ImageAdditionError: Unable to add image to Collection \"[name]\""
        And the error cause is: "Error: Unsafe or invalid filename"
        And no image files are created

    Scenario: User attempts to add an image with filename that exceeds 256 characters
        Given no Collection exists with name: [name]
        When the user attempts to adds an image that exceeds 256 characters
        Then the system throws "ImageAdditionError: Unable to add image to Collection \"[name]\""
        And the error cause is: "Error: Filename exceeds 256 characters"
        And no image files are created

    Scenario: User attempts to add an image to non-existent Collection
        Given no Collection exists with name: [name]
        When the user attempts to adds an image to the Collection
        Then the system throws "ImageAdditionError: Unable to add image to Collection \"[name]\""
        And the error cause is: "CollectionNotFoundError: No Collection found with name: \"[name]\""
        And no image files are created

    Scenario: An internal error occurs when adding an image to a Collection
        Given a Collection exists with name: [name]
        When the user attempts to adds an image to the Collection
        But there is an internal error
        Then the system throws "ImageAdditionError: Unable to add image to Collection \"[name]\""
        And no image files are created
        And the Collection remains unchanged