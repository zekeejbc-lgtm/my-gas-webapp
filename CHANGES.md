# Change Log

## SearchPage.html
- Applied a viewport-aware minimum height to the homepage panel and introduced the `.push-bottom` helper so the login return control anchors consistently on both mobile and desktop.
- Upgraded contact buttons to share the `.btn-primary` styling, validated outbound URLs before opening new tabs, and guarded Gmail compose links behind the helper sanitizer.
- Escaped multi-line project descriptions when building modal content, trimming empty lines and preventing HTML injection while preserving the fade/scale animation.

## QRScanner.html
- No source edits required; retained the October 2025 blueprint implementation after syntax validation.

## Backend_Debug.js
- No modifications per scope (validation only).
