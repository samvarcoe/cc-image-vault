# Feature Notes - Collection Page Header Menu

## Summary
Persistent header menu for collection pages that provides navigation back to home and status filtering controls. The header remains sticky during scrolling and is positioned correctly relative to fullscreen popovers.

## Executable Specification
Requirement File: `client/requirements/collection-page/header-menu.feature`
Acceptance Test File: `client/tests/acceptance/specs/collection-page/header-menu.spec.ts`

**Scenarios**
- User navigates to the Collection page
- User navigates to the Home page via the Image Vault link
- User scrolls the Collection page
- User navigates between status views
- User opens the fullscreen popover

**Testing Notes**
The test implementation follows TDD principles and validates all 7 acceptance criteria through 5 comprehensive scenarios. Key implementation details:

- **UI Model Extensions**: Extended `CollectionPage` class with `Header`, `StatusToggle`, and `StatusButton` components following established patterns
- **Home Page Validation**: Added header element to `HomePage` class to test AC7 (header absence on home page)
- **Interaction Testing**: Tests validate sticky positioning through scroll interactions, URL parameter updates for status navigation, and z-index behavior with fullscreen popovers
- **Data-ID Selectors**: Uses semantic data-id attributes for reliable element selection:
  - `[data-id="header-menu"]` - Main header container
  - `[data-id="image-vault-link"]` - Home navigation link
  - `[data-id="status-toggle"]` - Status button group
  - `[data-id="status-button-{STATUS}"]` - Individual status buttons
- **Selection State**: Status buttons use CSS classes with `selected` pattern for visual state indication
- **Position Testing**: Custom `getBoundingBox()` and `getZIndex()` methods added to validate sticky positioning and layering behavior

All tests pass successfully with the native HTML implementation.

## Interfaces
```typescript
// No new interfaces required - uses existing ImageStatus type
type ImageStatus = 'COLLECTION' | 'INBOX' | 'ARCHIVE';
```

## Implementation Summary
Sticky header menu for collection pages with native HTML navigation. Provides home navigation link and status toggle buttons that update URL parameters immediately upon clicking. Header is positioned behind fullscreen popovers and excluded from home page. Status buttons are centered with flexbox layout, leaving space for future features on the right.

## Technical Notes
- **Native HTML Navigation**: All navigation handled through standard anchor tags (`<a href="...">`) eliminating JavaScript event handlers for better performance and accessibility
- **Flexbox Layout**: Three-column flex layout with `flex-1` spacers to center status buttons, leaving room for future features on the right side of the header
- **Status Selection**: Current status determined from URL parameter, selected button styled with darker background using conditional CSS classes
- **Sticky Positioning**: CSS `sticky top-0` keeps header fixed during scroll with `z-40` layering below popover's `z-50`
- **ARIA Attributes**: `aria-pressed` indicates button selection state for screen readers
- **URL-Based State**: Status parameter in URL drives entire UI state, enabling browser back/forward navigation and bookmarking
- **Button Order**: Status buttons displayed as INBOX, COLLECTION, ARCHIVE to match workflow progression