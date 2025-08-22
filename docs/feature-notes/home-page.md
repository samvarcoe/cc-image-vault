# Feature Notes - Home Page

## Summary
UI feature implementing the main entry point for the Image Vault application. Provides collection management functionality including creation, deletion, and navigation to individual collection pages.

## Executable Specification
**Requirement File:** `requirements/ui/home-page.feature`  
**Acceptance Test File:** `tests/ui/specs/home-page.spec.ts`

**Scenarios**
- Collections exist in the system - displays alphabetical list with navigation links
- No collections exist in the system - shows empty state with creation option
- User creates their first collection - successful creation flow from empty state
- User creates an additional collection - creation flow with existing collections
- User attempts to create a collection with an invalid ID - client-side validation prevents submission
- Collection creation with duplicate ID - server-side error handling and user feedback
- User attempts to delete a collection - confirmation dialog with warning
- User confirms deletion of a collection - successful deletion with UI update
- User cancels deletion of a collection - cancellation preserves collection

**Testing Notes**
Comprehensive UI test suite using full system integration approach. Tests utilize the established fixture pattern for automatic cleanup and API integration for collection state setup. Key implementation details:

- **HomePageFixtures**: Uses CollectionsAPI for setting up test scenarios via HTTP endpoints rather than direct domain manipulation
- **ImageVaultApp**: Main application entry point extending base App class with Image Vault-specific monitoring
- **HomePageDriver**: Page object providing semantic interaction methods and business workflow abstractions
- **ConfirmationDialogComponent**: Reusable modal component for deletion confirmation UI patterns

Tests execute against live development server with Playwright browser automation, following the project's no-mocking philosophy. All tests include error monitoring and API validation to ensure system integrity.

## Interfaces
```ts
// Collection display data
interface CollectionListItem {
  id: string;
}

// Collection creation request
interface CreateCollectionRequest {
  id: string; // validated pattern: /^[a-zA-Z0-9-]+$/
}

// UI Routes
GET / - Home page displaying all collections

// Expected HTML structure for testing
[data-testid="collections-list"] - Container for collection items
[data-testid="collection-item-{id}"] - Individual collection list item
[data-testid="collection-link-{id}"] - Navigation link to collection page  
[data-testid="delete-button-{id}"] - Delete action trigger
[data-testid="create-collection-form"] - New collection creation form
[data-testid="collection-id-input"] - Collection ID input field
[data-testid="create-button"] - Form submission button
[data-testid="validation-error"] - Client-side validation error display
[data-testid="duplicate-id-error"] - Server-side duplicate error display
[data-testid="empty-state"] - Message when no collections exist
[data-testid="confirmation-dialog"] - Deletion confirmation modal
[data-testid="confirm-button"] - Confirmation action in modal
[data-testid="cancel-button"] - Cancellation action in modal
[data-testid="collection-id-display"] - Collection ID in confirmation dialog
[data-testid="warning-message"] - Deletion warning text
```