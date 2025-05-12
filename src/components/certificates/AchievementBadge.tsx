import React from 'react';
import { Award, Star, Trophy, Medal, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface AchievementBadgeProps {
  type: 'course' | 'trainer' | 'community' | 'streak' | 'premium';
  title: string;
  description: string;
  level?: 'bronze' | 'silver' | 'gold' | 'platinum';
  date: string;
  onClick?: () => void;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  type,
  title,
  description,
  level = 'bronze',
  date,
  onClick
}) => {
  const getBadgeIcon = () => {
    switch (type) {
      case 'course':
        return <Award size={24} />;
      case 'trainer':
        return <Medal size={24} />;
      case 'community':
        return <Trophy size={24} />;
      case 'streak':
        return <Star size={24} />;
      case 'premium':
        return <Crown size={24} />;
      default:
        return <Award size={24} />;
    }
  };

  const getBadgeColor = () => {
    switch (level) {
      case 'bronze':
        return 'from-amber-700 to-amber-500';
      case 'silver':
        return 'from-gray-400 to-gray-300';
      case 'gold':
        return 'from-yellow-500 to-yellow-300';
      case 'platinum':
        return 'from-indigo-400 to-purple-300';
      default:
        return 'from-amber-700 to-amber-500';
    }
  };

  const getBadgeSize = () => {
    switch (level) {
      case 'bronze':
        return 'w-16 h-16';
      case 'silver':
        return 'w-16 h-16';
      case 'gold':
        return 'w-16 h-16';
      case 'platinum':
        return 'w-16 h-16';
      default:
        return 'w-16 h-16';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div className={`${getBadgeSize()} rounded-full bg-gradient-to-br ${getBadgeColor()} flex items-center justify-center`}>
          {getBadgeIcon()}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
          <p className="text-xs text-gray-500 mt-1">Erhalten am {new Date(date).toLocaleDateString()}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default AchievementBadge;