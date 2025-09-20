Feature: Client - Collection Page - Viewing Images
    User Story: As a user, I want to view images in my Collection, so that I can see my curated images in an organized layout

    Acceptance Criteria:
      - AC1: Collection page displays images filtered by the status in the URL search params
      - AC2: Collection page redirects to "?status=COLLECTION" if a Status is not provided
      - AC3: Images are displayed in a responsive 3-column grid layout with consistent spacing
      - AC4: Images preserve aspect ratio and have consistent width within columns
      - AC5: All images are server-side rendered with width and height attributes to prevent layout shift
      - AC6: Images use native browser lazy loading for performance
      - AC7: Thumbnail images are displayed instead of full-size originals
      - AC8: Empty state is shown when no "COLLECTION" status images exist
      - AC9: Error state is displayed when image retrieval fails

    Notes:
      - Uses thumbnails from /api/images/:CollectionId/:imageId/thumbnail endpoint
      - Responsive grid: 3 columns (desktop) → 2 columns (tablet) → 1 column (mobile)
      - All images loaded server-side to prevent layout shifts
      - Native lazy loading handled by browser with loading="lazy" attribute
      - Images are display-only with no click interactions in this iteration

    Scenario: User views the Collection page with no Status set
        Given a Collection exists with name "TestCollection"
        When the user visits the Collection page without a Status set in the URL
        Then the user is redirected to "/collection/TestCollection?status=COLLECTION"

    Scenario: User views Collection images on the Collection page
        Given a Collection exists with name "TestCollection"
        And the Collection contains images with multiple statuses
        When the user visits the Collection page "/collection/TestCollection?status=COLLECTION"
        Then all "COLLECTION" images are shown as thumbnails
        And no other images are displayed
        And images have the correct aspect ratio 
        And images use native lazy loading

    Scenario: User views INBOX images on the Collection page
        Given a Collection exists with name "TestCollection"
        And the Collection contains images with multiple statuses
        When the user visits the Collection page "/collection/TestCollection?status=INBOX"
        Then all "INBOX" images are shown as thumbnails
        And no other images are displayed
        And images have the correct aspect ratio 
        And images use native lazy loading

    Scenario: User views ARCHIVE images on the Collection page
        Given a Collection exists with name "TestCollection"
        And the Collection contains images with multiple statuses
        When the user visits the Collection page "/collection/TestCollection?status=ARCHIVE"
        Then all "ARCHIVE" images are shown as thumbnails
        And no other images are displayed
        And images have the correct aspect ratio 
        And images use native lazy loading

    Scenario: User views Collection page on desktop
        Given a Collection exists with name "TestCollection"
        And the Collection contains images with "Collection" status
        When the user visits the Collection page
        Then the page displays images in a 3-column grid layout
    
    Scenario: User views Collection page on tablet
        Given a Collection exists with name "TestCollection"
        And the Collection contains images
        When the user visits the Collection page
        Then the page displays images in a 2-column grid layout

    Scenario: User views Collection page on mobile
        Given a Collection exists with name "TestCollection"
        And the Collection contains images
        When the user visits the Collection page
        Then the page displays images in a 1-column grid layout

    Scenario: User views Collection with no images for a specific Status
        Given a Collection exists with name "EmptyCollection"
        And the Collection contains no images with a specific Status
        When the user visits the Collection page with that Status
        Then the page displays the message "This Collection has no images with \"[STATUS]\" status"
        And no image grid is displayed

    Scenario: Error occurs when retrieving Collection images
        Given a Collection exists with name "TestCollection"
        When the user visits the Collection page
        And there is an error retrieving the images
        Then the page displays the message "Error retrieving images"
        And no image grid is displayed

    Scenario: User visits Collection page with non-existent Collection
        Given no Collection exists with name "NonExistentCollection"
        When the user visits the Collection page
        Then the page returns a 404 status
        And no images are displayed