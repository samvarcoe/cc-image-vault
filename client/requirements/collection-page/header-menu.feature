Feature: Client - Collection Page - Header Menu
    User Story: As a user, I want a persistent header menu on collection pages, so that I can easily navigate home and switch between image status views

    Acceptance Criteria:
      - AC1: Header displays "Image Vault" text link that navigates to home page
      - AC2: Header remains sticky at top of viewport when scrolling
      - AC3: Status toggle displays as button group with COLLECTION/INBOX/ARCHIVE options
      - AC4: Currently selected status button displays with darker background color
      - AC5: Clicking status buttons immediately navigates to corresponding URL with status parameter
      - AC6: Header positioning stays behind fullscreen popover when active
      - AC7: Header does not display on home page

    Notes:
      - Header uses simple text "Image Vault" link, not logo or icon
      - Status buttons update URL immediately without additional confirmation
      - Sticky positioning fixed to top of viewport across all device sizes
      - Selected status button visual state matches current URL status parameter
      - Z-index ensures fullscreen popover appears above header

    Scenario: User navigates to the Collection page
        Given a Collection exists
        When the user visits the Collection page
        Then the page displays the header menu at the top of the page
        And the header contains the "Image Vault" text link
        And the header contains the Status toggle buttons
        And the button corresponding to the current status shows as selected
        And the other buttons show as unselected

    Scenario: User navigates to the Home page via the Image Vault link
        Given is on a Collection page
        When the user clicks the "Image Vault" link in the header
        Then the user is navigated to the home page "/"

    Scenario: User scrolls the Collection page
        Given the user is on a Collection page with many images
        When the user scrolls down the page
        Then the header remains fixed at the top of the viewport
        And the header is visible on top of the images

    Scenario: User navigates between status views
        Given the user is on a Collection page
        When the user clicks on a Status toggle button
        Then the user is navigated to "/collection/TestCollection?status=[STATUS]"

    Scenario: User opens the fullscreen popover
        Given user is on a Collection page
        When the user opens a fullscreen image popover
        Then the fullscreen popover covers the header