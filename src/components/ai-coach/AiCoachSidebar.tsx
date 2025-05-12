import React from 'react';
import { Trash2, Download, Save, Dog, Settings, Info } from 'lucide-react';

interface UserDog {
  id: string;
  name: string;
  breed: string;
  age: number;
  training_level: string;
}

interface AiCoachSidebarProps {
  userDogs: UserDog[];
  selectedDogId: string | null;
  onSelectDog: (dogId: string) => void;
  onClearChat: () => void;
  onExport: () => void;
  onSaveToDiary: () => void;
}

const AiCoachSidebar: React.FC<AiCoachSidebarProps> = ({
  userDogs,
  selectedDogId,
  onSelectDog,
  onClearChat,
  onExport,
  onSaveToDiary
}) => {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Dog size={20} className="mr-2 text-purple-400" />
          Dein Hund
        </h3>
        
        {userDogs.length === 0 ? (
          <div className="text-gray-400 text-sm">
            Kein Hund gefunden. Füge einen Hund in deinem Profil hinzu.
          </div>
        ) : (
          <div className="space-y-2">
            {userDogs.map(dog => (
              <button
                key={dog.id}
                onClick={() => onSelectDog(dog.id)}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  selectedDogId === dog.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <div className="flex-1 text-left">
                  <div className="font-medium">{dog.name}</div>
                  <div className="text-xs text-gray-400">{dog.breed}, {dog.age} Jahre</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 pt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings size={20} className="mr-2 text-purple-400" />
          Aktionen
        </h3>
        
        <div className="space-y-2">
          <button
            onClick={onExport}
            className="w-full flex items-center p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Download size={18} className="mr-3 text-purple-400" />
            <span>Als PDF exportieren</span>
          </button>
          
          <button
            onClick={onSaveToDiary}
            className="w-full flex items-center p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            disabled={!selectedDogId}
          >
            <Save size={18} className="mr-3 text-purple-400" />
            <span>Im Tagebuch speichern</span>
          </button>
          
          <button
            onClick={onClearChat}
            className="w-full flex items-center p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Trash2 size={18} className="mr-3 text-red-400" />
            <span>Chat löschen</span>
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Info size={20} className="mr-2 text-purple-400" />
          Tipps
        </h3>
        
        <div className="bg-white/5 rounded-lg p-4 text-sm">
          <p className="mb-2">Du kannst Fragen stellen zu:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-300">
            <li>Hundetraining & Erziehung</li>
            <li>Verhaltensproblemen</li>
            <li>Ernährung & Gesundheit</li>
            <li>Rassespezifischen Eigenschaften</li>
            <li>Welpenentwicklung</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AiCoachSidebar;