/* ══════════════════════════════════════════════════════════════
   _pricing.js — cart validation, re-pricing and shipping choice.

   Deliberately free of Stripe and of any HTTP concern so it can be
   tested directly. The one rule that matters: prices come from
   _catalog.json, never from the request. A browser can be told to send
   any number it likes.
   ══════════════════════════════════════════════════════════════ */

const catalog = require('./_catalog.json');

const BY_ID = new Map(catalog.products.map(p => [p.id, p]));

const MAX_QTY = 20;          // matches the storefront's own cap
const MAX_LINES = 40;        // a sane ceiling on distinct parts per order

/* Anything on a roof or holding food is a two-person lift and ships as
   freight, not parcel. Weight decides it where we have one; for these
   categories a missing weight still means bulky. */
const HEAVY_LB = 50;
const BULKY_CATS = new Set(['acs', 'fridges']);
const isHeavy = p => (p.lb != null ? p.lb > HEAVY_LB : BULKY_CATS.has(p.cat));

const cents = n => Math.round(n * 100);

/**
 * @param {Array<{id: string, qty: number}>} raw  as posted by the browser
 * @returns {{ok: boolean, errors: string[], lines: object[], subtotal: number,
 *            heavy: boolean, totalLb: number|null}}
 */
function priceCart(raw) {
  const errors = [];

  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, errors: ['Your cart is empty.'], lines: [], subtotal: 0,
             heavy: false, totalLb: 0 };
  }
  if (raw.length > MAX_LINES) {
    errors.push(`That's more than ${MAX_LINES} different parts — please call us.`);
  }

  const lines = [];
  const seen = new Set();

  for (const item of raw.slice(0, MAX_LINES)) {
    const id = typeof item?.id === 'string' ? item.id : '';
    const product = BY_ID.get(id);
    if (!product) {
      errors.push(`We no longer carry one of the parts in your cart.`);
      continue;
    }
    if (seen.has(id)) continue;          // fold duplicates rather than double-charge
    seen.add(id);

    const qty = Math.floor(Number(item.qty));
    if (!Number.isFinite(qty) || qty < 1) {
      errors.push(`Invalid quantity for ${product.name}.`);
      continue;
    }

    lines.push({
      product,
      qty: Math.min(qty, MAX_QTY),
      unitCents: cents(product.price),   // from the catalogue, not the request
    });
  }

  if (lines.length === 0 && errors.length === 0) {
    errors.push('Your cart is empty.');
  }

  const subtotal = lines.reduce((n, l) => n + l.unitCents * l.qty, 0);
  const heavy = lines.some(l => isHeavy(l.product));
  const weights = lines.map(l => (l.product.lb == null ? null : l.product.lb * l.qty));
  const totalLb = weights.includes(null)
    ? null
    : Math.round(weights.reduce((a, b) => a + b, 0) * 10) / 10;

  return { ok: errors.length === 0 && lines.length > 0, errors, lines,
           subtotal, heavy, totalLb };
}

/* Flat rates, no carrier integration. Freight quoting for an 80 lb rooftop
   unit is a conversation, not a checkbox — so heavy carts are pickup or local
   delivery only, and the customer is told to call for anything further. */
const SHIPPING = {
  pickup: {
    id: 'pickup',
    label: 'Pickup at the shop — 2476 Wenzel St',
    cents: 0,
    days: [1, 3],
  },
  local: {
    id: 'local',
    label: 'Delivery within Winnipeg',
    cents: 3500,
    days: [1, 3],
  },
  canada: {
    id: 'canada',
    label: 'Shipping within Canada',
    cents: 2500,
    days: [3, 10],
  },
};

function shippingOptions({ heavy }) {
  return heavy
    ? [SHIPPING.pickup, SHIPPING.local]
    : [SHIPPING.pickup, SHIPPING.local, SHIPPING.canada];
}

module.exports = {
  priceCart, shippingOptions, isHeavy,
  MAX_QTY, MAX_LINES, HEAVY_LB, SHIPPING,
  catalogGenerated: catalog.generated,
};
