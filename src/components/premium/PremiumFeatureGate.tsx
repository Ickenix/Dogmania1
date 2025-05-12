import React from 'react';
import { Link } from 'react-router-dom';
import { usePremium } from '../../hooks/usePremium';
import { Lock } from 'lucide-react';

interface PremiumFeatureGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({ 
  children, 
  fallback 
}) => {
  const { isPremium, loading } = usePremium();

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
      <Lock size={48} className="mx-auto mb-4 text-purple-400" />
      <h3 className="text-2xl font-bold mb-4">Premium-Feature</h3>
      <p className="text-gray-400 mb-6">
        Diese Funktion ist Premium-Mitgliedern vorbehalten.
      </p>
      <Link
        to="/pricing"
        className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
      >
        Jetzt Premium werden
      </Link>
    </div>
  );
};

export default PremiumFeatureGate;