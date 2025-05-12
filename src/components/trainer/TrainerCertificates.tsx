import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Award, Upload, Trash2, Calendar, ExternalLink, Plus, X } from 'lucide-react';
import TrainerCertificateUpload from '../certificates/TrainerCertificateUpload';

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issue_date: string;
  expiry_date: string | null;
  file_url: string;
  created_at: string;
}

interface TrainerCertificatesProps {
  trainerId?: string;
}

const TrainerCertificates: React.FC<TrainerCertificatesProps> = ({ trainerId }) => {
  const { session } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (trainerId) {
      fetchCertificates();
    }
  }, [trainerId]);

  async function fetchCertificates() {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCertificate(id: string, fileUrl: string) {
    if (!confirm('Bist du sicher, dass du dieses Zertifikat löschen möchtest?')) {
      return;
    }

    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('certificates')
        .remove([fileUrl]);

      if (storageError) throw storageError;

      // Delete record from database
      const { error: dbError } = await supabase
        .from('certificates')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      fetchCertificates();
    } catch (error) {
      console.error('Error deleting certificate:', error);
    }
  }

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
        <h2 className="text-2xl font-bold">Zertifikate & Qualifikationen</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Zertifikat hinzufügen
        </button>
      </div>

      {/* Certificate List */}
      {certificates.length === 0 && !showAddForm ? (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <Award size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Keine Zertifikate</h3>
          <p className="text-gray-400 mb-6">
            Füge deine Zertifikate und Qualifikationen hinzu, um dein Profil zu vervollständigen und das Vertrauen deiner Kunden zu gewinnen.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
          >
            Erstes Zertifikat hinzufügen
          </button>
        </div>
      ) : (
        <>
          {showAddForm ? (
            <TrainerCertificateUpload
              trainerId={trainerId!}
              onSuccess={() => {
                setShowAddForm(false);
                fetchCertificates();
              }}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Award size={24} className="text-purple-400" />
                    </div>
                    <button
                      onClick={() => deleteCertificate(cert.id, cert.file_url)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Zertifikat löschen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-1">{cert.title}</h3>
                  <p className="text-gray-400 mb-4">{cert.issuer}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <Calendar size={16} className="mr-2 text-purple-400" />
                      <span>Ausgestellt: {new Date(cert.issue_date).toLocaleDateString()}</span>
                    </div>
                    {cert.expiry_date && (
                      <div className="flex items-center text-sm">
                        <Calendar size={16} className="mr-2 text-purple-400" />
                        <span>Gültig bis: {new Date(cert.expiry_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <a
                    href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/certificates/${cert.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <ExternalLink size={16} className="mr-1" />
                    <span>Zertifikat anzeigen</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrainerCertificates;