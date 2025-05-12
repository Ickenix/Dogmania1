import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Award, Search, Filter } from 'lucide-react';
import CertificateCard from './CertificateCard';

interface Certificate {
  id: string;
  course_id: string;
  download_url: string;
  issued_at: string;
  course: {
    title: string;
  };
  dog?: {
    name: string;
  };
}

interface CertificateDisplayProps {
  userId?: string;
  showFilters?: boolean;
  limit?: number;
}

const CertificateDisplay: React.FC<CertificateDisplayProps> = ({
  userId,
  showFilters = true,
  limit
}) => {
  const { session } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, course, achievement, trainer

  useEffect(() => {
    fetchCertificates();
  }, [userId, session]);

  async function fetchCertificates() {
    try {
      const targetUserId = userId || session?.user.id;
      if (!targetUserId) return;

      const query = supabase
        .from('course_certificates')
        .select(`
          *,
          course:course_id(title),
          dog:dog_id(name)
        `)
        .eq('user_id', targetUserId)
        .order('issued_at', { ascending: false });

      if (limit) {
        query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.course.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'course' && !cert.dog) ||
      (filter === 'achievement' && cert.dog);
      
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
        <Award size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">Keine Zertifikate</h3>
        <p className="text-gray-400">
          Schließe Kurse ab, um Zertifikate zu erhalten und deine Erfolge zu dokumentieren.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Suche nach Zertifikaten..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setFilter('course')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'course' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Kurse
            </button>
            <button
              onClick={() => setFilter('achievement')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'achievement' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Mit Hund
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCertificates.map((cert) => (
          <CertificateCard
            key={cert.id}
            id={cert.id}
            title={cert.course.title}
            issuedAt={cert.issued_at}
            downloadUrl={cert.download_url}
            type={cert.dog ? 'achievement' : 'course'}
            dogName={cert.dog?.name}
          />
        ))}
      </div>
    </div>
  );
};

export default CertificateDisplay;