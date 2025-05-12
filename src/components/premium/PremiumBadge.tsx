import React from 'react';
import { Star } from 'lucide-react';

interface PremiumBadgeProps {
  className?: string;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-sm font-medium ${className}`}>
      <Star size={14} className="mr-1" />
      Premium
    </div>
  );
};

export default PremiumBadge;