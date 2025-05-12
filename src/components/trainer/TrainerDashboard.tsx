import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Users, Star, Award, Upload, MapPin, Clock, ChevronRight, MessageSquare, Settings, Home } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import TrainerBookings from './TrainerBookings';
import TrainerProfile from './TrainerProfile';
import TrainerRatings from './TrainerRatings';
import TrainerMessages from './TrainerMessages';
import TrainerCertificates from './TrainerCertificates';

interface Trainer {
  id: string;
  bio: string;
  location: string;
  specialization: string[];
  is_verified: boolean;
  latitude: number;
  longitude: number;
  hourly_rate: number;
}

const TrainerDashboard = () => {
  const { session } = useAuth();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingBookings: 0,
    completedBookings: 0,
    averageRating: 0,
    certificateCount: 0,
    totalEarnings: 0,
    upcomingBookings: 0
  });

  useEffect(() => {
    if (session) {
      fetchTrainerData();
    }
  }, [session]);

  async function fetchTrainerData() {
    try {
      // Fetch trainer profile
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .select('*')
        .eq('user_id', session?.user.id)
        .single();

      if (trainerError) {
        // If no trainer profile exists, create one
        if (trainerError.code === 'PGRST116') {
          const { data: newTrainer, error: createError } = await supabase
            .from('trainers')
            .insert({
              user_id: session?.user.id,
              bio: '',
              location: '',
              specialization: [],
              is_verified: false,
              hourly_rate: 0
            })
            .select()
            .single();
            
          if (createError) throw createError;
          setTrainer(newTrainer);
        } else {
          throw trainerError;
        }
      } else {
        setTrainer(trainerData);
      }

      // Fetch statistics
      if (trainerData) {
        // Pending bookings
        const { count: pendingCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact' })
          .eq('trainer_id', trainerData.id)
          .eq('status', 'pending');
          
        // Completed bookings
        const { count: completedCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact' })
          .eq('trainer_id', trainerData.id)
          .eq('status', 'completed');
          
        // Upcoming bookings
        const today = new Date().toISOString().split('T')[0];
        const { count: upcomingCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact' })
          .eq('trainer_id', trainerData.id)
          .eq('status', 'confirmed')
          .gte('date', today);
          
        // Average rating
        const { data: ratingsData } = await supabase
          .from('ratings')
          .select('rating')
          .eq('trainer_id', trainerData.id);
          
        const averageRating = ratingsData && ratingsData.length > 0
          ? ratingsData.reduce((sum, item) => sum + item.rating, 0) / ratingsData.length
          : 0;
          
        // Certificate count
        const { count: certificateCount } = await supabase
          .from('certificates')
          .select('*', { count: 'exact' })
          .eq('trainer_id', trainerData.id);
          
        // Calculate total earnings (simplified)
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*')
          .eq('trainer_id', trainerData.id)
          .eq('status', 'completed');
          
        const totalEarnings = bookingsData ? bookingsData.length * trainerData.hourly_rate : 0;
        
        setStats({
          pendingBookings: pendingCount || 0,
          completedBookings: completedCount || 0,
          averageRating,
          certificateCount: certificateCount || 0,
          totalEarnings,
          upcomingBookings: upcomingCount || 0
        });
      }
    } catch (error) {
      console.error('Error fetching trainer data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-2">Willkommen im Trainer-Dashboard</h2>
              <p className="text-gray-300">
                Hier kannst du deine Buchungen verwalten, dein Profil bearbeiten und mit deinen Kunden kommunizieren.
              </p>
            </div>
            
            {/* Upcoming Bookings Preview */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Anstehende Termine</h3>
                <button 
                  onClick={() => setActiveTab('bookings')}
                  className="text-purple-400 hover:text-purple-300 flex items-center"
                >
                  Alle anzeigen <ChevronRight size={16} />
                </button>
              </div>
              
              {stats.upcomingBookings === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  Keine anstehenden Termine
                </div>
              ) : (
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                        <Users size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium">Nächster Termin</p>
                        <p className="text-sm text-gray-400">Heute, 15:00 Uhr</p>
                      </div>
                    </div>
                    <button className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-500 transition-colors text-sm">
                      Details
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Recent Messages Preview */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Letzte Nachrichten</h3>
                <button 
                  onClick={() => setActiveTab('messages')}
                  className="text-purple-400 hover:text-purple-300 flex items-center"
                >
                  Alle anzeigen <ChevronRight size={16} />
                </button>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                      <Users size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">Max Mustermann</p>
                      <p className="text-sm text-gray-400 truncate max-w-xs">Hallo, ich hätte eine Frage zum Training...</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">Vor 2h</span>
                </div>
              </div>
            </div>
            
            {/* Recent Ratings Preview */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Letzte Bewertungen</h3>
                <button 
                  onClick={() => setActiveTab('ratings')}
                  className="text-purple-400 hover:text-purple-300 flex items-center"
                >
                  Alle anzeigen <ChevronRight size={16} />
                </button>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 flex-shrink-0">
                    <Users size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium">Anna Schmidt</p>
                      <div className="flex ml-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={14} 
                            className={star <= 5 ? "text-yellow-400 fill-current" : "text-gray-400"} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">
                      Super Training, mein Hund hat viel gelernt! Vielen Dank für die Geduld und die tollen Tipps.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Vor 3 Tagen</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'profile':
        return <TrainerProfile trainer={trainer} onUpdate={fetchTrainerData} />;
      case 'bookings':
        return <TrainerBookings trainerId={trainer?.id} />;
      case 'messages':
        return <TrainerMessages trainerId={trainer?.id} />;
      case 'ratings':
        return <TrainerRatings trainerId={trainer?.id} />;
      case 'certificates':
        return <TrainerCertificates trainerId={trainer?.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="text-purple-400" size={20} />
            <span className="text-2xl font-bold">{stats.pendingBookings}</span>
          </div>
          <h3 className="text-sm text-gray-300">Offene Anfragen</h3>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-purple-400" size={20} />
            <span className="text-2xl font-bold">{stats.upcomingBookings}</span>
          </div>
          <h3 className="text-sm text-gray-300">Anstehende Termine</h3>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-purple-400" size={20} />
            <span className="text-2xl font-bold">{stats.completedBookings}</span>
          </div>
          <h3 className="text-sm text-gray-300">Abgeschlossene Trainings</h3>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Star className="text-purple-400" size={20} />
            <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
          </div>
          <h3 className="text-sm text-gray-300">Durchschnittliche Bewertung</h3>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Award className="text-purple-400" size={20} />
            <span className="text-2xl font-bold">{stats.certificateCount}</span>
          </div>
          <h3 className="text-sm text-gray-300">Zertifikate</h3>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-purple-400">€</div>
            <span className="text-2xl font-bold">{stats.totalEarnings}</span>
          </div>
          <h3 className="text-sm text-gray-300">Gesamteinnahmen</h3>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              activeTab === 'overview' ? 'bg-purple-600' : 'hover:bg-white/10'
            }`}
          >
            <Home size={18} className="mr-2" />
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              activeTab === 'profile' ? 'bg-purple-600' : 'hover:bg-white/10'
            }`}
          >
            <Settings size={18} className="mr-2" />
            Profil
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              activeTab === 'bookings' ? 'bg-purple-600' : 'hover:bg-white/10'
            }`}
          >
            <Calendar size={18} className="mr-2" />
            Buchungen
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              activeTab === 'messages' ? 'bg-purple-600' : 'hover:bg-white/10'
            }`}
          >
            <MessageSquare size={18} className="mr-2" />
            Nachrichten
          </button>
          <button
            onClick={() => setActiveTab('ratings')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              activeTab === 'ratings' ? 'bg-purple-600' : 'hover:bg-white/10'
            }`}
          >
            <Star size={18} className="mr-2" />
            Bewertungen
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              activeTab === 'certificates' ? 'bg-purple-600' : 'hover:bg-white/10'
            }`}
          >
            <Award size={18} className="mr-2" />
            Zertifikate
          </button>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default TrainerDashboard;