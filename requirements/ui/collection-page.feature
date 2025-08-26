Feature: Collection Page - Displaying Images
    User Story: As a user, I want to view images in my collection filtered by status, so that I can browse and manage my curated images effectively.

    Acceptance Criteria
      - AC1: Page displays images in a 3-column grid layout
      - AC2: Images are filtered by status parameter from URL query string
      - AC3: Default status is "COLLECTION" when no query parameter is present
      - AC4: Images display their thumbnails (400px optimized versions)
      - AC5: Images use native HTML lazy loading for performance
      - AC6: Page handles empty collection states gracefully with specific messaging
      - AC7: Page validates collection existence before rendering

    Scenario: Collection page displays images with default status
        Given a collection exists with images in "COLLECTION" status
        When the user navigates to "/collection/:id"
        Then the system displays images with "COLLECTION" status in a 3-column grid
        And each image displays its thumbnail with proper dimensions
        And images use native HTML lazy loading

    Scenario: Collection page displays images filtered by status parameter
        Given a collection exists with images in multiple statuses
        When the user navigates to "/collection/:id?status=INBOX"
        Then the system displays only images with "INBOX" status
        And the system arranges the images in a 3-column grid layout
        And thumbnails are displayed for each image

    Scenario: Collection page displays archived images
        Given a collection exists with images in "ARCHIVE" status
        When the user navigates to "/collection/:id?status=ARCHIVE"
        Then the system displays only images with "ARCHIVE" status
        And the system maintains the 3-column grid structure

    Scenario: Empty collection displays status-specific message
        Given a collection exists with no images in "INBOX" status
        When the user navigates to "/collection/:id?status=INBOX"
        Then the system displays "This collection has no images with status: \"INBOX\""
        And the system maintains the page layout

    Scenario: Empty collection displays default status message
        Given a collection exists with no images in "COLLECTION" status
        When the user navigates to "/collection/:id"
        Then the system displays "This collection has no images with status: \"COLLECTION\""
        And the system maintains the page layout

    Scenario: Collection page with non-existent collection ID
        Given no collection exists with the specified ID
        When the user navigates to "/collection/:id"
        Then the system displays a 404 error page
        And the system informs the user that the collection was not found

    Scenario: Collection page with invalid status parameter
        Given a collection exists with images
        When the user navigates to "/collection/:id?status=INVALID"
        Then the system defaults to "COLLECTION" status filter
        And the system displays images with "COLLECTION" status