# Feature Notes - Collection Page Slideshow

## Summary
Implements fullscreen slideshow functionality for viewing images in a collection with automatic advancement, keyboard controls, and random image ordering.

## Executable Specification
Requirement File: `client/requirements/collection-page/slideshow.feature`
Acceptance Test File: `client/tests/acceptance/specs/collection-page/slideshow.spec.ts`

**Scenarios**
- User views slideshow button on a collection page with images
- User views slideshow button on a collection page without images
- User starts slideshow from collection page
- User pauses slideshow with spacebar
- User resumes slideshow with spacebar
- User manually advances with enter key
- User closes the slideshow
- User watches a slideshow whilst curate mode is active
- An image fails to load during a slideshow
- User watches the whole slideshow

**Testing Notes**
- **UI Model Extensions**: Added `slideshowButton` to Header component and created new `Slideshow` component with methods for image validation, pause symbol management, and image advancement tracking
- **Playwright Clock API**: Used `page.clock.install()` and `page.clock.fastForward(5000)` for deterministic testing of 5-second auto-advance timing instead of `waitForTimeout()`
- **Image Validation**: Created semantic methods like `shouldShowImageFromCollection()`, `shouldShowDifferentImage()`, and `shouldShowSameImage()` to avoid direct attribute access in tests
- **Keyboard Testing**: Implemented keyboard event testing for SPACE (pause/resume), ENTER (manual advance), and ESC (close) controls
- **Advanced Network Mocking**: Used sophisticated `page.route()` patterns with request counting to dynamically fail the second image request during slideshow progression, capturing failed image IDs from actual URLs for realistic error simulation
- **State Preservation**: Verified curate mode selection state is maintained across slideshow open/close operations
- **Collection Fixtures**: Used `createCollectionFixture()` with varying image counts (0 for empty, 3 for small collection) to test different scenarios
- **Enhanced Error Handling**: Tests verify graceful handling of failed image loads with comprehensive request counting validation (expecting exactly 3 requests: initial + failed + recovery) and proper console/network error tracking
- **Loop Testing**: Implemented cycle completion testing by tracking image sequence uniqueness and verifying loop behavior

All tests correctly fail due to pending slideshow implementation, confirming proper test structure and readiness for implementation phase.