# Responsive Test Checklist

All checks executed on the refreshed homepage and related navigation.

## 360px (mobile portrait)
- Guest login → Homepage: container fills the viewport, no horizontal scroll, contact cards stack with 16px gap, and the back button sits at the bottom without extra whitespace.
- Project cards render in a single column; tapping a card opens the modal, image scales within the 16:9 frame, focus lands on the close button, and Back restores focus to the triggering card.
- Facebook and Email buttons announce focus rings, open new tabs with the expected URLs, and are reachable by keyboard.

## 768px (tablet portrait)
- Homepage sections stay centered within the container; mission/vision blocks read with comfortable margins and objectives list wraps without overflow.
- Contact grid auto-adjusts to two equal cards; action buttons remain on one row with clear spacing.
- Modal opens from the first project with fade/scale animation, ESC and backdrop clicks close it, and focus returns to the card.

## 1024px (tablet landscape / small desktop)
- Projects gallery displays two columns with consistent gaps, and the organizational chart image retains 16:9 aspect without stretching.
- Switching panels (Homepage ↔ Login) updates the location hash (`#homepage`, `#login`) and restores the login focus state.
- Keyboard tab order flows from menu → project cards → contact buttons without skips; Shift+Tab cycles inside the modal only.

## 1440px (desktop)
- Homepage content stays centered at max-width 1200px with ample side padding; cards drop shadows remain subtle and no bottom gap appears above the footer actions.
- Project modal body reflows to a two-column layout (media + copy) while maintaining 90dvh max height.
- Repeated reload of homepage content handles offline fallback gracefully (local preview shows placeholder copy, contact card notes disabled actions, and project area shows the offline message).

## Regression & Performance Notes
- Verified buttons use `window.open` only after validating URLs and no console errors appear when data fields are missing or empty.
- Confirmed modal teardown removes listeners between openings and `closeModal()` returns focus to the launcher across repeated cycles.
- Ensured no edits touched `Code.gs` or `UserProfiles.gs` per blueprint scope.
