import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Check, Star, X } from 'lucide-react';
import CheckoutButton from './CheckoutButton';

const PricingPlans = () => {
  const { session } = useAuth();

  const plans = [
    {
      name: 'Kostenlos',
      price: 0,
      description: 'Grundfunktionen für Einsteiger',
      features: [
        { text: 'Zugang zur Community', included: true },
        { text: 'Grundlegende Trainingskurse', included: true },
        { text: 'Hundetagebuch', included: true },
        { text: 'Marktplatz-Zugang', included: true },
        { text: 'Zugang zu Premium-Kursen', included: false },
        { text: 'Unbegrenzte Trainerbuchungen', included: false },
        { text: 'Erweiterte Community-Features', included: false },
        { text: 'Prioritäts-Support', included: false },
      ],
      buttonText: 'Aktueller Plan',
      highlighted: false,
    },
    {
      name: 'Premium Monatlich',
      price: 9.99,
      description: 'Voller Zugang zu allen Funktionen',
      features: [
        { text: 'Zugang zur Community', included: true },
        { text: 'Grundlegende Trainingskurse', included: true },
        { text: 'Hundetagebuch', included: true },
        { text: 'Marktplatz-Zugang', included: true },
        { text: 'Zugang zu Premium-Kursen', included: true },
        { text: 'Unbegrenzte Trainerbuchungen', included: true },
        { text: 'Erweiterte Community-Features', included: true },
        { text: 'Prioritäts-Support', included: true },
      ],
      buttonText: 'Jetzt abonnieren',
      highlighted: true,
      productId: 'premium_monthly' as const,
    },
    {
      name: 'Premium Jährlich',
      price: 99.99,
      description: '2 Monate gratis (16% Ersparnis)',
      features: [
        { text: 'Zugang zur Community', included: true },
        { text: 'Grundlegende Trainingskurse', included: true },
        { text: 'Hundetagebuch', included: true },
        { text: 'Marktplatz-Zugang', included: true },
        { text: 'Zugang zu Premium-Kursen', included: true },
        { text: 'Unbegrenzte Trainerbuchungen', included: true },
        { text: 'Erweiterte Community-Features', included: true },
        { text: 'Prioritäts-Support', included: true },
      ],
      buttonText: 'Jetzt abonnieren',
      highlighted: false,
      productId: 'premium_yearly' as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Premium-Mitgliedschaft</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Wähle den Plan, der am besten zu dir und deinem Hund passt
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`bg-white/5 backdrop-blur-lg rounded-2xl p-8 border transition-all ${
              plan.highlighted
                ? 'border-purple-500 scale-105 shadow-xl shadow-purple-500/20'
                : 'border-white/10 hover:border-purple-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-gray-400">{plan.description}</p>
              </div>
              {plan.highlighted && (
                <Star className="text-yellow-400" size={24} />
              )}
            </div>

            <div className="mb-8">
              <span className="text-4xl font-bold">{plan.price}€</span>
              {plan.price > 0 && (
                <span className="text-gray-400 ml-2">
                  / {index === 1 ? 'Monat' : 'Jahr'}
                </span>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center">
                  {feature.included ? (
                    <Check className="text-green-400 mr-3 flex-shrink-0" size={20} />
                  ) : (
                    <X className="text-red-400 mr-3 flex-shrink-0" size={20} />
                  )}
                  <span className={feature.included ? '' : 'text-gray-500'}>{feature.text}</span>
                </li>
              ))}
            </ul>

            {plan.price === 0 ? (
              <button
                disabled
                className="w-full bg-white/10 text-gray-400 px-6 py-3 rounded-lg cursor-not-allowed"
              >
                {plan.buttonText}
              </button>
            ) : (
              <CheckoutButton
                productId={plan.productId}
                className="w-full py-3"
              >
                {plan.buttonText}
              </CheckoutButton>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPlans;