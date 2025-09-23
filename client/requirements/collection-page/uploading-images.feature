Feature: Client - Images - Upload
    User Story: As a user, I want to upload images to my collection, so that I can add new images to my INBOX for curation

    Acceptance Criteria:
      - AC1: "Upload" button appears in header menu next to "Curate" button on all collection pages
      - AC2: Upload button opens a file browser dialog using native HTML input
      - AC3: Dialog supports both click-to-browse and drag-and-drop file selection
      - AC4: Users can select multiple image files (JPG/JPEG, PNG, WebP)
      - AC5: Users can "Cancel" or "Add" files via dialog buttons
      - AC6: Upload button shows spinner and is disabled during upload process
      - AC7: Upload requests are processed in batches of maximum 10 concurrent requests
      - AC8: Navigation warning appears when users try to navigate during upload
      - AC9: Users can choose to "Leave" or "Stay on Page" when upload is in progress
      - AC10: All uploaded images are added with INBOX status
      - AC11: Upload button returns to normal state after completion
      - AC12: Error message appears if some uploads fail

    Notes:
      - Upload button is always visible in header, not dependent on current status view
      - Uses native HTML file input with accept="image/*" and multiple attributes
      - Drag-and-drop provides enhanced UX but click-to-browse remains primary interaction
      - File validation relies on API/domain layer validation for supported formats
      - Navigation warning uses browser beforeunload event for page navigation
      - Batch processing follows existing patterns from status updates and deletion
      - Error handling follows existing curation menu error display patterns
      - Upload button text changes from "Upload" to spinner during processing

    Scenario: User views Collection page header
        Given a Collection exists
        When the user visits the Collection page
        Then the header displays the "Upload" button
        And the "Upload" button is enabled

    Scenario: User opens upload dialog
        Given the user is on a Collection page
        When the user clicks the "Upload" button
        Then a file browser dialog opens
        And the dialog accepts image files (JPG, JPEG, PNG, WebP)
        And the dialog allows multiple file selection
        And the dialog shows "Cancel" and "Add" buttons

    Scenario: User submits images for upload
        Given the file browser dialog is open
        When the user submits images for upload
        Then the dialog closes
        And the upload process begins
        And the "Upload" button shows a spinner
        And the "Upload" button is disabled

    Scenario: User cancels file selection
        Given the file browser dialog is open
        When the user clicks "Cancel"
        Then the dialog closes
        And no upload process begins
        And the "Upload" button remains enabled

    Scenario: Upload completes successfully
        Given files are being uploaded
        When all upload requests complete successfully
        Then the "Upload" button spinner is removed
        And the "Upload" button text returns to "Upload"
        And the "Upload" button is enabled
        And no error messages are displayed

    Scenario: Upload fails partially
        Given files are being uploaded
        When some upload requests fail
        Then the "Upload" button spinner is removed
        And the "Upload" button text returns to "Upload"
        And the "Upload" button is enabled
        And the error message "Unable to upload some images" is displayed in the header

    Scenario: Upload fails completely
        Given files are being uploaded
        When all upload requests fail
        Then the "Upload" button spinner is removed
        And the "Upload" button text returns to "Upload"
        And the "Upload" button is enabled
        And the error message "Unable to upload some images" is displayed in the header

    Scenario: User attempts to navigate during upload
        Given files are being uploaded
        When the user attempts to navigate away from the page
        Then a warning dialog appears
        And the dialog message says "Upload currently in progress, pending image uploads will be canceled if you leave the page"
        And the dialog shows "Leave" and "Stay on Page" buttons

    Scenario: User chooses to stay during upload
        Given the navigation warning dialog is displayed
        When the user clicks "Stay on Page"
        Then the warning dialog closes
        And the user remains on the current page
        And the upload process continues

    Scenario: User chooses to leave during upload
        Given the navigation warning dialog is displayed
        When the user clicks "Leave"
        Then the user navigates away from the page

    Scenario: User uploads large number of files
        Given the user has selected many image files
        When the upload process begins
        Then all files are processed successfully

    Scenario: User uploads invalid file type
        Given the user has submitted a mixture of valid and non-image files
        When the process concludes
        Then the valid image files are uploaded successfully
        And the error message "Unable to upload some images" is displayed