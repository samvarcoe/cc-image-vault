# Feature Notes - Viewing Collections

## Summary
User can view their collections on the home page in a card-based layout, with appropriate messages for empty state and error conditions.

## Executable Specification
Requirement File: `client/requirements/home-page/viewing-collections.feature`
Acceptance Test File: `client/tests/acceptance/specs/viewing-collections.spec.ts`

**Scenarios**
- User visits home page and collections exist
- User visits home page and no collections exist
- Error occurs when loading collections on home page

**Testing Notes**
- **UI Model Extensions**: Enhanced `HomePage` class with collection card elements and assertion methods. Added `CollectionCard` component for reusable card interactions including link verification.
- **Test Data Setup**: Uses domain `Collection.create()` to set up real collection data. `Collection.clear()` called in `beforeEach` for test isolation.
- **Error Simulation**: Uses `X-Test-Force-FS-Error` header to simulate filesystem failures for error scenario testing.
- **Element Selectors**: Tests expect specific data-testid attributes:
  - `[data-testid="collection-cards"]` - Container for all collection cards
  - `[data-testid="collection-card"]` - Individual collection card elements
  - `[data-testid="collection-card"][data-collection-name="name"]` - Specific collection cards
  - `[data-testid="collection-name"]` - Collection name display element
  - `[data-testid="no-collections-message"]` - Empty state message
  - `[data-testid="error-message"]` - Error state message
- **Link Verification**: Tests verify collection cards link to `/collection/:id` using href attribute validation
- **Message Validation**: Exact string matching for error messages:
  - No collections: "No Collections found, create one to get started"
  - Error loading: "Unable to load collections"

All tests fail as expected due to pending home page implementation. Tests will guide implementation by specifying required HTML structure and data attributes.