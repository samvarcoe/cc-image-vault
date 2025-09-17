Feature: Client - Collection Page - Viewing Images
    User Story: As a user, I want to view images with "COLLECTION" status in my collection, so that I can see my curated images in an organized layout

    Acceptance Criteria:
      - AC1: Collection page displays images filtered to "COLLECTION" status by default
      - AC2: Images are displayed in a responsive 3-column grid layout with consistent spacing
      - AC3: Images preserve aspect ratio and have consistent width within columns
      - AC4: All images are server-side rendered with width and height attributes to prevent layout shift
      - AC5: Images use native browser lazy loading for performance
      - AC6: Thumbnail images are displayed instead of full-size originals
      - AC7: Empty state is shown when no "COLLECTION" status images exist
      - AC8: Error state is displayed when image retrieval fails

    Notes:
      - Uses thumbnails from /api/images/:collectionId/:imageId/thumbnail endpoint
      - Responsive grid: 3 columns (desktop) → 2 columns (tablet) → 1 column (mobile)
      - All images loaded server-side to prevent layout shifts
      - Native lazy loading handled by browser with loading="lazy" attribute
      - Images are display-only with no click interactions in this iteration

    Scenario: User views collection page
        Given a collection exists with name "TestCollection"
        And the collection contains images with multiple statuses
        When the user visits the collection page "/collection/TestCollection"
        Then all "Collection" images are shown as thumbnails
        And no other images are displayed
        And image have the correct aspect ratio 
        And images use native lazy loading

    Scenario: User views collection page on desktop
        Given a collection exists with name "TestCollection"
        And the collection contains images with "COLLECTION" status
        When the user visits the collection page "/collection/TestCollection"
        Then the page displays images in a 3-column grid layout
    
    Scenario: User views collection page on tablet
        Given a collection exists with name "TestCollection"
        And the collection contains images with "COLLECTION" status
        When the user visits the collection page "/collection/TestCollection"
        Then the page displays images in a 2-column grid layout

    Scenario: User views collection page on mobile
        Given a collection exists with name "TestCollection"
        And the collection contains images with "COLLECTION" status
        When the user visits the collection page "/collection/TestCollection"
        Then the page displays images in a 1-column grid layout

    Scenario: User views collection with no "COLLECTION" status images
        Given a collection exists with name "EmptyCollection"
        And the collection contains no images with "COLLECTION" status
        When the user visits the collection page "/collection/EmptyCollection"
        Then the page displays the message "This collection has no images with \"COLLECTION\" status"
        And no image grid is displayed

    Scenario: Error occurs when retrieving collection images
        Given a collection exists with name "TestCollection"
        When the user visits the collection page "/collection/TestCollection"
        And there is an error retrieving the images
        Then the page displays the message "Error retrieving images"
        And no image grid is displayed

    Scenario: User visits collection page with non-existent collection
        Given no collection exists with name "NonExistentCollection"
        When the user visits the collection page "/collection/NonExistentCollection"
        Then the page returns a 404 status
        And no images are displayed