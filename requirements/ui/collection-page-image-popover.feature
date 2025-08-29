Feature: Collection Page - Full Size Image Popover
    User Story: As a user, I want to click on image thumbnails to view them at full size in a popover, so that I can examine image details without leaving the collection page.

    Acceptance Criteria
      - AC1: Clicking a thumbnail opens a popover displaying the full resolution image
      - AC2: Image displays at full size if it fits within viewport with 5% margin
      - AC3: Image scales down to fit viewport with 5% margin when native size exceeds viewport
      - AC4: Popover centers the image in the viewport
      - AC5: Opening popover applies light blur and semi-transparent overlay to entire page background
      - AC6: Clicking outside the image closes the popover and removes background effects
      - AC7: Pressing ESC key closes the popover and removes background effects
      - AC8: Only one popover displays at a time
      - AC9: Clicking on other thumbnails is disabled when popover is open

    Scenario: User opens popover by clicking thumbnail
        Given a collection page displays images in the grid
        When the user clicks on an image thumbnail
        Then the system displays the full resolution image in a centered popover
        And the system applies light blur and semi-transparent overlay to the page background
        And the images in the background are disabled from full-screen viewing

    Scenario: Popover displays full-size image when it fits viewport
        Given a collection contains an image smaller than viewport with 5% margin
        When the user clicks on the image thumbnail
        Then the system displays the image at its native size in the popover
        And the image centers in the viewport

    Scenario: Popover scales down large image to fit viewport
        Given a collection contains an image larger than viewport with 5% margin
        When the user clicks on the image thumbnail
        Then the system displays the image scaled to fit within viewport with 5% margin
        And the image maintains its original aspect ratio
        And the image centers in the viewport

    Scenario: User closes popover by clicking outside image
        Given a popover displays a full-size image
        When the user clicks outside the image area
        Then the system closes the popover
        And the system removes the blur and overlay from the page background
        And the other images reenabled for full-screen viewing

    Scenario: User closes popover with ESC key
        Given a popover displays a full-size image
        When the user presses the ESC key
        Then the system closes the popover
        And the system removes the blur and overlay from the page background
        And the other images reenabled for full-screen viewing