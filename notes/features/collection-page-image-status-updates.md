# Feature Notes - Collection Page - Image Status Updates

## Summary
Enables users to update the status of images through context-dependent curation buttons (Keep, Discard, Restore) with immediate visual feedback, progressive placeholders during API requests, and comprehensive error handling.

## Executable Specification
Requirement File: `client/requirements/collection-page/image-status-updates.feature`
Acceptance Test File: `client/tests/acceptance/specs/collection-page/image-status-updates.spec.ts`

**Scenarios**
- User views INBOX images with curate mode active
- User views COLLECTION images with curate mode active
- User views ARCHIVE images with curate mode active
- User initiates a "Keep" request
- User initiates a "Discard" request for "INBOX" images
- User initiates a "Discard" request for "COLLECTION" images
- User initiates a "Restore" request
- A status change request responds successfully
- A status change request is unsuccessful
- User updates a large number of images

**Testing Notes**
The test implementation extends the existing UI model with comprehensive status update functionality:

1. **CurationMenu Extensions**: Added `keepButton`, `discardButton`, `restoreButton`, and `errorMessage` properties to support all status update operations and error display
2. **ImageCard State Management**: Added `shouldBeHidden()`, `shouldNotBeHidden()`, and `shouldShowPlaceholder()` methods to verify the immediate visual feedback behavior where images are hidden but cards remain as placeholders
3. **Context-Dependent Button Display**: Tests verify that the correct buttons are shown based on current status view (INBOX=Keep+Discard, COLLECTION=Discard only, ARCHIVE=Restore only)
4. **API Error Simulation**: Uses Playwright's route mocking to test failure scenarios and verify error recovery behavior
5. **Progressive Visual Feedback**: Tests verify the complete user experience flow: immediate hiding → placeholder display → final removal on success OR recovery on failure
6. **Collection Fixtures**: Uses flexible `createCollectionFixture(name, count)` with configurable image count (default 12, up to 100+ for batching tests) enabling efficient testing across different scales
7. **Large-Scale Testing**: Tests with 100 images to verify real-world batching behavior, API call tracking, and system performance under load

Key validation points:
- Button visibility is context-dependent based on current status view
- Images hide immediately when action buttons are clicked (optimistic updates)
- Card placeholders remain visible during API requests
- Successful requests result in card removal
- Failed requests restore images and maintain selection state
- Error messages display in curation menu for failed operations
- All operations preserve existing selection and curate mode behaviors
- Large-scale operations (100+ images) process all items with individual API calls
- Real API integration testing via route continuation (no response mocking)

## Status Update Logic
**Keep**: INBOX → COLLECTION (images move from inbox to main collection)
**Discard**: INBOX/COLLECTION → ARCHIVE (images are archived)
**Restore**: ARCHIVE → COLLECTION (archived images return to collection)

## Implementation Requirements

### UI Model Extensions (✅ Completed)
```ts
// CurationMenu class additions
get keepButton(): Element;
get discardButton(): Element;
get restoreButton(): Element;
get errorMessage(): Element;

// ImageCard class additions
async shouldBeHidden(): Promise<void>;
async shouldNotBeHidden(): Promise<void>;
async shouldShowPlaceholder(): Promise<void>;
```

### Expected Implementation Areas
1. **View Layer**: CurationMenu component needs Keep/Discard/Restore buttons with context-dependent visibility logic
2. **Model Layer**: Status update methods with optimistic state management and error recovery
3. **Controller Layer**: Event handlers for status update buttons with batched API calls (max 10 concurrent)
4. **API Integration**: PATCH requests to `/api/images/:collectionId/:imageId` with `{status: ImageStatus}` payload
5. **Visual Feedback**: `data-hidden="true"` attribute system for immediate image hiding with placeholder cards
6. **Error Handling**: Error message display in curation menu with selection state preservation

### Technical Considerations
- **Optimistic Updates**: Images hide immediately before API confirmation
- **Placeholder System**: Cards remain visible as placeholders during requests
- **Batched Operations**: Handle large selections efficiently (10 concurrent API calls max)
- **Error Recovery**: Unhide images and maintain selection on API failures
- **State Management**: Preserve selection state across status view navigation
- **Accessibility**: Maintain ARIA states and keyboard navigation
- **Performance**: Efficient DOM updates for large image collections

## Test Failure Validation
Current test failures confirm proper TDD setup:
- Keep/Discard/Restore buttons not found (expected - not implemented)
- Image hiding behavior not implemented (expected - pending model/view logic)
- API integration pending (expected - controller implementation needed)

All tests are properly structured to pass once the corresponding functionality is implemented following established MVC patterns.

## Integration Points
- **Extends**: Existing image selection functionality
- **Requires**: Curate mode activation (already implemented)
- **Uses**: Collection fixture with 12 images per status (INBOX/COLLECTION/ARCHIVE)
- **API**: PATCH `/api/images/:collectionId/:imageId` endpoint (assumed existing)
- **Dependencies**: No additional dependencies - uses existing patterns and infrastructure