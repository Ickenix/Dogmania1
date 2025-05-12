import React from 'react';
import { Dog, User, Target, Award } from 'lucide-react';

interface OnboardingStepProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

export const OnboardingStep: React.FC<OnboardingStepProps> = ({
  title,
  description,
  icon,
  isActive,
  isCompleted,
  onClick
}) => {
  return (
    <div 
      className={`flex items-center p-4 rounded-lg cursor-pointer transition-all ${
        isActive 
          ? 'bg-purple-600 text-white' 
          : isCompleted 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-white/5 hover:bg-white/10'
      }`}
      onClick={onClick}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
        isActive 
          ? 'bg-white/20' 
          : isCompleted 
            ? 'bg-green-500/20' 
            : 'bg-purple-500/20'
      }`}>
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
          {description}
        </p>
      </div>
    </div>
  );
};

export const onboardingSteps = [
  {
    id: 'welcome',
    title: 'Willkommen',
    description: 'Entdecke Dogmania',
    icon: <Dog size={24} />
  },
  {
    id: 'profile',
    title: 'Dein Profil',
    description: 'Erzähl uns von dir',
    icon: <User size={24} />
  },
  {
    id: 'dog',
    title: 'Dein Hund',
    description: 'Füge deinen Vierbeiner hinzu',
    icon: <Dog size={24} />
  },
  {
    id: 'goals',
    title: 'Deine Ziele',
    description: 'Was möchtest du erreichen?',
    icon: <Target size={24} />
  },
  {
    id: 'subscription',
    title: 'Mitgliedschaft',
    description: 'Wähle dein Paket',
    icon: <Award size={24} />
  }
];