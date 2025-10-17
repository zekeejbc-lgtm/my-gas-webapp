# YSP Tagum Web App — Codex Blueprint (October 2025 Build)

> **Purpose:** This file is the authoritative, machine-readable task blueprint for Codex. Attach it to the environment and reference it in tasks.

---

## 0) Context

- Stack: **Google Apps Script (GAS)** + HTML/CSS/JS frontend, data in **Google Sheets**.
- Repo is synced with GAS via **clasp**.
- This spec consolidates the final feature set and the precise work Codex should do next.

---

## 1) Scope of Work (for THIS task series)

### ✅ IN SCOPE (edit/scan/improve)
- **SearchPage.html**
- **QRScanner.html**
- **Backend_Debug.gs**  ← currently contains debugging artifacts; treat as the primary backend file for features referenced by the two HTML files.

### 🚫 OUT OF SCOPE (do not edit)
- **Code.gs**  ← already finalized
- **UserProfiles.gs**  ← already finalized

> If a change appears necessary in the out-of-scope files, stop and report a blocking note instead of editing them.

---

## 2) Objectives

1. **Code Audit & Report**
   - Parse **SearchPage.html**, **QRScanner.html**, **Backend_Debug.gs**.
   - Produce a clear report of:
     - Current **features** and user flows.
     - How frontend functions **communicate with backend** (google.script.run, google apps script HTML Service patterns, doPost/doGet, etc.).
     - Existing **UI/CSS** structure: class names, CSS rules, layout behavior, and any framework usage.
     - Any **bugs, dead code, duplicated logic**, or **performance / security** issues (e.g., unescaped HTML, unsafe innerHTML, unnecessary DOM scans).

2. **UI/UX Improvements (keep all features)**
   - **Respect existing visual identity** but **improve CSS/UI** quality:
     - Reduce redundancy, improve semantics, accessible labels, focus states.
     - Clean spacing, consistent paddings/margins, readable scales.
     - Fix the **“very big space at the bottom”** issue; eliminate unintended gaps and overflow.
     - Ensure **mobile-first responsive** design:
       - Scales gracefully on mobile, tablet, desktop.
       - Centered / aesthetically pleasing layout on small screens.
       - Touch targets ≥ 44px, readable typography, no horizontal scroll.
   - Maintain or improve **performance** (minimize expensive reflows, avoid blocking scripts).

3. **Responsiveness**
   - Confirm that pages are **mobile-friendly**: layout adapts for small screens, typography scales, components stack appropriately.
   - Provide responsive CSS (media queries or container queries) without introducing a heavy framework unless already present.
   - No breaking changes to functional logic.

4. **Refactor (Non-breaking)**
   - Keep all **existing features** intact.
   - Improve structure and readability (modular CSS blocks, smaller functions).
   - Preserve public function names used by other files unless the blueprint explicitly permits changes.

---

## 3) Functional Requirements (recap)

### A. Core Modules & Features (context)
- Login, Guest Login, Dashboard, Homepage, My Profile, My QR ID, QR Attendance (Auto), Manual Attendance, Attendance Dashboard, Attendance Transparency, Manage Events, Officer Directory, Announcements, Feedback, Access Logs, Logout.

### B. Sheets Structure (relevant highlights)
- **User Profiles**: contains user info (Email, Name, Role, ID Code, etc.).
- **Announcements**: ID, Creator, Title, Body, Recipient scope, Read status, Auto email.
- **Master Attendance Log**: per-event 5-column groups `[Date | Event | Time In | Time Out | Status]`; Active vs Inactive controls visibility.
- **Access Logs**, **Feedback**, **Homepage Content** as defined.

### C. Backend Function Map (context)
- `doGet()`, `checkLogin`, `getHomepageContent`, `getUserProfile`, `recordAttendanceScan`, `recordManualAttendance`, `createEvent`, `toggleEventStatus`, `getAllEvents`, `getAnnouncements`, `createAnnouncement`, `markAnnouncementRead`, `getFeedback`, `submitFeedback`, `getAccessLogs`, `recordAccessLog`, `getAttendanceTransparencyForUser`.

> NOTE: Many of these exist outside the in-scope files. Do **not** modify finalized files; coordinate backend calls via **Backend_Debug.gs** if required by in-scope pages.

---

## 4) Non-Functional Requirements

- **Accessibility**: Labels for inputs, ARIA where needed, keyboard navigation, visible focus states.
- **Responsiveness**: Mobile-first; test at 360px, 768px, 1024px, 1440px widths.
- **Performance**: Avoid layout thrash; debounce heavy listeners; minimize DOM queries in loops.
- **Security**: Sanitize/escape user content; avoid unsafe `innerHTML` injections.
- **Consistency**: Unified spacing scale (e.g., 4/8/12/16px), font sizes, and color tokens.

---

## 5) Known Issues to Address

- **Large bottom space** on pages: identify cause (min-height, extra margins, flex gaps, sticky footer miscalc, or container height). Fix without removing needed content.
- **Mobile aesthetics**: center content where appropriate, ensure cards/panels scale, avoid cramped edges on small screens, prevent horizontal scrolling.
- Any flicker or layout shift during QR scanning or search interactions.

---

## 6) Deliverables

1. **REPORT.md** — placed at repo root. Must include:
   - Summary of **current features** for each in-scope file.
   - **How frontend calls backend** (function names, parameters, return shapes).
   - **CSS/UI analysis** (class names, layout systems, spacing, issues found).
   - **Issue list** with severity and suggested fixes.

2. **CHANGES.md** — high-level change log of edits you make (file-by-file).

3. **Updated files** (only in scope):
   - `SearchPage.html`
   - `QRScanner.html`
   - `Backend_Debug.gs` (refactored from debugging scaffold to production-safe entry points used by the two HTML files).

4. **RESPONSIVE_TESTS.md** — manual test steps:
   - Verify at 360, 768, 1024, 1440 widths.
   - No horizontal scroll on 360px.
   - Interactive controls reachable via keyboard and touch.
   - Confirm that the bottom spacing issue is gone.

> **Do NOT** include screenshots or run headful browsers. Text-only artifacts are fine.

---

## 7) Acceptance Criteria (Definition of Done)

- **No edits** to `Code.gs` and `UserProfiles.gs`.
- All features from the existing pages remain **functional** and **unchanged in behavior** (unless explicitly improved in UI only).
- **Bottom-space bug** resolved on both pages.
- Pages are **responsive** and **aesthetically improved** on mobile and desktop.
- **REPORT.md** clearly documents the current behavior (pre-change) and the new structure (post-change).
- **CHANGES.md** lists each modified file with a concise rationale.
- CSS is **cleaned**, **deduplicated**, and **namespaced** to avoid regressions.
- No new console errors in browser (if applicable).
- Lint passes if a linter exists; otherwise, code is formatted consistently.

---

## 8) Constraints & Conventions

- **Styling**: Prefer lightweight, hand-authored CSS. Only introduce a framework if already present or strictly necessary.
- **Responsiveness**: Use media queries (e.g., `@media (max-width: 768px) { ... }`) and fluid units (%, rem, vw) where appropriate.
- **JS**: Avoid global namespace pollution; keep functions modular.
- **GAS**: Frontend → backend calls via `google.script.run.withSuccessHandler(...).withFailureHandler(...).functionName(args)`.
- **Do not** change IDs, function names, or data contracts unless documented in CHANGES.md.

---

## 9) Task Execution Guidance for Codex

**Phase 1 — Audit (no edits):**
- Read the three in-scope files and output **REPORT.md**.
- Stop if any dependency is missing; list blockers.

**Phase 2 — Refactor & UI polish:**
- Implement CSS/HTML improvements in `SearchPage.html` and `QRScanner.html`.
- Make minimal, safe backend adjustments only in `Backend_Debug.gs` to support those pages.
- Produce **CHANGES.md** with rationale.

**Phase 3 — Responsive verification:**
- Write **RESPONSIVE_TESTS.md** with steps and expected outcomes for each breakpoint.
- Confirm the bottom-space issue is fixed.

**IMPORTANT:** Do **not** fetch external URLs or take screenshots. If network access is needed, state the command and stop.

---

## 10) Handy Checklists

### UI polish checklist
- [ ] Consistent spacing scale (4/8/12/16px)
- [ ] Typography scales with `rem`
- [ ] Buttons: hover/focus/active states
- [ ] Inputs: labels, placeholders, error messages
- [ ] Cards/panels: rounded corners, soft shadow, balanced padding
- [ ] No excessive bottom gaps or scroll “dead zones”

### Responsive checklist
- [ ] No horizontal scrolling at 360px width
- [ ] Layout stacks vertically on small screens
- [ ] QR scanner container centers and fits viewport height without overflow
- [ ] Search results list is scrollable within a bounded container
- [ ] Tap targets ≥ 44px

### Frontend ↔ Backend checklist
- [ ] Documented all `google.script.run` calls and handlers
- [ ] Validated parameter names and return shapes
- [ ] Error handling: withFailureHandler shows toast/message

---

## 11) Notes from the Product Owner (must-reads)

- “You don’t have to edit **Code.gs** and **UserProfiles.gs** (they’re finalized).”
- “The only files you need to fix are **SearchPage.html**, **QRScanner.html**, and **Backend_Debug.gs** (this will be the backend file; it currently contains debugging code).”
- “Please **scan those files** and tell me **all features**, how they **communicate with backend**, and the **UI/CSS** details.”
- “**Make it better** while respecting the current UI/CSS style and **keeping all features**.”
- “Confirm the **CSS/UI** is improved and **mobile-friendly** (desktop and mobile sizing; auto-resizes).”
- “Fix the **very big space at the bottom**. On mobile, make everything **aesthetically pleasing** (center as needed, balanced spacing).”

---

## 12) Suggested Task Prompt (to use inside Codex)

> **Task:** Read `YSP Tagum Web App — Codex Blueprint (October 2025 Build)` and follow Sections 1–12.  
> **Deliverables:** `REPORT.md`, `CHANGES.md`, updated `SearchPage.html`, `QRScanner.html`, `Backend_Debug.gs`, and `RESPONSIVE_TESTS.md`.  
> **Constraints:** No edits to `Code.gs` and `UserProfiles.gs`. No screenshots. No external fetches. Keep functionality intact while improving CSS/UI and responsiveness.

