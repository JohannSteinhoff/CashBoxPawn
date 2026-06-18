# Cash Box Pawn

Website for Cash Box Pawn — 1515 Aquarena Springs Dr, Suite 100, San Marcos, TX 78666.

**Live site:** https://johannsteinhoff.github.io/CashBoxPawn/

A fast, mobile-friendly single-page site built with plain HTML, CSS, and JavaScript
(no frameworks, no build step). It can be hosted for free on GitHub Pages, Netlify, or
Cloudflare Pages.

## Run locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server
```

then visit http://localhost:8000.

## Structure

```
index.html          — the page (all sections) + inlined CSS in a <style> block
js/main.js          — hours/open-status, gallery lightbox, nav, form, animations
images/             — photos and logo (WebP with JPEG fallbacks)
optimize_images.py  — one-off image resizer/compressor
```

The CSS lives in a `<style>` block in the `<head>` of `index.html` (inlined to
avoid a render-blocking request). Edit it there.
