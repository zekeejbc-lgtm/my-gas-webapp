
# Youth Service Philippines – Tagum Chapter Web App
# FINAL, AUTHORITATIVE IMPLEMENTATION BLUEPRINT (October 2025)

> **READ FIRST (Codex): HARD REQUIREMENTS**
> - **This blueprint supersedes and REPLACES any previous blueprints or instructions.** Ignore earlier blueprints or drafts.
> - **Do NOT edit** `Code.gs` or `UserProfiles.gs`. Only modify files required to implement the Homepage/UI updates and any referenced client-side helpers.
> - **All code must compile and run flawlessly** in Google Apps Script HTML Service. No missing variables, no broken selectors, no undefined functions.
> - **Perform thorough testing**: desktop & mobile (360/768/1024/1440), keyboard navigation, modal accessibility, Gmail/Facebook links, back-navigation to Login, and Sheets data binding.
> - **Before final output**, run a complete “self-QA”: sanity checks for nulls, empty arrays, invalid URLs, race conditions in `google.script.run`, double submits, and layout overflows.
> - **Deliverables must be complete** (see §10) and reflect the final, working code. Provide no screenshots, only code & markdown artifacts.

---

## A. PRODUCT OVERVIEW
The YSP Tagum Web App centralizes login, attendance, announcements, feedback, events, and directory features. It reads and writes to Google Sheets; frontend is served by Google Apps Script (HTML Service). This Final Blueprint focuses implementation on the **Homepage** while preserving the rest of the application’s features and contracts.

---

## B. CORE MODULES & FEATURES (Context)
1) **Login System** — username/password (from User Profiles); animated eye toggle; smooth panel transitions.  
2) **Guest Login** — captures name, records to Access Logs with ID Code “Visitor”, redirects to Homepage with limited access.  
3) **Main Menu Dashboard** — profile, role-based tiles, unread announcements badge.  
4) **Homepage (target of this blueprint)** — About YSP, Founder, Mission, Vision, Objectives, Org Chart, Contact buttons, Projects Implemented with modal gallery.  
5) **My Profile** — profile cards from User Profiles.  
6) **My QR ID** — modal with QR (ID Code), below-text (name, position, ID).  
7) **QR Attendance (Automatic)** — in-app scanner, event select (active only), Time In/Out, PH time, duplicate prevention.  
8) **Manual Attendance** — search member/event, set status/time, anti-duplication, stable layout (no expanding inputs).  
9) **Attendance Dashboard** — Chart.js KPIs per event.  
10) **Attendance Transparency** — personal table (Date, Event, Time In/Out).  
11) **Manage Events** — create event block (5 columns), toggle Active/Inactive; search & toasts.  
12) **Officer Directory** — autosuggest name, profile card.  
13) **Announcements** — create→email, read/unread cards, modal view.  
14) **Submit Feedback** — modal submit + history table (scrollable).  
15) **View Feedback (Admin)** — global feedback table (scrollable, justified).  
16) **Access Logs** — timestamp, ID Code, name (visitor = “Visitor”).  
17) **Logout** — clears session, animates back to login.

---

## C. GOOGLE SHEETS SCHEMA (Canonical)
### 1) User Profiles
B: Email Address; D: Full Name; E: Date of Birth; F: Age; G: Sex/Gender; H: Pronouns; I: Civil Status; J: Contact Number; K: Religion; L: Nationality; N: Username; O: Password; S: ID Code; T: Position; U: Role (Admin/Head/Auditor/Member/Guest); V: ProfilePictureURL.

### 2) Announcements
A: Timestamp; B: Announcement ID; C: Creator ID; D: Creator Name; E: Title; F: Subject; G: Body; H: Recipient Type (`all|committee|id`); I: Recipient Value (list); J: Send Email (TRUE); K: Read By (ID list).

### 3) Master Attendance Log
A: ID Code; B: Name; C: Position; D: ID Number (ignored);
E..∞ repeat per event: `Date | EventName | TimeIn | TimeOut | Status` (Status used for Active/Inactive visibility).

### 4) Access Logs
A: Timestamp (PH); B: ID Code; C: Name (Visitor for guests).

### 5) Feedback
A: Timestamp; B: Name; C: ID Code; D: Message.

### 6) Homepage Content (Key–Value)
1 `mission`, 2 `vision`, 3 `objectives`, 4 `orgChartUrl`, 5 `facebookUrl`, 6 `email`, 7 `founderName`, 8 `aboutYSP`, 9+ paired `projectImageUrl_N`, `projectDesc_N`.

**Frontend contract (`getHomepageContent`)**  
Either returns a flat map or:
```js
{
  mission, vision, objectives, orgChartUrl,
  facebookUrl, email, founderName, aboutYSP,
  projects?: Array<{ imageUrl, description }>
}
```
If flat, client derives `projects[]` by scanning `projectImageUrl_N/projectDesc_N` until missing.

---

## D. HOMEPAGE — MANDATORY IMPLEMENTATION

### D1) Projects Implemented — Modal Redesign (Accessible + No Bottom Gap)
- Centered modal with backdrop; Desktop: max-width 720–840px; Mobile: max-width 90vw; max-height 90dvh; overflow:auto.  
- Rounded ≥12px; soft shadow; padding 16–24px; Lexend titles, Roboto body.  
- Open from project card; close via X, ESC, and backdrop.  
- **Focus trap** inside modal; **return focus** to opener on close.  
- Animation: fade + scale (0.98→1, 200–250ms).  
- 16:9 image wrapper with `object-fit: cover`; caption text.  
- Hidden state uses `display:none` (or `visibility:hidden` + `pointer-events:none`) to avoid reserving space.  
- Page wrapper uses flex column with `min-height:100dvh` and footer `margin-top:auto` to eliminate “big bottom whitespace.”

### D2) Separate Cards: “Report Issues via FB/Email” vs “Web App Developer”
- Split into **two distinct cards** with consistent tokens: radius 12px, shadow `0 6px 24px rgba(0,0,0,.08)`, padding 16–20px.  
- Titles in **Lexend** 18–22px; body **Roboto** 14–16px.

### D3) Action Buttons (Facebook + Gmail Compose)
- Replace plain links with buttons:
  - **Open Facebook Page** → opens `facebookUrl` in new tab (`_blank`, `noopener`).
  - **Email YSP** → `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=%5BYSP%5D%20Issue%20Report`.
- Buttons: `.btn` (min-height 44px, radius 10–12px, fw 600), `.btn-primary` (primary orange, white text), visible focus ring, proper `aria-label`.

### D4) Back Button Behavior (Homepage → Login Panel)
- On **Homepage**, Back must **return to Login** (not dashboard).  
- If app-level router exists (e.g., `showPanel('login')`), call it.  
- Else add a minimal local function: hide Homepage root, show Login root, set `location.hash = '#login'` (no edits to `Code.gs`/`UserProfiles.gs`).

### D5) Responsive & Spacing (360/768/1024/1440)
- Mobile-first; **no horizontal scroll at 360px**.  
- Cards stack with 16px gap; centered key sections.  
- Typography in `rem`; spacing scale 4/8/12/16px.  
- Containers: `max-width:1200px`, centered with side padding 16–24px.

---

## E. UI TOKENS & CSS UTILITIES
- Fonts: **Lexend** (headers), **Roboto** (body).  
- Colors: Primary `#f6421f`, Secondary `#ee8724`, Accent `#fbcb29`.  
- `.container{max-width:1200px;margin:0 auto;padding:0 16px}`  
- `.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 16px;border-radius:12px;font-weight:600;transition:.2s}`  
- `.btn-primary{background:#f6421f;color:#fff}`  
- `.btn-primary:focus{box-shadow:0 0 0 3px rgba(246,66,31,.35)}`  
- `.card{border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.08);padding:16px;background:#fff}`  
- `.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);display:none}`  
- `.modal-backdrop.is-open{display:block}`  
- `.modal{position:fixed;inset:0;display:grid;place-items:center;opacity:0;transform:scale(.98);transition:opacity .22s ease,transform .22s ease;pointer-events:none}`  
- `.modal.is-open{opacity:1;transform:scale(1);pointer-events:auto}`  
- `.modal__panel{width:min(92vw,840px);max-height:90dvh;overflow:auto;background:#fff;border-radius:12px;box-shadow:0 12px 48px rgba(0,0,0,.18)}`  
- `.ratio-16x9{aspect-ratio:16/9;overflow:hidden}`  
- `.ratio-16x9 img{width:100%;height:100%;object-fit:cover}`

---

## F. FRONTEND↔BACKEND CONTRACT (Homepage)
- Call:
```js
google.script.run
  .withSuccessHandler(renderHomepage)
  .withFailureHandler(showHomeError)
  .getHomepageContent();
```
- `renderHomepage(home)` expects fields from §C. If `projects` missing, derive from keys.  
- Sanitize dynamic content; avoid unsafe `innerHTML` for arbitrary text.  
- Error path must show a toast/banner (no blocking alerts).

---

## G. ACCESSIBILITY / PERFORMANCE / SECURITY
- **A11y:** Keyboard focusable controls; visible focus; modal `role="dialog" aria-modal="true" aria-labelledby aria-describedby`; focus trap; return focus to trigger.  
- **Perf:** Avoid layout thrash; throttle resize; lazy-load large modal images (`loading="lazy"`).  
- **Security:** Escape user content; validate URLs before `window.open`.

---

## H. FUNCTIONAL FLOW DETAILS (Buttons & Panel Layout)
- **Login:** centered card; [Log In], [Log In as Guest]; invalid → toast.  
- **Guest Login:** name capture modal → Access Logs (Visitor) → Homepage with limited menu.  
- **Homepage:** sections per §D; **Back** → Login; Contact buttons open FB/Gmail compose; Projects modal per §D1.  
- **Dashboard & others:** unchanged behavior; keep consistent card/spacing/tokens.

---

## I. AUTOMATED SYSTEM BEHAVIORS
- PH time for all timestamps.  
- Duplicate prevention in Attendance & Feedback.  
- Announcements always email.  
- Active/Inactive status gates attendance visibility.  
- Scrollable containers preserve Back visibility.  
- Theme consistency: fonts/colors/transitions.

---

## J. TEST PLAN (Codex must execute before final output)
1) **Data load**: `getHomepageContent()` success/failure paths; null/empty fields; missing project pairs.  
2) **Modal UX**: open via project card; close via X/backdrop/ESC; focus trap; restore focus to opener.  
3) **Buttons**: FB opens new tab; Gmail compose URL encodes email; network pop-up not blocked (use proper `window.open`).  
4) **Back behavior**: Homepage Back shows Login (not dashboard).  
5) **Responsive**: 360/768/1024/1440 — no horizontal scroll; spacing balanced; images 16:9.  
6) **A11y**: tab order inside modal; `aria-*` present; color contrast.  
7) **Perf**: no layout jank; images lazy where large.  
8) **Regression**: no edits to `Code.gs` or `UserProfiles.gs`; other modules unaffected.

---

## K. DELIVERABLES (What you must output)
1) **CHANGES.md** — file-by-file changes, reasons, and how they meet §D–§J.  
2) **UPDATED CODE** — Homepage HTML/CSS/JS implementing all requirements.  
3) **RESPONSIVE_TESTS.md** — stepwise checks & expected results for 360/768/1024/1440.  
4) **NOTES.md** — helper functions (focus trap, back routing), assumptions about `getHomepageContent()` structure.

> **Quality bar:** Only provide final artifacts after passing all tests above. No partial/placeholder outputs.
