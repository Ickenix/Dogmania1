import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Award, Trophy, FileText, CheckCircle } from 'lucide-react';
import CertificateDisplay from './CertificateDisplay';
import UserAchievements from './UserAchievements';
import CertificateVerification from './CertificateVerification';
import CertificationModule from './CertificationModule';

const CertificatesPage = () => {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'certificates' | 'achievements' | 'verify' | 'certifications'>('certifications');

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <Award size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">Anmeldung erforderlich</h2>
          <p className="text-gray-400 mb-6">
            Bitte melde dich an, um deine Zertifikate und Errungenschaften zu sehen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Zertifikate & Errungenschaften</h1>
          <p className="text-gray-400">
            Verwalte deine Zertifikate und zeige deine Errungenschaften
          </p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('certifications')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'certifications'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Award size={18} className="inline-block mr-2" />
            Zertifizierungen
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'certificates'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText size={18} className="inline-block mr-2" />
            Kursabschlüsse
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'achievements'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy size={18} className="inline-block mr-2" />
            Errungenschaften
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'verify'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CheckCircle size={18} className="inline-block mr-2" />
            Verifizieren
          </button>
        </div>
      </div>

      {activeTab === 'certifications' && (
        <CertificationModule />
      )}

      {activeTab === 'certificates' && (
        <div className="space-y-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Meine Kursabschlüsse</h2>
            <CertificateDisplay showFilters={true} />
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <FileText size={24} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Zertifiziert von Dogmania</h2>
                <p className="text-gray-400">Teile deine Zertifikate mit anderen</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6">
              Alle Zertifikate von Dogmania sind mit einer einzigartigen ID versehen und können jederzeit verifiziert werden. 
              Teile deine Zertifikate in sozialen Medien oder füge sie deinem Lebenslauf hinzu, um deine Qualifikationen nachzuweisen.
            </p>
            
            <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle size={20} className="text-green-400 mr-3" />
                <span>Deine Zertifikate sind digital signiert und fälschungssicher</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
            <UserAchievements showHeader={true} />
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Trophy size={24} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Wie du Errungenschaften freischaltest</h2>
                <p className="text-gray-400">Sammle Abzeichen und zeige deine Fortschritte</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Kursabschlüsse</h3>
                <p className="text-gray-400 text-sm">Schließe Kurse ab, um Kurs-Abzeichen zu erhalten. Je mehr Kurse du in einer Kategorie abschließt, desto höher wird dein Abzeichen-Level.</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Community-Beiträge</h3>
                <p className="text-gray-400 text-sm">Sei aktiv in der Community, erstelle hilfreiche Beiträge und erhalte Likes von anderen Nutzern, um Community-Abzeichen freizuschalten.</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Aktivitäts-Streaks</h3>
                <p className="text-gray-400 text-sm">Logge dich regelmäßig ein und nutze die App, um Streak-Abzeichen zu sammeln. 7, 30, 90 und 365 Tage in Folge schalten besondere Abzeichen frei.</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Trainer-Qualifikationen</h3>
                <p className="text-gray-400 text-sm">Trainer können spezielle Abzeichen erhalten, indem sie ihre Qualifikationen nachweisen und positive Bewertungen sammeln.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'verify' && (
        <CertificateVerification />
      )}
    </div>
  );
};

export default CertificatesPage;