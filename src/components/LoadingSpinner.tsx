import React from 'react';
import { motion } from 'framer-motion';
import { Dog } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium',
  text
}) => {
  const sizes = {
    small: {
      container: 'h-8 w-8',
      icon: 16
    },
    medium: {
      container: 'h-12 w-12',
      icon: 24
    },
    large: {
      container: 'h-16 w-16',
      icon: 32
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div 
        className={`${sizes[size].container} bg-purple-600/20 rounded-full flex items-center justify-center`}
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <Dog size={sizes[size].icon} className="text-purple-500" />
      </motion.div>
      {text && (
        <p className="mt-4 text-gray-400">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;