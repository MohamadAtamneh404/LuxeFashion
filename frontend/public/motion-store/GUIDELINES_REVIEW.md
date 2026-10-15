# Vercel Web Interface Guidelines review
Reviewed 2026-10-14 using the web-design-guidelines skill and current rules:
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

Scope: motion-proof.html and the catalog subcategory routing in luxefashion-preview.html. This is an isolated local MVP, with demo shopping/newsletter behavior.

## Corrected findings
- motion-proof.html:11 — variable font range, swap behavior and font preload support the bold typography.
- motion-proof.html:170 — visible keyboard focus styles, including contrasting dark-section states and a focus-revealed skip link.
- motion-proof.html:222 — image dimensions throughout; priority loading for the hero poster and lazy loading below the fold.
- motion-proof.html:294 — newsletter input naming, autocomplete, usable placeholder, inline validation and announced status.
- motion-proof.html:364 — responsive horizontal-story lifecycle; desktop pin removed when switching to the stacked mobile layout.
- motion-proof.html:378 — product prices formatted with Intl.NumberFormat.
- motion-proof.html:507 — category keyboard navigation, ArrowDown entry, Escape close and focus restoration.
- luxefashion-preview.html:47 — category subsection links resolve to matching filtered catalog content.

## Browser verification
- Desktop 1440px, tablet 900px and mobile 390px checked; no horizontal page overflow observed.
- One desktop horizontal story pin; zero pins on mobile after resizing.
- Category hover previews, keyboard navigation and Dresses catalog destination checked.
- Garment rows and hotspots activate matching blooming labels.
- Marquee movement continues while hovered. Footer letter movement and sheen verified over time.
- Empty and valid newsletter submissions produce appropriate local demo feedback.
- All 48 main-page images declare dimensions. No visible motion-pause control.
- Final inline JavaScript syntax checks passed for both files. No browser console errors or warnings in the final preview.

## Explicit design exceptions and limits
- Continuous autoplay has no on-page pause control, as explicitly requested. This departs from the guideline requiring a pause control for long autoplay motion. System reduced-motion fallbacks remain.
- The requested glass refraction and blooming masks use SVG displacement and clip-path as well as compositor transforms/opacity; these depart from a strict transform/opacity-only motion rule.
- Reduced-motion/transparency fallbacks were reviewed in source; operating-system preference emulation was not performed.
- This review does not certify full accessibility conformance or production checkout readiness.
