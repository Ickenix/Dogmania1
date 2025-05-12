export const STRIPE_PRODUCTS = {
  premium_monthly: {
    id: 'prod_premium_monthly',
    priceId: 'price_premium_monthly',
    name: 'Dogmania Premium Monatlich',
    description: 'Monatliches Premium-Abonnement für Dogmania',
    price: 9.99,
    mode: 'subscription' as const
  },
  premium_yearly: {
    id: 'prod_premium_yearly',
    priceId: 'price_premium_yearly',
    name: 'Dogmania Premium Jährlich',
    description: 'Jährliches Premium-Abonnement für Dogmania mit 2 Monaten gratis',
    price: 99.99,
    mode: 'subscription' as const
  },
  trainer_session: {
    id: 'prod_trainer_session',
    priceId: 'price_trainer_session',
    name: 'Einzeltraining',
    description: 'Einzeltraining mit einem zertifizierten Hundetrainer',
    price: 45.00,
    mode: 'payment' as const
  },
  premium_course: {
    id: 'prod_premium_course',
    priceId: 'price_premium_course',
    name: 'Premium Kurs',
    description: 'Zugang zu einem Premium-Kurs',
    price: 29.99,
    mode: 'payment' as const
  }
} as const;

export type ProductId = keyof typeof STRIPE_PRODUCTS;