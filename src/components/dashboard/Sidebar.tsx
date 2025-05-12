import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dog, 
  Users, 
  BookOpen, 
  Award, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  Heart, 
  Map, 
  FileText, 
  Brain, 
  MessageSquare, 
  Bell, 
  User, 
  Home, 
  Menu, 
  X, 
  Zap, 
  Star, 
  BarChart2, 
  Bookmark, 
  ShoppingCart, 
  Globe, 
  PenTool, 
  Layers, 
  Shield, 
  HelpCircle, 
  Moon, 
  Sun, 
  Languages,
  Activity,
  Camera,
  CreditCard
} from 'lucide-react';
import NotificationBell from '../NotificationBell';

// Navigation structure
const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/dashboard'
  },
  {
    id: 'dog',
    label: 'Mein Hund',
    icon: Dog,
    children: [
      { id: 'dog-profile', label: 'Hundeprofil', path: '/dashboard/dog' },
      { id: 'dog-diary', label: 'Tagebuch', path: '/dashboard/dog/diary' },
      { id: 'dog-training', label: 'Trainingsstatus', path: '/dashboard/dog/training' },
      { id: 'dog-health', label: 'Gesundheitsdaten', path: '/dashboard/dog/health' }
    ]
  },
  {
    id: 'community',
    label: 'Community',
    icon: Users,
    children: [
      { id: 'community-feed', label: 'Feed', path: '/community' },
      { id: 'community-groups', label: 'Gruppen & Foren', path: '/groups' },
      { id: 'community-forum', label: 'Forum', path: '/forum' },
      { id: 'community-map', label: 'Community-Karte', path: '/dashboard/map' }
    ]
  },
  {
    id: 'courses',
    label: 'Kurse & Wissen',
    icon: BookOpen,
    children: [
      { id: 'courses-overview', label: 'Kursübersicht', path: '/courses' },
      { id: 'courses-progress', label: 'Fortschritt', path: '/dashboard/courses/progress' },
      { id: 'courses-certificates', label: 'Quiz & Zertifikate', path: '/certificates' },
      { id: 'courses-resources', label: 'Ressourcen', path: '/dashboard/courses/resources' }
    ]
  },
  {
    id: 'trainers',
    label: 'Trainer & Züchter',
    icon: Award,
    children: [
      { id: 'trainers-search', label: 'Suchen & Buchen', path: '/book-trainer' },
      { id: 'trainers-ratings', label: 'Bewertungen', path: '/dashboard/trainers/ratings' },
      { id: 'trainers-experts', label: 'Zertifizierte Experten', path: '/dashboard/trainers/experts' }
    ]
  },
  {
    id: 'marketplace',
    label: 'Marktplatz',
    icon: ShoppingBag,
    children: [
      { id: 'marketplace-products', label: 'Produkte', path: '/marketplace' },
      { id: 'marketplace-sell', label: 'Verkaufen', path: '/marketplace/create' },
      { id: 'marketplace-orders', label: 'Bestellungen', path: '/dashboard/marketplace/orders' }
    ]
  },
  {
    id: 'ai-coach',
    label: 'KI-Coach',
    icon: Brain,
    path: '/ai-coach'
  },
  {
    id: 'messages',
    label: 'Nachrichten',
    icon: MessageSquare,
    path: '/messages'
  },
  {
    id: 'media',
    label: 'Medien',
    icon: Camera,
    path: '/media'
  },
  {
    id: 'certificates',
    label: 'Zertifikate',
    icon: Award,
    path: '/certificates'
  },
  {
    id: 'payment',
    label: 'Zahlungen',
    icon: CreditCard,
    path: '/payment-settings'
  },
  {
    id: 'support',
    label: 'Support',
    icon: HelpCircle,
    path: '/support'
  },
  {
    id: 'settings',
    label: 'Einstellungen',
    icon: Settings,
    children: [
      { id: 'settings-profile', label: 'Profil & Account', path: '/profile' },
      { id: 'settings-notifications', label: 'Benachrichtigungen', path: '/dashboard/settings/notifications' },
      { id: 'settings-appearance', label: 'Sprache & Design', path: '/dashboard/settings/appearance' },
      { id: 'settings-payment', label: 'Zahlungen', path: '/payment-settings' }
    ]
  }
];

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false, onClose }) => {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(3);

  // Determine active path
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    return location.pathname.startsWith(path);
  };

  // Determine if a category is active (any child is active)
  const isCategoryActive = (item: any) => {
    if (item.path && isActive(item.path)) return true;
    if (item.children) {
      return item.children.some((child: any) => isActive(child.path));
    }
    return false;
  };

  // Toggle expanded state of a category
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  // Auto-expand the active category on mobile
  useEffect(() => {
    if (isMobile) {
      const activeCategory = navigationItems.find(item => isCategoryActive(item));
      if (activeCategory && activeCategory.children && !expandedItems.includes(activeCategory.id)) {
        setExpandedItems(prev => [...prev, activeCategory.id]);
      }
    }
  }, [location.pathname, isMobile]);

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Fetch unread notifications count
  useEffect(() => {
    // Mock data for demonstration
    setUnreadNotifications(3);
    
    // In a real app, you would fetch from Supabase
    // const fetchNotifications = async () => {
    //   const { data, error } = await supabase
    //     .from('notifications')
    //     .select('count')
    //     .eq('user_id', session?.user.id)
    //     .eq('is_read', false)
    //     .single();
    //   
    //   if (!error && data) {
    //     setUnreadNotifications(data.count);
    //   }
    // };
    // 
    // fetchNotifications();
  }, []);

  return (
    <div className={`h-full flex flex-col bg-gradient-to-b from-blue-950/80 to-purple-950/80 backdrop-blur-lg ${
      isMobile ? 'w-full' : 'w-64'
    } border-r border-white/10`}>
      {/* Logo and Title */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dog className="h-8 w-8 text-purple-400" />
          <span className="font-bold text-xl tracking-tight">Dogmania</span>
        </div>
        {isMobile && onClose && (
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <div key={item.id} className="mb-1">
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                      isCategoryActive(item) 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon size={20} className="mr-3" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {expandedItems.includes(item.id) ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {expandedItems.includes(item.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-6 mt-1 space-y-1 overflow-hidden"
                      >
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => handleNavigation(child.path)}
                            className={`w-full flex items-center p-2 rounded-lg transition-colors ${
                              isActive(child.path)
                                ? 'bg-purple-500/30 text-purple-300'
                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                            }`}
                          >
                            <span className="text-sm">{child.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center p-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <item.icon size={20} className="mr-3" />
                  <span className="font-medium">{item.label}</span>
                  
                  {/* Show notification badge for messages */}
                  {item.id === 'messages' && unreadMessages > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {unreadMessages}
                    </span>
                  )}
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <NotificationBell />
            <button
              onClick={() => navigate('/messages')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
              aria-label="Messages"
            >
              <MessageSquare size={20} />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadMessages}
                </span>
              )}
            </button>
            <div className="relative group">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <User size={20} />
              </button>
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-blue-900/90 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden invisible group-hover:visible z-10">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors"
                >
                  Mein Profil
                </button>
                <button
                  onClick={() => navigate('/payment-settings')}
                  className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center"
                >
                  <CreditCard size={16} className="mr-2" />
                  Zahlungen
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors"
                >
                  Einstellungen
                </button>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            signOut();
            if (isMobile && onClose) {
              onClose();
            }
          }}
          className="w-full flex items-center p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          <span className="font-medium">Abmelden</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;