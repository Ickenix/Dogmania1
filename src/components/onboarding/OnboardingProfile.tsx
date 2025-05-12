import React, { useState } from 'react';
import { MapPin, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface OnboardingProfileProps {
  onNext: (data: any) => void;
  initialData?: any;
}

const OnboardingProfile: React.FC<OnboardingProfileProps> = ({ onNext, initialData = {} }) => {
  const { session } = useAuth();
  const [formData, setFormData] = useState({
    username: initialData.username || '',
    full_name: initialData.full_name || '',
    location: initialData.location || '',
    bio: initialData.bio || '',
    show_on_map: initialData.show_on_map || false,
    latitude: initialData.latitude || null,
    longitude: initialData.longitude || null
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleLocationDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          show_on_map: true
        });
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Upload avatar if selected
      let avatarUrl = null;
      if (avatar && session) {
        const fileExt = avatar.name.split('.').pop();
        const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatar);
          
        if (uploadError) throw uploadError;
        avatarUrl = fileName;
      }
      
      // Prepare data for next step
      const profileData = {
        ...formData,
        avatar_url: avatarUrl
      };
      
      onNext(profileData);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Dein Profil</h2>
      
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden">
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt="Avatar preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera size={32} className="text-purple-400" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-500 transition-colors">
            <Camera size={16} className="text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm text-gray-400">Profilbild hinzufügen</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Benutzername*</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Vollständiger Name</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Standort</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Stadt, Land"
            />
            <button
              type="button"
              onClick={handleLocationDetect}
              className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
              title="Standort erkennen"
            >
              <MapPin size={20} />
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Über mich</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={3}
            placeholder="Erzähle etwas über dich und deine Erfahrungen mit Hunden..."
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="show_on_map"
            checked={formData.show_on_map}
            onChange={(e) => setFormData({ ...formData, show_on_map: e.target.checked })}
            className="h-4 w-4 text-purple-600 rounded border-white/20 bg-white/10 focus:ring-purple-500"
          />
          <label htmlFor="show_on_map" className="ml-2 text-sm text-gray-300">
            Meinen Standort auf der Community-Karte anzeigen
          </label>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!formData.username || loading}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Wird gespeichert...' : 'Weiter'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingProfile;