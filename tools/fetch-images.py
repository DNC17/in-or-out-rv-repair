#!/usr/bin/env python3
"""
Download the product images referenced by a Via export and self-host them.

    python3 tools/fetch-images.py ~/Downloads/rv-parts-catalog-2026-08-29

Writes WebP files to assets/img/parts/ plus a manifest the catalogue build
reads. Images are fetched at a larger size than the export's 130px thumbnails
(the CDNs honour maxwidth/maxheight), then resized and re-encoded locally so
the site serves its own optimised copies rather than hotlinking a supplier CDN.

Needs Pillow. If it isn't importable, make a venv:
    python3 -m venv .venv && .venv/bin/pip install Pillow
    .venv/bin/python tools/fetch-images.py <export-dir>

Re-runnable: files already present are skipped unless --force is passed.
"""
import csv, io, json, os, re, sys, time, urllib.request, urllib.error

FETCH_PX = 900          # ask the CDN for this, then downscale locally
OUT_PX   = 560          # what we actually serve (cards are ~330px, so 2x-ish)
QUALITY  = 82
DELAY    = 0.25         # be polite to the supplier CDN

UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36')


def source_name(url):
    """'...?File=CLM/Images/2111-00511_A-CM-8-24.png&max...' -> stable slug."""
    m = re.search(r'[?&]File=([^&]+)', url)
    raw = (m.group(1) if m else url).rsplit('/', 1)[-1]
    raw = re.sub(r'\.(png|jpe?g|gif|webp)$', '', raw, flags=re.I)
    return re.sub(r'[^a-z0-9]+', '-', raw.lower()).strip('-')


def upsize(url, px):
    url = re.sub(r'maxheight=\d+', f'maxheight={px}', url)
    return re.sub(r'maxwidth=\d+', f'maxwidth={px}', url)


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA,
                                               'Referer': 'https://www.viantp.com/'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def main(src, force=False):
    try:
        from PIL import Image
    except ImportError:
        sys.exit('Pillow is required — see the docstring for the venv one-liner.')

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root, 'assets', 'img', 'parts')
    os.makedirs(out_dir, exist_ok=True)

    rows = list(csv.DictReader(open(os.path.join(src, 'rv-parts-storefront.csv'),
                                    newline='', encoding='utf-8')))

    # one download per distinct source image, even when products share it
    wanted = {}
    for r in rows:
        url = r['image_url']
        if not url or 'No_Image' in url:
            continue
        wanted.setdefault(source_name(url), url)

    manifest, failed, skipped, fetched = {}, [], 0, 0
    for i, (slug, url) in enumerate(sorted(wanted.items()), 1):
        dest = os.path.join(out_dir, slug + '.webp')
        if os.path.exists(dest) and not force:
            manifest[slug] = slug + '.webp'
            skipped += 1
            continue
        try:
            data = fetch(upsize(url, FETCH_PX))
            im = Image.open(io.BytesIO(data))
            # Flatten transparency onto white: the photos are shot on white and
            # the card tile is white, so anything else shows as a halo.
            if im.mode in ('RGBA', 'LA', 'P'):
                im = im.convert('RGBA')
                bg = Image.new('RGB', im.size, (255, 255, 255))
                bg.paste(im, mask=im.split()[-1])
                im = bg
            else:
                im = im.convert('RGB')
            im.thumbnail((OUT_PX, OUT_PX), Image.LANCZOS)
            im.save(dest, 'WEBP', quality=QUALITY, method=6)
            manifest[slug] = slug + '.webp'
            fetched += 1
        except Exception as e:
            failed.append((slug, type(e).__name__, str(e)[:60]))
        if i % 20 == 0:
            print(f'  {i}/{len(wanted)}…')
        time.sleep(DELAY)

    # sku -> image file, for the catalogue build
    by_sku = {}
    for r in rows:
        slug = source_name(r['image_url']) if r['image_url'] else ''
        if slug in manifest:
            by_sku[r['sku']] = manifest[slug]

    with open(os.path.join(out_dir, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump({'generated': time.strftime('%Y-%m-%d'),
                   'outPx': OUT_PX, 'bySku': by_sku}, f, indent=2)
        f.write('\n')

    total = sum(os.path.getsize(os.path.join(out_dir, n)) for n in manifest.values())
    print(f'\ndistinct images : {len(wanted)}')
    print(f'  downloaded    : {fetched}')
    print(f'  already there : {skipped}')
    print(f'  failed        : {len(failed)} {failed[:3]}')
    print(f'products mapped : {len(by_sku)} / {len(rows)}')
    print(f'total on disk   : {total/1e6:.1f} MB  (avg {total/max(len(manifest),1)/1024:.0f} KB)')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    if len(args) != 1:
        sys.exit(__doc__)
    main(args[0], force='--force' in sys.argv)
