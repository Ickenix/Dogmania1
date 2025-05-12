import Stripe from 'npm:stripe@13.7.0';

if (!Deno.env.get('STRIPE_SECRET_KEY')) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});