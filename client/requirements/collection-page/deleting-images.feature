Feature: Client - Collection Page - Deleting Images
    User Story: As a user, I want to delete images from my archive, so that I can permanently remove unwanted images from my collection

    Acceptance Criteria:
      - AC1: "Delete" button appears only when viewing ARCHIVE status images in curate mode
      - AC2: "Delete" button is disabled when no images are selected
      - AC3: Confirmation dialog appears before delete operation is performed
      - AC4: Users can cancel the delete operation from the confirmation dialog
      - AC5: Users can continue with the delete operation from the confirmation dialog
      - AC6: Images remain selected when user cancels delete operation
      - AC7: Selected images are hidden immediately when delete is confirmed
      - AC8: Image cards remain visible as placeholders during deletion
      - AC9: Image cards are removed when deletion is successful
      - AC10: Images are unhidden and remain selected if deletion fails
      - AC11: Error messages are displayed in the curation menu on deletion failure
      - AC12: Visual indicators, workflow, and error behavior match status-updates pattern

    Notes:
      - Delete button appears in the curation menu alongside other contextual buttons
      - Confirmation dialog follows the modal pattern similar to fullscreen popover
      - Deletion operations use the existing DELETE /api/images/:collectionId/:imageId endpoint
      - Deletions are processed in batches of 10 to avoid overwhelming the server
      - Users see progressive feedback as images are processed
      - Permanent deletion cannot be undone, hence the confirmation requirement
      - Only ARCHIVE status images can be deleted to prevent accidental loss of active images

    Scenario: User views ARCHIVE images with curate mode active
        Given the user is on a Collection page
        And the current status view is "ARCHIVE"
        And curate mode is active
        When the page loads
        Then the curation menu displays the "Delete" button

    Scenario: User views COLLECTION images with curate mode active
        Given the user is on a Collection page
        And the current status view is "COLLECTION"
        And curate mode is active
        When the page loads
        Then the "Delete" button is not displayed

    Scenario: User views INBOX images with curate mode active
        Given the user is on a Collection page
        And the current status view is "INBOX"
        And curate mode is active
        When the page loads
        Then the "Delete" button is not displayed

    Scenario: User initiates delete operation
        Given multiple "ARCHIVE" images are selected
        When the user clicks the "Delete" button
        Then a confirmation dialog appears
        And the dialog message says "Are you sure you want to permanently delete these images? This action cannot be undone."
        And the dialog shows "Cancel" and "Delete" buttons

    Scenario: User cancels delete operation
        Given the delete confirmation dialog is displayed
        And multiple images are selected
        When the user clicks the "Cancel" button
        Then the confirmation dialog is closed
        And the selected images remain selected
        And no deletion request is made

    Scenario: User confirms delete operation
        Given the delete confirmation dialog is displayed
        And multiple images are selected
        When the user clicks the "Delete" button in the dialog
        Then the confirmation dialog is closed
        And the selected images are immediately hidden
        But the image cards remain visible as placeholders

    Scenario: Delete operation completes successfully
        Given a delete request is initiated
        When all deletion requests complete successfully
        Then the selected image cards are removed from the page
        And no error messages are displayed

    Scenario: Delete operation fails partially
        Given a delete request is initiated for multiple images
        When some deletion requests fail
        Then the successfully deleted image cards are removed
        And the failed images are unhidden and remain selected
        And an error message "Unable to delete all images" is displayed in the curation menu

    Scenario: Delete operation fails completely
        Given a delete request is initiated
        When all deletion requests fail
        Then all images are unhidden and remain selected
        And an error message "Unable to delete images" is displayed in the curation menu

    Scenario: User deletes a large number of images
        Given many "ARCHIVE" images are selected
        When the user confirms the delete operation
        Then all of the images are deleted successfully