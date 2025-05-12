import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="pt-36 pb-24 md:pt-48 md:pb-32 px-6">
      <div className="container mx-auto text-center max-w-4xl">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
        >
          Die Community-Plattform für <span className="text-purple-400">Hundemenschen</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto"
        >
          Trainiere, vernetze und entwickle dich mit deinem Hund.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Link 
            to="/register" 
            className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300"
          >
            Jetzt starten
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;