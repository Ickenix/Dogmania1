import React, { useState } from 'react';
import { Target, Check } from 'lucide-react';

interface OnboardingGoalsProps {
  onNext: (data: any) => void;
  initialData?: any;
}

const OnboardingGoals: React.FC<OnboardingGoalsProps> = ({ onNext, initialData = {} }) => {
  const [formData, setFormData] = useState({
    interests: initialData.interests || [],
    training_goals: initialData.training_goals || [],
    experience_level: initialData.experience_level || 'beginner',
    preferred_training_type: initialData.preferred_training_type || []
  });

  const interests = [
    'Training', 'Ernährung', 'Gesundheit', 'Verhalten', 'Spiel & Spaß', 
    'Hundesport', 'Reisen mit Hund', 'Hundepflege'
  ];
  
  const goals = [
    'Grundgehorsam', 'Leinenführigkeit', 'Rückruf', 'Tricks', 'Agility',
    'Entspannung', 'Sozialverhalten', 'Problemverhalten lösen'
  ];
  
  const trainingTypes = [
    'Positive Verstärkung', 'Klicker-Training', 'Gruppentraining', 'Einzeltraining',
    'Online-Kurse', 'Bücher & Videos', 'Hundesportverein'
  ];

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const handleSubmit = () => {
    onNext(formData);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Deine Ziele & Interessen</h2>
      
      <div>
        <label className="block text-lg font-medium mb-4">Was interessiert dich besonders?</label>
        <div className="flex flex-wrap gap-3">
          {interests.map(interest => (
            <button
              key={interest}
              type="button"
              onClick={() => setFormData({
                ...formData,
                interests: toggleArrayItem(formData.interests, interest)
              })}
              className={`py-2 px-4 rounded-lg transition-colors ${
                formData.interests.includes(interest)
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-lg font-medium mb-4">Welche Trainingsziele hast du?</label>
        <div className="flex flex-wrap gap-3">
          {goals.map(goal => (
            <button
              key={goal}
              type="button"
              onClick={() => setFormData({
                ...formData,
                training_goals: toggleArrayItem(formData.training_goals, goal)
              })}
              className={`py-2 px-4 rounded-lg transition-colors ${
                formData.training_goals.includes(goal)
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-lg font-medium mb-4">Wie würdest du dein Erfahrungslevel einschätzen?</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['beginner', 'intermediate', 'advanced'].map(level => (
            <button
              key={level}
              type="button"
              onClick={() => setFormData({
                ...formData,
                experience_level: level
              })}
              className={`p-4 rounded-lg transition-colors ${
                formData.experience_level === level
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <div className="flex flex-col items-center">
                <Target size={32} className="mb-2" />
                <span className="font-medium">
                  {level === 'beginner' ? 'Anfänger' : 
                   level === 'intermediate' ? 'Fortgeschritten' : 'Profi'}
                </span>
                <p className="text-sm mt-1 text-center">
                  {level === 'beginner' 
                    ? 'Ich bin neu in der Hundeerziehung' 
                    : level === 'intermediate' 
                      ? 'Ich habe schon einige Erfahrung' 
                      : 'Ich bin sehr erfahren'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-lg font-medium mb-4">Welche Trainingsmethoden bevorzugst du?</label>
        <div className="flex flex-wrap gap-3">
          {trainingTypes.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({
                ...formData,
                preferred_training_type: toggleArrayItem(formData.preferred_training_type, type)
              })}
              className={`py-2 px-4 rounded-lg transition-colors flex items-center ${
                formData.preferred_training_type.includes(type)
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {formData.preferred_training_type.includes(type) && (
                <Check size={16} className="mr-2" />
              )}
              {type}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
        >
          Weiter
        </button>
      </div>
    </div>
  );
};

export default OnboardingGoals;