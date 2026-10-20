/* ══════════════════════════════════════════════════════════════
   order.js — summary for the page a customer lands on after paying.

   Takes the Checkout Session id Stripe puts in the success URL and
   returns just enough to confirm the order. The id is the customer's
   own and only reaches them, but the response is still limited to
   what's useful: no payment-method details, no raw Stripe objects.
   ══════════════════════════════════════════════════════════════ */

module.exports = async function handler(req, res) {
  const id = (req.query && req.query.session_id) || '';
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) {
    return res.status(400).json({ error: 'Missing or malformed session id.' });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return res.status(503).json({ error: 'Not configured.', code: 'stripe_not_configured' });
  }

  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(key);
    const s = await stripe.checkout.sessions.retrieve(id, {
      expand: ['line_items'],
    });

    const captureLater =
      s.payment_intent && typeof s.payment_intent === 'object'
        ? s.payment_intent.capture_method === 'manual'
        : process.env.CAPTURE_METHOD !== 'automatic';

    return res.status(200).json({
      paid: s.payment_status === 'paid' || s.payment_status === 'no_payment_required',
      status: s.status,                       // complete | open | expired
      authorisedOnly: captureLater,
      email: s.customer_details && s.customer_details.email,
      total: s.amount_total,
      currency: s.currency,
      shipping: s.shipping_cost && s.shipping_cost.shipping_rate
        ? (s.shipping_details && s.shipping_details.name ? 'delivery' : 'selected')
        : null,
      items: (s.line_items && s.line_items.data ? s.line_items.data : []).map(li => ({
        name: li.description,
        qty: li.quantity,
        amount: li.amount_total,
      })),
    });
  } catch (err) {
    console.error('[order] stripe error:', err && err.message);
    return res.status(502).json({ error: 'Could not look up that order.' });
  }
};
