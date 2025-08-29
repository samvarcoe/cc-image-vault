# Feature Notes - Collection Page Image Popover

## Summary
Enables users to click on image thumbnails in the collection page to view them at full size in a centered popover, providing detailed image examination without leaving the collection context.

## Executable Specification
**Requirement File:** `requirements/ui/collection-page-image-popover.feature`
**Acceptance Test File:** `tests/ui/specs/collection-page-image-popover.spec.ts`

**Scenarios**
- User opens popover by clicking thumbnail
- Popover displays full-size image when it fits viewport
- Popover scales down large image to fit viewport
- User closes popover by clicking outside image
- User closes popover with ESC key

**Testing Notes**
The test implementation uses a specialized fixture system for testing image scaling behaviors at different viewport sizes. Key testing components include:

- **PopoverFixtures**: Creates collections with images specifically sized relative to 1920x1080 viewport
  - Small images (800x600, 600x800) that fit within viewport with 5% margin
  - Large images (2400x1600, 1200x1800) that exceed viewport effective area
  - Both landscape and portrait orientations for comprehensive scaling tests

- **ImagePopoverComponent**: UI Model component encapsulating popover interactions
  - Full-size image display verification (non-thumbnail URLs)
  - Native vs scaled sizing assertions with aspect ratio preservation
  - Background blur/overlay effect detection via CSS classes
  - Thumbnail disable/enable state management
  - Viewport centering calculations with 5px tolerance

- **Collection Page Enhancements**: Extended existing CollectionPage model
  - Added popover interaction methods (clickImageThumbnail, shouldHavePopoverOpen/Closed)
  - Integrated with existing image grid functionality
  - Maintains consistency with current UI Model patterns

- **Viewport Configuration**: Explicit 1920x1080 viewport in playwright.config.ts
  - Effective area calculations: 1824x1026 (with 5% margin)
  - Predictable sizing behavior for automated scaling tests

- **Visual State Assertions**: CSS class-based blur detection for fast execution
  - Background effects verification without visual snapshots
  - Thumbnail interaction state checking via DOM properties
  - Popover positioning validation using getBoundingClientRect

The test suite uses proper TDD approach - tests are implemented first and will guide the implementation. All fixtures clean up automatically and tests run in parallel-safe manner.

## Interfaces
```typescript
// Extension to existing CollectionPageModel for popover state
interface CollectionPageModel {
  // Existing properties...
  
  // New popover-specific state
  isPopoverOpen(): boolean;
  getPopoverImageId(): string | null;
  openPopover(imageId: string): void;
  closePopover(): void;
}

// Extension to existing CollectionPageView for popover rendering
interface CollectionPageView {
  // Existing methods...
  
  // New popover rendering methods
  renderPopover(): string;
  renderPopoverBackdrop(): string;
}

// Extension to existing CollectionPageController for popover interactions
interface CollectionPageController {
  // Existing methods...
  
  // New popover event handlers
  handleThumbnailClick(imageId: string): void;
  handlePopoverClose(): void;
  handleEscKeyPress(event: KeyboardEvent): void;
  handleBackdropClick(event: MouseEvent): void;
}
```