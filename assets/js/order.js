/* ══════════════════════════════════════════════════════════════
   order.js — the page a customer lands on after paying.

   Clears the cart, then asks api/order for a summary. If that call
   fails the page still confirms the payment went through, because
   Stripe only ever redirects here on success — a lookup failure is our
   problem, not a reason to worry the customer.
   ══════════════════════════════════════════════════════════════ */

(function () {
'use strict';

const SHOP_PHONE = '+12049303646';
const CART_KEY = 'ioro.cart.v1';
const $ = s => document.querySelector(s);

const MONEY = new Intl.NumberFormat('en-CA', {
  style: 'currency', currency: 'CAD', currencyDisplay: 'narrowSymbol'
});
const money = cents => MONEY.format((cents || 0) / 100);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function clearCart() {
  try { localStorage.removeItem(CART_KEY); } catch (e) { /* private mode */ }
}

const shell = (title, body) => `
  <div class="ord__box">
    <p class="ord__tick" aria-hidden="true">✓</p>
    <h1 class="ord__h">${title}</h1>
    ${body}
    <div class="ord__act">
      <a class="btn btn--lg" href="/shop">Back to the shop</a>
      <a class="link" href="tel:${SHOP_PHONE}">Call (204) 930‑3646 ↗</a>
    </div>
  </div>`;

function renderUnknown() {
  $('#ord').innerHTML = shell('Thanks — your order is in.', `
    <p class="ord__lede">
      We've got it. Adam will confirm the parts are on the shelf and be in
      touch shortly. If anything looks wrong, give the shop a call.
    </p>`);
}

function renderNoSession() {
  $('#ord').innerHTML = `
    <div class="ord__box">
      <h1 class="ord__h">Nothing to show here.</h1>
      <p class="ord__lede">
        This page confirms an order after checkout. If you've just paid and
        landed here by mistake, call the shop and we'll find your order.
      </p>
      <div class="ord__act">
        <a class="btn btn--lg" href="/shop">Back to the shop</a>
        <a class="link" href="tel:${SHOP_PHONE}">Call (204) 930‑3646 ↗</a>
      </div>
    </div>`;
}

function render(o) {
  const items = (o.items || []).map(i => `
    <li><span class="ord__q">${esc(i.qty)}&times;</span>
        <span class="ord__n">${esc(i.name)}</span>
        <span class="ord__a">${money(i.amount)}</span></li>`).join('');

  $('#ord').innerHTML = shell('Thanks — your order is in.', `
    <p class="ord__lede">
      ${o.authorisedOnly
        ? 'Your card is authorised but <strong>not charged yet</strong>. We confirm '
          + 'every part is on the shelf first, and only take payment once it is. '
          + 'If something is backordered we release the hold and call you.'
        : 'Your payment went through.'}
      ${o.email ? `A receipt is on its way to ${esc(o.email)}.` : ''}
    </p>

    ${items ? `<ul class="ord__items">${items}</ul>` : ''}
    ${o.total != null ? `
      <p class="ord__total"><span>Total</span><b>${money(o.total)}</b></p>` : ''}

    <p class="ord__next">
      Next: we check stock in the morning and call or text you with a pickup
      or delivery time.
    </p>`);
}

async function init() {
  clearCart();

  const id = new URLSearchParams(location.search).get('session_id');
  if (!id) return renderNoSession();

  try {
    const res = await fetch(`/api/order?session_id=${encodeURIComponent(id)}`);
    if (!res.ok) return renderUnknown();
    const data = await res.json();
    if (!data || data.error) return renderUnknown();
    render(data);
  } catch (e) {
    renderUnknown();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
