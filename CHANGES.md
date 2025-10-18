# Change Log

## SearchPage.html
- Rebuilt the modal helper with plain DOM APIs (`createElement`, `onclick`) and `var` declarations so the Apps Script HTML Service stops raising `Unexpected identifier 'modal'` and all login buttons remain interactive.
- Extended `safeImageUrl` fallback coverage and swapped placeholder hosts to `placehold.co` to prevent `ERR_NAME_NOT_RESOLVED` console noise when sheet-driven media is blank or invalid.
- Left the DOM wiring log (`✅ YSP Web App Initialized OK`) in place for deployment smoke tests after the compatibility fixes.

## QRScanner.html
- No code changes this pass; prior DOMContentLoaded wiring and modal helpers remain valid.

## Backend_Debug.js
- Validation only; endpoints unchanged.
