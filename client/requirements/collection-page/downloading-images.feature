Feature: Client - Collection Page - Download Images
    User Story: As a user, I want to download images from my collection, so that I can save them to my local filesystem

    Acceptance Criteria:
      - AC1: "Download" button appears in the Curate menu on the left side
      - AC2: "Download" button is disabled when no images are selected
      - AC3: "Download" button is enabled when one or more images are selected
      - AC4: Single image downloads individually with original filename
      - AC5: Multiple images download as ZIP archive
      - AC6: ZIP archive name follows format: [collection name]-[status]-images.zip
      - AC7: Download button shows loading state during download process
      - AC8: Download button returns to normal state after download completes
      - AC9: Error messages display in curation menu following existing patterns
      - AC10: Download works across all status views (COLLECTION, INBOX, ARCHIVE)

    Notes:
      - Download button positioned on left side of curation menu with other operation buttons
      - Download uses browser's native download mechanism (Content-Disposition: attachment)
      - Individual downloads use GET /api/images/:collectionId/:imageId/download
      - Batch downloads use POST /api/images/:collectionId/download with imageIds and archiveName
      - Archive name is validated by API layer (alphanumeric, dashes, underscores only)
      - No confirmation dialog required (non-destructive operation)
      - Images remain visible throughout download process
      - Loading state follows existing pattern from upload feature

    Scenario: User views INBOX images with curate mode active
        Given the user is viewing "INBOX" images
        When the user activates curate mode
        Then the "Download" button is displayed in the curation menu
        And the "Download" button is disabled

    Scenario: User views COLLECTION images with curate mode active
        Given the user is viewing "COLLECTION" images
        When the user activates curate mode
        Then the "Download" button is displayed in the curation menu
        And the "Download" button is disabled

    Scenario: User views ARCHIVE images with curate mode active
        Given the user is viewing "ARCHIVE" images
        When the user activates curate mode
        Then the "Download" button is displayed in the curation menu
        And the "Download" button is disabled

    Scenario: User selects some images
        Given curate mode is active
        When the user selects some images
        Then the "Download" button is enabled

    Scenario: User downloads a single image
        Given one image is selected
        When the user clicks the "Download" button
        Then the "Download" button shows a spinner
        And the "Download" button is disabled
        And the browser downloads the image with its original filename

    Scenario: User downloads multiple images
        Given multiple images are selected
        When the user clicks the "Download" button
        Then the "Download" button shows a spinner
        And the "Download" button is disabled
        And the browser downloads a ZIP archive named "[collection name]-[status]-images.zip"

    Scenario: Download completes successfully
        Given a download is in progress
        When the download completes successfully
        Then the "Download" button spinner is removed
        And the "Download" button is enabled
        And no error messages are displayed

    Scenario: Download fails with API error
        Given images are selected
        When the user clicks the "Download" button
        And the API returns an error response
        Then the "Download" button spinner is removed
        And the "Download" button is enabled
        And an error message "Unable to download image(s)" is displayed in the curation menu