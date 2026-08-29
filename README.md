# In or Out RV Parts & Repair — website

A static, dependency-free rebuild of [inoroutrvrepair.ca](https://inoroutrvrepair.ca/)
for **In or Out RV Parts and Repair**, 2476 Wenzel St Unit 303, Winnipeg, MB —
(204) 930-3646.

No build step. Everything is plain HTML/CSS/JS with vendored libraries, so the
folder can be uploaded to any static host (or dropped into a WordPress theme)
as-is.

## Run it locally

```bash
python3 serve.py 4321
```

Then open <http://localhost:4321>. `serve.py` is a ~60-line static server that
adds HTTP Range support — the stock `python3 -m http.server` does not, and the
hero `<video>` needs it.

Append `?motion=off` to any URL to force the reduced-motion code path (no
preloader, no smooth scroll, no WebGL). Useful for screenshots, printing and QA.

## Layout

```
index.html              homepage
shop.html               parts catalogue
tools/build-catalog.py  turns a Via export into catalog.js + dealer-costs.json
tools/fetch-images.py   downloads + optimises product photos to assets/img/parts/
data/dealer-costs.json  PRIVATE dealer cost (never deployed)
assets/
  css/main.css          all styles, single file
  js/main.js            GSAP + Lenis wiring, nav, reveals (shared by both pages)
  js/hero-gl.js         Three.js shader treatment for the hero video
  js/shop.js            search, filtering and cart logic
  js/catalog.js         GENERATED product data (MSRP only) — see tools/
  video/hero.mp4        1280×720 desktop loop  (3.9 MB)
  video/hero-mobile.mp4 960×540 mobile loop    (572 KB)
  img/                  logo + shop photos
  fonts/                Archivo (variable) + Instrument Serif italic
  vendor/               gsap, ScrollTrigger, SplitText, lenis, three
```

## The hero video — read this first

**The site had no video of its own.** Their WordPress media library contains only
a logo, one stock banner image and a handful of shop photos; the Facebook page's
Videos tab reports "No videos found"; and `inoroutrv.com` (listed as the website
on Facebook) no longer resolves.

`assets/video/hero.mp4` is therefore a **placeholder**: a stock clip of an RV on
an open highway, from Pexels. The [Pexels
License](https://www.pexels.com/license/) allows commercial use with no
attribution required. Source clip: <https://www.pexels.com/video/4560731/>.

### Swapping in their own footage

Replace the two files and nothing else changes:

| File | Used when | Suggested encode |
| --- | --- | --- |
| `assets/video/hero.mp4` | viewport ≥ 900 px | ~1280×720, H.264, 10–15 s loop, under ~4 MB |
| `assets/video/hero-mobile.mp4` | viewport < 900 px, or Save-Data on | ~960×540, under ~1 MB |

The breakpoint and filenames live in `initHero()` in
[`assets/js/main.js`](assets/js/main.js). Keep both muted-autoplay friendly (no
audio track needed) and seamlessly loopable.

Also update the low-res blur-up `poster=` data URI on the `<video>` in
`index.html` if the new footage looks very different — it's a 48×27 JPEG of the
first frame, used so the hero isn't blank on a slow connection.

## The shop page (`shop.html`)

A parts catalogue with search, category filters and a cart. **207 real products**
across ACs (135), Roof Vents (48), Fridges (12) and Furnaces (12).

### Where the data comes from

Product data is generated from an NTP-STAG/Via export, not hand-written:

```bash
python3 tools/build-catalog.py ~/Downloads/rv-parts-catalog-2026-08-29
```

That reads the export's two CSVs and writes:

| Output | Contents | Deployed? |
| --- | --- | --- |
| `assets/js/catalog.js` | name, part number, category, **MSRP**, spec blurb, search tags | yes |
| `data/dealer-costs.json` | dealer cost, margin, margin % — keyed by product id | **no** (`.vercelignore`) |

Both are generated — re-run the script on a fresh export rather than editing
them. The site shows **MSRP** as the sale price.

**Cost must never reach `assets/`.** Anything under `assets/` is downloadable by
anyone with devtools, so a cost field in `catalog.js` would publish Adam's
margins to his customers. The generator deliberately writes cost only to
`/data/`, which `.vercelignore` keeps out of deploys. Via product URLs are also
excluded — they carry a session id and expire.

### Things to know about the current export

- **Dealer cost is exactly 60% of MSRP on all 207 lines** — a flat 40% off
  rather than real per-line account pricing. A margin dashboard built on it
  would show 40% for everything. Worth re-exporting with true account pricing.
- **No stock data.** Cards show no availability, quantities cap at `MAX_QTY`
  (20) and the shop confirms what's on the shelf when a list comes in.
- **No plumbing.** The export excluded it, so that chip is gone; chips are
  generated from whatever categories the data actually contains.
- **Product photos are self-hosted**, not hotlinked — see below.
- Prices are point-in-time and need a refresh before they go live.

### Product images

`tools/fetch-images.py` downloads the images the export references and serves
them from `assets/img/parts/` — nothing is hotlinked off the supplier CDN, so
the page doesn't break if they block or rotate URLs.

```bash
python3 tools/fetch-images.py ~/Downloads/rv-parts-catalog-2026-08-29
```

The export links 130px thumbnails, but both CDNs honour a bigger
`maxwidth`/`maxheight`, so the script requests 900px, downscales to 560px and
re-encodes as WebP. **154 images, 1.3 MB total, ~8 KB each.** It needs Pillow:

```bash
python3 -m venv .venv && .venv/bin/pip install Pillow
.venv/bin/python tools/fetch-images.py <export-dir>
```

It writes `assets/img/parts/manifest.json`, which `build-catalog.py` reads to
attach an `img` to each product. Already-downloaded files are skipped unless
you pass `--force`. 198 of 207 products have a photo; the other 9 fall back to
the SVG line art, which is why the icon sprite is still in `shop.html`.

Transparent PNGs are flattened onto the paper colour rather than kept as
alpha — it keeps the WebP small and they only ever sit on that background.

Worth confirming the dealer agreement permits redistributing manufacturer
product images on the storefront; it normally does for the products you sell,
but it's NTP-STAG's call.

### Search

Each product carries a `tags` string built from its full Via title and spec
description, so brand, model, BTU rating, dimensions and both part numbers are
all findable.

Matching is on **word starts**, not raw substrings: a plain `includes` meant
"ac" also matched "furn*ac*e" and "repl*ac*ement". Each word contributes both
its squashed form and its pieces, so "A/C" is findable as `ac` and a part
number as any of its segments.

### Cart

No payment is processed. The cart builds a parts list and hands it off — "Send
this list to the shop" opens a pre-filled text to (204) 930-3646, and "Copy
list" puts the same text on the clipboard. It persists in `localStorage` under
`ioro.cart.v1`, and quantities are clamped on both write and read.

The grid renders 48 at a time with a "Show more" control, so 207 products don't
all hit the DOM at once.

## Design notes

- **Light mode throughout.** Warm paper (`#F4F1EA`) and near-black ink, with the
  hero footage pushed under a paper-toned scrim so ink type stays readable over
  it.
- **Brand green `#399F43`**, sampled from the gears in their existing logo. It's
  ~3:1 on paper — fine for display type and graphics but not for body text, so
  small green text uses `--brand-ink` (`#2A7532`, ~5:1) to meet WCAG AA. The
  deep evergreen `--deep` (`#17423C`) marks the "in the shop" lane.
- **Type:** Archivo variable (weight + width axes) for everything, with
  Instrument Serif italic as an accent.
- **Motion:** GSAP + ScrollTrigger for reveals and the scroll-linked hero grade;
  Lenis for smooth scrolling; SplitText for line/character reveals.
- **Three.js** renders the hero video through a fragment shader that adds a
  gentle barrel warp, edge chromatic fringe, film grain and a scroll-linked
  desaturation so the footage dissolves into the page as you scroll. It is
  opt-in: desktop only, ≥900 px, WebGL available, ≥4 cores, and never under
  `prefers-reduced-motion`. Everything else gets the plain `<video>`, which
  looks correct on its own.
- **Reduced motion** is honoured everywhere — the preloader, smooth scroll,
  marquee, WebGL and all reveals switch off, and the page renders fully static.

## Content provenance

Everything factual on the page comes from their own material:

- Phone, address and the "Over 10 years of RV experience…" tagline — their site
  and Facebook page.
- The three testimonials (Lori Lanthier, Brian Pound, Darlene Fontaine) are
  quoted **verbatim** from the existing site, lightly trimmed for length only.
- Service lists are grounded in what's evidenced: the tagline (furnaces, hot
  water tanks, lights, roadside), the shop photos (roof rebuild, faucets,
  tongue jacks, toilets) and the fridge story in Lori's review.
- **Hours are deliberately not stated** — no source lists them. The contact
  section says "Seasonal hours — call ahead" instead of inventing any.

## Things worth fixing on their side

1. **The logo has a typo.** `assets/img/logo.png` (their current logo, taken
   from the live site) reads *"In or **Our** RV Parts and Repair"*. The site
   uses a typographic wordmark instead, so the typo isn't visible anywhere —
   but the original file is worth correcting.
2. `assets/img/shop-02.jpg`, `shop-03.jpg` and `shop-04.jpg` (parts-counter
   shelves, tongue jacks and fixtures, pulled from their Facebook page) are
   included but not currently placed on the page. They're good material if a
   gallery or services imagery gets added later.
3. The old site's footer showed placeholder theme content — a San Francisco
   address and lorem-ipsum service blurbs. None of that carried over.

## Browser support

Modern evergreen browsers. Uses `color-mix()`, `clamp()`, `aspect-ratio`,
`:focus-visible` and ES modules with an import map. No horizontal overflow at
360–1920 px (verified); the process carousel becomes swipeable below 700 px and
the nav collapses to a drawer below 900 px.
