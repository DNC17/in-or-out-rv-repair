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
shop.html               parts catalogue (demo data)
assets/
  css/main.css          all styles, single file
  js/main.js            GSAP + Lenis wiring, nav, reveals (shared by both pages)
  js/hero-gl.js         Three.js shader treatment for the hero video
  js/shop.js            catalogue, filtering and cart — DEMO PRODUCT DATA
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

A parts catalogue with search, category filters and a cart, sharing the same
stylesheet and nav as the homepage. Categories: **ACs, Fridges, Furnaces, Roof
Vents, Plumbing**.

**Everything in it is demo data.** `PRODUCTS` at the top of
[`assets/js/shop.js`](assets/js/shop.js) is invented — names, part numbers,
prices and stock counts. Replace that array with the real catalogue before this
page is treated as live inventory.

⚠ The on-page "demo catalogue" notice was removed at the client's request, so
**nothing visible on the page tells a visitor the prices aren't real.** The page
is still `noindex`, but put the real catalogue in before linking anyone to it.

### Dealer cost vs. MSRP

The shop shows **MSRP** as the sale price. Adam's dealer cost from NTP-STAG Via
lives in [`data/dealer-costs.json`](data/dealer-costs.json), keyed by the same
product id, ready for the margin dashboard.

**Cost must never reach `assets/`.** Everything under `assets/` is downloadable
by anyone who opens devtools on the live site, so putting a `cost` field in
`shop.js` would publish Adam's margins to his customers and competitors.
`/data/` is listed in `.vercelignore` so it is not uploaded at all.

### Search

Each product carries a `tags` string of things people actually type — brand
names, symptoms ("won't cool", "humming", "no ignition") and alternative words
("refrigerator" for fridge). Search covers name, part number, category, blurb
and tags.

Matching is on **word starts**, not raw substrings: a plain `includes` meant
"ac" also matched "furn*ac*e" and "repl*ac*ement". Each word contributes both
its squashed form and its pieces, so "A/C" is findable as `ac` and `IO-AC-135`
as `io`, `ac`, `135` or the whole SKU.

**No payment is taken and none is implied.** The cart builds a parts list and
hands it off — "Send this list to the shop" opens a pre-filled text to
(204) 930-3646, and "Copy list" puts the same text on the clipboard. Adam then
confirms availability and quotes the real price, which is how the shop already
works. Taking payment on the site would need a real backend (Stripe or similar)
plus live stock — say the word if that's wanted.

The cart lives in `localStorage` under `ioro.cart.v1`. Quantities are clamped to
each product's stock on both write *and* read, so a stale or hand-edited entry
can't restore more than the shop has.

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
