import React from 'react';
import { motion } from 'framer-motion';

const AppPreviewSection = () => {
  return (
    <section className="py-20 px-6 bg-blue-950/50">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Die Dogmania-Erfahrung</h2>
          <p className="text-gray-300 text-lg">Entdecke unsere intuitive Plattform für das beste Lernerlebnis.</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="lg:w-3/5"
          >
            <div className="relative">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-1.5 shadow-2xl shadow-purple-500/20">
                <img 
                  src="https://images.pexels.com/photos/6956900/pexels-photo-6956900.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Dogmania App Interface" 
                  className="rounded-3xl shadow-inner w-full"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-purple-600 text-white py-2 px-4 rounded-full shadow-lg">
                Neue Version!
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="lg:w-2/5"
          >
            <h3 className="text-2xl font-bold mb-6">Lerne, wo und wann du willst</h3>
            <ul className="space-y-6">
              <motion.li 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-start"
              >
                <div className="bg-purple-500/20 p-2 rounded-full mr-4 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Interaktive Kurse</h4>
                  <p className="text-gray-300">Videos, Quizze und praktische Übungen für effektives Lernen.</p>
                </div>
              </motion.li>
              <motion.li 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex items-start"
              >
                <div className="bg-purple-500/20 p-2 rounded-full mr-4 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Fortschrittsverfolgung</h4>
                  <p className="text-gray-300">Behalte deinen Lernfortschritt im Auge und feiere Erfolge.</p>
                </div>
              </motion.li>
              <motion.li 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex items-start"
              >
                <div className="bg-purple-500/20 p-2 rounded-full mr-4 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Live Sessions</h4>
                  <p className="text-gray-300">Nimm an wöchentlichen Live-Sessions mit Experten teil.</p>
                </div>
              </motion.li>
            </ul>

            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300"
            >
              Entdecke die App
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AppPreviewSection;