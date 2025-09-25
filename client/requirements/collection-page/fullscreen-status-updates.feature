Feature: Client - Images - Fullscreen Status Updates
    User Story: As a user, I want to update image status while viewing images in fullscreen popover, so that I can efficiently curate my collection without returning to the grid view

    Acceptance Criteria:
      - AC1: Available keyboard shortcuts match context of current status view
      - AC2: Tab key initiates Keep request (INBOX view) or Restore request (ARCHIVE view)
      - AC3: Backspace key initiates Discard request (INBOX and COLLECTION views)
      - AC4: Delete functionality has no keyboard shortcut (requires confirmation dialog)
      - AC5: Success message "Image status updated" displays under the image
      - AC6: Image advances to next in sequence after 500ms delay on successful update
      - AC7: Success message is hidden when image advances to next
      - AC8: Error message "Unable to update image status" displays under image on failure
      - AC9: Error message persists until user navigates away or closes popover
      - AC10: Image does not advance when status update fails

    Notes:
      - Integrates with existing fullscreen popover navigation and display
      - Follows existing status update patterns from curate mode
      - Uses same API endpoints as batch status updates (PATCH /api/images/:collectionId/:imageId)
      - Respects existing navigation logic for advancing to next image (follows current status filter)
      - Messages display in popover overlay, positioned under the image
      - Keyboard shortcuts only available when popover is open and focused
      - Status updates apply to single image being viewed, not batch operations

    Scenario: User successfully keeps an INBOX image
        Given the user is viewing an "INBOX" image in fullscreen
        And the user has initiated a request to "Keep" the image
        When the update is successful
        Then the status of the image is updated to "COLLECTION"
        And a success message is displayed: "Image moved to COLLECTION"
        And after 500ms delay the popover advances to the next image
        And the success message is hidden

    Scenario: User successfully discards an INBOX image
        Given the user is viewing an "INBOX" image in fullscreen
        And the user has initiated a request to "Discard" the image
        When the update is successful
        Then the status of the image is updated to "ARCHIVE"
        And a success message is displayed: "Image moved to ARCHIVE"
        And after 500ms delay the popover advances to the next image
        And the success message is hidden

    Scenario: User successfully discards a COLLECTION image
        Given the user is viewing a "COLLECTION" image in fullscreen
        And the user has initiated a request to "Discard" the image
        When the update is successful
        Then the status of the image is updated to "ARCHIVE"
        And a success message is displayed: "Image moved to ARCHIVE"
        And after 500ms delay the popover advances to the next image
        And the success message is hidden

    Scenario: User successfully restores an ARCHIVE image
        Given the user is viewing an "ARCHIVE" image in fullscreen
        And the user has initiated a request to "Restore" the image
        When the update is successful
        Then the status of the image is updated to "COLLECTION"
        And a success message is displayed: "Image moved to COLLECTION"
        And after 500ms delay the popover advances to the next image
        And the success message is hidden

    Scenario: User exits fullscreen mode after updating images
        Given the user is viewing a fullscreen image 
        And the user has updated some images since entering fullscreen mode
        When the user exits fullscreen mode
        Then the image grid reflects the updates they made

    Scenario: User updates the last image
        Given the user is viewing a fullscreen image
        And it is the only image with the current status
        When the user updates the status of the image
        Then fullscreen mode is closed
        And the empty state message is displayed

    Scenario: Status update request fails
        Given the user is viewing an image in fullscreen
        And the user has initiated a status update request
        When the update fails
        Then the error message "Unable to update image status" displays under the image
        And the image does not advance to the next image
        And the error message is hidden after 500ms delay

    Scenario: User views a "COLLECTION" image in fullscreen
        Given a collection contains a "COLLECTION" image
        When the user views the image in fullscreen
        Then the user is only able to initiate a "Discard" request

    Scenario: User views an "ARCHIVE" image in fullscreen
        Given the user is viewing an "ARCHIVE" image in fullscreen
        When the user views the image
        Then the user is only able to initiate a "Restore" request