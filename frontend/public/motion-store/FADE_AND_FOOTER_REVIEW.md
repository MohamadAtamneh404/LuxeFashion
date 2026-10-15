# Shared MVP footer and fade corrections

15 October 2026. Applied the premium upgrade workflow, using the user's existing visual decisions without further taste questions.

- All 16 store route families now render the MVP footer markup from assets/mvp-footer.js, with corresponding extracted component styles in assets/mvp-footer.css. It includes the original newsletter, four navigation columns, wordmark tide/sheens, CTA, credits and back-to-top link.
- The footer's original colors, Inter Tight display type, body typography, mobile grid and rounded geometry are retained. Its newsletter validates locally and explicitly confirms that no email was sent.
- Homepage chapter backgrounds remain fully opaque. Exit dissolves affect children only, during the last 12% of viewport travel; the pinned campaign is excluded from this extra fade layer.
- Store content reveals once as it enters view. Scrolling or updating a wishlist/filter no longer fades already-visible cards away or restarts their entrance.
- Slow entrances remain. Reduced-motion fallbacks remain. No pause UI was added, per user instruction.

## Verified
- Every store route family has the shared footer, newsletter and four navigation groups.
- Desktop/mobile footer fits without horizontal overflow; the mobile navigation grid has two columns.
- Wordmark sheen is visible and letter transforms change over time.
- Newsletter invalid and valid states both work.
- Same-route wishlist updates keep card opacity at 1 immediately.
- Homepage showcase background opacity stays at 1 throughout the exit. Content remains fully visible with 240px still on screen; only its final edge dissolves. Pinned campaign stays fully opaque and expands to the full frame.
- JavaScript syntax checks passed for homepage inline scripts and store-page code. No browser console errors or warnings observed in final checks.

OS reduced-motion/transparency fallbacks were source reviewed, not emulated. Existing user-directed autoplay-pause exception still applies.
