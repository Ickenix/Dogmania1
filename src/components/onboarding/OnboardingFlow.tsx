import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Dog, MapPin, Target, Book, Star } from 'lucide-react';

const steps = [
  {
    id: 'welcome',
    title: 'Willkommen bei Dogmania',
    description: 'Deine Community für glückliche Hunde und zufriedene Halter',
    icon: Dog
  },
  {
    id: 'profile',
    title: 'Erzähl uns von dir',
    description: 'Erstelle dein persönliches Profil',
    icon: MapPin
  },
  {
    id: 'dog',
    title: 'Dein Hund',
    description: 'Füge deinen vierbeinigen Freund hinzu',
    icon: Dog
  },
  {
    id: 'goals',
    title: 'Deine Ziele',
    description: 'Was möchtest du erreichen?',
    icon: Target
  }
];

const OnboardingFlow = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    profile: {
      username: '',
      full_name: '',
      location: '',
      show_on_map: false,
      latitude: null as number | null,
      longitude: null as number | null
    },
    dog: {
      name: '',
      breed: '',
      birth_date: '',
      gender: '',
      training_level: 'beginner'
    },
    preferences: {
      interests: [] as string[],
      training_goals: [] as string[],
      experience_level: 'beginner',
      preferred_training_type: [] as string[]
    }
  });

  useEffect(() => {
    // Check if onboarding is already completed
    const checkOnboarding = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session?.user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return;
      }

      if (data?.onboarding_completed) {
        navigate('/dashboard');
      }
    };

    checkOnboarding();
  }, [session]);

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save all data
      try {
        // Update profile
        await supabase
          .from('profiles')
          .update({
            ...formData.profile,
            onboarding_completed: true
          })
          .eq('id', session?.user.id);

        // Create dog
        await supabase
          .from('dogs')
          .insert({
            ...formData.dog,
            owner_id: session?.user.id
          });

        // Save preferences using upsert to handle existing records
        await supabase
          .from('onboarding_preferences')
          .upsert({
            ...formData.preferences,
            user_id: session?.user.id
          }, {
            onConflict: 'user_id'
          });

        navigate('/dashboard');
      } catch (error) {
        console.error('Error saving onboarding data:', error);
      }
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center">
            <Dog className="w-24 h-24 mx-auto mb-8 text-purple-400" />
            <h2 className="text-3xl font-bold mb-4">Willkommen bei Dogmania</h2>
            <p className="text-xl text-gray-300 mb-8">
              Deine neue Community für alles rund um deinen Hund. Lass uns dein Profil einrichten!
            </p>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Benutzername</label>
              <input
                type="text"
                value={formData.profile.username}
                onChange={(e) => setFormData({
                  ...formData,
                  profile: { ...formData.profile, username: e.target.value }
                })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Vollständiger Name</label>
              <input
                type="text"
                value={formData.profile.full_name}
                onChange={(e) => setFormData({
                  ...formData,
                  profile: { ...formData.profile, full_name: e.target.value }
                })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Standort</label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={formData.profile.location}
                  onChange={(e) => setFormData({
                    ...formData,
                    profile: { ...formData.profile, location: e.target.value }
                  })}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Stadt, Land"
                />
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((position) => {
                        setFormData({
                          ...formData,
                          profile: {
                            ...formData.profile,
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            show_on_map: true
                          }
                        });
                      });
                    }
                  }}
                  type="button"
                  className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
                >
                  <MapPin size={20} />
                </button>
              </div>
            </div>
          </div>
        );

      case 'dog':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name deines Hundes</label>
              <input
                type="text"
                value={formData.dog.name}
                onChange={(e) => setFormData({
                  ...formData,
                  dog: { ...formData.dog, name: e.target.value }
                })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rasse</label>
              <input
                type="text"
                value={formData.dog.breed}
                onChange={(e) => setFormData({
                  ...formData,
                  dog: { ...formData.dog, breed: e.target.value }
                })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Geburtsdatum</label>
              <input
                type="date"
                value={formData.dog.birth_date}
                onChange={(e) => setFormData({
                  ...formData,
                  dog: { ...formData.dog, birth_date: e.target.value }
                })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Geschlecht</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    dog: { ...formData.dog, gender: 'male' }
                  })}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    formData.dog.gender === 'male' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  Rüde
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    dog: { ...formData.dog, gender: 'female' }
                  })}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    formData.dog.gender === 'female' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  Hündin
                </button>
              </div>
            </div>
          </div>
        );

      case 'goals':
        const interests = [
          'Training', 'Ernährung', 'Gesundheit', 'Verhalten', 'Spiel & Spaß'
        ];
        
        const goals = [
          'Grundgehorsam', 'Leinenführigkeit', 'Rückruf', 'Tricks', 'Agility'
        ];
        
        const trainingTypes = [
          'Positive Verstärkung', 'Klicker-Training', 'Gruppentraining', 'Einzeltraining'
        ];

        return (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium mb-4">Deine Interessen</label>
              <div className="flex flex-wrap gap-2">
                {interests.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => {
                      const newInterests = formData.preferences.interests.includes(interest)
                        ? formData.preferences.interests.filter(i => i !== interest)
                        : [...formData.preferences.interests, interest];
                      
                      setFormData({
                        ...formData,
                        preferences: { 
                          ...formData.preferences, 
                          interests: newInterests 
                        }
                      });
                    }}
                    className={`py-2 px-4 rounded-lg transition-colors ${
                      formData.preferences.interests.includes(interest)
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
              <label className="block text-sm font-medium mb-4">Deine Trainingsziele</label>
              <div className="flex flex-wrap gap-2">
                {goals.map(goal => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => {
                      const newGoals = formData.preferences.training_goals.includes(goal)
                        ? formData.preferences.training_goals.filter(g => g !== goal)
                        : [...formData.preferences.training_goals, goal];
                      
                      setFormData({
                        ...formData,
                        preferences: { 
                          ...formData.preferences, 
                          training_goals: newGoals 
                        }
                      });
                    }}
                    className={`py-2 px-4 rounded-lg transition-colors ${
                      formData.preferences.training_goals.includes(goal)
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
              <label className="block text-sm font-medium mb-4">Dein Erfahrungslevel</label>
              <div className="flex gap-4">
                {['beginner', 'intermediate', 'advanced'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      preferences: { 
                        ...formData.preferences, 
                        experience_level: level 
                      }
                    })}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                      formData.preferences.experience_level === level
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {level === 'beginner' ? 'Anfänger' : 
                     level === 'intermediate' ? 'Fortgeschritten' : 'Profi'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-purple-950 p-4">
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  index <= currentStep ? 'bg-purple-600' : 'bg-white/10'
                }`}
              >
                <step.icon size={16} />
              </div>
            ))}
          </div>
          <div className="h-2 bg-white/10 rounded-full">
            <div 
              className="h-full bg-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-6 py-3 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Zurück
          </button>
          <button
            onClick={handleNext}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300"
          >
            {currentStep === steps.length - 1 ? 'Abschließen' : 'Weiter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;