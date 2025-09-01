Feature: Collections - Image Operations
    User Story: As a developer, I want to add and retrieve images from collections, so that I can manage image storage with automatic processing and querying capabilities.

    Acceptance Criteria
      - AC1: Collection class processes images synchronously during add operations
      - AC2: Collection class generates thumbnails and calculates hashes for all added images
      - AC3: Collection class stores images with UUID filenames while preserving metadata
      - AC4: Collection class provides image retrieval with status filtering
      - AC5: Collection class prevents duplicate images through hash validation
      - AC6: Collection class ensures atomic image operations with rollback on failure

    # Positive Scenarios

    Scenario: Image addition with valid file
        Given a Collection instance exists with persistent database connection
        And the developer provides a valid image file for upload
        When the developer adds the image to the collection
        Then the collection stores the original image with UUID filename
        And the collection generates a thumbnail preserving aspect ratio
        And the collection returns the image metadata

    Scenario: Image retrieval with status filter
        Given a Collection instance contains multiple images in different statuses
        When the developer queries images with a status filter
        Then the collection returns only images matching the specified status
        And the collection includes complete image metadata in results
        And the collection orders results by updated_at timestamp

    Scenario: Image retrieval without filter
        Given a Collection instance contains multiple images
        When the developer queries all images without status filter
        Then the collection returns all images in the collection
        And the collection includes complete image metadata in results
        And the collection orders results by updated_at timestamp

    # Negative Scenarios

    Scenario: Image addition with duplicate hash
        Given a Collection instance contains an existing image
        When the developer attempts to add an image with the same SHA256 hash
        Then the collection throws a "Duplicate Image" error
        And the collection creates no files
        And the collection modifies no database records
        And the filesystem and database remain unchanged

    Scenario: Image addition with processing failure
        Given an existing Collection instance
        When the developer attempts to add the image
        But the image processing fails
        Then the collection throws a "Unable to process image" failure
        And the collection creates no files or database records
        And the filesystem and database remain unchanged

    Scenario: Image addition with storage failure
        Given an existing Collection instance
        When the developer attempts to add the image
        But the image storage fails
        Then the collection throws a "Unable to save image" failure
        And the collection removes any partially written files
        And the collection restores filesystem and database to original state

    Scenario: Image retrieval with database error
        Given a Collection instance encounters database connection issues
        When the developer attempts to query images
        Then the collection throws a "Unable to retrieve images" failure
        And the error message includes connection diagnostics