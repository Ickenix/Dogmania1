import React, { useState } from 'react';
import { Dog, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface OnboardingDogProps {
  onNext: (data: any) => void;
  initialData?: any;
}

const OnboardingDog: React.FC<OnboardingDogProps> = ({ onNext, initialData = {} }) => {
  const { session } = useAuth();
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    breed: initialData.breed || '',
    birth_date: initialData.birth_date || '',
    gender: initialData.gender || '',
    weight: initialData.weight || '',
    bio: initialData.bio || '',
    training_level: initialData.training_level || 'beginner'
  });
  const [dogImage, setDogImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDogImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Upload dog image if selected
      let imageUrl = null;
      if (dogImage && session) {
        const fileExt = dogImage.name.split('.').pop();
        const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('dogs')
          .upload(fileName, dogImage);
          
        if (uploadError) throw uploadError;
        imageUrl = fileName;
      }
      
      // Prepare data for next step
      const dogData = {
        ...formData,
        image_url: imageUrl,
        weight: formData.weight ? parseFloat(formData.weight) : null
      };
      
      onNext(dogData);
    } catch (error) {
      console.error('Error saving dog profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Dein Hund</h2>
      
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden">
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Dog preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Dog size={32} className="text-purple-400" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-500 transition-colors">
            <Camera size={16} className="text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm text-gray-400">Bild deines Hundes hinzufügen</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Name deines Hundes*</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Rasse</label>
          <input
            type="text"
            value={formData.breed}
            onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="z.B. Labrador, Mischling, etc."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Geburtsdatum</label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Gewicht (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Geschlecht</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, gender: 'male' })}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                formData.gender === 'male' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Rüde
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, gender: 'female' })}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                formData.gender === 'female' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Hündin
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Trainingslevel</label>
          <div className="flex gap-4">
            {['beginner', 'intermediate', 'advanced'].map(level => (
              <button
                key={level}
                type="button"
                onClick={() => setFormData({ ...formData, training_level: level })}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  formData.training_level === level
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
        
        <div>
          <label className="block text-sm font-medium mb-2">Über deinen Hund</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={3}
            placeholder="Erzähle etwas über deinen Hund, seine Persönlichkeit, Vorlieben..."
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!formData.name || loading}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Wird gespeichert...' : 'Weiter'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingDog;