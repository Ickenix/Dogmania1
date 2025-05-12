import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Award, Dog, Share, Download, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import CertificateGenerator from '../certificates/CertificateGenerator';

interface CourseCompletionProps {
  courseId: string;
  courseName: string;
  onClose: () => void;
}

const CourseCompletion: React.FC<CourseCompletionProps> = ({
  courseId,
  courseName,
  onClose
}) => {
  const { session } = useAuth();
  const [userName, setUserName] = useState('');
  const [dogs, setDogs] = useState<any[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchUserData();
      fetchUserDogs();
    }
  }, [session]);

  async function fetchUserData() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;
      setUserName(data.full_name || data.username || session?.user.email || 'Hundefreund');
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserDogs() {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name')
        .eq('owner_id', session?.user.id);

      if (error) throw error;
      setDogs(data || []);
      if (data && data.length > 0) {
        setSelectedDogId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching user dogs:', error);
    }
  }

  const selectedDog = dogs.find(dog => dog.id === selectedDogId);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-2xl">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Kurs abgeschlossen!</h2>
            <p className="text-xl text-gray-300">
              Herzlichen Glückwunsch zum erfolgreichen Abschluss von "{courseName}"
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Award size={24} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Zertifikat erstellen</h3>
                <p className="text-gray-400">Dokumentiere deinen Erfolg mit einem offiziellen Zertifikat</p>
              </div>
            </div>

            {dogs.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Mit welchem Hund hast du den Kurs absolviert?</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dogs.map(dog => (
                    <button
                      key={dog.id}
                      onClick={() => setSelectedDogId(dog.id)}
                      className={`p-3 rounded-lg transition-colors flex items-center ${
                        selectedDogId === dog.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <Dog size={18} className="mr-2" />
                      <span>{dog.name}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedDogId(null)}
                    className={`p-3 rounded-lg transition-colors flex items-center ${
                      selectedDogId === null
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <Dog size={18} className="mr-2" />
                    <span>Ohne Hund</span>
                  </button>
                </div>
              </div>
            )}

            <CertificateGenerator
              userName={userName}
              courseName={courseName}
              completionDate={new Date()}
              courseId={courseId}
              dogName={selectedDog?.name}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 transition-colors px-6 py-3 rounded-lg"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCompletion;