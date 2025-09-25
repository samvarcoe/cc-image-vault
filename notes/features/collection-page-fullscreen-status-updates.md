# Feature Notes - Fullscreen Status Updates

## Summary
Enables users to update image status while viewing images in the fullscreen popover using keyboard shortcuts, with context-specific success/error messaging and automatic image advancement.

## Implementation Details
- **Tab Key**: Keep INBOX images (move to COLLECTION), Restore ARCHIVE images (move to COLLECTION)
- **Backspace Key**: Discard INBOX/COLLECTION images (move to ARCHIVE)
- **Context-Specific Constraints**: COLLECTION images don't respond to Tab, ARCHIVE images don't respond to Backspace
- **Status Messages**: Absolute positioning with backdrop styling to prevent layout shift
- **Timing**: 500ms delay after success message before advancing to next image

## Executable Specification
Requirement File: `client/requirements/collection-page/fullscreen-status-updates.feature`
Acceptance Test File: `client/tests/acceptance/specs/collection-page/fullscreen-status-updates.spec.ts`

**Scenarios**
- User successfully keeps an INBOX image
- User successfully discards an INBOX image
- User successfully discards a COLLECTION image
- User successfully restores an ARCHIVE image
- Status update request fails
- User views a "COLLECTION" image in fullscreen
- User views an "ARCHIVE" image in fullscreen

**Testing Notes**
- Uses Playwright clock control (`page.clock.install()` and `page.clock.fastForward(500)`) for precise 500ms timing verification
- Extended Popover class in UI model with `statusMessage` element and keyboard shortcut methods (`pressTab()`, `pressBackspace()`)
- **Key Implementation Detail**: Tests use `page.keyboard.press()` rather than `locator.press()` because keyboard event listeners are attached to `document`, not the popover element
- Tests keyboard shortcuts: Tab for Keep/Restore operations, Backspace for Discard operations
- **Full system tests**: Only mocks API responses for error scenarios (500 status), success scenarios test real system end-to-end
- **Context-specific success messages**: "Image moved to COLLECTION" and "Image moved to ARCHIVE" provide clear user feedback
- Success messages appear immediately, then after 500ms delay image advances and message is hidden
- **Improved error UX**: Error messages now timeout after 500ms delay instead of persisting indefinitely
- **Layout Shift Prevention**: Status messages use absolute positioning (`absolute bottom-8 left-1/2`) with backdrop styling (`bg-black bg-opacity-75`) to overlay on image without affecting layout
- Includes proper DOM verification flow: ensures messages are displayed before testing they disappear (avoids false positives)
- **Status-specific restrictions**: Tests verify wrong keyboard shortcuts don't trigger API calls (COLLECTION images reject Tab, ARCHIVE images reject Backspace)
- Positive keyboard shortcut cases covered in main success scenarios, negative cases tested separately
- Follows existing test patterns from fullscreen-popover and image-status-updates specifications
- Perfect 1:1 mapping: 7 Gherkin scenarios correspond exactly to 7 test implementations