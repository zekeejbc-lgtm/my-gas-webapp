# Change Log

## SearchPage.html
- Wrapped the entire UI script in a DOMContentLoaded-ready IIFE, keeping all element lookups and event wiring inside the callback so Apps Script loads without touching undefined nodes.
- Replaced modal, timeout, and focus helpers with plain functions (no arrow/destructured defaults) and added a reusable `isValidHttpUrl` plus placeholder fallbacks so contact buttons and project media never emit broken links.
- Updated all login, guest-flow, and navigation handlers to attach after the DOM is ready using classic function expressions, ensuring the Apps Script sandbox no longer raises `Unexpected identifier 'modal'` and every button responds again.
- Cleaned the homepage renderers to reuse the sanitized helpers, verify external URLs before injection, and keep modal/project markup generated with `document.createElement`.

## QRScanner.html
- Rebuilt the scanner script as a DOM-ready IIFE that declares state locally, swaps every arrow/implicit default for traditional functions, and starts the camera only after the HTML service finishes loading.
- Hardened manual attendance and modal handlers with explicit callbacks, Promise chaining, and guarded status updates so the sandboxed environment no longer blocks button clicks or camera flips.

## Backend_Debug.js
- Validation only; no source edits.
