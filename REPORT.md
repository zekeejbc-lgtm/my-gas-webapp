# Audit Report — YSP Tagum Member Web App

## 1. SearchPage.html
### Current feature set & flow
- Multi-panel single-page app that swaps panels via `switchPanels()` and CSS classes. Panels include login, main menu, search, homepage, feedback, access logs, profile, announcements, and attendance transparency.
- Login captures username/password, calls `checkLogin`, stores the authenticated user in `appState`, fetches avatar/profile, and assembles a role-aware menu (home, QR tools, announcements, etc.).
- Guest login skips authentication and opens the homepage in read-only mode.
- Search panel filters officer records in-memory (`appState.officerData`) with live suggestions, keyboard-accessible navigation (Arrow keys/Enter/Escape), and status messaging before opening a manual attendance modal wired to the backend.
- Homepage pulls rich content (mission, vision, projects) and presents modal details per project card.
- Announcements list renders cards with mark-read and modal view actions, includes creator-only modal for creating announcements.
- Attendance transparency fetches per-user records and renders a table summarizing events, time in/out, and inferred status.
- Feedback, access logs, and profile panels load corresponding datasets on demand with table/card layouts.
- Modal helper renders a single reusable dialog (`#modal-root`) for announcements, QR code display, manual attendance, etc., while headings/ARIA wiring keep focus trapped until closure.

### Frontend ↔ backend touchpoints
- Authentication & session: `checkLogin({ username, password })` persists the last user in `PropertiesService`, and `getSession()` bootstraps returning visitors when available.
- Profile & avatar: `getUserProfile(idCode)`.
- Officer data & events: `getOfficerData()`, `getEvents()` for privileged roles.
- Homepage content: `getHomepageContent()`.
- Announcements: `getAnnouncements()`, `createAnnouncement(payload)`, `markAnnouncementRead(userId, announcementId)`.
- Attendance records: `recordManualAttendance(idCode, status)`, `getAttendanceTransparencyForUser(idCode)`.
- Feedback/logs: `getFeedback()`, `getAccessLogs()`.
- Utilities: modal-based QR preview uses QRCode.js locally without backend calls.
- New scanner entry point: `getQrScannerUrl()` opens the QR scanner web app in a new tab when available.

### UI/CSS structure & observations
- Body retains the animated tri-color gradient but now overlays a subtle white wash, centers `#app` with `flex` + `min-height:100dvh`, and uses clamp-based padding tokens so there is no dead space at the top or bottom on any viewport.
- Each panel uses the new `.panel-header` (logo, title, optional subtitle) and `.panel-body` wrappers; widths clamp between 520–840px, internal gaps rely on shared spacing tokens, and scrollbars stay inside the frosted card shell.
- Form-heavy sections adopt `.form-stack` and `.panel-actions`, ensuring inputs/buttons share consistent spacing while button rows automatically stack on phones.
- The suggestions list is now a styled `.suggestions-list`/`.suggestion-item` component that hides via the `hidden` attribute, highlights the active option, and syncs `aria-activedescendant` as the user navigates with the keyboard.
- Utility classes like `.media-stack`, `.info-grid`, `.directory-result`, and `.panel-divider` replace prior inline style clusters so avatar rows, profile cards, and action grids remain balanced as breakpoints change.
- Media queries at 1024px, 820px, 600px, and 420px adjust padding, border radii, and layout direction while `prefers-reduced-motion` disables the gradient animation for accessibility.

## 2. QRScanner.html
### Current feature set & flow
- Loads `Html5Qrcode` to stream the environment camera, auto-pauses between scans, and calls `recordAttendanceScan(idCode)` for automatic Present status.
- Offers a Flip Camera control (when multiple cameras are detected) and auto-resizes the `qrbox` after orientation or viewport changes.
- Manual entry modal allows admins to submit `recordManualAttendance(id, status)` when a QR scan fails.
- Back button closes the Apps Script host window when embedded or window/tab otherwise.

### Frontend ↔ backend touchpoints
- `recordAttendanceScan(idCode)` for automatic scans.
- `recordManualAttendance(id, status)` for manual overrides.
- `google.script.host.close()` used to exit Apps Script dialog contexts.

### UI/CSS structure & observations
- Body keeps the animated gradient but adds a translucent overlay, centered flex layout, and clamp padding so the scanner card stays vertically balanced without bottom gaps.
- `.container` now features a frosted glass treatment, border, and spacing tokens; `.scanner-header` and `.action-group` align controls while preserving center alignment.
- Buttons hold 44px+ touch targets, share Lexend typography, and stretch full-width below 640px; the Flip Camera button hides automatically when only one device is exposed.
- `#reader` uses a resized `qrbox` driven by `computeQrBox()` and an inset border to maintain a predictable viewport as the device rotates.
- `showStatus` swaps `data-state` attributes instead of classes so success/error colors render consistently and messages clear after four seconds unless marked persistent.
- Manual entry dialog keeps its accessible structure (ARIA role, ESC/backdrop close, focus return) with the new palette and spacing.

## 3. Backend_Debug.gs
### Current responsibilities
- Hosts the Apps Script web app (`doGet`), authentication (`checkLogin`), sheet fetch helpers (profiles, homepage, officer data, logs, feedback), attendance utilities, announcement workflow, and reporting helpers.
- Logs major actions (login, data loads) and formats timestamps for client consumption.

### Recent adjustments
- `doGet` now inspects `e.parameter.page` to serve `SearchPage` or `QRScanner`, applies viewport metadata, and relaxes X-Frame options for the scanner.
- Added `getQrScannerUrl()` to expose a stable URL (`ScriptApp.getService().getUrl()?page=qrscanner`) for the frontend menu button.
- Stored the last authenticated user in `PropertiesService` during `checkLogin` and exposed a safe `getSession()` helper so the frontend can restore active sessions without re-authentication.

## 4. Issue log & recommendations
| Severity | Area | Details | Suggested Fix |
| --- | --- | --- | --- |
| High | Frontend rendering | Numerous `innerHTML` injections render sheet data (announcements, homepage content, feedback). If untrusted users can author content, this allows stored XSS. | Escape dynamic fields before insertion or swap to DOM APIs/textContent. Centralize a sanitizer helper before rendering.
| Medium | Data validation | Homepage/project image URLs and announcement bodies are displayed without validation; broken or malicious URLs degrade UX. | Add backend validation/whitelisting for URLs and fallback imagery if fetch fails.
| Medium | Accessibility | While main buttons and modal now have focus states, some dynamically injected buttons (announcement cards, manual attendance) rely on default focus outlines and lack aria labels. | Extend helper functions to apply `type="button"`, `aria-labels`, and ensure focus management when modals open.
| Low | Code organization | Inline styles remain throughout markup (profile grids, announcement text), making them harder to maintain and override responsively. | Gradually migrate repeated inline styles into CSS utility classes within the existing stylesheet.
| Low | Performance | `loadAnnouncements` and other loaders re-render full HTML with string concatenation; large datasets may cause layout thrash. | Consider incremental rendering or document fragments with `textContent` to minimize repeated layout recalculations.

## 5. Visual layout previews (text descriptions)
### SearchPage panels
- **Login panel:** Frosted panel header stacks the YSP crest, Lexend headline, and a muted subtitle above a compact `.form-stack` with username/password fields. Primary and secondary actions sit in a centered button group, and the status line fades in directly beneath the form.
- **Main menu / dashboard:** Panel header greets the user by name, while the `.media-stack` pairs the avatar with detail text and unread badge. Below a translucent divider, the dynamic menu renders as vertical button groups that stay centered yet stretch full-width on phones.
- **Homepage panel:** `.panel-body` widens to 840px for longform content. Mission text lives in a card, followed by a responsive project grid that collapses to one column on mobile and a developer contact card anchored by evenly spaced paragraphs.
- **Announcements panel:** Filter row keeps the dropdown and “Create Announcement” button aligned on a single row (wrapping gracefully when space is tight). Announcement cards inherit the frosted style with bold titles, timestamp metadata, and in-card action buttons.
- **Feedback panel:** The feedback container sits inside the panel body with consistent padding; entries render in stacked cards or the fallback table, and the back button shares the standardized `.panel-actions` alignment.
- **Access logs panel:** Logs appear inside the card body with uniform spacing and muted metadata while the header subtitle reiterates accountability messaging.
- **Profile panel:** Avatar and key attributes render with the `.info-grid` utility, balancing cards for email, birthday, gender, etc., while the about section spans the width in a single frosted card.
- **Attendance transparency panel:** A muted lead-in sentence precedes the table, which respects the internal padding and scrolls within the panel without triggering page scroll.
- **Manual attendance dialog:** The reusable modal maintains Lexend headings, stacked inputs, and right-aligned action buttons that collapse full-width on narrow screens.

### QRScanner page
- **Scanner shell:** The centered card now opens with a structured header (logo, title, descriptive subtitle) and an action group that houses Manual Entry, Flip Camera, and Back controls while keeping everything perfectly centered.
- **Camera preview:** The reader viewport gains an inset border and dynamically sized `qrbox`, so it scales toward square on larger viewports yet stays comfortable (minimum 220px) on small phones.
- **Status area:** A muted placeholder message (“Initializing camera…”) transitions into success/error messaging driven by `data-state`—messages fade after four seconds unless explicitly persistent.
- **Manual entry modal:** Dialog styling mirrors the main palette with Lexend heading, stacked labels/fields, and right-aligned controls that stretch to full width on narrow devices while maintaining ESC/backdrop dismissal and focus return.
