# Featured selector polish — 15 October 2026

Applied premium-frontend-upgrade with its premium-motion-websites companion to the existing motion-proof.html MVP.

## Changes
- Existing four featured-piece buttons now carry reserved-size real product thumbnails and clearer editorial label hierarchy.
- A shared rounded image preview opens on pointer hover or keyboard focus, dissolves between matching photographs, and closes with Escape or focus/pointer exit.
- Slow reversible CSS transitions leave button hitboxes stationary. The existing click selection, aria-pressed state, prices and product routes remain intact.
- Mobile uses a two-column grid with visible thumbnails and no floating preview. Reduced-motion CSS removes preview movement and transitions.
- Existing section order, assets, slow 1.2-second chapter fades, campaign pin, horizontal story, glass and ambient animations are retained.

## Implementation and references
Original HTML/CSS/JavaScript implementation using the existing stack; no new packages or paid component source installed. Reviewed the Vengeance UI Image Reveal List pattern (https://www.vengenceui.com/components/image-reveal-list), Skiper UI and Animmaster Lib catalogs. The selected pattern was implemented locally because the preview is a standalone HTML page, while the referenced component is React-based. No claim of using its source code.

## Validation
- Desktop 1440px: thumbnail dimensions, focus preview, all four product destinations, selected state and interrupted focus changes checked.
- Escape closes the preview while preserving button focus. One preview image is active after rapid changes.
- Mobile 390px: two-column controls, 72px target heights, matching selected product, hidden floating preview and no horizontal overflow checked.
- Tablet 900px: control fitting and focus-preview bounds checked.
- Inline JavaScript syntax check passed. Browser console contained no errors or warnings during checks.
- Current Vercel Web Interface Guidelines reviewed for these controls: stable hitboxes, semantic buttons, visible focus, Escape dismissal, image dimensions and touch fallback.
- Reduced-motion fallback inspected in source; operating-system preference emulation was not performed.

This is a focused upgrade of the featured-piece selector. Other component families retain their existing treatment pending feedback on this representative interaction.
