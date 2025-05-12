import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Award, CheckCircle, Clock, Download, Share2, ArrowRight, Lock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import CertificateGenerator from './CertificateGenerator';

interface CertificationType {
  id: string;
  name: string;
  description: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  required_courses: number;
  required_score: number;
}

interface Certification {
  id: string;
  user_id: string;
  dog_id: string | null;
  certification_type_id: string;
  status: 'started' | 'eligible' | 'certified';
  completion_pct: number;
  certificate_url: string | null;
  issued_at: string | null;
  certification_type: CertificationType;
  dog?: {
    name: string;
  };
}

interface CertificationCriteria {
  id: string;
  certification_type_id: string;
  course_id: string | null;
  criteria_type: 'course_completion' | 'quiz_score' | 'training_days';
  required_value: number;
  description: string;
  course?: {
    title: string;
  };
}

interface Dog {
  id: string;
  name: string;
}

const CertificationModule: React.FC = () => {
  const { session } = useAuth();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [certificationTypes, setCertificationTypes] = useState<CertificationType[]>([]);
  const [criteria, setCriteria] = useState<Record<string, CertificationCriteria[]>>({});
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDog, setSelectedDog] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (session) {
      fetchUserProfile();
      fetchCertificationTypes();
      fetchUserDogs();
    }
  }, [session]);

  useEffect(() => {
    if (selectedDog) {
      fetchCertifications();
    }
  }, [selectedDog]);

  async function fetchUserProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;
      setUserName(data.full_name || data.username || session?.user.email || 'Hundefreund');
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  async function fetchCertificationTypes() {
    try {
      const { data, error } = await supabase
        .from('certification_types')
        .select('*')
        .order('level', { ascending: true });

      if (error) throw error;
      setCertificationTypes(data || []);

      // Fetch criteria for each certification type
      for (const type of data || []) {
        fetchCriteria(type.id);
      }
    } catch (error) {
      console.error('Error fetching certification types:', error);
    }
  }

  async function fetchCriteria(certificationTypeId: string) {
    try {
      const { data, error } = await supabase
        .from('certification_criteria')
        .select(`
          *,
          course:course_id(title)
        `)
        .eq('certification_type_id', certificationTypeId);

      if (error) throw error;
      setCriteria(prev => ({
        ...prev,
        [certificationTypeId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching criteria:', error);
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
        setSelectedDog(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching user dogs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCertifications() {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .select(`
          *,
          certification_type:certification_type_id(*),
          dog:dog_id(name)
        `)
        .eq('user_id', session?.user.id)
        .eq('dog_id', selectedDog);

      if (error) throw error;
      setCertifications(data || []);

      // Check if we need to create any missing certifications
      const existingTypeIds = data?.map(cert => cert.certification_type_id) || [];
      const missingTypes = certificationTypes.filter(type => !existingTypeIds.includes(type.id));

      if (missingTypes.length > 0) {
        await createMissingCertifications(missingTypes);
      }
    } catch (error) {
      console.error('Error fetching certifications:', error);
    }
  }

  async function createMissingCertifications(types: CertificationType[]) {
    try {
      const newCertifications = types.map(type => ({
        user_id: session?.user.id,
        dog_id: selectedDog,
        certification_type_id: type.id,
        status: 'started',
        completion_pct: 0
      }));

      const { data, error } = await supabase
        .from('certifications')
        .insert(newCertifications)
        .select(`
          *,
          certification_type:certification_type_id(*),
          dog:dog_id(name)
        `);

      if (error) throw error;
      setCertifications(prev => [...prev, ...(data || [])]);
    } catch (error) {
      console.error('Error creating certifications:', error);
    }
  }

  async function generateCertificate(certification: Certification) {
    setSelectedCertification(certification);
    setShowCertificateModal(true);
  }

  async function markAsCertified(certificationId: string, certificateUrl: string) {
    try {
      const { error } = await supabase
        .from('certifications')
        .update({
          status: 'certified',
          certificate_url: certificateUrl,
          issued_at: new Date().toISOString()
        })
        .eq('id', certificationId);

      if (error) throw error;
      fetchCertifications();
    } catch (error) {
      console.error('Error updating certification:', error);
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze':
        return 'from-amber-700 to-amber-500';
      case 'silver':
        return 'from-gray-400 to-gray-300';
      case 'gold':
        return 'from-yellow-500 to-yellow-300';
      case 'platinum':
        return 'from-indigo-400 to-purple-300';
      default:
        return 'from-amber-700 to-amber-500';
    }
  };

  const getLevelTextColor = (level: string) => {
    switch (level) {
      case 'bronze':
        return 'text-amber-500';
      case 'silver':
        return 'text-gray-300';
      case 'gold':
        return 'text-yellow-400';
      case 'platinum':
        return 'text-purple-300';
      default:
        return 'text-amber-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
        <Award size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">Anmeldung erforderlich</h3>
        <p className="text-gray-400 mb-6">
          Bitte melde dich an, um deine Zertifikate zu verwalten.
        </p>
      </div>
    );
  }

  if (dogs.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
        <Award size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">Kein Hund gefunden</h3>
        <p className="text-gray-400 mb-6">
          Bitte füge zuerst einen Hund zu deinem Profil hinzu, um Zertifikate zu erhalten.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Dogmania Zertifizierungen</h2>
          <p className="text-gray-400">
            Dokumentiere deine Trainingserfolge mit offiziellen Zertifikaten
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          {dogs.map(dog => (
            <button
              key={dog.id}
              onClick={() => setSelectedDog(dog.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedDog === dog.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {dog.name}
            </button>
          ))}
        </div>
      </div>

      {/* Certifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certifications.map((certification) => (
          <motion.div
            key={certification.id}
            whileHover={{ y: -5 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getLevelColor(certification.certification_type.level)} flex items-center justify-center`}>
                <Award size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{certification.certification_type.name}</h3>
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${getLevelTextColor(certification.certification_type.level)}`}>
                    {certification.certification_type.level.charAt(0).toUpperCase() + certification.certification_type.level.slice(1)}-Level
                  </span>
                  {certification.dog && (
                    <span className="text-sm text-gray-400 ml-2">
                      • mit {certification.dog.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              {certification.certification_type.description}
            </p>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Fortschritt</span>
                <span>{certification.completion_pct}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 bg-gradient-to-r ${getLevelColor(certification.certification_type.level)}`}
                  style={{ width: `${certification.completion_pct}%` }}
                />
              </div>
            </div>

            {/* Criteria */}
            <div className="space-y-3 mb-6">
              <h4 className="font-medium">Anforderungen:</h4>
              {criteria[certification.certification_type_id]?.map((criterion) => (
                <div 
                  key={criterion.id} 
                  className="flex items-start"
                >
                  {certification.completion_pct >= 100 ? (
                    <CheckCircle size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Clock size={18} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm">
                      {criterion.criteria_type === 'course_completion' && criterion.course && (
                        <>Kurs "{criterion.course.title}" abschließen</>
                      )}
                      {criterion.criteria_type === 'quiz_score' && (
                        <>Quiz-Score von mindestens {criterion.required_value}% erreichen</>
                      )}
                      {criterion.criteria_type === 'training_days' && (
                        <>{criterion.required_value} Trainingstage absolvieren</>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Button */}
            {certification.status === 'certified' ? (
              <div className="space-y-3">
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center">
                  <CheckCircle size={18} className="mr-2" />
                  Zertifiziert am {new Date(certification.issued_at!).toLocaleDateString('de-DE')}
                </div>
                <div className="flex gap-2">
                  <a
                    href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/certificates/${certification.certificate_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center justify-center"
                  >
                    <Download size={18} className="mr-2" />
                    Zertifikat
                  </a>
                  <button
                    onClick={() => {
                      if (navigator.share && certification.certificate_url) {
                        navigator.share({
                          title: `${certification.certification_type.name} Zertifikat`,
                          text: `Ich habe das ${certification.certification_type.name} Zertifikat auf Dogmania erhalten!`,
                          url: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/certificates/${certification.certificate_url}`
                        });
                      }
                    }}
                    className="bg-white/10 hover:bg-white/20 transition-colors p-2 rounded-lg"
                    title="Teilen"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            ) : certification.status === 'eligible' ? (
              <button
                onClick={() => generateCertificate(certification)}
                className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-500 transition-colors flex items-center justify-center"
              >
                <Award size={18} className="mr-2" />
                Zertifikat erstellen
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-3 rounded-lg flex items-center">
                  <Clock size={18} className="mr-2" />
                  Noch {100 - certification.completion_pct}% bis zur Zertifizierung
                </div>
                <button
                  disabled
                  className="w-full bg-white/10 text-gray-400 px-4 py-3 rounded-lg cursor-not-allowed flex items-center justify-center"
                >
                  <Lock size={18} className="mr-2" />
                  Zertifikat noch nicht verfügbar
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Certificate Generation Modal */}
      {showCertificateModal && selectedCertification && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Zertifikat erstellen</h2>
            
            <div className="bg-white/5 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getLevelColor(selectedCertification.certification_type.level)} flex items-center justify-center`}>
                  <Award size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedCertification.certification_type.name}</h3>
                  <p className="text-sm text-gray-400">
                    {selectedCertification.dog?.name ? `Für ${selectedCertification.dog.name}` : 'Ohne Hund'}
                  </p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">
                Herzlichen Glückwunsch! Du hast alle Anforderungen für dieses Zertifikat erfüllt.
                Klicke auf "Zertifikat erstellen", um dein offizielles Dogmania-Zertifikat zu generieren.
              </p>
              
              <CertificateGenerator
                userName={userName}
                courseName={selectedCertification.certification_type.name}
                completionDate={new Date()}
                courseId={selectedCertification.certification_type_id}
                dogName={selectedCertification.dog?.name}
                onComplete={(fileUrl) => {
                  markAsCertified(selectedCertification.id, fileUrl);
                  setShowCertificateModal(false);
                }}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationModule;