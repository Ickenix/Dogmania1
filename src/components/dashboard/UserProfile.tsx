import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Camera, Award, Trophy } from 'lucide-react';
import CertificateDisplay from '../certificates/CertificateDisplay';
import UserAchievements from '../certificates/UserAchievements';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  location: string;
}

const UserProfile = () => {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState<'profile' | 'certificates' | 'achievements'>('profile');

  useEffect(() => {
    getProfile();
  }, [session]);

  async function getProfile() {
    try {
      if (!session?.user) throw new Error('No user');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setLocation(data.location || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      if (!session?.user) throw new Error('No user');

      const updates = {
        id: session.user.id,
        full_name: fullName,
        location: location,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Error updating profile.' });
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${session?.user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: session?.user.id,
          avatar_url: filePath,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;
      
      getProfile();
      setMessage({ type: 'success', text: 'Avatar updated successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: 'Error uploading avatar.' });
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        <div className="flex border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'profile'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Profil
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'certificates'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Award size={18} className="inline-block mr-2" />
            Zertifikate
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
        </div>

        {activeTab === 'profile' && (
          <>
            <h2 className="text-2xl font-bold mb-6">Mein Profil</h2>

            {message.text && (
              <div className={`p-4 rounded-lg mb-6 ${
                message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera size={32} className="text-purple-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-500 transition-colors">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={uploadAvatar}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{fullName || profile?.username || 'Set your name'}</h3>
                  <p className="text-gray-400">{session?.user.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Wohnort</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={updateProfile}
                disabled={uploading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300"
              >
                {uploading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </>
        )}

        {activeTab === 'certificates' && (
          <>
            <h2 className="text-2xl font-bold mb-6">Meine Zertifikate</h2>
            <CertificateDisplay />
          </>
        )}

        {activeTab === 'achievements' && (
          <>
            <h2 className="text-2xl font-bold mb-6">Meine Errungenschaften</h2>
            <UserAchievements />
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;