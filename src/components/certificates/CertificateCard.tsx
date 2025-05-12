import React from 'react';
import { Award, Download, Calendar, Dog } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';

interface CertificateCardProps {
  id: string;
  title: string;
  issuedAt: string;
  downloadUrl: string;
  type: 'course' | 'achievement' | 'trainer';
  dogName?: string;
}

const CertificateCard: React.FC<CertificateCardProps> = ({
  id,
  title,
  issuedAt,
  downloadUrl,
  type,
  dogName
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'course':
        return <Dog size={24} className="text-purple-400" />;
      case 'achievement':
        return <Award size={24} className="text-yellow-400" />;
      case 'trainer':
        return <Award size={24} className="text-blue-400" />;
      default:
        return <Award size={24} className="text-purple-400" />;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'course':
        return 'bg-purple-500/20 text-purple-400';
      case 'achievement':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'trainer':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-purple-500/20 text-purple-400';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'course':
        return 'Kursabschluss';
      case 'achievement':
        return 'Errungenschaft';
      case 'trainer':
        return 'Trainer-Zertifikat';
      default:
        return 'Zertifikat';
    }
  };

  const handleDownload = () => {
    window.open(
      `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/certificates/${downloadUrl}`,
      '_blank'
    );
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
          {getTypeIcon()}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor()}`}>
          {getTypeLabel()}
        </span>
      </div>
      
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-400">
          <Calendar size={16} className="mr-2" />
          <span>Ausgestellt am {format(new Date(issuedAt), 'dd. MMMM yyyy', { locale: de })}</span>
        </div>
        {dogName && (
          <div className="flex items-center text-sm text-gray-400">
            <Dog size={16} className="mr-2" />
            <span>Mit {dogName}</span>
          </div>
        )}
      </div>
      
      <button
        onClick={handleDownload}
        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center justify-center"
      >
        <Download size={18} className="mr-2" />
        Zertifikat anzeigen
      </button>
    </div>
  );
};

export default CertificateCard;