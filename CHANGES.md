# Change Log

## SearchPage.html
- Inlined all theme styles and feature scripts so the entire frontend lives inside a single HTML file without Apps Script includes.
- Removed references to decentralized partials and ensured the login panel remains the initial active view.
- Verified every panel script (login, homepage, directory, attendance, events, announcements, feedback, logs) loads from the consolidated bundle to keep buttons responsive.

## Backend_Debug.js
- Simplified `doGet` to always serve `SearchPage.html`, aligning with the single-frontend deployment model while preserving the health probe.
- Left the remaining backend endpoints intact so the consolidated UI can continue calling them.
