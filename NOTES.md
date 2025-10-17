# Implementation Notes

- `textOrEmpty`, `isSafeHttpUrl`, `buildGmailComposeUrl`, and `openExternal` live near the modal utilities so homepage rendering can sanitize sheet data, validate outbound links, and build Gmail compose URLs without duplicating logic elsewhere.
- The modal helper now builds DOM nodes (no template strings for the shell), traps focus with a keydown handler, closes on backdrop/ESC, and restores focus to the opener through `modalState.lastFocused`. Footer buttons just declare `data-modal-close` to opt into the shared teardown.
- `loadHomepage()` normalizes Apps Script responses that may arrive as a map or array: it derives `projects[]` from sequential `projectImageUrl_N`/`projectDesc_N` keys when the structured array is missing. Missing or unsafe URLs fall back to placeholders.
- Facebook and Gmail buttons are only wired when URLs survive validation; offline/local preview mode renders explicit disabled messaging so tests can pass without Apps Script connectivity.
- `switchPanels()` updates `location.hash` for `#homepage`/`#login` so the Back requirement maps the homepage directly to the login panel without touching `Code.gs` or `UserProfiles.gs`.
