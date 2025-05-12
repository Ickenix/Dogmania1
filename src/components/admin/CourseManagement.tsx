import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, BookOpen, Edit2, Trash2, Plus, Star, Clock, Users, 
  Check, X, ChevronDown, ChevronUp, Video, FileText, HelpCircle,
  Save, Eye, ArrowUp, ArrowDown, Globe, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  difficulty: string;
  category: string;
  is_premium: boolean;
  is_published?: boolean;
  duration: number;
  created_at: string;
  enrollment_count: number;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  video_url: string;
  order: number;
}

interface Quiz {
  id: string;
  question: string;
  options: string[];
  correct_option: number;
}

const CourseManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, free, premium, published, draft
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    category: 'general',
    is_premium: false,
    is_published: false,
    duration: 60,
    image_url: ''
  });

  // Chapter form state
  const [chapterForm, setChapterForm] = useState({
    title: '',
    content: '',
    video_url: '',
    order: 1
  });

  // Quiz form state
  const [quizForm, setQuizForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_option: 0
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (expandedCourse) {
      fetchChapters(expandedCourse);
      fetchQuizzes(expandedCourse);
    }
  }, [expandedCourse]);

  async function fetchCourses() {
    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch enrollment counts
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('course_id, count')
        .group('course_id');

      if (enrollmentError) throw enrollmentError;

      // Combine data
      const enrollmentMap = new Map();
      enrollmentData?.forEach(item => {
        enrollmentMap.set(item.course_id, item.count);
      });

      const coursesWithCounts = coursesData?.map(course => ({
        ...course,
        enrollment_count: enrollmentMap.get(course.id) || 0
      })) || [];

      setCourses(coursesWithCounts);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchChapters(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

      if (error) throw error;
      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  }

  async function fetchQuizzes(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId);

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (editingCourse) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update(formData)
          .eq('id', editingCourse.id);
          
        if (error) throw error;
      } else {
        // Create new course
        const { error } = await supabase
          .from('courses')
          .insert([formData]);
          
        if (error) throw error;
      }
      
      // Reset form and fetch updated courses
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  }

  async function handleChapterSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!expandedCourse) return;
    
    try {
      if (editingChapter) {
        // Update existing chapter
        const { error } = await supabase
          .from('chapters')
          .update({
            title: chapterForm.title,
            content: chapterForm.content,
            video_url: chapterForm.video_url,
            order: chapterForm.order
          })
          .eq('id', editingChapter.id);
          
        if (error) throw error;
      } else {
        // Create new chapter
        const { error } = await supabase
          .from('chapters')
          .insert([{
            course_id: expandedCourse,
            title: chapterForm.title,
            content: chapterForm.content,
            video_url: chapterForm.video_url,
            order: chapterForm.order
          }]);
          
        if (error) throw error;
      }
      
      // Reset form and fetch updated chapters
      resetChapterForm();
      fetchChapters(expandedCourse);
    } catch (error) {
      console.error('Error saving chapter:', error);
    }
  }

  async function handleQuizSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!expandedCourse) return;
    
    try {
      if (editingQuiz) {
        // Update existing quiz
        const { error } = await supabase
          .from('quizzes')
          .update({
            question: quizForm.question,
            options: quizForm.options,
            correct_option: quizForm.correct_option
          })
          .eq('id', editingQuiz.id);
          
        if (error) throw error;
      } else {
        // Create new quiz
        const { error } = await supabase
          .from('quizzes')
          .insert([{
            course_id: expandedCourse,
            question: quizForm.question,
            options: quizForm.options,
            correct_option: quizForm.correct_option
          }]);
          
        if (error) throw error;
      }
      
      // Reset form and fetch updated quizzes
      resetQuizForm();
      fetchQuizzes(expandedCourse);
    } catch (error) {
      console.error('Error saving quiz:', error);
    }
  }

  function editCourse(course: Course) {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      difficulty: course.difficulty,
      category: course.category,
      is_premium: course.is_premium,
      is_published: course.is_published || false,
      duration: course.duration || 60,
      image_url: course.image_url || ''
    });
    setShowCourseForm(true);
  }

  function editChapter(chapter: Chapter) {
    setEditingChapter(chapter);
    setChapterForm({
      title: chapter.title,
      content: chapter.content || '',
      video_url: chapter.video_url || '',
      order: chapter.order
    });
    setShowChapterForm(true);
  }

  function editQuiz(quiz: Quiz) {
    setEditingQuiz(quiz);
    setQuizForm({
      question: quiz.question,
      options: quiz.options,
      correct_option: quiz.correct_option
    });
    setShowQuizForm(true);
  }

  async function deleteCourse(courseId: string) {
    if (!confirm('Bist du sicher, dass du diesen Kurs löschen möchtest? Alle zugehörigen Kapitel, Quizze und Fortschritte werden ebenfalls gelöscht.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
        
      if (error) throw error;
      
      fetchCourses();
      if (expandedCourse === courseId) {
        setExpandedCourse(null);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  }

  async function deleteChapter(chapterId: string) {
    if (!confirm('Bist du sicher, dass du dieses Kapitel löschen möchtest?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);
        
      if (error) throw error;
      
      if (expandedCourse) {
        fetchChapters(expandedCourse);
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
    }
  }

  async function deleteQuiz(quizId: string) {
    if (!confirm('Bist du sicher, dass du dieses Quiz löschen möchtest?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);
        
      if (error) throw error;
      
      if (expandedCourse) {
        fetchQuizzes(expandedCourse);
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  }

  async function moveChapter(chapterId: string, direction: 'up' | 'down') {
    const currentChapter = chapters.find(c => c.id === chapterId);
    if (!currentChapter || !expandedCourse) return;
    
    const currentIndex = chapters.findIndex(c => c.id === chapterId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= chapters.length) return;
    
    const targetChapter = chapters[newIndex];
    
    try {
      // Update current chapter order
      const { error: error1 } = await supabase
        .from('chapters')
        .update({ order: targetChapter.order })
        .eq('id', currentChapter.id);
        
      if (error1) throw error1;
      
      // Update target chapter order
      const { error: error2 } = await supabase
        .from('chapters')
        .update({ order: currentChapter.order })
        .eq('id', targetChapter.id);
        
      if (error2) throw error2;
      
      fetchChapters(expandedCourse);
    } catch (error) {
      console.error('Error moving chapter:', error);
    }
  }

  async function toggleCoursePublished(courseId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !currentStatus })
        .eq('id', courseId);
        
      if (error) throw error;
      
      fetchCourses();
    } catch (error) {
      console.error('Error toggling course published status:', error);
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      difficulty: 'beginner',
      category: 'general',
      is_premium: false,
      is_published: false,
      duration: 60,
      image_url: ''
    });
    setEditingCourse(null);
    setShowCourseForm(false);
  }

  function resetChapterForm() {
    setChapterForm({
      title: '',
      content: '',
      video_url: '',
      order: chapters.length + 1
    });
    setEditingChapter(null);
    setShowChapterForm(false);
  }

  function resetQuizForm() {
    setQuizForm({
      question: '',
      options: ['', '', '', ''],
      correct_option: 0
    });
    setEditingQuiz(null);
    setShowQuizForm(false);
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'free' && !course.is_premium) ||
      (filter === 'premium' && course.is_premium) ||
      (filter === 'published' && course.is_published) ||
      (filter === 'draft' && !course.is_published);
      
    const matchesCategory =
      categoryFilter === 'all' ||
      course.category === categoryFilter;
      
    return matchesSearch && matchesFilter && matchesCategory;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Kursverwaltung</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Suche nach Kursen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Alle Kurse</option>
            <option value="free">Kostenlos</option>
            <option value="premium">Premium</option>
            <option value="published">Veröffentlicht</option>
            <option value="draft">Entwurf</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Alle Kategorien</option>
            <option value="general">Allgemein</option>
            <option value="training">Training</option>
            <option value="behavior">Verhalten</option>
            <option value="health">Gesundheit</option>
            <option value="nutrition">Ernährung</option>
          </select>
          <button
            onClick={() => {
              setEditingCourse(null);
              resetForm();
              setShowCourseForm(true);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Neuer Kurs
          </button>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-4">
        {filteredCourses.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Keine Kurse gefunden</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || filter !== 'all' || categoryFilter !== 'all'
                ? 'Versuche es mit anderen Filtereinstellungen'
                : 'Erstelle deinen ersten Kurs, um loszulegen'}
            </p>
            <button
              onClick={() => {
                setEditingCourse(null);
                resetForm();
                setShowCourseForm(true);
              }}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
            >
              <Plus size={20} className="inline-block mr-2" />
              Ersten Kurs erstellen
            </button>
          </div>
        ) : (
          filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden"
            >
              {/* Course Header */}
              <div className="p-6 cursor-pointer" onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-purple-500/20 flex items-center justify-center overflow-hidden">
                      {course.image_url ? (
                        <img
                          src={course.image_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen size={32} className="text-purple-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{course.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <div className={`flex items-center ${getDifficultyColor(course.difficulty)}`}>
                          <BookOpen size={16} className="mr-1" />
                          {getDifficultyLabel(course.difficulty)}
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Clock size={16} className="mr-1" />
                          {course.duration} Min.
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Users size={16} className="mr-1" />
                          {course.enrollment_count} Teilnehmer
                        </div>
                        {course.is_premium && (
                          <div className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs flex items-center">
                            <Star size={12} className="mr-1" />
                            Premium
                          </div>
                        )}
                        {course.is_published ? (
                          <div className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs flex items-center">
                            <Globe size={12} className="mr-1" />
                            Veröffentlicht
                          </div>
                        ) : (
                          <div className="bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full text-xs flex items-center">
                            <Lock size={12} className="mr-1" />
                            Entwurf
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCoursePublished(course.id, course.is_published || false);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        course.is_published
                          ? 'text-green-400 hover:bg-green-500/20'
                          : 'text-gray-400 hover:bg-white/10'
                      }`}
                      title={course.is_published ? 'Als Entwurf markieren' : 'Veröffentlichen'}
                    >
                      {course.is_published ? <Globe size={18} /> : <Lock size={18} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        editCourse(course);
                      }}
                      className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCourse(course.id);
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Löschen"
                    >
                      <Trash2 size={18} />
                    </button>
                    {expandedCourse === course.id ? (
                      <ChevronUp size={18} className="ml-2" />
                    ) : (
                      <ChevronDown size={18} className="ml-2" />
                    )}
                  </div>
                </div>
              </div>

              {/* Course Content (Expanded) */}
              <AnimatePresence>
                {expandedCourse === course.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-white/10 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Course Description */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-2">Beschreibung</h4>
                        <p className="text-gray-300">{course.description || 'Keine Beschreibung vorhanden'}</p>
                      </div>

                      {/* Chapters */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold">Kapitel</h4>
                          <button
                            onClick={() => {
                              setEditingChapter(null);
                              setChapterForm({
                                title: '',
                                content: '',
                                video_url: '',
                                order: chapters.length + 1
                              });
                              setShowChapterForm(true);
                            }}
                            className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-500 transition-colors flex items-center text-sm"
                          >
                            <Plus size={16} className="mr-1" />
                            Kapitel hinzufügen
                          </button>
                        </div>

                        {chapters.length === 0 ? (
                          <div className="bg-white/5 rounded-lg p-4 text-center">
                            <BookOpen size={32} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-400">Keine Kapitel vorhanden</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {chapters.map((chapter, index) => (
                              <div key={chapter.id} className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-3">
                                      <span className="font-semibold">{chapter.order}</span>
                                    </div>
                                    <div>
                                      <h5 className="font-semibold">{chapter.title}</h5>
                                      <div className="flex items-center text-xs text-gray-400 mt-1">
                                        {chapter.video_url && (
                                          <div className="flex items-center mr-3">
                                            <Video size={12} className="mr-1" />
                                            Video
                                          </div>
                                        )}
                                        {chapter.content && (
                                          <div className="flex items-center">
                                            <FileText size={12} className="mr-1" />
                                            Text
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <button
                                      onClick={() => moveChapter(chapter.id, 'up')}
                                      disabled={index === 0}
                                      className="p-1 text-gray-400 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <ArrowUp size={16} />
                                    </button>
                                    <button
                                      onClick={() => moveChapter(chapter.id, 'down')}
                                      disabled={index === chapters.length - 1}
                                      className="p-1 text-gray-400 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <ArrowDown size={16} />
                                    </button>
                                    <button
                                      onClick={() => editChapter(chapter)}
                                      className="p-1 text-gray-400 hover:bg-white/10 rounded-lg transition-colors ml-2"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      onClick={() => deleteChapter(chapter.id)}
                                      className="p-1 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quizzes */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold">Quizze</h4>
                          <button
                            onClick={() => {
                              setEditingQuiz(null);
                              setQuizForm({
                                question: '',
                                options: ['', '', '', ''],
                                correct_option: 0
                              });
                              setShowQuizForm(true);
                            }}
                            className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-500 transition-colors flex items-center text-sm"
                          >
                            <Plus size={16} className="mr-1" />
                            Quiz hinzufügen
                          </button>
                        </div>

                        {quizzes.length === 0 ? (
                          <div className="bg-white/5 rounded-lg p-4 text-center">
                            <HelpCircle size={32} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-400">Keine Quizze vorhanden</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {quizzes.map((quiz) => (
                              <div key={quiz.id} className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-semibold">{quiz.question}</h5>
                                    <div className="mt-2 space-y-1">
                                      {quiz.options.map((option, index) => (
                                        <div key={index} className="flex items-center text-sm">
                                          <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                                            index === quiz.correct_option
                                              ? 'bg-green-500/20 text-green-400'
                                              : 'bg-white/10 text-gray-400'
                                          }`}>
                                            {index === quiz.correct_option ? <Check size={12} /> : (index + 1)}
                                          </div>
                                          <span className={index === quiz.correct_option ? 'text-green-400' : ''}>{option}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <button
                                      onClick={() => editQuiz(quiz)}
                                      className="p-1 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      onClick={() => deleteQuiz(quiz.id)}
                                      className="p-1 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {/* Course Form Modal */}
      {showCourseForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">
                {editingCourse ? 'Kurs bearbeiten' : 'Neuen Kurs erstellen'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Titel</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Beschreibung</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Schwierigkeitsgrad</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="beginner">Anfänger</option>
                    <option value="intermediate">Fortgeschritten</option>
                    <option value="advanced">Profi</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Kategorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="general">Allgemein</option>
                    <option value="training">Training</option>
                    <option value="behavior">Verhalten</option>
                    <option value="health">Gesundheit</option>
                    <option value="nutrition">Ernährung</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Dauer (Minuten)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Bild URL</label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_premium"
                    checked={formData.is_premium}
                    onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                    className="h-4 w-4 text-purple-600 rounded border-white/20 bg-white/10 focus:ring-purple-500"
                  />
                  <label htmlFor="is_premium" className="ml-2 text-sm text-gray-300">
                    Premium-Kurs (nur für Premium-Mitglieder)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="h-4 w-4 text-purple-600 rounded border-white/20 bg-white/10 focus:ring-purple-500"
                  />
                  <label htmlFor="is_published" className="ml-2 text-sm text-gray-300">
                    Veröffentlichen (sofort sichtbar)
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors"
                >
                  {editingCourse ? 'Kurs aktualisieren' : 'Kurs erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chapter Form Modal */}
      {showChapterForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">
                {editingChapter ? 'Kapitel bearbeiten' : 'Neues Kapitel erstellen'}
              </h2>
              <button
                onClick={resetChapterForm}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleChapterSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Titel</label>
                <input
                  type="text"
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Inhalt</label>
                <textarea
                  value={chapterForm.content}
                  onChange={(e) => setChapterForm({ ...chapterForm, content: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={8}
                  placeholder="Markdown wird unterstützt"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Video URL (YouTube oder Vimeo)</label>
                <input
                  type="text"
                  value={chapterForm.video_url}
                  onChange={(e) => setChapterForm({ ...chapterForm, video_url: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Reihenfolge</label>
                <input
                  type="number"
                  value={chapterForm.order}
                  onChange={(e) => setChapterForm({ ...chapterForm, order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="1"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetChapterForm}
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors"
                >
                  {editingChapter ? 'Kapitel aktualisieren' : 'Kapitel erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Form Modal */}
      {showQuizForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">
                {editingQuiz ? 'Quiz bearbeiten' : 'Neues Quiz erstellen'}
              </h2>
              <button
                onClick={resetQuizForm}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleQuizSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Frage</label>
                <input
                  type="text"
                  value={quizForm.question}
                  onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Antwortmöglichkeiten</label>
                <div className="space-y-3">
                  {quizForm.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <input
                          type="radio"
                          id={`option-${index}`}
                          name="correct-option"
                          checked={quizForm.correct_option === index}
                          onChange={() => setQuizForm({ ...quizForm, correct_option: index })}
                          className="h-4 w-4 text-purple-600 border-white/20 bg-white/10 focus:ring-purple-500"
                        />
                      </div>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...quizForm.options];
                          newOptions[index] = e.target.value;
                          setQuizForm({ ...quizForm, options: newOptions });
                        }}
                        className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder={`Antwort ${index + 1}`}
                        required
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Wähle die richtige Antwort durch Anklicken des Radiobuttons aus.
                </p>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetQuizForm}
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors"
                >
                  {editingQuiz ? 'Quiz aktualisieren' : 'Quiz erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;