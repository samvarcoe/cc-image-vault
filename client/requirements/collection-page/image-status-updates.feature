Feature: Client - Collection Page - Image Status Updates
    User Story: As a user, I want to update the status of my images, so that I can efficiently move images between INBOX, COLLECTION, and ARCHIVE views

    Acceptance Criteria:
        - AC1: Curate menu buttons are context dependent based on current status view
        - AC2: INBOX status shows "Keep" and "Discard" buttons
        - AC3: COLLECTION status shows "Discard" button only
        - AC4: ARCHIVE status shows "Restore" button only
        - AC5: "Keep" updates status to "COLLECTION"
        - AC6: "Discard" updates status to "ARCHIVE"
        - AC7: "Restore" updates status to "COLLECTION"
        - AC8: Selected images are hidden when the request is made but their card remain visible (as a placeholder)
        - AC9: Image cards are removed when the request is successful
        - AC10: Images are unhidden if the request fails
        - AC11: Images remain selected until the request succeeds (selection persists on failure)
        - AC12: Status update buttons are disabled when no images are selected

    Notes:
        - Status update operations only apply to currently selected images
        - Visual feedback provides immediate response while maintaining placeholders
        - Error recovery ensures users can retry failed operations
        - Buttons follow existing curate menu design patterns with left/right positioning
        - All operations use existing API endpoints (PATCH /api/images/:collectionId/:imageId)
        - Selection state management follows existing patterns from image selection feature
        - Status update operations should handle large selections efficiently
        - Requests should be sent with controlled concurrency to avoid overwhelming the server (batches of 10)
        - User should see progressive feedback as images are processed

    Scenario: User views INBOX images with curate mode active
        Given the user is on a Collection page
        And the current status view is "INBOX"
        And curate mode is active
        When the page loads
        Then the curation menu displays "Keep" and "Discard" buttons
        And the "Restore" button is not displayed

    Scenario: User views COLLECTION images with curate mode active
        Given the user is on a Collection page
        And the current status view is "COLLECTION"
        And curate mode is active
        When the page loads
        Then the curation menu displays "Discard" button
        And the "Keep" and "Restore" buttons are not displayed

    Scenario: User views ARCHIVE images with curate mode active
        Given the user is on a Collection page
        And the current status view is "ARCHIVE"
        And curate mode is active
        When the page loads
        Then the curation menu displays "Restore" button only
        And the "Keep" button is not displayed

    Scenario: User initiates a "Keep" request
        Given multiple "INBOX" images are selected
        When the user clicks the "Keep" button
        Then the selected images are immediately hidden
        But the image cards remain visible as a placeholder
    
    Scenario: User initiates a "Discard" request for "INBOX" images
        Given multiple "INBOX" images are selected
        When the user clicks the "Discard" button
        Then the selected images are immediately hidden
        But the image cards remain visible as a placeholder

    Scenario: User initiates a "Discard" request for "COLLECTION" images
        Given multiple "COLLECTION" images are selected
        When the user clicks the "Discard" button
        Then the selected images are immediately hidden
        But the image cards remain visible as a placeholder

    Scenario: User initiates a "Restore" request
        Given multiple "ARCHIVE" images are selected
        When the user clicks the "Restore" button
        Then the selected images are immediately hidden
        But the image cards remain visible as a placeholder

    Scenario: A status change request responds successfully
        Given a status change request is initiated
        When the response is successful
        Then the selected image card is removed

    Scenario: A status change request is unsuccessful
        Given a status change request is initiated
        When the response is unsuccessful
        Then the image on the image card is displayed
        And the image is still selected
        And an error message "Unable to complete update for all Images" is displayed in the curation menu

    Scenario: User updates a large number of images
        Given many images are selected
        When the user performs a status update
        Then all of the images are updated successfully