# Feature Notes - Viewing Collections

## Summary
User can view their collections on the home page in a card-based layout, with appropriate messages for empty state and error conditions.

## Executable Specification
Requirement File: `client/requirements/home-page/viewing-collections.feature`
Acceptance Test File: `client/tests/acceptance/specs/viewing-collections.spec.ts`

**Scenarios**
- User visits home page and collections exist
- User navigates to a collection from the home page
- User visits home page and no collections exist
- Error occurs when loading collections on home page

**Testing Notes**
- **UI Model Extensions**: Enhanced `HomePage` class with collection card elements and assertion methods. Added `CollectionCard` component for reusable card interactions including link verification.
- **Test Data Setup**: Uses domain `Collection.create()` to set up real collection data. `Collection.clear()` called in `beforeEach` for test isolation.
- **Error Simulation**: Uses `X-Test-Force-FS-Error` header to simulate filesystem failures for error scenario testing.
- **Element Selectors**: Tests expect specific data-testid attributes:
  - `[data-id="collection-card-${name}"]` - Individual collection card elements
  - `[data-id="collection-title"]` - Collection name display element
  - `[data-id="user-message"]` - State and error messages
- **Link Verification**: Tests verify collection cards link to `/collection/:id` using href attribute validation
- **Message Validation**: Exact string matching for error messages:
  - No collections: "No Collections found, create one to get started"
  - Error loading: "Unable to load collections"

All tests now pass with complete implementation. Tests validate HTML structure, data attributes, state handling, and navigation.

## UI Design
**Mockups**
- `client/src/mockups/home-collections-success.html` - Home page with collections displayed in clean list layout
- `client/src/mockups/home-collections-empty.html` - Home page empty state with helpful message
- `client/src/mockups/home-collections-error.html` - Home page error state with error message

**References**
- `/workspace/projects/ui-reference/lists/stacked-lists/with_links.html` - Clickable list items with navigation
- `/workspace/projects/ui-reference/application-shells/stacked/with_lighter_page_header.html` - Simple header pattern

**Design Features**
- **Desktop-Optimized Layout**: Centered content optimized for 1920x1080 displays with responsive scaling
- **Professional Styling**: Clean TailwindCSS implementation with subtle shadows and hover effects
- **Minimal Design**: Focus on requirements only - no decorative icons or unnecessary elements
- **Application Shell**: Simple header with "Image Vault" branding and clean typography
- **Responsive Design**: Scales from mobile (375px) to desktop (1920px) with appropriate text sizes and spacing

**Technical Implementation**
- TailwindCSS via CDN for reliable styling in mockups
- Required data attributes: `data-id="collection-card-${name}"`, `data-id="collection-title"`, `data-id="user-message"`
- Semantic HTML with proper accessibility (role="list", clickable areas)
- Dark mode support throughout all states
- Flexbox centering for optimal desktop presentation
- Responsive typography: `text-base lg:text-lg` for readability across devices

**Layout Specifications**
- **Desktop**: Centered content with `max-w-4xl`, larger text and generous padding
- **Mobile**: Compact layout with `max-w-2xl`, appropriate touch targets
- **Header**: Fixed `h-16` with clean typography, consistent across all states
- **Content Area**: Vertical centering using `min-h-[calc(100vh-4rem)]` for full-screen layout

## Interfaces
```ts
// client/src/pages/home/model.ts
export interface HomePageData {
  collections?: string[];
  error?: string;
  loading?: boolean;
}

export default class HomePageModel extends Model<HomePageData> {
  async loadCollections(): Promise<void>
  getCollections(): string[]
  hasError(): boolean
  getErrorMessage(): string
  hasCollections(): boolean
  isLoading(): boolean
}
```

## Implementation Summary
Complete home page implementation for viewing collections with card-based layout, error handling, and empty state support.

**Key Components:**
- **HomePageModel**: Manages collection data loading via Domain layer with comprehensive error handling
- **HomePageView**: Renders responsive HTML with three states (success, empty, error) using TailwindCSS
- **Server Integration**: Direct domain integration with `Collection.list()` and test error simulation
- **UI Testing**: Fixed href attribute validation and URL comparison for proper test coverage

**Data Flow:**
1. Client route (`/`) → HomePageModel loads collections via `Collection.list()`
2. HomePageView renders appropriate state based on model data
3. Collection cards link to `/collection/:id` for navigation
4. Error simulation via `X-Test-Force-FS-Error` header for testing

## Technical Notes
- **Refactored Architecture**: Eliminated code duplication through component-based rendering methods with 4-space indentation
- **Fixed Test Infrastructure**: Async href attribute validation (`client/tests/ui-model/base/element.ts:189`) and URL pathname comparison (`client/tests/ui-model/base/ui.ts:143`)
- **Server-side Data Loading**: Direct domain integration prevents client-server data mismatch issues
- **Component Structure**: Clean separation with `header()`, `main()`, `pageHeader()`, `mainContentContainer()`, and state-specific rendering methods
- **All 4 acceptance test scenarios pass** with comprehensive coverage and visual consistency maintained
