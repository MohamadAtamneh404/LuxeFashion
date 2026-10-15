# Preview asset provenance

- `campaign.webp`, `atrium.webp`, `runway.webp`, `atelier.webp`: copied from the user-authorized LuxeFashion source repository's `frontend/public/merit` folder. Its source manifest identifies public editorial images from meritbrand.store. Used here only in the local evaluation prototype, without any MERIT wordmark.
- Product JPG files: localized from the Unsplash image IDs already present in the LuxeFashion seed data on 14 October 2026. Product titles describe the visible photographs; prices are illustrative preview values.
- `inter-tight-latin.woff2`: copied from the same source folder; OFL license retained as `InterTight-OFL.txt`.
- `gsap.min.js`, `ScrollTrigger.min.js`: copied from the source repository's installed GSAP distribution for local playback.

The catalog is exploratory and does not represent verified inventory, fabric composition, or fulfillment promises.

## Motion proof additions

- `fashion-red-film.mp4` and `fashion-red-poster.jpg`: localized 720p fashion footage and a frame extracted from [Mixkit clip 52269](https://mixkit.co/free-stock-video/a-young-beautiful-model-posing-over-a-red-backdrop-with-52269/). The source page identifies it as free stock video under the [Mixkit Stock Video Free License](https://mixkit.co/license/). The supplied CloudFront MP4 was inspected at multiple times and depicted an illustrated landscape, so it is not used as fashion footage.
- `motion-proof.html` adapts the kinetic carousel engine in the official [React Bits Carousel source](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/Carousel/Carousel.jsx) and its [CSS](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/Carousel/Carousel.css) to vanilla DOM. Adapted ideas include spring positioning, looping nearest-offset poses, autoplay progress bars, pointer drag, keyboard navigation, and visibility-aware pause. It is not an installed React component. The applicable notice is preserved in `react-bits-LICENSE.md`.

## Two-row motion iteration

- The two opposing fashion-photo rows in `motion-proof.html` adapt the duplicated-group, gap-aware CSS transform loop and `reverse` behavior from the official [Magic UI Marquee source](https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/marquee.tsx) and [registry animation definition](https://github.com/magicuidesign/magicui/blob/main/registry.json). `pauseOnHover` is intentionally false. This is a vanilla HTML/CSS adaptation, not an installed React component. The MIT notice is preserved in `magic-ui-LICENSE.md`.
- The previous React Bits carousel code remains in the artifact but its visual carousel is hidden in favor of the marquee; the stationary product selector reuses its product data and update function. No React Bits component is installed.
- The mirage effect is an original lightweight SVG `feTurbulence` + `feDisplacementMap` filter applied to the local fashion film and poster, with time-varying frequency controlled only while the hero is visible and motion is enabled.

## Lookbook and footer continuation

- The orbiting lookbook photographs in `motion-proof.html` adapt the angle, radius, duration, and counter-rotation mechanism from the official [Magic UI Orbiting Circles source](https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/orbiting-circles.tsx). This is a vanilla HTML/CSS adaptation with local fashion imagery, not an installed React component. Magic UI's MIT notice is retained in `magic-ui-LICENSE.md`.
- The atelier photo crossfade, tracing contour, and animated LuxeFashion footer lettering are original CSS/SVG choreography using the existing project assets. The newsletter stores or sends no data; its confirmation is local demo feedback only.
