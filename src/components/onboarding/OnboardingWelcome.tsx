import React from 'react';
import { Dog, ArrowRight } from 'lucide-react';

interface OnboardingWelcomeProps {
  onNext: () => void;
}

const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({ onNext }) => {
  return (
    <div className="text-center">
      <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-8">
        <Dog size={48} className="text-purple-400" />
      </div>
      
      <h2 className="text-3xl font-bold mb-6">Willkommen bei Dogmania</h2>
      
      <p className="text-xl text-gray-300 mb-8 max-w-lg mx-auto">
        Deine neue Community für alles rund um deinen Hund. Wir helfen dir, das Beste aus eurem Zusammenleben zu machen.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl">
          <h3 className="font-semibold text-lg mb-2">Lerne & Trainiere</h3>
          <p className="text-gray-400">Zugang zu Expertenwissen und Trainingskursen für jedes Level</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl">
          <h3 className="font-semibold text-lg mb-2">Vernetze dich</h3>
          <p className="text-gray-400">Finde Gleichgesinnte und teile deine Erfahrungen</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl">
          <h3 className="font-semibold text-lg mb-2">Dokumentiere</h3>
          <p className="text-gray-400">Halte Fortschritte fest und feiere gemeinsame Erfolge</p>
        </div>
      </div>
      
      <button
        onClick={onNext}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 flex items-center mx-auto"
      >
        Los geht's
        <ArrowRight className="ml-2" size={20} />
      </button>
    </div>
  );
};

export default OnboardingWelcome;