Feature: Client - Collection Page - Curate Mode
    User Story: As a user, I want to activate a curate mode on collection pages, so that I can access bulk curation functionality while browsing images

    Acceptance Criteria:
      - AC1: Curate button displays on the right side of the header menu
      - AC2: Curate button toggles curate mode on/off 
      - AC3: Curate mode tracked with URL query parameter
      - AC4: Curate button shows selected state when curate mode is active
      - AC5: Curation menu displays below header when curate mode is active
      - AC6: Curation menu remains sticky when user scrolls the page
      - AC7: Fullscreen popover is disabled when in curate mode
      - AC8: Curate mode works across all image status views (COLLECTION, INBOX, ARCHIVE)
      - AC9: Curate mode persists across page refresh and navigation

    Notes:
      - Curate mode is controlled by `?curate=true` URL query parameter
      - Curation menu contains placeholder content for future bulk operations
      - Sticky positioning ensures curation menu stays below the sticky header
      - Button only toggles mode - no other exit methods provided
      - Responsive behavior is consistent across mobile, tablet, and desktop

    Scenario: User navigates to a Collection page with "?curate=true" set
        Given the user navigates to a Collection page
        And "?curate=true" is set in the URL
        When the page loads
        Then "?curate=true" persists in the URL
        And the "Curate" button displays in selected state
        And the curation menu displays below the header 

    Scenario: User navigates to a Collection page with "?curate=false" set
        Given the user navigates to a Collection page
        And "?curate=false" is set in the URL
        When the page loads
        Then "?curate=false" persists in the URL
        And the "Curate" button displays in unselected state
        And the curation menu is not displayed

    Scenario: User navigates to a Collection page without "?curate" set
        Given the user navigates to a Collection page
        And "?curate" is not set in the URL
        When the page loads
        Then the query parameter is updated to "?curate=false" in the URL 
        And the "Curate" button displays in unselected state
        And the curation menu is not displayed

    Scenario: User activates curate mode
        Given the user is viewing a Collection page
        And the page is not in curate mode
        When the user clicks the "Curate" button in the header
        Then the "Curate" button displays in selected state
        And the curation menu displays below the header
        And the query parameter is updated to "?curate=true" in the URL
        
    Scenario: User deactivates curate mode
        Given the user is viewing a Collection page
        And the page is in curate mode
        When the user clicks the "Curate" button in the header
        Then the "Curate" button displays in unselected state
        And the curation menu is hidden
        And the query parameter is updated to "?curate=false" in the URL 

    Scenario: User scrolls the Collection page
        Given the user is on a Collection page with many images
        And the page is in curate mode
        When the user scrolls down the page
        Then the header remains fixed at the top of the viewport
        And the curation menu remains positioned directly below the header
        And the curation menu is visible on top of the images

    Scenario: User clicks on an image with curate mode activated
        Given the user is on a Collection page with curate mode active
        When the user clicks on a thumbnail image
        Then the fullscreen popover does not open

    Scenario: User navigates between status views with curate mode activated
        Given the user is viewing a Collection page
        And the page is in curate mode
        When the user clicks on a Status toggle button
        Then "?curate=true" persists in the URL
        And curate mode remains active

    Scenario: User navigates between status views without curate mode activated
        Given the user is viewing a Collection page
        And the page is not in curate mode
        When the user clicks on a Status toggle button
        Then "?curate=false" persists in the URL
        And curate mode remains inactive

    Scenario: User refreshes the Collection page with curate mode activated
        Given the user is viewing a Collection page
        And the page is in curate mode
        When the user refreshes the page
        Then "?curate=true" persists in the URL
        And curate mode remains active

    Scenario: User refreshes the Collection page without curate mode activated
        Given the user is viewing a Collection page
        And the page is not in curate mode
        When the user refreshes the page
        Then "?curate=false" persists in the URL
        And curate mode remains inactive