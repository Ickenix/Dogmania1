import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Brain, Heart, Zap, Award, Save, AlertTriangle } from 'lucide-react';

interface DogPersonalityProfileProps {
  dogId: string;
  dogName: string;
}

interface Trait {
  id: string;
  name: string;
  description: string;
  score: number;
}

interface PersonalityProfile {
  id?: string;
  dog_id: string;
  traits: Record<string, number>;
  summary: string;
  created_at?: string;
  updated_at?: string;
}

const DogPersonalityProfile: React.FC<DogPersonalityProfileProps> = ({ dogId, dogName }) => {
  const { session } = useAuth();
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Personality traits
  const traits: Trait[] = [
    { id: 'energy', name: 'Energy Level', description: 'How active and energetic is your dog?', score: 3 },
    { id: 'sociability', name: 'Sociability', description: 'How well does your dog interact with other dogs and people?', score: 3 },
    { id: 'confidence', name: 'Confidence', description: 'How confident is your dog in new situations?', score: 3 },
    { id: 'independence', name: 'Independence', description: 'How independent is your dog?', score: 3 },
    { id: 'trainability', name: 'Trainability', description: 'How easily does your dog learn new commands?', score: 3 },
    { id: 'playfulness', name: 'Playfulness', description: 'How playful is your dog?', score: 3 },
    { id: 'protectiveness', name: 'Protectiveness', description: 'How protective is your dog of you and your home?', score: 3 },
    { id: 'adaptability', name: 'Adaptability', description: 'How well does your dog adapt to new environments?', score: 3 }
  ];

  useEffect(() => {
    if (session && dogId) {
      fetchProfile();
    }
  }, [session, dogId]);

  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from('dog_personality_profiles')
        .select('*')
        .eq('dog_id', dogId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // No profile found, initialize with default values
        const defaultTraits = traits.reduce((acc, trait) => {
          acc[trait.id] = trait.score;
          return acc;
        }, {} as Record<string, number>);

        const defaultProfile = {
          dog_id: dogId,
          traits: defaultTraits,
          summary: generateSummary(defaultTraits)
        };

        setProfile(defaultProfile);
      } else {
        setProfile(data);
        
        // Update trait scores from the profile
        traits.forEach(trait => {
          if (data.traits[trait.id] !== undefined) {
            trait.score = data.traits[trait.id];
          }
        });
      }
    } catch (error) {
      console.error('Error fetching personality profile:', error);
      setMessage({ type: 'error', text: 'Failed to load personality profile.' });
    } finally {
      setLoading(false);
    }
  }

  function handleTraitChange(traitId: string, value: number) {
    if (!profile) return;
    
    const updatedTraits = { ...profile.traits, [traitId]: value };
    setProfile({
      ...profile,
      traits: updatedTraits,
      summary: generateSummary(updatedTraits)
    });
  }

  function generateSummary(traitScores: Record<string, number>): string {
    // Generate a personality summary based on trait scores
    const highTraits = Object.entries(traitScores)
      .filter(([_, score]) => score >= 4)
      .map(([traitId, _]) => {
        const trait = traits.find(t => t.id === traitId);
        return trait ? trait.name.toLowerCase() : '';
      });
      
    const lowTraits = Object.entries(traitScores)
      .filter(([_, score]) => score <= 2)
      .map(([traitId, _]) => {
        const trait = traits.find(t => t.id === traitId);
        return trait ? trait.name.toLowerCase() : '';
      });
    
    let summary = `${dogName} is a dog with `;
    
    if (highTraits.length > 0) {
      summary += `high ${highTraits.join(', ')}`;
      if (lowTraits.length > 0) {
        summary += ' and ';
      }
    }
    
    if (lowTraits.length > 0) {
      summary += `low ${lowTraits.join(', ')}`;
    }
    
    if (highTraits.length === 0 && lowTraits.length === 0) {
      summary += 'a balanced personality across all traits';
    }
    
    summary += '. ';
    
    // Add specific trait-based insights
    if (traitScores.energy >= 4) {
      summary += `${dogName} is very energetic and will need plenty of exercise and stimulation. `;
    } else if (traitScores.energy <= 2) {
      summary += `${dogName} has a calm energy level and may prefer relaxed activities. `;
    }
    
    if (traitScores.sociability >= 4) {
      summary += `${dogName} is very social and enjoys the company of other dogs and people. `;
    } else if (traitScores.sociability <= 2) {
      summary += `${dogName} may be reserved around strangers and might need gradual socialization. `;
    }
    
    if (traitScores.trainability >= 4) {
      summary += `${dogName} is highly trainable and eager to learn new commands. `;
    } else if (traitScores.trainability <= 2) {
      summary += `${dogName} may require patience and consistency during training sessions. `;
    }
    
    return summary;
  }

  async function saveProfile() {
    if (!profile || !session) return;
    
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      if (profile.id) {
        // Update existing profile
        const { error } = await supabase
          .from('dog_personality_profiles')
          .update({
            traits: profile.traits,
            summary: profile.summary,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
          
        if (error) throw error;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('dog_personality_profiles')
          .insert({
            dog_id: dogId,
            traits: profile.traits,
            summary: profile.summary
          })
          .select()
          .single();
          
        if (error) throw error;
        
        setProfile(data);
      }
      
      setMessage({ type: 'success', text: 'Personality profile saved successfully!' });
    } catch (error) {
      console.error('Error saving personality profile:', error);
      setMessage({ type: 'error', text: 'Failed to save personality profile.' });
    } finally {
      setSaving(false);
    }
  }

  function getTraitIcon(traitId: string) {
    switch (traitId) {
      case 'energy':
        return <Zap className="text-yellow-400" />;
      case 'sociability':
        return <Heart className="text-red-400" />;
      case 'trainability':
        return <Brain className="text-purple-400" />;
      case 'protectiveness':
        return <Award className="text-blue-400" />;
      default:
        return <Brain className="text-purple-400" />;
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
        <h2 className="text-2xl font-bold">{dogName}'s Personality Profile</h2>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
          ) : (
            <Save size={18} className="mr-2" />
          )}
          Save Profile
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {message.text}
        </div>
      )}

      {/* Personality Summary */}
      {profile && (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Personality Summary</h3>
          <p className="text-gray-300">{profile.summary}</p>
        </div>
      )}

      {/* Trait Sliders */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-6">Personality Traits</h3>
        <div className="space-y-6">
          {traits.map((trait) => (
            <div key={trait.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3">
                    {getTraitIcon(trait.id)}
                  </div>
                  <div>
                    <h4 className="font-medium">{trait.name}</h4>
                    <p className="text-xs text-gray-400">{trait.description}</p>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {trait.score === 1 ? 'Very Low' :
                   trait.score === 2 ? 'Low' :
                   trait.score === 3 ? 'Medium' :
                   trait.score === 4 ? 'High' : 'Very High'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs">Low</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={profile?.traits[trait.id] || trait.score}
                  onChange={(e) => handleTraitChange(trait.id, parseInt(e.target.value))}
                  className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600"
                />
                <span className="text-xs">High</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Training Recommendations */}
      {profile && (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Training Recommendations</h3>
          <div className="space-y-4">
            {profile.traits.energy >= 4 && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium mb-2">High Energy Management</h4>
                <p className="text-gray-300">
                  {dogName} has high energy levels. Consider daily vigorous exercise like running, 
                  agility training, or fetch games. Mental stimulation through puzzle toys can also 
                  help channel this energy positively.
                </p>
              </div>
            )}
            
            {profile.traits.sociability <= 2 && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium mb-2">Socialization Strategy</h4>
                <p className="text-gray-300">
                  {dogName} shows some social reservation. Gradually introduce new people and dogs 
                  in controlled, positive environments. Use treats and praise to create positive associations 
                  with social interactions.
                </p>
              </div>
            )}
            
            {profile.traits.confidence <= 2 && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium mb-2">Confidence Building</h4>
                <p className="text-gray-300">
                  Work on building {dogName}'s confidence through positive reinforcement training. 
                  Start with easy tasks and gradually increase difficulty. Celebrate small successes 
                  to build confidence over time.
                </p>
              </div>
            )}
            
            {profile.traits.trainability >= 4 && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium mb-2">Advanced Training Potential</h4>
                <p className="text-gray-300">
                  {dogName} shows high trainability. Consider advanced obedience, trick training, 
                  or even specialized activities like scent work or agility. This will provide mental 
                  stimulation and strengthen your bond.
                </p>
              </div>
            )}
            
            {profile.traits.trainability <= 2 && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium mb-2">Training Approach</h4>
                <p className="text-gray-300">
                  {dogName} may need extra patience during training. Keep sessions short (5-10 minutes), 
                  use high-value treats, and be consistent with commands. Focus on one skill at a time 
                  before moving to the next.
                </p>
              </div>
            )}
            
            {Object.values(profile.traits).every(score => score === 3) && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium mb-2">Balanced Training Approach</h4>
                <p className="text-gray-300">
                  {dogName} shows a balanced personality profile. A well-rounded training approach 
                  with consistent rules, positive reinforcement, and regular exercise should work well. 
                  Adjust based on how {dogName} responds to different training methods.
                </p>
              </div>
            )}
            
            {profile.traits.protectiveness >= 4 && (
              <div className="bg-white/5 rounded-lg p-4 flex items-start">
                <AlertTriangle size={20} className="text-yellow-400 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-2">Protective Behavior Management</h4>
                  <p className="text-gray-300">
                    {dogName} shows strong protective instincts. While this can be valuable, it's important 
                    to establish clear boundaries. Focus on socialization and obedience training to ensure 
                    protective behaviors are appropriate and controlled.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DogPersonalityProfile;