import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Check, Star } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

const PricingPlans = () => {
  const { session } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubscribe = async (plan: Plan) => {
    if (!session) {
      // Redirect to login
      return;
    }

    try {
      // Redirect to Stripe checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId: plan.stripe_price_id,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Premium-Mitgliedschaft</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Wähle den Plan, der am besten zu dir und deinem Hund passt
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-gray-400">{plan.description}</p>
              </div>
              <Star className="text-purple-400" size={24} />
            </div>

            <div className="mb-8">
              <span className="text-4xl font-bold">{plan.price}€</span>
              <span className="text-gray-400 ml-2">
                / {plan.interval === 'month' ? 'Monat' : 'Jahr'}
              </span>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="text-green-400 mr-3" size={20} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan)}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors flex items-center justify-center"
            >
              Jetzt Premium werden
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPlans;