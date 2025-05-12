import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface OnboardingCompleteProps {
  onFinish: () => void;
  username: string;
}

const OnboardingComplete: React.FC<OnboardingCompleteProps> = ({ onFinish, username }) => {
  return (
    <div className="text-center">
      <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-8">
        <CheckCircle size={48} className="text-green-400" />
      </div>
      
      <h2 className="text-3xl font-bold mb-6">Alles bereit, {username}!</h2>
      
      <p className="text-xl text-gray-300 mb-8 max-w-lg mx-auto">
        Dein Profil ist eingerichtet und du kannst jetzt alle Funktionen von Dogmania nutzen.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl">
          <h3 className="font-semibold text-lg mb-2">Entdecke Kurse</h3>
          <p className="text-gray-400">Starte mit deinem ersten Trainingskurs</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl">
          <h3 className="font-semibold text-lg mb-2">Finde Hundefreunde</h3>
          <p className="text-gray-400">Vernetze dich mit anderen Hundebesitzern in deiner Nähe</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl">
          <h3 className="font-semibold text-lg mb-2">Führe Tagebuch</h3>
          <p className="text-gray-400">Dokumentiere Fortschritte und besondere Momente</p>
        </div>
      </div>
      
      <button
        onClick={onFinish}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 flex items-center mx-auto"
      >
        Zum Dashboard
        <ArrowRight className="ml-2" size={20} />
      </button>
    </div>
  );
};

export default OnboardingComplete;