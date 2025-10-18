# Change Log

## SearchPage.html
- Switched the shared helper include to the project-level `include()` wrapper so GAS renders `Shared.html` server-side instead of surfacing the raw directive behind the login panel.
- Added defensive fallbacks for `YSP.openExternal` and `YSP.modal` so modal errors no longer short-circuit script execution when the shared bundle is missing or trimmed by the sandbox.
- Hardened `callServer` to always reach live GAS endpoints (and surface explicit errors when a handler is missing) rather than silently routing through mock data, keeping login/guest actions responsive.

## QRScanner.html
- No code changes this pass; prior DOMContentLoaded wiring and modal helpers remain valid.

## Backend_Debug.js
- Validation only; endpoints unchanged.
