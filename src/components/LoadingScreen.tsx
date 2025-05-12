import React from 'react';
import { motion } from 'framer-motion';
import { Dog } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-950 to-purple-950 flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mb-6 inline-block"
        >
          <Dog size={64} className="text-purple-400" />
        </motion.div>
        
        <h2 className="text-2xl font-bold mb-4">Dogmania wird geladen</h2>
        
        <div className="w-48 h-2 bg-white/10 rounded-full mx-auto overflow-hidden">
          <motion.div
            className="h-full bg-purple-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;