# Responsive Test Checklist

All tests were executed with the updated HTML/CSS and should be repeated after future changes.

## 360px (mobile portrait)
1. Load `SearchPage.html`; confirm the login panel fills the viewport without excessive top/bottom padding, the logo/title/subtitle stack stays centered, and no horizontal scroll is present.
2. Tap the password field and the eye toggle — ensure focus outlines are visible and the toggle hit area is comfortable.
3. Complete a guest login; verify the main menu buttons stack vertically and the announcements badge stays within the card.
4. Open the Search panel, type two characters, use Arrow Down/Up to move the highlight, and press Enter to select a suggestion; the list should stay inside the card without horizontal scroll.
5. Clear the field (Escape or blur) and confirm the list hides while the “No officers found” message appears when searching nonsense text.
6. Open the announcements modal and manual attendance modal from the search results; both should fit the screen height with internal scrolling only.
7. From the menu, open the homepage panel; project cards should display as a single column grid with balanced margins.

## 768px (tablet portrait)
1. On the main menu, ensure the avatar row aligns side-by-side with breathing room and the card retains rounded corners.
2. Trigger "Open Scanner"; verify a new tab opens (or a message appears in preview) without throwing console errors.
3. Load feedback and access logs; tables should fit the width without horizontal scrolling and maintain readable font sizes.
4. Resize announcements panel filters; dropdown and button should remain on a single row without wrapping, and subtitles stay centered.

## 1024px (tablet landscape / small desktop)
1. Login as a real user (or mock) to view the profile panel; confirm the two-column grid renders with consistent card heights and gaps.
2. Scroll within a tall panel (e.g., announcements) and ensure the internal scrollbar appears while the page background remains fixed.
3. Open and close the QR modal, verifying focus returns to the triggering button and the modal backdrop covers the entire viewport.
4. Navigate back to the search panel, confirm the combobox retains keyboard support, and the suggestions list never overlaps the panel header.

## 1440px (desktop)
1. Verify the main panel centers with balanced side padding, the header logo/title/subtitle block aligns centrally, and no extra blank space appears around the panel.
2. Inspect the project gallery; multiple cards should render in a row via the CSS grid with uniform spacing.
3. Open attendance transparency; table columns should stay left-aligned and readable without stretching excessively.
4. Refresh the page to confirm returning users auto-load when `getSession` is available (if testing in Apps Script) without exposing console errors.

## QRScanner.html specific checks
- At 360px, confirm the scanner container remains centered, the YSP logo/heading/subtitle stay aligned, buttons stack full-width, and there is no blank space below the card.
- At 768px and above, ensure the QR preview maintains its aspect ratio and manual entry modal appears centered with scrollable content if needed.
- Press the Flip Camera button (if visible); the stream should restart on the alternate camera and the status bar should announce the change.
- Resize the viewport (or rotate the device) and confirm the preview recalculates without clipping or leaving blank bands.
- Test manual entry: open the modal, hit ESC to close, reopen to confirm inputs reset. Submit a sample ID to observe the status toast and its 4-second timeout.

## Keyboard & accessibility spot checks
- From the login panel, use the Tab key to navigate through inputs, buttons, menu items, and modals; focus rings should be visible on every interactive element.
- When any modal is open, press Shift+Tab to cycle backwards and ensure focus remains within the modal; closing should return focus to the opener.
- On QRScanner, verify `Back to Menu` closes the Apps Script container when embedded and `window.close()` fallback works in a standalone window.
- On QRScanner, tab through Manual Entry → Flip Camera → Back to ensure focus order is logical and Flip Camera disappears entirely when only one camera is detected.
- Confirm there is no horizontal scroll on any page at 360px width after interacting with content.
- Verify the animated gradient stops when `prefers-reduced-motion` is enabled in the browser/OS settings.

