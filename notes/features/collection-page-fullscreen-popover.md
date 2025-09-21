# Feature Notes - Collection Page Fullscreen Popover

## Summary
Implements acceptance tests for a fullscreen popover feature that allows users to view original images in a modal overlay when clicking thumbnails on the collection page. The popover displays images at maximum size with proper aspect ratio preservation, includes blur background effects, and supports keyboard/mouse interactions.

## Executable Specification
Requirement File: `client/requirements/collection-page/fullscreen-popover.feature`
Acceptance Test File: `client/tests/acceptance/specs/collection-page/fullscreen-popover.spec.ts`

**Scenarios**
1. User clicks thumbnail to open popover
2. User closes popover by clicking background
3. User closes popover with Esc key
4. Popover displays on desktop viewport
5. Popover displays on tablet viewport
6. Popover displays on mobile viewport
7. Original image fails to load in popover

**Testing Notes**

### UI Model Extensions
- **CollectionPage**: Added `popover` property returning `Popover` component
- **ImageCard**: Added `clickToOpenPopover()` method for thumbnail interaction
- **Popover**: New component class with overlay, image, and error message children
- **PopoverOverlay**: Custom element class for background blur and transparency validation
- **PopoverImage**: Custom element class for viewport margin and aspect ratio validation

### Key Testing Utilities Added
- **Error Simulation**: Uses Playwright's `page.route()` to mock failed image requests for error testing
- **Multi-viewport Testing**: Tests across desktop (1200x800), tablet (768x1024), and mobile (375x667) viewports

### Implementation Expectations
- Popover elements use `data-id` attributes: `fullscreen-popover`, `popover-overlay`, `popover-image`, `popover-error-message`
- Original image endpoint: `/api/images/:collectionId/:imageId` (not thumbnail endpoint)
- Error message text: "Unable to load full image"
- Keyboard support: Escape key closes popover
- Focus management: Returns to clicked thumbnail when closed

### Test Results
- All 7 tests correctly fail with expected errors:
- Demonstrates proper test structure and validation logic

### Dependencies
- Uses existing `createCollectionFixture` for test data setup
- Follows established UI model patterns with Element base class
- Integrates with existing ImageVault test framework
- Maintains consistency with collection page testing approaches