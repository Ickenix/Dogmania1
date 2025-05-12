import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Award, Trophy, Star, Search } from 'lucide-react';
import AchievementBadge from './AchievementBadge';

interface Achievement {
  id: string;
  user_id: string;
  type: 'course' | 'trainer' | 'community' | 'streak' | 'premium';
  title: string;
  description: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  created_at: string;
}

interface UserAchievementsProps {
  userId?: string;
  limit?: number;
  showHeader?: boolean;
}

const UserAchievements: React.FC<UserAchievementsProps> = ({
  userId,
  limit,
  showHeader = true
}) => {
  const { session } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, course, trainer, community, streak, premium

  useEffect(() => {
    fetchAchievements();
  }, [userId, session]);

  async function fetchAchievements() {
    try {
      const targetUserId = userId || session?.user.id;
      if (!targetUserId) return;

      // For demo purposes, we'll create some mock achievements
      // In a real app, you'd fetch from the database
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          user_id: targetUserId,
          type: 'course',
          title: 'Grundgehorsam Meister',
          description: '5 Grundgehorsam-Kurse abgeschlossen',
          level: 'gold',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: targetUserId,
          type: 'trainer',
          title: 'Zertifizierter Trainer',
          description: 'Offiziell von Dogmania zertifiziert',
          level: 'platinum',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          user_id: targetUserId,
          type: 'community',
          title: 'Community-Held',
          description: '50 hilfreiche Beiträge in der Community',
          level: 'silver',
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          user_id: targetUserId,
          type: 'streak',
          title: '30-Tage-Streak',
          description: '30 Tage in Folge aktiv',
          level: 'bronze',
          created_at: new Date().toISOString()
        },
        {
          id: '5',
          user_id: targetUserId,
          type: 'premium',
          title: 'Premium-Mitglied',
          description: '1 Jahr Premium-Mitgliedschaft',
          level: 'gold',
          created_at: new Date().toISOString()
        }
      ];

      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAchievements = achievements
    .filter(achievement => {
      const matchesSearch = 
        achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        filter === 'all' || 
        achievement.type === filter;
        
      return matchesSearch && matchesFilter;
    })
    .slice(0, limit || achievements.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
        <Trophy size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">Keine Errungenschaften</h3>
        <p className="text-gray-400">
          Schließe Kurse ab und sei in der Community aktiv, um Errungenschaften freizuschalten.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Errungenschaften</h2>
          
          {achievements.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="bg-white/5 px-3 py-1 rounded-lg text-sm">
                <Trophy size={16} className="inline-block mr-1 text-yellow-400" />
                <span>{achievements.length} Errungenschaften</span>
              </div>
            </div>
          )}
        </div>
      )}

      {showHeader && achievements.length > 3 && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Suche nach Errungenschaften..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                filter === 'all' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setFilter('course')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                filter === 'course' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Kurse
            </button>
            <button
              onClick={() => setFilter('community')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                filter === 'community' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Community
            </button>
            <button
              onClick={() => setFilter('streak')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                filter === 'streak' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Streaks
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAchievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            type={achievement.type}
            title={achievement.title}
            description={achievement.description}
            level={achievement.level}
            date={achievement.created_at}
          />
        ))}
      </div>
    </div>
  );
};

export default UserAchievements;