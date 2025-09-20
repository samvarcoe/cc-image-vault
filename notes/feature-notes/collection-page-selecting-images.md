# Feature Notes - Collection Page - Selecting Images

## Summary
Enables users to select and deselect images when in curate mode for bulk operations. Selection is indicated by visual borders and managed through "Select All" and "Clear" buttons in the curation menu.

## Executable Specification
Requirement File: `client/requirements/collection-page/selecting-images.feature`
Acceptance Test File: `client/tests/acceptance/specs/collection-page/selecting-images.spec.ts`

**Scenarios**
- User activates curate mode
- User selects an image
- User deselects an image
- User selects all images
- User clears all selections
- User deactivates curate mode with selections
- User clicks image when not in curate mode

**Testing Notes**
The test implementation uses the existing UI model patterns with several key extensions:

1. **CurationMenu Component**: Added new class extending Element with `selectAllButton` and `clearButton` properties for accessing selection controls
2. **ImageCard Selection Methods**: Added `shouldBeSelectedForCuration()` and `shouldNotBeSelectedForCuration()` methods that verify the `data-selected` attribute to distinguish from existing aria-pressed selection methods
3. **ImageGrid Selection Verification**: Added `shouldHaveNoSelectedImages()` and `shouldHaveAllImagesSelected()` methods to verify bulk selection states using `data-selected="true"` attribute selectors
4. **Collection Fixtures**: Reused existing `createCollectionFixture()` which provides 12 images across all status types (INBOX, COLLECTION, ARCHIVE) for comprehensive testing
5. **Cross-Status Testing**: Tests verify selection functionality works across different image status views and that "Select All" operates only on currently displayed images
6. **State Persistence**: Tests confirm selection state is ephemeral and cleared when exiting curate mode, but persists during status navigation within curate mode

Key implementation considerations:
- Selection visual indicators use `data-selected` attribute rather than aria-pressed to distinguish from button states
- Selection state is contextual to curate mode - clicking images outside curate mode should not trigger selection
- "Select All" operates only on visible images for the active status view, not all images in the collection
- Selection functionality must work seamlessly with existing fullscreen popover behavior (disabled in curate mode)