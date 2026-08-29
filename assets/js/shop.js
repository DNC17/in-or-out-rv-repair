/* ══════════════════════════════════════════════════════════════
   shop.js — parts catalogue, filtering and cart.

   ⚠ DEMO DATA. Every product, part number, price and stock figure
   below is invented placeholder content. Replace PRODUCTS with the
   real catalogue before this page is treated as live inventory.

   There is no payment processing here and none is implied: the cart
   builds a parts list that gets sent to the shop by text or email,
   and the shop quotes and takes payment the way they already do.
   ══════════════════════════════════════════════════════════════ */

const SHOP_PHONE = '+12049303646';

const CATEGORIES = [
  { id: 'all',      label: 'Everything' },
  { id: 'heating',  label: 'Heating & Water' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'electric', label: 'Electrical' },
  { id: 'exterior', label: 'Exterior' },
  { id: 'hardware', label: 'Hardware' }
];

/** @type {{id:string,name:string,sku:string,cat:string,price:number,stock:number,icon:string,blurb:string}[]} */
const PRODUCTS = [
  { id: 'furnace-30k',  name: 'RV Furnace — 30,000 BTU', sku: 'IO-FRN-30', cat: 'heating',  price: 899.00, stock: 4,
    icon: 'furnace',  blurb: 'Direct-vent forced air. Fits most standard furnace cut-outs.' },
  { id: 'wh-6gal',      name: '6-Gallon Water Heater',   sku: 'IO-WH-06',  cat: 'heating',  price: 649.00, stock: 3,
    icon: 'heater',   blurb: 'Gas/electric with bypass kit. Drop-in for most 6-gal openings.' },
  { id: 'anode-rod',    name: 'Anode Rod & Drain Plug',  sku: 'IO-AND-01', cat: 'heating',  price: 24.50,  stock: 40,
    icon: 'rod',      blurb: 'Magnesium rod for Suburban tanks. Change it every season.' },
  { id: 'faucet-8in',   name: '8" Kitchen Faucet — Chrome', sku: 'IO-FCT-08', cat: 'plumbing', price: 78.00, stock: 12,
    icon: 'faucet',   blurb: 'Single-lever, hi-arc spout. Standard 8" centre mount.' },
  { id: 'faucet-lav',   name: 'Two-Handle Lavatory Faucet', sku: 'IO-FCT-04', cat: 'plumbing', price: 52.00, stock: 18,
    icon: 'faucet2',  blurb: '4" centreset with crystal handles. Washroom sink standard.' },
  { id: 'diverter',     name: 'Tub / Shower Diverter Valve', sku: 'IO-DVT-01', cat: 'plumbing', price: 46.00, stock: 9,
    icon: 'valve',    blurb: 'Replaces most leaking diverters without touching the wall.' },
  { id: 'pump-3gpm',    name: '12V Water Pump — 3.0 GPM', sku: 'IO-PMP-30', cat: 'plumbing', price: 139.00, stock: 7,
    icon: 'pump',     blurb: 'Self-priming, run-dry safe. Quiet enough for an overnight.' },
  { id: 'toilet-grav',  name: 'RV Toilet — Gravity Flush', sku: 'IO-TLT-01', cat: 'plumbing', price: 189.00, stock: 5,
    icon: 'toilet',   blurb: 'Foot-pedal flush, china bowl. Standard floor flange.' },
  { id: 'led-dome',     name: 'LED Dome Light — 12V',    sku: 'IO-LED-12', cat: 'electric', price: 19.00,  stock: 60,
    icon: 'light',    blurb: 'Warm white, low draw. Direct swap for old incandescent domes.' },
  { id: 'converter-55', name: 'Converter / Charger — 55A', sku: 'IO-CNV-55', cat: 'electric', price: 279.00, stock: 6,
    icon: 'converter',blurb: 'Four-stage charging. Fixes the batteries-never-full complaint.' },
  { id: 'vent-fan',     name: 'Roof Vent with Fan — 14"', sku: 'IO-VNT-14', cat: 'exterior', price: 165.00, stock: 8,
    icon: 'vent',     blurb: 'Reversible 12V fan in a standard 14" × 14" roof opening.' },
  { id: 'jack-3500',    name: 'Power Tongue Jack — 3,500 lb', sku: 'IO-JCK-35', cat: 'exterior', price: 245.00, stock: 6,
    icon: 'jack',     blurb: 'Lit footplate and manual override. Bolts to a standard A-frame.' },
  { id: 'lap-sealant',  name: 'Self-Levelling Lap Sealant', sku: 'IO-SLR-01', cat: 'exterior', price: 14.00, stock: 50,
    icon: 'sealant',  blurb: 'For horizontal roof seams. The cheapest roof repair there is.' },
  { id: 'baggage-lock', name: 'Baggage Door Lock Set',    sku: 'IO-LCK-02', cat: 'hardware', price: 32.00,  stock: 22,
    icon: 'lock',     blurb: 'Keyed-alike pair with cam and gasket. Common size.' }
];

/* ---------- helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => '$' + n.toFixed(2);
const CART_KEY = 'ioro.cart.v1';

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

/* ---------- rendering ---------- */
function productCard(p) {
  const out = p.stock === 0;
  return `
    <li class="prod${out ? ' is-out' : ''}" data-cat="${p.cat}">
      <div class="prod__art" aria-hidden="true">
        <svg viewBox="0 0 48 48"><use href="#ic-${p.icon}"></use></svg>
      </div>
      <div class="prod__body">
        <p class="prod__sku">${p.sku}</p>
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
  const list = activeCat === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === activeCat);
  $('#grid').innerHTML = list.map(productCard).join('');
  $('#count').textContent = `${list.length} ${list.length === 1 ? 'part' : 'parts'}`;
  syncAddButtons();
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

function init() {
  // category chips
  $('#chips').innerHTML = CATEGORIES.map(c =>
    `<button class="chip${c.id === 'all' ? ' is-active' : ''}" data-cat="${c.id}">${c.label}</button>`
  ).join('');

  $('#chips').addEventListener('click', e => {
    const chip = e.target.closest('[data-cat]');
    if (!chip) return;
    activeCat = chip.dataset.cat;
    $$('#chips .chip').forEach(c => c.classList.toggle('is-active', c === chip));
    renderGrid();
  });

  $('#grid').addEventListener('click', e => {
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
