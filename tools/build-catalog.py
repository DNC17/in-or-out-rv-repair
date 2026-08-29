#!/usr/bin/env python3
"""
Turn an NTP-STAG/Via export into the two files the site needs.

    python3 tools/build-catalog.py ~/Downloads/rv-parts-catalog-2026-08-29

Writes:
  assets/js/catalog.js      PUBLIC  — MSRP only, no cost, no session URLs
  data/dealer-costs.json    PRIVATE — dealer cost + margin (gitignored from deploys)

Re-run it whenever a fresh export lands; both outputs are generated, so don't
hand-edit them.
"""
import csv, json, re, sys, os, datetime

# Via category -> (chip id, chip label, default icon)
CATEGORIES = {
    'RV Air Conditioners': ('acs',      'ACs',        'ac'),
    'RV Refrigerators':    ('fridges',  'Fridges',    'fridge'),
    'RV Furnaces':         ('furnaces', 'Furnaces',   'furnace'),
    'RV Roof Vents':       ('vents',    'Roof Vents', 'vent'),
}

# Narrow the icon when the description makes the sub-type obvious.
ICON_RULES = [
    (r'ceiling assembly|duct|register|grille', 'grille'),
    (r'\blid\b|dome',                          'lid'),
    (r'garnish|trim ring',                     'ring'),
    (r'thermostat',                            'thermostat'),
    (r'control board|circuit',                 'board'),
    (r'capacitor',                             'capacitor'),
    (r'blower|fan motor',                      'blower'),
    (r'shroud|cover',                          'shroud'),
]

TITLE_RE = re.compile(r'^(?P<brand>.+?)\s+(?P<item>[\w-]+)\s*\((?P<mfr>[^)]+)\)\s*$')
MEASURE_RE = re.compile(r'\d+\s*(inch|volt|btu|amp|cubic|pound|watt)|^\d', re.I)


def money(s):
    """'$2,794.38 CAD' -> 2794.38"""
    m = re.sub(r'[^0-9.]', '', s or '')
    return round(float(m), 2) if m else None


def segments(desc):
    return [s.strip() for s in (desc or '').split(';') if s.strip()]


def key_spec(desc):
    """The one number that tells these apart on a shelf."""
    for pat, fmt in (
        (r'([\d,]+)\s*BTU',            lambda v: f"{int(v.replace(',', '')):,} BTU"),
        (r'([\d.]+)\s*Cubic\s*(?:Foot|Feet)', lambda v: f"{v} cu.ft."),
        (r'(\d[\d\-/]*)\s*Inch\s*x\s*\d[\d\-/]*\s*Inch', lambda v: f'{v}"'),
    ):
        m = re.search(pat, desc or '', re.I)
        if m:
            return fmt(m.group(1))
    return ''


def build_name(row):
    m = TITLE_RE.match(row['title'])
    brand = (m.group('brand') if m else row['title']).strip()
    segs = segments(row['description'])
    model = segs[1] if len(segs) > 1 else ''
    if MEASURE_RE.search(model):
        model = ''
    model = re.sub(r'\s*[™®]\s*', ' ', model).strip()
    name = f"{brand} {model}".strip() or brand
    spec = key_spec(row['description'])
    if spec and spec.lower() not in name.lower():
        name = f"{name} — {spec}"
    return re.sub(r'\s{2,}', ' ', name)


def build_blurb(row, name):
    """Short spec line. Skips the part type and anything already in the name."""
    segs = segments(row['description'])[1:]
    out, total = [], 0
    for s in segs:
        s = re.sub(r'\s*[™®]\s*', ' ', s).strip(' .')
        if not s or s.lower() in name.lower():
            continue
        if total + len(s) > 108:
            break
        out.append(s)
        total += len(s) + 2
    return '; '.join(out) or segments(row['description'])[0]


def pick_icon(row, default):
    hay = f"{row['title']} {row['description']}".lower()
    for pat, icon in ICON_RULES:
        if re.search(pat, hay):
            return icon
    return default


def disambiguate(products):
    """Several parts share a model and rating and differ only by colour or duct
    type, which made a run of identical-looking cards. Append the first
    description segment that actually differs within each clashing group."""
    groups = {}
    for p in products:
        groups.setdefault(p['name'], []).append(p)

    for name, grp in groups.items():
        if len(grp) < 2:
            continue
        opts = [[s for s in segments(p['_desc']) if s.lower() not in name.lower()]
                for p in grp]
        pos = next((i for i in range(max(len(o) for o in opts))
                    if len({o[i] if i < len(o) else '' for o in opts}) > 1), None)
        for p, o in zip(grp, opts):
            extra = (o[pos] if pos is not None and pos < len(o) else '') or p['sku']
            extra = re.sub(r'\s*[™®]\s*', ' ', extra).strip(' .')
            if len(extra) > 42:
                extra = extra[:42].rsplit(' ', 1)[0] + '…'
            p['name'] = f"{name} · {extra}"

    # anything still clashing gets its part number
    counts = {}
    for p in products:
        counts[p['name']] = counts.get(p['name'], 0) + 1
    for p in products:
        if counts[p['name']] > 1:
            p['name'] = f"{p['name']} · {p['sku']}"


def main(src):
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    store = list(csv.DictReader(open(os.path.join(src, 'rv-parts-storefront.csv'),
                                    newline='', encoding='utf-8')))
    internal = {r['sku']: r for r in csv.DictReader(
        open(os.path.join(src, 'rv-parts-internal.csv'), newline='', encoding='utf-8'))}

    # image manifest from tools/fetch-images.py, if it has been run
    manifest_path = os.path.join(root, 'assets', 'img', 'parts', 'manifest.json')
    images = {}
    if os.path.exists(manifest_path):
        images = json.load(open(manifest_path, encoding='utf-8')).get('bySku', {})

    products, costs, skipped = [], [], []
    seen_ids = set()

    for r in store:
        cat = CATEGORIES.get(r['category'])
        if not cat:
            skipped.append((r['sku'], r['category']))
            continue
        cat_id, _, default_icon = cat
        msrp = money(r['msrp'])
        if not msrp:
            skipped.append((r['sku'], 'no msrp'))
            continue

        m = TITLE_RE.match(r['title'])
        mfr_part = m.group('mfr').strip() if m else r['sku']
        name = build_name(r)

        pid = re.sub(r'[^a-z0-9]+', '-', r['sku'].lower()).strip('-')
        if pid in seen_ids:                       # shouldn't happen; guard anyway
            skipped.append((r['sku'], 'duplicate id'))
            continue
        seen_ids.add(pid)

        products.append({
            'id': pid,
            'name': name,
            'sku': mfr_part,
            'viaSku': r['sku'],
            'cat': cat_id,
            'price': msrp,
            'icon': pick_icon(r, default_icon),
            'blurb': build_blurb(r, name),
            'img': images.get(r['sku']),          # None -> card falls back to line art
            # searchable but not displayed: full spec text + both part numbers
            'tags': re.sub(r'\s+', ' ', f"{r['title']} {r['description']}").strip(),
            '_desc': r['description'],
        })

        cost = money((internal.get(r['sku']) or {}).get('dealer_price'))
        if cost:
            costs.append({
                'id': pid, 'viaSku': r['sku'], 'mfrPart': mfr_part, 'name': None,
                'msrp': msrp, 'cost': cost,
                'margin': round(msrp - cost, 2),
                'marginPct': round((msrp - cost) / msrp * 100, 2),
            })

    disambiguate(products)
    final_names = {p['id']: p['name'] for p in products}
    for c in costs:
        c['name'] = final_names.get(c['id'], c['mfrPart'])

    # keep the chips in a sensible order, and only for categories we actually have
    present = [c for c in CATEGORIES.values() if any(p['cat'] == c[0] for p in products)]
    cats = [{'id': 'all', 'label': 'Everything'}] + \
           [{'id': i, 'label': l} for i, l, _ in present]

    for p in products:
        p.pop('_desc', None)

    stamp = datetime.date.today().isoformat()
    js = os.path.join(root, 'assets', 'js', 'catalog.js')
    with open(js, 'w', encoding='utf-8') as f:
        f.write(f"""/* ══════════════════════════════════════════════════════════════
   catalog.js — GENERATED, do not hand-edit.

   Built by tools/build-catalog.py from an NTP-STAG/Via export.
   Source export: {os.path.basename(src.rstrip('/'))}
   Generated:     {stamp}
   {len(products)} products.

   PUBLIC FILE: MSRP only. Dealer cost lives in data/dealer-costs.json,
   which is excluded from deploys — never add a cost field here.
   ══════════════════════════════════════════════════════════════ */
window.CATALOG = {{
  generated: {json.dumps(stamp)},
  categories: {json.dumps(cats, indent=2, ensure_ascii=False)},
  products: {json.dumps(products, indent=2, ensure_ascii=False)}
}};
""")

    costs_path = os.path.join(root, 'data', 'dealer-costs.json')
    with open(costs_path, 'w', encoding='utf-8') as f:
        json.dump({
            '$comment': [
                "PRIVATE — Adam's dealer cost from NTP-STAG Via. Never ship to the",
                'public site: /data/ is listed in .vercelignore and assets/js/catalog.js',
                'carries MSRP only. GENERATED by tools/build-catalog.py — do not hand-edit.',
            ],
            'source': 'NTP-STAG Via (viantp.com)',
            'sourceExport': os.path.basename(src.rstrip('/')),
            'currency': 'CAD',
            'pulledAt': stamp,
            'products': costs,
        }, f, indent=2, ensure_ascii=False)
        f.write('\n')

    with_img = sum(1 for p in products if p.get('img'))
    print(f'products written : {len(products)}  ({with_img} with a photo)')
    for cid, label, _ in present:
        print(f'  {label:12} {sum(1 for p in products if p["cat"] == cid)}')
    print(f'cost rows written: {len(costs)}')
    if skipped:
        print(f'skipped          : {len(skipped)} -> {skipped[:5]}')
    if costs:
        pcts = sorted(c['marginPct'] for c in costs)
        print(f'margin           : {pcts[0]:.1f}% – {pcts[-1]:.1f}% (median {pcts[len(pcts)//2]:.1f}%)')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
