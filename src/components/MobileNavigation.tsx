import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Users, ShoppingBag, User, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const MobileNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  
  // Only show for authenticated users
  if (!session) return null;
  
  // Don't show on admin pages
  if (location.pathname.startsWith('/admin')) return null;
  
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/courses', icon: BookOpen, label: 'Kurse' },
    { path: '/ai-coach', icon: Brain, label: 'KI-Coach' },
    { path: '/community', icon: Users, label: 'Community' },
    { path: '/profile', icon: User, label: 'Profil' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-blue-950/90 backdrop-blur-md border-t border-white/10 z-40 md:hidden"
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full ${
              isActive(item.path) ? 'text-purple-400' : 'text-gray-400'
            }`}
          >
            <item.icon size={20} />
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default MobileNavigation;