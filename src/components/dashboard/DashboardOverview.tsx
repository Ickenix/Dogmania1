import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Award, BookOpen, Users, Calendar, Bot, ArrowRight, Brain, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import MediaFeed from '../media/MediaFeed';

const DashboardOverview = () => {
  const { session } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchUserProfile();
    }
  }, [session]);

  async function fetchUserProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, dogs(count)')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    { name: 'Abgeschlossene Kurse', value: '3', icon: BookOpen },
    { name: 'Errungenschaften', value: '12', icon: Award },
    { name: 'Community-Beiträge', value: '28', icon: Users },
    { name: 'Aktive Tage', value: '45', icon: Calendar },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div 
        variants={item}
        className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 md:p-8"
      >
        <h2 className="text-2xl font-bold mb-2">Willkommen zurück, {userProfile?.username || session?.user.email}!</h2>
        <p className="text-gray-300">Was möchtest du heute mit deinem Hund unternehmen?</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            variants={item}
            whileHover={{ scale: 1.05 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 md:p-6 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="text-purple-400" size={24} />
              <span className="text-2xl md:text-3xl font-bold">{stat.value}</span>
            </div>
            <h3 className="text-sm md:text-base text-gray-300">{stat.name}</h3>
          </motion.div>
        ))}
      </div>

      {/* Media Feed */}
      <motion.div variants={item} className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Neueste Medien</h3>
          <Link
            to="/media"
            className="text-purple-400 hover:text-purple-300 flex items-center"
          >
            Alle anzeigen <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        
        <MediaFeed limit={4} showHeader={false} />
      </motion.div>

      {/* AI Coach Promo */}
      <motion.div 
        variants={item}
        className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-purple-500/30"
      >
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mr-4">
              <Brain size={24} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">KI-Hundecoach</h3>
              <p className="text-gray-300">Personalisierte Trainingstipps und Beratung für deinen Hund</p>
            </div>
          </div>
          <Link
            to="/ai-coach"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
          >
            Jetzt ausprobieren
            <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      </motion.div>

      {/* Media Upload Promo */}
      <motion.div 
        variants={item}
        className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-blue-500/30"
      >
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mr-4">
              <Camera size={24} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Teile deine Momente</h3>
              <p className="text-gray-300">Lade Bilder und Videos von deinem Hund hoch und teile sie mit der Community</p>
            </div>
          </div>
          <Link
            to="/media"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-500 transition-colors flex items-center"
          >
            Medien hochladen
            <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardOverview;