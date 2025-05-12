import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, Star, Award } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
}

interface OnboardingSubscriptionProps {
  onNext: (data: any) => void;
}

const OnboardingSubscription: React.FC<OnboardingSubscriptionProps> = ({ onNext }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
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

  const handleSubmit = () => {
    onNext({ selectedPlan });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <Award size={48} className="mx-auto mb-4 text-purple-400" />
        <h2 className="text-2xl font-bold mb-2">Wähle deine Mitgliedschaft</h2>
        <p className="text-gray-300">
          Entscheide, wie du Dogmania nutzen möchtest
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div 
          className={`bg-white/5 backdrop-blur-lg rounded-2xl p-6 border-2 transition-all cursor-pointer ${
            selectedPlan === 'free' 
              ? 'border-purple-500 bg-white/10' 
              : 'border-transparent hover:border-white/20'
          }`}
          onClick={() => setSelectedPlan('free')}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold">Kostenlos</h3>
              <p className="text-gray-400">Grundfunktionen</p>
            </div>
            <div className="text-2xl font-bold">0€</div>
          </div>
          
          <ul className="space-y-3 mb-6">
            <li className="flex items-start">
              <Check size={20} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
              <span>Zugang zur Community</span>
            </li>
            <li className="flex items-start">
              <Check size={20} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
              <span>Grundlegende Trainingskurse</span>
            </li>
            <li className="flex items-start">
              <Check size={20} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
              <span>Hundetagebuch</span>
            </li>
            <li className="flex items-start">
              <Check size={20} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
              <span>Marktplatz-Zugang</span>
            </li>
          </ul>
        </div>
        
        {/* Premium Plan */}
        {plans.length > 0 && (
          <div 
            className={`bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-lg rounded-2xl p-6 border-2 transition-all cursor-pointer ${
              selectedPlan === plans[0].id 
                ? 'border-purple-500' 
                : 'border-purple-500/30 hover:border-purple-500/60'
            }`}
            onClick={() => setSelectedPlan(plans[0].id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center">
                  <h3 className="text-xl font-bold">Premium</h3>
                  <div className="ml-2 bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
                    <Star size={12} className="mr-1" />
                    Empfohlen
                  </div>
                </div>
                <p className="text-gray-400">Alle Funktionen</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{plans[0].price}€</div>
                <div className="text-sm text-gray-400">
                  / {plans[0].interval === 'month' ? 'Monat' : 'Jahr'}
                </div>
              </div>
            </div>
            
            <ul className="space-y-3 mb-6">
              {plans[0].features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check size={20} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
        >
          Weiter
        </button>
      </div>
    </div>
  );
};

export default OnboardingSubscription;