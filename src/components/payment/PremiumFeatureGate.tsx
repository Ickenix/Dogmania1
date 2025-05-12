import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Lock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import CheckoutButton from './CheckoutButton';

interface PremiumFeatureGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({ 
  children, 
  fallback 
}) => {
  const { session } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      checkPremiumStatus();
    } else {
      setLoading(false);
    }
  }, [session]);

  async function checkPremiumStatus() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, premium_until')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;

      const isPremiumActive = 
        data.subscription_status === 'premium' && 
        (!data.premium_until || new Date(data.premium_until) > new Date());

      setIsPremium(isPremiumActive);
    } catch (error) {
      console.error('Error checking premium status:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return null;
  }

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
        <Lock size={32} className="text-yellow-400" />
      </div>
      <h3 className="text-2xl font-bold mb-4">Premium-Feature</h3>
      <p className="text-gray-400 mb-6">
        Diese Funktion ist Premium-Mitgliedern vorbehalten.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/pricing"
          className="bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors"
        >
          Pläne vergleichen
        </Link>
        <CheckoutButton
          productId="premium_monthly"
          className="px-6 py-3"
        >
          <Star size={18} className="mr-2" />
          Premium werden
        </CheckoutButton>
      </div>
    </div>
  );
};

export default PremiumFeatureGate;