Feature: Client - Collection Page - Fullscreen Popover
    User Story: As a user, I want to click on a thumbnail to view the original image in a fullscreen popover, so that I can see image details clearly without navigating away from the collection page

    Acceptance Criteria:
      - AC1: Clicking any thumbnail opens a popover displaying the original image
      - AC2: Popover displays images at native resolution
      - AC3: Image is fully visible within the viewport
      - AC4: Background area outside popover has light blur and semi-transparent overlay
      - AC5: Clicking anywhere on the screen closes the popover
      - AC6: Pressing Esc key closes the popover
      - AC7: Error message displays when original image fails to load
      - AC8: Popover works for any image displayed on collection page

    Notes:
      - Uses original images from /api/images/:collectionId/:imageId endpoint
      - 10px padding around the popover
      - Focus is trapped within popover and returned to clicked thumbnail when closed
      - No loading indicators - image displays when ready
      - Error state shows "Unable to load full image" message
      - Works with any image status that might be displayed on collection page

    Scenario: User clicks thumbnail to open popover
        Given a collection exists with name "TestCollection"
        And the collection contains images with "COLLECTION" status
        When the user visits the collection page "/collection/TestCollection"
        And the user clicks on a thumbnail image
        Then the popover displays the original image
        And the image is fully visible within the viewport
        And the background has a blurred semi-transparent effect

    Scenario: User closes popover by clicking background
        Given a collection page is open with an image popover displayed
        When the user clicks on the background overlay
        Then the popover closes
        And the user returns to the collection page view

    Scenario: User closes popover with Esc key
        Given a collection page is open with an image popover displayed
        When the user presses the Esc key
        Then the popover closes
        And the user returns to the collection page view

    Scenario: Popover displays on desktop viewport
        Given a collection page is open on desktop
        When the user clicks on a thumbnail image
        Then the popover displays the original image
        And the image is fully visible within the viewport

    Scenario: Popover displays on tablet viewport
        Given a collection page is open on tablet
        When the user clicks on a thumbnail image
        Then the popover displays the original image
        And the image is fully visible within the viewport

    Scenario: Popover displays on mobile viewport
        Given a collection page is open on mobile
        When the user clicks on a thumbnail image
        Then the popover displays the original image
        And the image is fully visible within the viewport

    Scenario: Original image fails to load in popover
        Given a collection page is open
        When the user clicks on a thumbnail image
        And the original image fails to load
        Then the popover displays the message "Unable to load full image"
        And the user can still close the popover normally