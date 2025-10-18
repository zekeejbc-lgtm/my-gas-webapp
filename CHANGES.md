# Change Log

## SearchPage.html
- Applied a viewport-aware minimum height to the homepage panel and introduced the `.push-bottom` helper so the login return control anchors consistently on both mobile and desktop.
- Upgraded contact buttons to share the `.btn-primary` styling, normalize Facebook URLs that omit the protocol, validate outbound destinations before opening new tabs, and guard Gmail compose links behind the helper sanitizer.
- Escaped multi-line project descriptions when building modal content, trimming empty lines and preventing HTML injection while preserving the fade/scale animation.
- Added an inline guest-login modal that captures the visitor's full name, logs the access (ID `Visitor`) via `logAccess`, and routes directly to the homepage once confirmed. The login buttons now declare `type="button"` so Apps Script's default form wrapper cannot swallow clicks.
- Centralized panel hash routing so every `switchPanels` call updates `location.hash` (`#dashboard`, `#homepage`, `#login`, etc.), guaranteeing consistent back-navigation across desktop and mobile.

## QRScanner.html
- No source edits required; retained the October 2025 blueprint implementation after syntax validation.

## Backend_Debug.js
- No modifications per scope (validation only).
