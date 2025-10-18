# Change Log

## SearchPage.html
- Eliminated the remaining arrow callbacks and inline lambdas from the modal, navigation, and announcement helpers so every handler is declared with classic functions that the HTML Service parser accepts.
- Added a `safeImageUrl` helper plus attribute escaping for avatars, project media, and org-chart imagery to prevent `ERR_NAME_NOT_RESOLVED` errors when sheet URLs are empty or malformed.
- Extended every `google.script.run` invocation with paired failure handlers to surface backend errors gracefully in the UI and avoid silent button stalls.
- Logged `✅ YSP Web App Initialized OK` after the DOM wiring finishes so deployment smoke tests can verify the sandboxed script completed without syntax errors.

## QRScanner.html
- No changes in this pass; previous compatibility hardening remains valid.

## Backend_Debug.js
- Validation only; no source edits required.
