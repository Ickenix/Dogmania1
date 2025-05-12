import { STRIPE_PRODUCTS } from '../stripe-config';

export async function createCheckoutSession(priceId: string, mode: 'payment' | 'subscription') {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('supabase.auth.token')}`,
    },
    body: JSON.stringify({
      price_id: priceId,
      success_url: `${window.location.origin}/dashboard?checkout=success`,
      cancel_url: `${window.location.origin}/dashboard?checkout=cancelled`,
      mode,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create checkout session');
  }

  const { url } = await response.json();
  return url;
}

export async function redirectToCheckout(productId: keyof typeof STRIPE_PRODUCTS) {
  const product = STRIPE_PRODUCTS[productId];
  if (!product) throw new Error('Invalid product ID');

  const checkoutUrl = await createCheckoutSession(product.priceId, product.mode);
  window.location.href = checkoutUrl;
}