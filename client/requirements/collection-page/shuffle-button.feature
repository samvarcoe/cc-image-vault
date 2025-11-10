Feature: Client - Collection Page - Shuffle Button
    User Story: As a user, I want to shuffle the images displayed on collection pages, so that I can view my images in different random orders

    Acceptance Criteria:
      - AC1: Shuffle button displays in header menu to the left of the slideshow button
      - AC2: Shuffle button is enabled when images are displayed on the current page
      - AC3: Shuffle button is disabled when no images are displayed
      - AC4: Clicking shuffle button randomly reorders the displayed images without page reload
      - AC5: Shuffle button provides visual feedback when clicked
      - AC6: Multiple clicks produce different random orders each time
      - AC7: Shuffle works consistently across all status views (COLLECTION, INBOX, ARCHIVE)
      - AC8: Fullscreen popover navigation follows shuffled order
      - AC9: Slideshow plays images in shuffled order
      - AC10: Shuffle order is not persisted when navigating to different status or refreshing page

    Notes:
      - Shuffle is visual only - no persistence to URL parameters or server state
      - Default image order is by last updated timestamp
      - Button can be clicked multiple times to generate new random orders
      - Shuffle order resets to default when user navigates away or refreshes
      - Fullscreen popover and slideshow respect the current shuffled order
      - Visual feedback on button click indicates the shuffle action completed

    Scenario: User views shuffle button on Collection page with images
        Given a Collection with images exists
        When the user views the Collection page
        Then the header displays the "Shuffle" button
        And the "Shuffle" button is enabled

    Scenario: User views shuffle button on Collection page without images
        Given an empty Collection exists
        When the user visits the Collection page
        Then the header displays the "Shuffle" button
        And the "Shuffle" button is disabled

    Scenario: User shuffles COLLECTION status images
        Given a Collection contains images with multiple statuses
        And the user is viewing the COLLECTION status page
        When the user clicks the "Shuffle" button
        Then the images reorder randomly
        And the button displays visual feedback

    Scenario: User shuffles INBOX status images
        Given a Collection contains images with multiple statuses
        And the user is viewing the INBOX status page
        When the user clicks the "Shuffle" button
        Then the images reorder randomly
        And the button displays visual feedback

    Scenario: User shuffles ARCHIVE status images
        Given a Collection contains images with multiple statuses
        And the user is viewing the ARCHIVE status page
        When the user clicks the "Shuffle" button
        Then the images reorder randomly
        And the button displays visual feedback

    Scenario: User shuffles images multiple times
        Given the user is on a Collection page with images
        And the user has clicked the "Shuffle" button once
        When the user clicks the "Shuffle" button again
        Then the images reorder into a new random sequence
        And the button displays visual feedback

    Scenario: User opens fullscreen popover after shuffling
        Given the user has shuffled images on a Collection page
        When the user opens the fullscreen popover
        Then the popover displays images in the shuffled order
        And navigation advances through images in the shuffled sequence

    Scenario: User opens slideshow after shuffling
        Given the user has shuffled images on a Collection page
        When the user opens the slideshow
        Then the slideshow displays images in the shuffled order
        And auto-advance follows the shuffled sequence

    Scenario: User refreshes page after shuffling
        Given the user has shuffled images on a Collection page
        When the user refreshes the page
        Then the images display in default order
        And the shuffle order is not preserved

    Scenario: User shuffles collection with single image
        Given the user is on a Collection page with a single image
        When the user clicks the "Shuffle" button
        Then the button displays visual feedback
        And the single image remains in place
