import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ChevronRight, Play, CheckCircle, Lock, Award, Menu, X } from 'lucide-react';
import CourseCompletion from './CourseCompletion';
import CheckoutButton from '../payment/CheckoutButton';
import PremiumFeatureGate from '../payment/PremiumFeatureGate';
import { motion, AnimatePresence } from 'framer-motion';

interface Chapter {
  id: string;
  title: string;
  content: string;
  video_url: string;
  order: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  is_premium: boolean;
  image_url: string;
}

interface UserProgress {
  chapter_id: string;
  completed_at: string;
}

const CourseView = () => {
  const { courseId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    fetchCourseData();
    checkForCertificate();
  }, [courseId]);

  async function fetchCourseData() {
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData || []);
      if (chaptersData?.length > 0) {
        setActiveChapter(chaptersData[0]);
      }

      // Fetch user progress if logged in
      if (session?.user) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('course_id', courseId)
          .eq('user_id', session.user.id);

        if (progressError) throw progressError;
        setUserProgress(progressData || []);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkForCertificate() {
    if (!session?.user || !courseId) return;
    
    try {
      const { data, error } = await supabase
        .from('course_certificates')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', session.user.id)
        .maybeSingle();
        
      if (error) throw error;
      setHasCertificate(!!data);
    } catch (error) {
      console.error('Error checking for certificate:', error);
    }
  }

  async function markChapterComplete(chapterId: string) {
    if (!session?.user || !courseId) return;

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: session.user.id,
          course_id: courseId,
          chapter_id: chapterId,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Refresh progress
      fetchCourseData();
      
      // Check if all chapters are completed
      const isLastChapter = chapters.indexOf(activeChapter!) === chapters.length - 1;
      if (isLastChapter) {
        // Check if all chapters are completed
        const updatedProgress = [...userProgress, { chapter_id: chapterId, completed_at: new Date().toISOString() }];
        const allCompleted = chapters.every(chapter => 
          updatedProgress.some(progress => progress.chapter_id === chapter.id)
        );
        
        if (allCompleted) {
          setShowCompletionModal(true);
        }
      }
    } catch (error) {
      console.error('Error marking chapter complete:', error);
    }
  }

  const isChapterCompleted = (chapterId: string) => {
    return userProgress.some(p => p.chapter_id === chapterId);
  };

  const allChaptersCompleted = chapters.length > 0 && 
    chapters.every(chapter => isChapterCompleted(chapter.id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-purple-950 pt-16">
      <div className="flex flex-col md:flex-row">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-20 right-4 z-30 md:hidden bg-purple-600 text-white p-3 rounded-full shadow-lg"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 768) && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`w-full md:w-80 bg-blue-900/20 backdrop-blur-lg min-h-[calc(100vh-4rem)] p-6 ${
                sidebarOpen ? 'fixed top-16 left-0 right-0 bottom-0 z-20 overflow-y-auto' : 'hidden md:block md:fixed'
              }`}
            >
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-2">{course.title}</h2>
                <p className="text-gray-400 text-sm">{course.description}</p>
                
                {allChaptersCompleted && (
                  <div className="mt-4 bg-green-500/10 text-green-400 px-4 py-2 rounded-lg flex items-center">
                    <CheckCircle size={18} className="mr-2" />
                    Kurs abgeschlossen
                  </div>
                )}
                
                {hasCertificate && (
                  <div className="mt-4 bg-purple-500/10 text-purple-400 px-4 py-2 rounded-lg flex items-center">
                    <Award size={18} className="mr-2" />
                    Zertifikat erhalten
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      setActiveChapter(chapter);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-lg transition-all ${
                      activeChapter?.id === chapter.id
                        ? 'bg-purple-600 text-white'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center">
                      {isChapterCompleted(chapter.id) ? (
                        <CheckCircle size={20} className="text-green-400 mr-3" />
                      ) : (
                        <Play size={20} className="mr-3" />
                      )}
                      <span className="text-sm">{chapter.title}</span>
                    </div>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
              
              {allChaptersCompleted && !hasCertificate && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowCompletionModal(true)}
                    className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-500 transition-colors flex items-center justify-center"
                  >
                    <Award size={18} className="mr-2" />
                    Zertifikat erstellen
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="w-full md:ml-80 flex-1 p-4 md:p-8">
          {course.is_premium ? (
            <PremiumFeatureGate
              fallback={
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
                  <Lock size={48} className="mx-auto mb-4 text-purple-400" />
                  <h3 className="text-2xl font-bold mb-4">Premium-Inhalt</h3>
                  <p className="text-gray-400 mb-6">
                    Dieser Kurs ist nur für Premium-Mitglieder verfügbar.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => navigate('/pricing')}
                      className="bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Pläne vergleichen
                    </button>
                    <CheckoutButton
                      productId="premium_monthly"
                      className="px-6 py-3"
                    >
                      Premium werden
                    </CheckoutButton>
                  </div>
                </div>
              }
            >
              {activeChapter ? (
                <div className="space-y-8">
                  {activeChapter.video_url && (
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden">
                      <iframe
                        src={activeChapter.video_url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}

                  <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 md:p-8">
                    <h3 className="text-2xl font-bold mb-6">{activeChapter.title}</h3>
                    <div className="prose prose-invert max-w-none">
                      {activeChapter.content}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => {
                        const currentIndex = chapters.findIndex(c => c.id === activeChapter.id);
                        if (currentIndex > 0) {
                          setActiveChapter(chapters[currentIndex - 1]);
                        }
                      }}
                      className="px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
                      disabled={chapters.indexOf(activeChapter) === 0}
                    >
                      Vorheriges Kapitel
                    </button>

                    {isChapterCompleted(activeChapter.id) ? (
                      <button
                        onClick={() => {
                          const currentIndex = chapters.findIndex(c => c.id === activeChapter.id);
                          if (currentIndex < chapters.length - 1) {
                            setActiveChapter(chapters[currentIndex + 1]);
                          }
                        }}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-500 transition-colors"
                      >
                        Nächstes Kapitel
                      </button>
                    ) : (
                      <button
                        onClick={() => markChapterComplete(activeChapter.id)}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
                      >
                        Kapitel abschließen
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>Wähle ein Kapitel aus der Navigation</div>
              )}
            </PremiumFeatureGate>
          ) : (
            activeChapter ? (
              <div className="space-y-8">
                {activeChapter.video_url && (
                  <div className="aspect-video bg-black rounded-2xl overflow-hidden">
                    <iframe
                      src={activeChapter.video_url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}

                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 md:p-8">
                  <h3 className="text-2xl font-bold mb-6">{activeChapter.title}</h3>
                  <div className="prose prose-invert max-w-none">
                    {activeChapter.content}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      const currentIndex = chapters.findIndex(c => c.id === activeChapter.id);
                      if (currentIndex > 0) {
                        setActiveChapter(chapters[currentIndex - 1]);
                      }
                    }}
                    className="px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
                    disabled={chapters.indexOf(activeChapter) === 0}
                  >
                    Vorheriges Kapitel
                  </button>

                  {isChapterCompleted(activeChapter.id) ? (
                    <button
                      onClick={() => {
                        const currentIndex = chapters.findIndex(c => c.id === activeChapter.id);
                        if (currentIndex < chapters.length - 1) {
                          setActiveChapter(chapters[currentIndex + 1]);
                        }
                      }}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-500 transition-colors"
                    >
                      Nächstes Kapitel
                    </button>
                  ) : (
                    <button
                      onClick={() => markChapterComplete(activeChapter.id)}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
                    >
                      Kapitel abschließen
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>Wähle ein Kapitel aus der Navigation</div>
            )
          )}
        </div>
      </div>
      
      {/* Course Completion Modal */}
      {showCompletionModal && course && (
        <CourseCompletion
          courseId={course.id}
          courseName={course.title}
          onClose={() => setShowCompletionModal(false)}
        />
      )}
    </div>
  );
};

export default CourseView;