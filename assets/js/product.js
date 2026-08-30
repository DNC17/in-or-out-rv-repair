/* ══════════════════════════════════════════════════════════════
   product.js — single-product detail view.

   Reads ?id= against the generated catalogue in catalog.js. Shares the
   cart storage key with shop.js so a part added here shows up there.
   ══════════════════════════════════════════════════════════════ */

/* Wrapped in an IIFE: this loads alongside shop.js as a classic script, and
   both files declare helpers of the same name at top level. */
(function () {
'use strict';

const SHOP_PHONE = '+12049303646';
const CATALOG = window.CATALOG || { categories: [], products: [] };
const PRODUCTS = CATALOG.products || [];
const MAX_QTY = 20;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MONEY = new Intl.NumberFormat('en-CA', {
  style: 'currency', currency: 'CAD', currencyDisplay: 'narrowSymbol'
});
const money = n => MONEY.format(n);
const catLabel = id => ((CATALOG.categories || []).find(c => c.id === id) || {}).label || '';
const escapeHtml = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* The cart itself lives in shop.js (loaded alongside this file); we only
   ever add to it, so there is no second copy of that state here. */
const parts = () => window.PartsList;

let qty = 1;

/* ---------- render ---------- */
function notFound() {
  $('#pd').innerHTML = `
    <div class="pd__missing">
      <h1>We couldn't find that part.</h1>
      <p>It may have come out of the catalogue, or the link may be incomplete.</p>
      <div class="pd__missing-act">
        <a class="btn btn--lg" href="shop.html">Back to the shop</a>
        <a class="link" href="tel:${SHOP_PHONE}">Call (204) 930‑3646 ↗</a>
      </div>
    </div>`;
  document.title = 'Part not found — In or Out RV Parts & Repair';
}

function render(p) {
  document.title = `${p.name} — In or Out RV Parts & Repair`;
  const related = PRODUCTS
    .filter(x => x.cat === p.cat && x.id !== p.id)
    .slice(0, 4);

  $('#pd').innerHTML = `
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="shop.html">Shop</a>
      <span aria-hidden="true">/</span>
      <a href="shop.html#${p.cat}" data-cat="${p.cat}">${escapeHtml(catLabel(p.cat))}</a>
      <span aria-hidden="true">/</span>
      <span class="crumbs__here">${escapeHtml(p.name)}</span>
    </nav>

    <div class="pd__main">
      <div class="pd__media${p.img ? ' has-photo' : ''}">
        ${p.img
          ? `<img src="assets/img/parts/${p.img}" alt="${escapeHtml(p.name)}" decoding="async">`
          : `<svg viewBox="0 0 48 48" aria-hidden="true"><use href="#ic-${p.icon}"></use></svg>`}
      </div>

      <div class="pd__info">
        <p class="pd__meta">${escapeHtml(p.sku)} · ${escapeHtml(catLabel(p.cat))}</p>
        <h1 class="pd__name">${escapeHtml(p.name)}</h1>
        <p class="pd__price">${money(p.price)}</p>
        <p class="pd__note">
          Price is manufacturer's suggested retail. We confirm availability and
          the final price when your list comes in.
        </p>

        <div class="pd__buy">
          <div class="pd__qty">
            <button id="qDec" aria-label="One fewer">−</button>
            <span id="qVal">1</span>
            <button id="qInc" aria-label="One more">+</button>
          </div>
          <button class="btn btn--lg" id="pdAdd">Add to list</button>
        </div>
        <p class="pd__inlist" id="pdInList" hidden></p>

        <ul class="pd__specs">
          ${p.specs.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>

        <dl class="pd__ids">
          <dt>Part number</dt><dd>${escapeHtml(p.sku)}</dd>
          <dt>Supplier code</dt><dd>${escapeHtml(p.viaSku)}</dd>
        </dl>

        <p class="pd__help">
          Not sure this is the right part?
          <a class="link" href="sms:${SHOP_PHONE}">Text a photo of the old one ↗</a>
        </p>
      </div>
    </div>

    ${related.length ? `
      <section class="pd__rel">
        <h2>More ${escapeHtml(catLabel(p.cat))}</h2>
        <ul class="grid">
          ${related.map(r => `
            <li class="prod">
              <a class="prod__link" href="product.html?id=${encodeURIComponent(r.id)}">
                <span class="sr-only">${escapeHtml(r.name)}</span>
              </a>
              <div class="prod__art${r.img ? ' has-photo' : ''}" aria-hidden="true">
                ${r.img
                  ? `<img src="assets/img/parts/${r.img}" alt="" loading="lazy" decoding="async">`
                  : `<svg viewBox="0 0 48 48"><use href="#ic-${r.icon}"></use></svg>`}
              </div>
              <div class="prod__body">
                <p class="prod__sku">${escapeHtml(r.sku)}</p>
                <h3 class="prod__name">${escapeHtml(r.name)}</h3>
              </div>
              <div class="prod__foot">
                <span class="prod__price">${money(r.price)}</span>
              </div>
            </li>`).join('')}
        </ul>
      </section>` : ''}
  `;

  const inList = () => {
    const n = parts() ? parts().qty(p.id) : 0;
    const el = $('#pdInList');
    el.hidden = n === 0;
    if (n) el.innerHTML = `${n} already in your <a class="link" href="shop.html">parts list</a>.`;
  };

  const setQty = v => { qty = Math.max(1, Math.min(v, MAX_QTY)); $('#qVal').textContent = qty; };
  $('#qDec').addEventListener('click', () => setQty(qty - 1));
  $('#qInc').addEventListener('click', () => setQty(qty + 1));

  $('#pdAdd').addEventListener('click', () => {
    if (parts()) parts().add(p.id, qty);
    inList();
    const btn = $('#pdAdd');
    btn.textContent = 'Added';
    setTimeout(() => { btn.textContent = 'Add to list'; }, 1600);
  });

  inList();
}

function init() {
  const id = new URLSearchParams(location.search).get('id');
  const p = PRODUCTS.find(x => x.id === id);
  if (p) render(p); else notFound();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
