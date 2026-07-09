import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function createCheckoutSession({ amount, email, merchantName }) {
  if (!stripe) {
    return null;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'php',
          product_data: {
            name: `SwiftWallet Top-up for ${merchantName}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?status=cancelled`,
    customer_email: email,
  });

  return session;
}
