Feature: Client - Collection Page - Selecting Images
    User Story: As a user, I want to select and deselect images when in curate mode, so that I can mark images for bulk operations

    Acceptance Criteria:
      - AC1: Image selection is toggled on click when in curate mode
      - AC2: Images are not selectable when not in curate mode
      - AC3: "Select All" and "Clear" buttons display on the left side of the curate menu
      - AC4: "Select All" button selects all visible images in current status view
      - AC5: "Clear" button clears all current selections
      - AC6: Curate mode persists after clearing selections
      - AC7: Selection functionality works across all image status views

    Notes:
      - Visual selection indicator is a light border around the image container
      - Border styling does not affect the thumbnail image itself
      - Click behavior on images is contextual: fullscreen popover when not in curate mode, selection toggle when in curate mode
      - Selection state is ephemeral and not persisted across page loads or navigation
      - "Select All" operates only on currently displayed images for the active status

    Scenario: User activates curate mode
        Given the Collection page is not in curate mode
        When the user clicks the "Curate" button
        Then the curation menu displays the "Select All" and "Clear" buttons
        And no images are selected

    Scenario: User selects an image
        Given the Collection page is in curate mode
        When the user clicks on an image thumbnail
        Then the image is selected

    Scenario: User deselects an image 
        Given multiple images are selected
        When the user clicks on a selected image thumbnail
        Then the image is deselected
        And the other selected images remain selected

    Scenario: User selects all images
        Given the Collection page is in curate mode
        And multiple images are displayed
        When the user clicks the "Select All" button
        Then all images on the page are selected

    Scenario: User clears all selections
        Given multiple images are selected
        When the user clicks the "Clear" button
        Then all images are deselected
        And the page remains in curate mode

    Scenario: User deactivates curate mode with selections
        Given multiple images are selected
        When the user deactivates curate mode
        Then all images are deselected

    Scenario: User clicks image when not in curate mode
        Given the Collection page is not in curate mode
        When the user clicks on an image thumbnail
        Then the image is not selected