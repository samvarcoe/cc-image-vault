# Feature Notes - Collection Page Curate Mode

## Summary
Implements curate mode functionality for collection pages, allowing users to toggle into a specialized curation interface for bulk operations. The feature adds a curate button to the header menu and displays a sticky curation menu when activated, controlled via URL query parameters.

## Executable Specification
Requirement File: `client/requirements/collection-page/curate-mode.feature`
Acceptance Test File: `client/tests/acceptance/specs/collection-page/curate-mode.spec.ts`

**Scenarios**
1. User navigates to a Collection page with "?curate=true" set
2. User navigates to a Collection page with "?curate=false" set
3. User navigates to a Collection page without "?curate" set
4. User activates curate mode
5. User deactivates curate mode
6. User scrolls the Collection page
7. User clicks on an image with curate mode activated
8. User navigates between status views with curate mode activated
9. User navigates between status views without curate mode activated
10. User refreshes the Collection page with curate mode activated
11. User refreshes the Collection page without curate mode activated

**Testing Notes**
- Tests implemented using Playwright with 1:1 mapping to Gherkin scenarios
- Extended CollectionPage UI Model with `curateButton` element in Header class and `curationMenu` element in main CollectionPage class
- Leveraged existing `shouldBeSticky()` method from base Element class for sticky positioning verification
- Used `createCollectionFixture` for consistent test setup across scenarios
- Tests verify URL parameter handling, button state management, menu visibility, and interaction behavior
- All tests currently fail as expected due to pending curate mode implementation in the MVC components

**Implementation Requirements Identified**
- **Model**: Add curate mode state to CollectionPageData interface
- **View**: Add curate button to header (right side) and curation menu component with sticky positioning
- **Controller**: Implement URL query parameter parsing, button click handlers, and curate mode state management
- **URL State**: Handle `?curate=true/false` parameter persistence across navigation and refresh
- **Integration**: Disable fullscreen popover functionality when curate mode is active
- **Responsive**: Ensure consistent behavior across mobile, tablet, and desktop viewports