Feature: Client - Collection Page - Slideshow
    User Story: As a user, I want to view a fullscreen slideshow of images in my collection, so that I can passively browse through my images in a randomized continuous loop

    Acceptance Criteria:
      - AC1: "Slideshow" button displays in header menu before "Curate" and "Upload" buttons
      - AC2: Slideshow button is disabled when no images are available for current status
      - AC3: Slideshow displays images from current status filter in fullscreen view
      - AC4: Images are shown in random order without repeats until all images displayed, then loops
      - AC5: Images advance automatically every 5 seconds
      - AC6: Previous image remains visible until next image fully loads
      - AC7: Images that fail to load are skipped automatically
      - AC8: ESC key closes slideshow and preserves previous page state
      - AC9: SPACE key toggles pause/resume of auto-advance
      - AC10: ENTER key advances to next image immediately
      - AC11: Pause symbol (⏸) displays in bottom right corner when paused
      - AC12: Curate mode state is preserved when slideshow opens and closes

    Notes:
      - Slideshow uses original images from /api/images/:collectionId/:imageId endpoint
      - Random shuffle ensures all images shown once before repeating
      - After showing all images, slideshow loops back to start with new random order
      - Failed image loads are logged but don't interrupt slideshow flow
      - Keyboard controls work consistently across all viewport sizes
      - Compatible with existing fullscreen popover implementation patterns

    Scenario: User views slideshow button on a collection page with images
        Given a collection with images exists
        When the user views the images on the collection page
        Then the header displays the "Slideshow" button
        And the "Slideshow" button is enabled

    Scenario: User views slideshow button on a collection page without images
        Given an empty collection exists
        When the user visits the collection page
        Then the header displays the "Slideshow" button
        And the "Slideshow" button is disabled

    Scenario: User starts slideshow from collection page
        Given the user is on a collection page with images
        When the user clicks the "Slideshow" button
        Then the slideshow opens in fullscreen view
        And the first random image is displayed
        And the image advances every 5 seconds

    Scenario: User pauses slideshow with spacebar
        Given a slideshow is running
        When the user presses the SPACE key
        Then the auto-advance pauses
        And the pause symbol (⏸) appears in the bottom right corner
        And the current image remains displayed

    Scenario: User resumes slideshow with spacebar
        Given a slideshow is paused
        When the user presses the SPACE key
        Then the auto-advance resumes
        And the pause symbol disappears
        And the image advances every 5 seconds

    Scenario: User manually advances with enter key
        Given a slideshow is running
        When the user presses the ENTER key
        Then the slideshow immediately advances to the next random image
        And the image advances every 5 seconds

    Scenario: User closes the slideshow
        Given a slideshow is running
        When the user presses the ESC key
        Then the slideshow is closed

    Scenario: User watches a slideshow whilst curate mode is active
        Given the user is on a collection page with curate mode active
        And multiple images are selected
        When the user opens and closes the slideshow
        Then curate mode remains active
        And the images are still selected

    Scenario: An image fails to load during a slideshow
        Given a slideshow is running
        When an image fails to load
        Then the slideshow automatically skips to the next image
        And the image advances every 5 seconds

    Scenario: User watches the whole slideshow
        Given a slideshow has displayed all available images once
        When the current cycle completes
        Then the slideshow starts again
        And the image advances every 5 seconds

