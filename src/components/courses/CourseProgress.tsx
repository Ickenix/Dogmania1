import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  BookOpen, CheckCircle, Clock, Calendar, Award, 
  ChevronRight, Search, Filter, Play, Star 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  difficulty: string;
  category: string;
  is_premium: boolean;
  duration: number;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  dog_id: string | null;
  enrolled_at: string;
  status: string;
  completed_at: string | null;
  progress: number;
  course: Course;
  dog?: {
    name: string;
  };
}

const CourseProgress = () => {
  const { session } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, completed
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (session) {
      fetchEnrollments();
    }
  }, [session]);

  async function fetchEnrollments() {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:course_id(*),
          dog:dog_id(name)
        `)
        .eq('user_id', session?.user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredEnrollments = enrollments.filter(enrollment => {
    // Filter by search query
    const matchesSearch = 
      enrollment.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.course.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && enrollment.status === 'active') ||
      (statusFilter === 'completed' && enrollment.status === 'completed');
    
    return matchesSearch && matchesStatus;
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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general':
        return 'Allgemein';
      case 'training':
        return 'Training';
      case 'behavior':
        return 'Verhalten';
      case 'health':
        return 'Gesundheit';
      case 'nutrition':
        return 'Ernährung';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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
            <h2 className="text-2xl font-bold mb-2">Mein Lernfortschritt</h2>
            <p className="text-gray-400">
              Verfolge deinen Fortschritt in allen Kursen
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Suche nach Kursen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
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
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      statusFilter === 'all' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Alle Kurse
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      statusFilter === 'active' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    In Bearbeitung
                  </button>
                  <button
                    onClick={() => setStatusFilter('completed')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      statusFilter === 'completed' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Abgeschlossen
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-6">Fortschrittsübersicht</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <BookOpen size={20} className="text-purple-400 mr-2" />
                <h4 className="font-semibold">Kurse</h4>
              </div>
              <span className="text-2xl font-bold">{enrollments.length}</span>
            </div>
            <p className="text-sm text-gray-400">Eingeschriebene Kurse</p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <CheckCircle size={20} className="text-green-400 mr-2" />
                <h4 className="font-semibold">Abgeschlossen</h4>
              </div>
              <span className="text-2xl font-bold">
                {enrollments.filter(e => e.status === 'completed').length}
              </span>
            </div>
            <p className="text-sm text-gray-400">Abgeschlossene Kurse</p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Award size={20} className="text-yellow-400 mr-2" />
                <h4 className="font-semibold">Zertifikate</h4>
              </div>
              <span className="text-2xl font-bold">
                {enrollments.filter(e => e.status === 'completed').length}
              </span>
            </div>
            <p className="text-sm text-gray-400">Erhaltene Zertifikate</p>
          </div>
        </div>
        
        {/* Overall Progress */}
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <h4 className="font-semibold mb-2">Gesamtfortschritt</h4>
          <div className="w-full bg-white/10 rounded-full h-4 mb-2">
            <div 
              className="bg-purple-600 h-4 rounded-full transition-all duration-300"
              style={{ 
                width: `${enrollments.length > 0 
                  ? (enrollments.reduce((sum, e) => sum + e.progress, 0) / (enrollments.length * 100)) * 100 
                  : 0}%` 
              }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>0%</span>
            <span>
              {enrollments.length > 0 
                ? Math.round((enrollments.reduce((sum, e) => sum + e.progress, 0) / (enrollments.length * 100)) * 100) 
                : 0}%
            </span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Meine Kurse</h3>
        
        {filteredEnrollments.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Keine Kurse gefunden</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Versuche es mit anderen Filtereinstellungen'
                : 'Du hast dich noch für keinen Kurs eingeschrieben'}
            </p>
            <Link
              to="/courses"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors inline-block"
            >
              Kurse entdecken
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEnrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden hover:bg-white/10 transition-all"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-64 h-48 md:h-auto">
                    <img
                      src={enrollment.course.image_url || 'https://images.pexels.com/photos/1904105/pexels-photo-1904105.jpeg'}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="p-6 flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{enrollment.course.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className={`flex items-center ${getDifficultyColor(enrollment.course.difficulty)}`}>
                            <BookOpen size={16} className="mr-1" />
                            {getDifficultyLabel(enrollment.course.difficulty)}
                          </div>
                          <div className="flex items-center text-gray-400">
                            <Clock size={16} className="mr-1" />
                            {enrollment.course.duration} Min.
                          </div>
                          {enrollment.course.is_premium && (
                            <div className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs flex items-center">
                              <Star size={12} className="mr-1" />
                              Premium
                            </div>
                          )}
                          <div className="bg-white/10 px-2 py-0.5 rounded-full text-xs">
                            {getCategoryLabel(enrollment.course.category)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 md:mt-0">
                        {enrollment.status === 'completed' ? (
                          <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm flex items-center">
                            <CheckCircle size={16} className="mr-1" />
                            Abgeschlossen
                          </div>
                        ) : (
                          <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center">
                            <Clock size={16} className="mr-1" />
                            In Bearbeitung
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Fortschritt</span>
                        <span>{enrollment.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="text-sm text-gray-400">
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-1" />
                          Eingeschrieben am {format(new Date(enrollment.enrolled_at), 'dd. MMMM yyyy', { locale: de })}
                        </div>
                        {enrollment.dog && (
                          <div className="mt-1">
                            Mit {enrollment.dog.name}
                          </div>
                        )}
                      </div>
                      
                      <Link
                        to={`/courses/${enrollment.course.id}`}
                        className="mt-4 md:mt-0 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
                      >
                        {enrollment.progress > 0 ? (
                          <>
                            <Play size={18} className="mr-2" />
                            Fortsetzen
                          </>
                        ) : (
                          <>
                            <Play size={18} className="mr-2" />
                            Starten
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificates */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Meine Zertifikate</h3>
          <Link to="/certificates" className="text-purple-400 hover:text-purple-300 flex items-center">
            Alle anzeigen <ChevronRight size={16} className="ml-1" />
          </Link>
        </div>
        
        {enrollments.filter(e => e.status === 'completed').length === 0 ? (
          <div className="bg-white/5 rounded-lg p-6 text-center">
            <Award size={32} className="mx-auto mb-4 text-gray-400" />
            <h4 className="font-semibold mb-2">Noch keine Zertifikate</h4>
            <p className="text-sm text-gray-400">
              Schließe Kurse ab, um Zertifikate zu erhalten
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.filter(e => e.status === 'completed').slice(0, 3).map((enrollment) => (
              <div key={enrollment.id} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                    <Award size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{enrollment.course.title}</h4>
                    <p className="text-xs text-gray-400">
                      Abgeschlossen am {enrollment.completed_at 
                        ? format(new Date(enrollment.completed_at), 'dd.MM.yyyy', { locale: de })
                        : format(new Date(), 'dd.MM.yyyy', { locale: de })}
                    </p>
                  </div>
                </div>
                <Link
                  to="/certificates"
                  className="text-purple-400 hover:text-purple-300 text-sm flex items-center"
                >
                  Zertifikat anzeigen <ChevronRight size={14} className="ml-1" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseProgress;