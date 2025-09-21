# Feature Notes - Creating Collections

## Summary
Enables users to create new Collections directly from the home page through an inline creation form that appears as the last item in the collection list.

## Executable Specification
Requirement File: `client/requirements/home-page/creating-collections.feature`
Acceptance Test File: `client/tests/acceptance/specs/creating-collections.spec.ts`

**Scenarios**
- User views the Collection creation form
- User attempts creation with a valid Collection name
- The creation request succeeds
- The creation request fails
- User attempts to create a Collection with a duplicate name
- User attempts creation with an empty Collection name
- User attempts creation with an invalid Collection name
- User attempts creation with a Collection name that is too long
- User edits an invalid Collection name

**Testing Notes**
The test implementation covers all scenarios from the feature file, including form visibility, validation rules, loading states, and error handling.

Key UI model additions:
- Added `CreationForm` component to `HomePage` with elements for name input, submit button, loading spinner, and validation messages
- Added helper methods `submitWithName()`, `shouldShowLoadingState()`, and `shouldNotShowLoadingState()` for cleaner test code

Tests verify:
- Form is always visible at bottom of collection list with correct placeholder text
- Client-side validation mirrors API rules (empty, invalid chars, length > 256)
- Loading state during submission (spinner shown, button text hidden)
- Successful creation adds collection without page refresh
- Form clears after successful creation
- Network errors are displayed appropriately
- Validation errors clear when user edits input
- No API requests are made when validation fails client-side

The tests use HTTP headers to simulate server errors (`X-Test-Force-Server-Error`) following the existing pattern in the codebase. All tests are currently failing as expected, waiting for implementation of the creation form functionality.
