# Responsive Test Checklist (October 2025 Final Pass)

Validated using a temporary local HTTP server (`python -m http.server`) and Playwright viewport swaps after the modal rewrite.

## 360px (mobile portrait)
- Login panel loads without horizontal scroll (`scrollWidth` = `clientWidth` = 360) and retains centered card alignment.
- Tapping **Log in as Guest** opens the rebuilt modal; the input and buttons stay within the viewport and remain focusable.
- Homepage contact buttons stay stacked in a single column with working actions and no overflow.

## 768px (tablet portrait)
- Body width equals viewport (`scrollWidth` = 768); homepage containers stay centered with 16px side padding.
- Project grid auto-fills two columns without overflow and the modal launches with focus on the close button.

## 1024px (tablet landscape)
- No horizontal overflow (`scrollWidth` = 1024). Homepage content maintains max-width 840px while project cards stretch evenly.
- Back button remains anchored; modal two-column layout (media + copy) activates above 768px.
- Guest modal centers within the viewport and traps focus between the name field and action buttons.

## 1440px (desktop)
- Layout stays centered (`scrollWidth` = 1440) with generous whitespace; panel height adheres to the viewport-based minimum without trailing gaps.
- Contact buttons retain the primary styling and focus outlines at desktop scale.
- Guest modal scales to a compact width, keeping the explanatory copy, text field, and CTA inline without overflow.

## Regression Notes
- Modal focus traps restore focus to their trigger buttons after closing.
- Shared helper include renders cleanly through `include('Shared')`; no raw directive text appears behind the login card at any viewport.
- Guest sign-in modal and QR manual-entry dialog were retested for keyboard focus order (`input` → Continue → Cancel) and ESC/backdrop dismissal after the script refactor/fallback injection.
- Desktop and mobile preview captures recorded for this pass (see artifacts `search-desktop.png`, `search-mobile.png`).
