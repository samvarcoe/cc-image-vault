# Feature Notes - Shuffle Button

## Summary
Enables users to randomize the display order of images on collection pages. The shuffle button appears in the header menu and provides visual feedback when clicked. Shuffled order applies to the main grid view, fullscreen popover navigation, and slideshow playback. The shuffle state is temporary and resets when navigating away or refreshing the page.

## Executable Specification
**Requirement File:** `client/requirements/collection-page/shuffle-button.feature`

**Acceptance Test File:** `client/tests/acceptance/specs/collection-page/shuffle-button.spec.ts`

**Scenarios:**
1. User views shuffle button on Collection page with images
2. User views shuffle button on Collection page without images
3. User shuffles COLLECTION status images
4. User shuffles INBOX status images
5. User shuffles ARCHIVE status images
6. User shuffles images multiple times
7. User opens fullscreen popover after shuffling
8. User opens slideshow after shuffling
9. User refreshes page after shuffling
10. User shuffles collection with single image

## Testing Notes

### Test Implementation Approach
- **Fixture Strategy:** Three fixtures created to cover different scenarios:
  - `shuffle-standard`: 5 COLLECTION, 2 INBOX, 2 ARCHIVE images
  - `shuffle-empty`: No images (tests disabled state)
  - `shuffle-single`: 1 image (tests edge case)

- **Randomness Verification:** Tests verify shuffle functionality by capturing image order before and after shuffle operations, then confirming the orders differ. This avoids brittle assertions on specific sequences while still validating randomization behavior.

- **Order Tracking:** Custom helper function `getDisplayedImageIds()` extracts image IDs from DOM in display order for comparison across shuffle operations.

- **Integration Testing:** Scenarios 7-8 verify that shuffled order is preserved when opening popover and slideshow:
  - Popover navigation follows shuffled sequence (verified via Tab key navigation)
  - Slideshow auto-advance respects shuffled order (verified using clock control)

- **State Reset Testing:** Scenario 9 verifies shuffle state doesn't persist by comparing default order before shuffle with order after page refresh.

### UI Model Updates
Added `shuffleButton` getter to `Header` class in `client/tests/ui-model/pages/collection.ts`:
```typescript
get shuffleButton(): Element {
    return this.child(Element, 'Shuffle Button', '[data-id="shuffle-button"]');
}
```

### Key Implementation Details for Feature Development
1. **Existing Shuffle Algorithm:** A Fisher-Yates shuffle implementation already exists in `client/src/pages/collection/model.ts:515-524` and is currently used by the slideshow feature. This can be reused for the shuffle button functionality.

2. **Visual Feedback:** User requested "CSS animation, quick flash" effect when button is clicked.

3. **Button Position:** Should appear before the slideshow button in the header menu.

4. **State Management:** Shuffle state stored only in page model (not URL parameters), ensuring it resets on navigation or refresh.

5. **Expected Model Changes:**
   - Add `isShuffled: boolean` state flag
   - Add `originalImageOrder` to preserve default order
   - Add `shuffleImages()` and `resetImageOrder()` methods

6. **Expected View Changes:**
   - Add shuffle button with `data-id="shuffle-button"`
   - Position between status toggle and slideshow button
   - Enable/disable based on image presence

7. **Expected Controller Changes:**
   - Add click handler for shuffle button
   - Call `model.shuffleImages()` and trigger view update
   - Apply CSS animation for visual feedback
