# Responsive Test Checklist (October 2025 Final Pass)

Validated using a temporary local HTTP server (`python -m http.server`) and Playwright-driven viewport swaps across the key breakpoints defined in the blueprint.

## 360px (mobile portrait)
- Login panel loads without horizontal scroll (`scrollWidth` = `clientWidth` = 360) and retains centered card alignment.
- Tapping **Log in as Guest** opens the modal capture form; the input and action buttons stay within the viewport and remain focusable via keyboard.
- Contact buttons remain within a single column when visiting the homepage; the Back control sticks to the bottom via `.push-bottom`.

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
- Reused modal helper keeps focus trapped and restores it to the triggering element after closing.
- `openExternal` now normalizes links missing a protocol and still blocks non-HTTP(S) URLs, preventing accidental navigation to unsupported destinations.
- Added coverage for the guest sign-in modal to confirm keyboard focus order (`input` → Continue → Cancel) and ESC/backdrop dismissal work across breakpoints.
