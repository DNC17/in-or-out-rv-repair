/* ══════════════════════════════════════════════════════════════
   shop.js — parts catalogue, search, filtering and cart.

   ⚠ DEMO DATA. Every product, part number, price and stock figure
   below is invented placeholder content. Replace PRODUCTS with the
   real catalogue before this page is treated as live inventory.
   (The on-page notice has been removed at the client's request —
   shop.html is still noindex.)

   There is no payment processing here and none is implied: the cart
   builds a parts list that gets sent to the shop, and the shop
   confirms availability and price the way it already does.
   ══════════════════════════════════════════════════════════════ */

const SHOP_PHONE = '+12049303646';

const CATEGORIES = [
  { id: 'all',      label: 'Everything' },
  { id: 'acs',      label: 'ACs' },
  { id: 'fridges',  label: 'Fridges' },
  { id: 'furnaces', label: 'Furnaces' },
  { id: 'vents',    label: 'Roof Vents' },
  { id: 'plumbing', label: 'Plumbing' }
];

/** @type {{id:string,name:string,sku:string,cat:string,price:number,stock:number,icon:string,blurb:string,tags?:string}[]} */
const PRODUCTS = [
  /* ---- ACs ---- */
  { id: 'ac-135',    name: 'Rooftop A/C — 13,500 BTU', sku: 'IO-AC-135', cat: 'acs', price: 1149.00, stock: 3,
    icon: 'ac', tags: 'air conditioner conditioning cooling roof top non-ducted',
    blurb: 'Non-ducted rooftop unit with ceiling assembly. Fits a standard 14" opening.' },
  { id: 'ac-150',    name: 'Rooftop A/C — 15,000 BTU', sku: 'IO-AC-150', cat: 'acs', price: 1349.00, stock: 2,
    icon: 'ac', tags: 'air conditioner conditioning cooling roof top ducted',
    blurb: 'For longer trailers and hot-box afternoons. Ducted or non-ducted.' },
  { id: 'ac-shroud', name: 'A/C Shroud — Replacement', sku: 'IO-AC-SHR', cat: 'acs', price: 129.00, stock: 7,
    icon: 'shroud', tags: 'air conditioner cover cap hail damage uv',
    blurb: 'For the cracked, sun-baked one. UV-stable, fits most common units.' },
  { id: 'ac-cap',    name: 'A/C Start Capacitor', sku: 'IO-AC-CAP', cat: 'acs', price: 38.00, stock: 24,
    icon: 'capacitor', tags: 'air conditioner hard start run capacitor humming not starting',
    blurb: 'The usual reason a unit hums but won’t spin up.' },
  { id: 'ac-duct',   name: 'Ducted Ceiling Assembly', sku: 'IO-AC-DCT', cat: 'acs', price: 219.00, stock: 4,
    icon: 'grille', tags: 'air conditioner vent register plenum ceiling',
    blurb: 'Register, filter and control board for a ducted rooftop install.' },

  /* ---- Fridges ---- */
  { id: 'frg-6',     name: 'Absorption Fridge — 6 cu.ft.', sku: 'IO-FRG-06', cat: 'fridges', price: 1479.00, stock: 2,
    icon: 'fridge', tags: 'refrigerator 3-way propane gas absorption dometic norcold',
    blurb: 'Two-door, propane/electric. The standard replacement size.' },
  { id: 'frg-12v',   name: '12V Compressor Fridge — 8 cu.ft.', sku: 'IO-FRG-12', cat: 'fridges', price: 1899.00, stock: 1,
    icon: 'fridge', tags: 'refrigerator dc compressor danfoss solar off grid',
    blurb: 'Runs off the battery bank. Cools properly on a hot day and off-level.' },
  { id: 'frg-cool',  name: 'Fridge Cooling Unit', sku: 'IO-FRG-CU', cat: 'fridges', price: 749.00, stock: 3,
    icon: 'coil', tags: 'refrigerator ammonia boiler not cooling leak yellow powder',
    blurb: 'Rebuild instead of replace when the box and trim are still good.' },
  { id: 'frg-pcb',   name: 'Fridge Control Board', sku: 'IO-FRG-PCB', cat: 'fridges', price: 186.00, stock: 6,
    icon: 'board', tags: 'refrigerator circuit pcb eyebrow error code no ignition',
    blurb: 'For error codes, dead displays and no-ignition-on-gas faults.' },
  { id: 'frg-vent',  name: 'Fridge Vent Base & Cover', sku: 'IO-FRG-VNT', cat: 'fridges', price: 64.00, stock: 11,
    icon: 'grille', tags: 'refrigerator sidewall vent screen cover exterior',
    blurb: 'Sidewall vent set. Replaces the brittle, chalked-out original.' },

  /* ---- Furnaces ---- */
  { id: 'frn-30',    name: 'RV Furnace — 30,000 BTU', sku: 'IO-FRN-30', cat: 'furnaces', price: 899.00, stock: 4,
    icon: 'furnace', tags: 'heater heat propane forced air suburban atwood',
    blurb: 'Direct-vent forced air. Fits most standard furnace cut-outs.' },
  { id: 'frn-20',    name: 'RV Furnace — 20,000 BTU', sku: 'IO-FRN-20', cat: 'furnaces', price: 799.00, stock: 3,
    icon: 'furnace', tags: 'heater heat propane forced air small trailer',
    blurb: 'For smaller trailers and campers. Same mounting pattern.' },
  { id: 'frn-sail',  name: 'Furnace Sail Switch', sku: 'IO-FRN-SAL', cat: 'furnaces', price: 42.00, stock: 18,
    icon: 'switch', tags: 'heater blower runs no heat no ignition airflow',
    blurb: 'Blower spins but never lights? Start here.' },
  { id: 'frn-limit', name: 'Furnace Limit Switch', sku: 'IO-FRN-LIM', cat: 'furnaces', price: 34.00, stock: 20,
    icon: 'switch', tags: 'heater overheat cycling shuts off high temp',
    blurb: 'For a furnace that lights, runs a minute, then shuts itself down.' },
  { id: 'frn-blow',  name: 'Furnace Blower Motor', sku: 'IO-FRN-BLW', cat: 'furnaces', price: 215.00, stock: 5,
    icon: 'blower', tags: 'heater fan squeal bearing noisy motor',
    blurb: 'Replaces the screeching bearing before it strands you in October.' },
  { id: 'frn-therm', name: 'Wall Thermostat — 12V', sku: 'IO-FRN-THM', cat: 'furnaces', price: 58.00, stock: 15,
    icon: 'thermostat', tags: 'heater stat control heat cool analog digital',
    blurb: 'Heat/cool, 12V. Swaps onto the existing two-wire run.' },

  /* ---- Roof Vents ---- */
  { id: 'vnt-fan',   name: 'Roof Vent with Fan — 14"', sku: 'IO-VNT-14', cat: 'vents', price: 165.00, stock: 8,
    icon: 'vent', tags: 'roof vent fan powered exhaust intake 14x14 maxxair fantastic',
    blurb: 'Reversible 12V fan in a standard 14" × 14" roof opening.' },
  { id: 'vnt-plain', name: 'Roof Vent — Non-Powered 14"', sku: 'IO-VNT-NP', cat: 'vents', price: 54.00, stock: 14,
    icon: 'vent', tags: 'roof vent manual crank lift 14x14 escape hatch',
    blurb: 'Crank-lift vent for bathrooms and second openings.' },
  { id: 'vnt-lid',   name: 'Roof Vent Lid — Smoke', sku: 'IO-VNT-LID', cat: 'vents', price: 38.00, stock: 26,
    icon: 'lid', tags: 'roof vent cover dome cracked hail replacement',
    blurb: 'The part that goes first. Hinge pins included.' },
  { id: 'vnt-ring',  name: 'Vent Garnish Ring — White', sku: 'IO-VNT-GRN', cat: 'vents', price: 19.00, stock: 30,
    icon: 'ring', tags: 'roof vent interior trim ring surround ceiling',
    blurb: 'Interior trim ring that hides a rough ceiling cut-out.' },
  { id: 'vnt-seal',  name: 'Self-Levelling Lap Sealant', sku: 'IO-SLR-01', cat: 'vents', price: 14.00, stock: 50,
    icon: 'sealant', tags: 'roof vent caulk dicor seal leak horizontal seam',
    blurb: 'For horizontal roof seams. The cheapest roof repair there is.' },

  /* ---- Plumbing ---- */
  { id: 'fct-8',     name: '8" Kitchen Faucet — Chrome', sku: 'IO-FCT-08', cat: 'plumbing', price: 78.00, stock: 12,
    icon: 'faucet', tags: 'tap sink galley single lever hi arc',
    blurb: 'Single-lever, hi-arc spout. Standard 8" centre mount.' },
  { id: 'fct-lav',   name: 'Two-Handle Lavatory Faucet', sku: 'IO-FCT-04', cat: 'plumbing', price: 52.00, stock: 18,
    icon: 'faucet2', tags: 'tap bathroom washroom sink 4 inch centreset',
    blurb: '4" centreset with crystal handles. Washroom sink standard.' },
  { id: 'dvt-1',     name: 'Tub / Shower Diverter Valve', sku: 'IO-DVT-01', cat: 'plumbing', price: 46.00, stock: 9,
    icon: 'valve', tags: 'shower tub mixer dripping leak cartridge',
    blurb: 'Replaces most leaking diverters without touching the wall.' },
  { id: 'pmp-3',     name: '12V Water Pump — 3.0 GPM', sku: 'IO-PMP-30', cat: 'plumbing', price: 139.00, stock: 7,
    icon: 'pump', tags: 'fresh water pressure shurflo cycling noisy self priming',
    blurb: 'Self-priming, run-dry safe. Quiet enough for an overnight.' },
  { id: 'tlt-grav',  name: 'RV Toilet — Gravity Flush', sku: 'IO-TLT-01', cat: 'plumbing', price: 189.00, stock: 5,
    icon: 'toilet', tags: 'washroom china bowl foot pedal thetford dometic',
    blurb: 'Foot-pedal flush, china bowl. Standard floor flange.' },
  { id: 'wh-6',      name: '6-Gallon Water Heater', sku: 'IO-WH-06', cat: 'plumbing', price: 649.00, stock: 3,
    icon: 'heater', tags: 'hot water tank gas electric suburban atwood dsi',
    blurb: 'Gas/electric with bypass kit. Drop-in for most 6-gal openings.' },
  { id: 'and-1',     name: 'Anode Rod & Drain Plug', sku: 'IO-AND-01', cat: 'plumbing', price: 24.50, stock: 40,
    icon: 'rod', tags: 'hot water tank magnesium suburban sacrificial winterize',
    blurb: 'Magnesium rod for Suburban tanks. Change it every season.' }
];

/* ---------- helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => '$' + n.toFixed(2);
const CART_KEY = 'ioro.cart.v1';
const catLabel = id => (CATEGORIES.find(c => c.id === id) || {}).label || '';

/* ---------- cart state (per browser, best-effort) ---------- */
/** Quantities are clamped to real stock in one place, so a stale or hand-edited
 *  localStorage entry can't restore more than the shop actually has. */
function clampQty(product, qty) {
  const q = Math.floor(Number(qty));
  if (!Number.isFinite(q) || q <= 0) return 0;
  return Math.min(q, product.stock);
}

function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    const clean = {};
    Object.entries(raw).forEach(([id, qty]) => {
      const product = PRODUCTS.find(p => p.id === id);
      if (!product) return;                       // not in the catalogue any more
      const q = clampQty(product, qty);
      if (q > 0) clean[id] = q;
    });
    return clean;
  } catch (e) {
    return {};
  }
}
function writeCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* private mode */ }
}

let cart = readCart();
writeCart(cart);   // normalise storage immediately if it held junk
let activeCat = 'all';
let query = '';

/* ---------- search ---------- */
/* Matching is on word *starts*, not raw substrings — plain `includes` meant
   "ac" also hit "furn-ac-e", "repl-ac-ement" and "surf-ac-e", which buried the
   air conditioners under everything else.

   Each word contributes both its squashed form and its pieces, so "A/C" is
   findable as "ac", and "IO-AC-135" as "io", "ac", "135" or the whole SKU. */
const squash = w => w.replace(/[^a-z0-9]+/g, '');

function tokenise(text) {
  const out = new Set();
  text.toLowerCase().split(/\s+/).filter(Boolean).forEach(word => {
    const whole = squash(word);            // "a/c" -> "ac",  "io-ac-135" -> "ioac135"
    if (whole) out.add(whole);
    word.split(/[^a-z0-9]+/).forEach(part => { if (part) out.add(part); });
  });
  return [...out];
}

/** Everything a product can be found by: name, part number, category and the
 *  symptom words in `tags` ("won't cool", "sail switch", "humming"). */
const TOKENS = new Map(PRODUCTS.map(p => [
  p.id,
  tokenise(`${p.name} ${p.sku} ${catLabel(p.cat)} ${p.blurb} ${p.tags || ''}`)
]));

function matches(p, terms) {
  const tokens = TOKENS.get(p.id) || [];
  return terms.every(t => tokens.some(tok => tok.startsWith(t)));
}

function visibleProducts() {
  const terms = query.trim().toLowerCase()
    .split(/\s+/).map(squash).filter(Boolean);
  return PRODUCTS.filter(p =>
    (activeCat === 'all' || p.cat === activeCat) &&
    (terms.length === 0 || matches(p, terms))
  );
}

/* ---------- rendering ---------- */
function productCard(p) {
  const out = p.stock === 0;
  return `
    <li class="prod${out ? ' is-out' : ''}">
      <div class="prod__art" aria-hidden="true">
        <svg viewBox="0 0 48 48"><use href="#ic-${p.icon}"></use></svg>
      </div>
      <div class="prod__body">
        <p class="prod__sku">${p.sku} · ${catLabel(p.cat)}</p>
        <h3 class="prod__name">${p.name}</h3>
        <p class="prod__blurb">${p.blurb}</p>
      </div>
      <div class="prod__foot">
        <span class="prod__price">${money(p.price)}</span>
        <span class="prod__stock">${out ? 'On order' : p.stock + ' in stock'}</span>
        <button class="prod__add" data-add="${p.id}" ${out ? 'disabled' : ''}>
          ${out ? 'Ask about it' : 'Add'}
        </button>
      </div>
    </li>`;
}

function renderGrid() {
  const list = visibleProducts();
  const grid = $('#grid');

  grid.innerHTML = list.length
    ? list.map(productCard).join('')
    : `<li class="noresult">
         <h3>Nothing matches${query.trim() ? ` “${escapeHtml(query.trim())}”` : ''}.</h3>
         <p>We stock a lot more than what's listed here — call or text a photo
            of the part and we'll track it down.</p>
         <div class="noresult__act">
           <button class="btn" id="clearFilters">Clear filters</button>
           <a class="link" href="tel:${SHOP_PHONE}">Call (204) 930‑3646 ↗</a>
         </div>
       </li>`;

  $('#count').textContent = `${list.length} ${list.length === 1 ? 'part' : 'parts'}`;
  $('#searchClear').hidden = query.trim() === '';
  syncAddButtons();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function syncAddButtons() {
  $$('[data-add]').forEach(btn => {
    const qty = cart[btn.dataset.add] || 0;
    btn.classList.toggle('is-in', qty > 0);
    if (qty > 0) btn.textContent = `In list · ${qty}`;
    else if (!btn.disabled) btn.textContent = 'Add';
  });
}

function cartLines() {
  return Object.entries(cart)
    .map(([id, qty]) => ({ p: PRODUCTS.find(x => x.id === id), qty }))
    .filter(l => l.p);
}
const cartCount = () => cartLines().reduce((n, l) => n + l.qty, 0);
const cartTotal = () => cartLines().reduce((n, l) => n + l.qty * l.p.price, 0);

function renderCart() {
  const lines = cartLines();
  const n = cartCount();

  $('#cartCount').textContent = n;
  $('#cartCount').hidden = n === 0;
  $('#cartTotal').textContent = money(cartTotal());

  $('#cartItems').innerHTML = lines.length
    ? lines.map(({ p, qty }) => `
        <li class="ci">
          <div class="ci__art" aria-hidden="true"><svg viewBox="0 0 48 48"><use href="#ic-${p.icon}"></use></svg></div>
          <div class="ci__main">
            <p class="ci__name">${p.name}</p>
            <p class="ci__sku">${p.sku} · ${money(p.price)}</p>
          </div>
          <div class="ci__qty">
            <button data-dec="${p.id}" aria-label="One fewer ${p.name}">−</button>
            <span>${qty}</span>
            <button data-inc="${p.id}" aria-label="One more ${p.name}" ${qty >= p.stock ? 'disabled' : ''}>+</button>
          </div>
          <button class="ci__rm" data-rm="${p.id}" aria-label="Remove ${p.name}">×</button>
        </li>`).join('')
    : `<li class="ci-empty">
         <p>Nothing in the list yet.</p>
         <p class="ci-empty__sub">Add the parts you need and send the whole list over in one go.</p>
       </li>`;

  $('#cartSend').disabled = lines.length === 0;
  syncAddButtons();
}

/** The list the customer sends to the shop. */
function orderText() {
  const lines = cartLines();
  const body = lines.map(({ p, qty }) => `${qty} x ${p.name} (${p.sku})`).join('\n');
  return `Parts request from the website:\n\n${body}\n\nEstimated total: ${money(cartTotal())}\n\nName:\nRV year/make/model:`;
}

/* ---------- interactions ---------- */
function setCart(id, qty) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const q = clampQty(p, qty);
  if (q === 0) delete cart[id]; else cart[id] = q;
  writeCart(cart);
  renderCart();
}

function openCart(open) {
  const panel = $('#cart');
  panel.classList.toggle('is-open', open);
  panel.setAttribute('aria-hidden', String(!open));
  $('#cartToggle').setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('cart-open', open);
  if (open) $('#cartClose').focus();
}

function setCategory(id) {
  activeCat = id;
  $$('#chips .chip').forEach(c => c.classList.toggle('is-active', c.dataset.cat === id));
  renderGrid();
}

function init() {
  // category chips
  $('#chips').innerHTML = CATEGORIES.map(c =>
    `<button class="chip${c.id === 'all' ? ' is-active' : ''}" data-cat="${c.id}">${c.label}</button>`
  ).join('');

  $('#chips').addEventListener('click', e => {
    const chip = e.target.closest('[data-cat]');
    if (chip) setCategory(chip.dataset.cat);
  });

  // search
  const search = $('#search');
  search.addEventListener('input', () => { query = search.value; renderGrid(); });
  search.addEventListener('keydown', e => {
    if (e.key === 'Escape' && search.value) { search.value = ''; query = ''; renderGrid(); }
  });
  $('#searchClear').addEventListener('click', () => {
    search.value = ''; query = ''; renderGrid(); search.focus();
  });

  $('#grid').addEventListener('click', e => {
    if (e.target.closest('#clearFilters')) {
      search.value = ''; query = ''; setCategory('all'); return;
    }
    const btn = e.target.closest('[data-add]');
    if (!btn || btn.disabled) return;
    setCart(btn.dataset.add, (cart[btn.dataset.add] || 0) + 1);
  });

  $('#cartItems').addEventListener('click', e => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    const rm  = e.target.closest('[data-rm]');
    if (inc) setCart(inc.dataset.inc, (cart[inc.dataset.inc] || 0) + 1);
    if (dec) setCart(dec.dataset.dec, (cart[dec.dataset.dec] || 0) - 1);
    if (rm)  setCart(rm.dataset.rm, 0);
  });

  $('#cartToggle').addEventListener('click', () => openCart(true));
  $('#cartClose').addEventListener('click', () => openCart(false));
  $('#cartScrim').addEventListener('click', () => openCart(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#cart').classList.contains('is-open')) openCart(false);
  });

  // Hand the list off to the shop — no payment is taken on this site.
  $('#cartSend').addEventListener('click', () => {
    const body = encodeURIComponent(orderText());
    window.location.href = `sms:${SHOP_PHONE}${/iPhone|iPad|Mac/.test(navigator.userAgent) ? '&' : '?'}body=${body}`;
  });
  $('#cartCopy').addEventListener('click', async () => {
    const btn = $('#cartCopy');
    try {
      await navigator.clipboard.writeText(orderText());
      btn.textContent = 'Copied';
    } catch (e) {
      btn.textContent = 'Press ⌘C';
    }
    setTimeout(() => { btn.textContent = 'Copy list'; }, 1800);
  });

  renderGrid();
  renderCart();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
