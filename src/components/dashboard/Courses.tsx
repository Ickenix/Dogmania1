import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BookOpen, Star, Clock, ChevronRight, Filter, Play, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CheckoutButton from '../payment/CheckoutButton';
import PremiumFeatureGate from '../payment/PremiumFeatureGate';
import { motion } from 'framer-motion';

interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  difficulty: string;
  category: string;
  is_premium: boolean;
  duration: number;
  progress?: number;
}

const Courses = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, free, premium
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});
  const [isPremium, setIsPremium] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCourses();
    if (session) {
      checkPremiumStatus();
    }
  }, [session]);

  async function checkPremiumStatus() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, premium_until')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;

      const isPremiumActive = 
        data.subscription_status === 'premium' && 
        (!data.premium_until || new Date(data.premium_until) > new Date());

      setIsPremium(isPremiumActive);
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  }

  async function fetchCourses() {
    try {
      // Fetch all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch user progress if logged in
      if (session?.user) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('course_id, chapter_id')
          .eq('user_id', session.user.id);

        if (progressData) {
          const progress: Record<string, number> = {};
          progressData.forEach(entry => {
            if (!progress[entry.course_id]) {
              progress[entry.course_id] = 0;
            }
            progress[entry.course_id]++;
          });
          setUserProgress(progress);
        }
      }

      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'free' && !course.is_premium) ||
      (filter === 'premium' && course.is_premium);
    
    const matchesCategory = 
      category === 'all' || 
      course.category === category;
    
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-400';
      case 'intermediate':
        return 'text-yellow-400';
      case 'advanced':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Anfänger';
      case 'intermediate':
        return 'Fortgeschritten';
      case 'advanced':
        return 'Profi';
      default:
        return difficulty;
    }
  };

  const handleCourseClick = (courseId: string, isPremiumCourse: boolean) => {
    if (isPremiumCourse && !isPremium) {
      // Show premium upgrade modal or redirect to pricing
      return;
    }
    navigate(`/courses/${courseId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Kurse entdecken</h2>
            <p className="text-gray-400">
              Starte deine Lernreise mit unseren professionellen Hundekursen
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Suche nach Kursen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Filter size={18} className="mr-1" />
                {showFilters ? 'Filter ausblenden' : 'Filter anzeigen'}
              </button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filter === 'all' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Alle Kurse
                  </button>
                  <button
                    onClick={() => setFilter('free')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filter === 'free' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Kostenlos
                  </button>
                  <button
                    onClick={() => setFilter('premium')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filter === 'premium' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Premium
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategory('all')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      category === 'all' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Alle Kategorien
                  </button>
                  <button
                    onClick={() => setCategory('training')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      category === 'training' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Training
                  </button>
                  <button
                    onClick={() => setCategory('behavior')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      category === 'behavior' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Verhalten
                  </button>
                  <button
                    onClick={() => setCategory('health')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      category === 'health' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Gesundheit
                  </button>
                  <button
                    onClick={() => setCategory('nutrition')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      category === 'nutrition' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Ernährung
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden hover:bg-white/10 transition-all group cursor-pointer"
          >
            <div className="relative">
              <img
                src={course.image_url || 'https://images.pexels.com/photos/1904105/pexels-photo-1904105.jpeg'}
                alt={course.title}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              {course.is_premium && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                  <Star size={16} className="mr-1" />
                  Premium
                </div>
              )}
              {userProgress[course.id] !== undefined && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${(userProgress[course.id] / (course.duration || 1)) * 100}%` }}
                  />
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{course.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {course.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                <div className="flex items-center">
                  <Clock size={16} className="mr-1" />
                  {course.duration} Min.
                </div>
                <div className={`flex items-center ${getDifficultyColor(course.difficulty)}`}>
                  <BookOpen size={16} className="mr-1" />
                  {getDifficultyLabel(course.difficulty)}
                </div>
              </div>

              {course.is_premium && !isPremium ? (
                <CheckoutButton
                  productId="premium_monthly"
                  className="w-full py-3"
                >
                  <Star size={16} className="mr-2" />
                  Premium freischalten
                </CheckoutButton>
              ) : (
                <button 
                  onClick={() => handleCourseClick(course.id, course.is_premium)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center group-hover:bg-purple-500"
                >
                  {course.is_premium && !isPremium ? (
                    <>
                      <Lock size={16} className="mr-2" />
                      Premium Kurs
                    </>
                  ) : userProgress[course.id] ? (
                    <>
                      <Play size={16} className="mr-2" />
                      Fortsetzen
                    </>
                  ) : (
                    <>
                      <Play size={16} className="mr-2" />
                      Jetzt starten
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;