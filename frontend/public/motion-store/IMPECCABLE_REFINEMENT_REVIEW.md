# Impeccable retail refinement

Applied clarify, harden, adapt, distill and polish against the 17 October critique, preserving the approved continuous-motion, rounded-media, glass and bold-type direction.

## Changed

- Latest edit is a deliberate four-product selection. Women and Men retain separate assortments. Three named collections now have distinct product combinations and direct URLs.
- Search is a consistent page across home/catalog and returns products and editorial stories. Articles provide useful styling/construction context and link to explicitly identified catalog alternatives.
- Garment-type navigation, size and price filters operate on the current edit. Featured, ascending price, descending price and alphabetical sorting only change ordering. Counts, active summaries, clear action and query-string persistence support recovery/reload/back navigation.
- Removed the ambiguous multi-pair jeans listing. Catalog imagery is separated from runway/film inspiration. Home insets and selected-piece photography show actual catalog references; preview labels distinguish hovering from selection.
- Removed repeated listing covers and technical chapter kickers from visible hierarchy. Main chapters now distinguish inspiration, choosing a piece, styling and inspecting details.
- Product heading/price precede the image on phones. A size/Add bar is available when the main purchase controls are outside the viewport. Selected product photographs remain visible on mobile. Controls use SVG arrows and functional text has a larger reading floor.
- Product detail contains visible-feature facts, measurement instructions, explicit missing-specification status, and delivery/returns information. False alternate-view thumbnails were removed; full-image enlargement remains.
- Bag supports size changes, quantity limits, merging matching sizes, removal Undo and meaningful quantity counts. Unknown/invalid stored products and sizes are excluded.
- Demo checkout no longer collects unnecessary shipping/personal data. Profile no longer requests a password. Customer care links the support address already present in the existing project; no response or fulfillment promises added.
- Shared full footer and minimal lettering motion remain across routes. Home bag count follows saved state. Shopping-page entrances stay readable and feedback is announced via a live status region.

## Verification

`node e2e/motion-store-retail.cjs` against the local static server passes combined filtering/sorting, URL persistence, story search, collection detail, product size validation, add/bag size/quantity, local confirmation, password-free profile, matching home product/photo/link and mobile purchase bar. Catalog/product/service/story route families have no document overflow at 320, 390 and 768px; browser page-error collection is empty. Desktop and phone screenshots were reviewed. These are browser-emulated checks, not physical Samsung testing.

The Impeccable detector ran once and returned 86 candidates (previous critique 107). Candidates include intentional warm palette/marquees/glass, hidden alternative/duplicated media, and initial inline CSS superseded by shared retail styles. It is not an accessibility certification. Main imagery overlays require contextual contrast judgement.

## Remaining factual inputs

Authentic additional product angles, garment measurements, materials/care labels, verified inventory and operational shipping/return terms have not been supplied. None were fabricated. The storefront remains a local commerce prototype, not a production payment/order service. The existing support address is linked, not independently verified.

The critique snapshot is retained open because the genuine product-evidence priority cannot be fully closed without those inputs. No unrelated React work was included in this change.

## Intentional constraints

No motion pause option and no pinch zoom remain as explicitly requested. All-page footer structure is preserved. Animation is not used to change product evidence or invent alternate garment views.
