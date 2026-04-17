require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY;
const successUrl = process.env.CHECKOUT_SUCCESS_URL;
const cancelUrl = process.env.CHECKOUT_CANCEL_URL;
const port = process.env.PORT || 4242;

if (!stripeKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable.');
}
if (!successUrl) {
  throw new Error('Missing CHECKOUT_SUCCESS_URL environment variable.');
}
if (!cancelUrl) {
  throw new Error('Missing CHECKOUT_CANCEL_URL environment variable.');
}

const stripe = new Stripe(stripeKey, { apiVersion: '2022-11-15' });
const app = express();
app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  try {
    const {
      dataset,
      dateFrom,
      dateTo,
      platforms,
      carriers,
      networkTypes,
      uptimeMin,
      uptimeMax,
      disconnectMin,
      disconnectMax,
      totalCount,
    } = req.body;

    if (!dataset || !dateFrom || !dateTo) {
      return res.status(400).json({ error: 'Missing required purchase fields.' });
    }

    const amount = Math.max(1000, Math.min(5000, Math.round((totalCount || 1) * 10)));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: `Connectivity dataset purchase`,
              description: `Connectivity dataset slice: ${dateFrom} to ${dateTo}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        dataset,
        filter_json: JSON.stringify({
          dateFrom,
          dateTo,
          platforms,
          carriers,
          networkTypes,
          uptimeMin,
          uptimeMax,
          disconnectMin,
          disconnectMax,
          totalCount,
        }),
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('create-checkout-session error', error);
    res.status(500).json({ error: 'Unable to create checkout session.' });
  }
});

app.listen(port, () => {
  console.log(`Stripe purchase server listening on http://localhost:${port}`);
});
