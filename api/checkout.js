/* ══════════════════════════════════════════════════════════════
   checkout.js — creates a Stripe Checkout Session for the cart.

   The browser posts only [{id, qty}]. Every price is looked up again
   from api/_catalog.json here, so a tampered cart can't change what
   gets charged.

   Env:
     STRIPE_SECRET_KEY     required. sk_test_… locally, sk_live_… in prod.
     STRIPE_AUTOMATIC_TAX  "true" once Stripe Tax is configured on the
                           account. Off by default: enabling it before
                           the account is set up makes the API call fail.
     CAPTURE_METHOD        "manual" (default) authorises now and captures
                           once the part is confirmed in Via — the export
                           carries no stock, so charging up front risks
                           taking money for a backordered part.
                           "automatic" charges immediately.
   ══════════════════════════════════════════════════════════════ */

const { priceCart, shippingOptions, catalogGenerated } = require('./_pricing');

function originOf(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

const isLocal = origin => /localhost|127\.0\.0\.1/.test(origin);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Not an error in the customer's cart — the shop just isn't wired up yet.
    return res.status(503).json({
      error: 'Online payment isn\'t switched on yet. Please call (204) 930‑3646 '
           + 'and we\'ll take the order over the phone.',
      code: 'stripe_not_configured',
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }

  const priced = priceCart(body && body.items);
  if (!priced.ok) {
    return res.status(400).json({ error: priced.errors[0], errors: priced.errors });
  }

  const origin = originOf(req);
  const shipping = shippingOptions(priced);

  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(key);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'cad',

      line_items: priced.lines.map(({ product, qty, unitCents }) => ({
        quantity: qty,
        price_data: {
          currency: 'cad',
          unit_amount: unitCents,
          product_data: {
            name: product.name,
            description: `Part no. ${product.sku}`,
            metadata: { part_number: product.sku, product_id: product.id },
            // Stripe needs absolute URLs, and it can't reach a dev machine.
            ...(product.img && !isLocal(origin)
              ? { images: [`${origin}/assets/img/parts/${product.img}`] }
              : {}),
          },
        },
      })),

      shipping_options: shipping.map(opt => ({
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: opt.label,
          fixed_amount: { amount: opt.cents, currency: 'cad' },
          delivery_estimate: {
            minimum: { unit: 'business_day', value: opt.days[0] },
            maximum: { unit: 'business_day', value: opt.days[1] },
          },
        },
      })),

      // Needed for delivery; harmless for pickup, and it gives Adam a
      // billing contact either way.
      shipping_address_collection: { allowed_countries: ['CA'] },
      phone_number_collection: { enabled: true },

      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === 'true' },

      payment_intent_data: {
        capture_method: process.env.CAPTURE_METHOD === 'automatic' ? 'automatic' : 'manual',
        description: 'inoroutrvrepair.com parts order',
      },

      // So the order is fulfillable straight from the Stripe dashboard.
      metadata: {
        parts: priced.lines.map(l => `${l.qty}x ${l.product.sku}`).join(', ').slice(0, 480),
        total_lb: priced.totalLb == null ? 'unknown' : String(priced.totalLb),
        heavy: String(priced.heavy),
        catalogue: catalogGenerated || 'unknown',
      },

      success_url: `${origin}/order?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop`,
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    // Surface the reason in the log, keep the customer-facing text plain.
    console.error('[checkout] stripe error:', err && err.message);
    return res.status(502).json({
      error: 'We couldn\'t start the checkout. Please try again, or call '
           + '(204) 930‑3646.',
      code: (err && err.code) || 'stripe_error',
    });
  }
};
