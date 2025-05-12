import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Users, FileText, ShoppingBag, BarChart2, Settings, AlertTriangle, Dog, BookOpen, MessageSquare, Award, Headphones } from 'lucide-react';
import UserManagement from './UserManagement';
import ContentModeration from './ContentModeration';
import MarketplaceControl from './MarketplaceControl';
import Statistics from './Statistics';
import SystemSettings from './SystemSettings';
import CourseManagement from './CourseManagement';
import DogManagement from './DogManagement';
import CommunityManagement from './CommunityManagement';
import TrainerCertification from './TrainerCertification';
import SupportTickets from './SupportTickets';

const AdminDashboard = () => {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [session]);

  async function checkAdminStatus() {
    try {
      if (!session?.user) throw new Error('No user');

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Zugriff verweigert</h2>
          <p className="text-gray-400">Du hast keine Berechtigung für diesen Bereich.</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { id: 'users', name: 'Nutzerverwaltung', icon: Users },
    { id: 'dogs', name: 'Hundeverwaltung', icon: Dog },
    { id: 'courses', name: 'Kursverwaltung', icon: BookOpen },
    { id: 'content', name: 'Inhaltsmoderation', icon: FileText },
    { id: 'community', name: 'Community', icon: MessageSquare },
    { id: 'marketplace', name: 'Marktplatz', icon: ShoppingBag },
    { id: 'certification', name: 'Trainer-Zertifizierung', icon: Award },
    { id: 'support', name: 'Support-Tickets', icon: Headphones },
    { id: 'statistics', name: 'Statistiken', icon: BarChart2 },
    { id: 'settings', name: 'Einstellungen', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'dogs':
        return <DogManagement />;
      case 'courses':
        return <CourseManagement />;
      case 'content':
        return <ContentModeration />;
      case 'community':
        return <CommunityManagement />;
      case 'marketplace':
        return <MarketplaceControl />;
      case 'certification':
        return <TrainerCertification />;
      case 'support':
        return <SupportTickets />;
      case 'statistics':
        return <Statistics />;
      case 'settings':
        return <SystemSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-blue-950 to-purple-950">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-blue-900/20 backdrop-blur-lg min-h-[calc(100vh-4rem)] p-6 fixed hidden md:block">
          <nav className="space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="w-full md:ml-64 flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;