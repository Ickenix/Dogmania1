import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, BookOpen, ShoppingBag, MessageSquare, Dog, Calendar, Award, DollarSign } from 'lucide-react';

interface Stats {
  totalUsers: number;
  newUsersToday: number;
  totalCourses: number;
  activeEnrollments: number;
  totalProducts: number;
  activeSales: number;
  totalPosts: number;
  postsToday: number;
  totalDogs: number;
  totalTrainers: number;
  totalBookings: number;
  premiumUsers: number;
}

interface ChartData {
  labels: string[];
  values: number[];
}

const Statistics = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    newUsersToday: 0,
    totalCourses: 0,
    activeEnrollments: 0,
    totalProducts: 0,
    activeSales: 0,
    totalPosts: 0,
    postsToday: 0,
    totalDogs: 0,
    totalTrainers: 0,
    totalBookings: 0,
    premiumUsers: 0
  });
  const [userGrowth, setUserGrowth] = useState<ChartData>({
    labels: [],
    values: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
    fetchUserGrowth();
  }, []);

  async function fetchStatistics() {
    try {
      // Fetch user statistics
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .gte('created_at', today.toISOString());

      // Fetch course statistics
      const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact' });

      const { count: activeEnrollments } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Fetch marketplace statistics
      const { count: totalProducts } = await supabase
        .from('marketplace_products')
        .select('*', { count: 'exact' });

      const { count: activeSales } = await supabase
        .from('marketplace_products')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Fetch community statistics
      const { count: totalPosts } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact' });

      const { count: postsToday } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact' })
        .gte('created_at', today.toISOString());
        
      // Fetch dog statistics
      const { count: totalDogs } = await supabase
        .from('dogs')
        .select('*', { count: 'exact' });
        
      // Fetch trainer statistics
      const { count: totalTrainers } = await supabase
        .from('trainers')
        .select('*', { count: 'exact' });
        
      // Fetch booking statistics
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact' });
        
      // Fetch premium user statistics
      const { count: premiumUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('subscription_status', 'premium');

      setStats({
        totalUsers: totalUsers || 0,
        newUsersToday: newUsersToday || 0,
        totalCourses: totalCourses || 0,
        activeEnrollments: activeEnrollments || 0,
        totalProducts: totalProducts || 0,
        activeSales: activeSales || 0,
        totalPosts: totalPosts || 0,
        postsToday: postsToday || 0,
        totalDogs: totalDogs || 0,
        totalTrainers: totalTrainers || 0,
        totalBookings: totalBookings || 0,
        premiumUsers: premiumUsers || 0
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchUserGrowth() {
    try {
      // Get the last 7 days
      const dates = [];
      const counts = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());
          
        dates.push(date.toLocaleDateString('de-DE', { weekday: 'short' }));
        counts.push(count || 0);
      }
      
      setUserGrowth({
        labels: dates,
        values: counts
      });
    } catch (error) {
      console.error('Error fetching user growth:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Nutzer',
      icon: Users,
      primary: stats.totalUsers,
      secondary: `+${stats.newUsersToday} heute`,
      color: 'purple'
    },
    {
      title: 'Hunde',
      icon: Dog,
      primary: stats.totalDogs,
      secondary: `${(stats.totalDogs / Math.max(1, stats.totalUsers) * 100).toFixed(0)}% Nutzerabdeckung`,
      color: 'blue'
    },
    {
      title: 'Kurse',
      icon: BookOpen,
      primary: stats.totalCourses,
      secondary: `${stats.activeEnrollments} aktive Teilnehmer`,
      color: 'green'
    },
    {
      title: 'Marktplatz',
      icon: ShoppingBag,
      primary: stats.totalProducts,
      secondary: `${stats.activeSales} aktive Anzeigen`,
      color: 'yellow'
    },
    {
      title: 'Community',
      icon: MessageSquare,
      primary: stats.totalPosts,
      secondary: `+${stats.postsToday} heute`,
      color: 'pink'
    },
    {
      title: 'Trainer',
      icon: Award,
      primary: stats.totalTrainers,
      secondary: `${stats.totalBookings} Buchungen`,
      color: 'indigo'
    },
    {
      title: 'Premium',
      icon: DollarSign,
      primary: stats.premiumUsers,
      secondary: `${(stats.premiumUsers / Math.max(1, stats.totalUsers) * 100).toFixed(0)}% der Nutzer`,
      color: 'amber'
    },
    {
      title: 'Aktivität',
      icon: Calendar,
      primary: stats.activeEnrollments + stats.totalBookings,
      secondary: 'Aktive Interaktionen',
      color: 'teal'
    }
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Statistiken & Übersicht</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/10 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon
                size={24}
                className="text-purple-400"
              />
              <span className="text-3xl font-bold">{stat.primary}</span>
            </div>
            <h3 className="font-medium mb-1">{stat.title}</h3>
            <p className="text-sm text-gray-400">{stat.secondary}</p>
          </div>
        ))}
      </div>

      {/* User Growth Chart */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 md:p-8">
        <h3 className="text-xl font-semibold mb-6">Nutzerwachstum (letzte 7 Tage)</h3>
        <div className="h-64 flex items-end justify-between">
          {userGrowth.values.map((value, index) => (
            <div key={index} className="flex flex-col items-center">
              <div 
                className="bg-purple-600 w-12 rounded-t-lg transition-all hover:bg-purple-500"
                style={{ 
                  height: `${Math.max(20, (value / Math.max(...userGrowth.values)) * 200)}px` 
                }}
              ></div>
              <div className="mt-2 text-xs text-gray-400">{userGrowth.labels[index]}</div>
              <div className="mt-1 text-sm">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Nutzerverteilung</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Normale Nutzer</span>
                <span className="text-sm">{stats.totalUsers - stats.premiumUsers}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${100 - (stats.premiumUsers / Math.max(1, stats.totalUsers) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Premium Nutzer</span>
                <span className="text-sm">{stats.premiumUsers}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${stats.premiumUsers / Math.max(1, stats.totalUsers) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Trainer</span>
                <span className="text-sm">{stats.totalTrainers}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${stats.totalTrainers / Math.max(1, stats.totalUsers) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Plattform-Aktivität</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <BookOpen size={20} className="text-purple-400 mr-2" />
                <h4 className="font-semibold">Kurseinschreibungen</h4>
              </div>
              <p className="text-2xl font-bold">{stats.activeEnrollments}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <MessageSquare size={20} className="text-purple-400 mr-2" />
                <h4 className="font-semibold">Community-Beiträge</h4>
              </div>
              <p className="text-2xl font-bold">{stats.totalPosts}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <ShoppingBag size={20} className="text-purple-400 mr-2" />
                <h4 className="font-semibold">Marktplatz-Anzeigen</h4>
              </div>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Calendar size={20} className="text-purple-400 mr-2" />
                <h4 className="font-semibold">Trainer-Buchungen</h4>
              </div>
              <p className="text-2xl font-bold">{stats.totalBookings}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;