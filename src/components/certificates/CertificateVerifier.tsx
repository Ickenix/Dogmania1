import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, CheckCircle, XCircle, Award } from 'lucide-react';

interface CertificateVerifierProps {
  certificateId?: string;
}

const CertificateVerifier: React.FC<CertificateVerifierProps> = ({ certificateId: initialId }) => {
  const [certificateId, setCertificateId] = useState(initialId || '');
  const [verificationResult, setVerificationResult] = useState<'valid' | 'invalid' | null>(null);
  const [certificateData, setCertificateData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!certificateId.trim()) return;
    
    try {
      setLoading(true);
      setVerificationResult(null);
      setCertificateData(null);
      
      // Query the certifications table
      const { data, error } = await supabase
        .from('certifications')
        .select(`
          *,
          user:user_id(username, full_name),
          certification_type:certification_type_id(name, level),
          dog:dog_id(name)
        `)
        .eq('id', certificateId)
        .single();

      if (error || !data) {
        setVerificationResult('invalid');
        return;
      }
      
      setVerificationResult('valid');
      setCertificateData(data);
    } catch (error) {
      console.error('Error verifying certificate:', error);
      setVerificationResult('invalid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Award size={24} className="text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Zertifikat verifizieren</h2>
          <p className="text-gray-400">Überprüfe die Echtheit eines Dogmania-Zertifikats</p>
        </div>
      </div>
      
      <form onSubmit={handleVerify} className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Zertifikat-ID eingeben"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !certificateId.trim()}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Wird überprüft...' : 'Verifizieren'}
          </button>
        </div>
      </form>
      
      {verificationResult === 'valid' && certificateData && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <CheckCircle size={32} className="text-green-400" />
            <div>
              <h3 className="text-lg font-semibold">Gültiges Zertifikat</h3>
              <p className="text-green-400">Dieses Zertifikat wurde von Dogmania ausgestellt.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-1">Zertifikat</h4>
              <p className="font-semibold">{certificateData.certification_type.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-1">Ausgestellt an</h4>
              <p className="font-semibold">{certificateData.user.full_name || certificateData.user.username}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-1">Ausstellungsdatum</h4>
              <p>{new Date(certificateData.issued_at).toLocaleDateString('de-DE')}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-1">Level</h4>
              <p className="capitalize">{certificateData.certification_type.level}</p>
            </div>
            {certificateData.dog && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Hund</h4>
                <p>{certificateData.dog.name}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {verificationResult === 'invalid' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <XCircle size={32} className="text-red-400" />
            <div>
              <h3 className="text-lg font-semibold">Ungültiges Zertifikat</h3>
              <p className="text-red-400">Dieses Zertifikat konnte nicht verifiziert werden.</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-400">
        <p>Jedes Dogmania-Zertifikat hat eine eindeutige ID, die zur Verifizierung verwendet werden kann. Die ID findest du in der unteren rechten Ecke des Zertifikats.</p>
      </div>
    </div>
  );
};

export default CertificateVerifier;