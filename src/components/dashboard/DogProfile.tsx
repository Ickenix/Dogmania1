import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Camera, Plus, Edit2, Trash2, Calendar, Weight, User, X } from 'lucide-react';
import DogDiary from './DogDiary';
import MediaGallery from '../media/MediaGallery';
import TrainingPlan from '../training/TrainingPlan';
import DogDiaryAnalytics from './DogDiaryAnalytics';
import DogHealth from './DogHealth';
import DogPersonalityProfile from './DogPersonalityProfile';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateAge } from '../../lib/utils';

interface Dog {
  id: string;
  name: string;
  breed: string;
  birth_date: string;
  gender: string;
  weight: number;
  bio: string;
  image_url: string;
  training_level: string;
}

const DogProfile = () => {
  const { session } = useAuth();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'diary' | 'health' | 'training' | 'media' | 'analytics' | 'personality'>('profile');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [bio, setBio] = useState('');
  const [trainingLevel, setTrainingLevel] = useState('beginner');

  useEffect(() => {
    fetchDogs();
  }, [session]);

  useEffect(() => {
    if (selectedDog) {
      setName(selectedDog.name);
      setBreed(selectedDog.breed || '');
      setBirthDate(selectedDog.birth_date || '');
      setGender(selectedDog.gender || '');
      setWeight(selectedDog.weight ? selectedDog.weight.toString() : '');
      setBio(selectedDog.bio || '');
      setTrainingLevel(selectedDog.training_level || 'beginner');
    } else {
      resetForm();
    }
  }, [selectedDog]);

  async function fetchDogs() {
    try {
      if (!session?.user) throw new Error('No user');

      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setDogs(data || []);
      if (data && data.length > 0 && !selectedDog) {
        setSelectedDog(data[0]);
      }
    } catch (error) {
      console.error('Error fetching dogs:', error);
      setMessage({ type: 'error', text: 'Failed to load dogs.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDogSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const dogData = {
        owner_id: session?.user.id,
        name,
        breed,
        birth_date: birthDate,
        gender,
        weight: parseFloat(weight) || null,
        bio,
        training_level: trainingLevel
      };

      if (editMode && selectedDog) {
        // Update existing dog
        const { data, error } = await supabase
          .from('dogs')
          .update(dogData)
          .eq('id', selectedDog.id)
          .select()
          .single();

        if (error) throw error;
        
        setSelectedDog(data);
        setMessage({ type: 'success', text: 'Dog profile updated successfully!' });
        setEditMode(false);
      } else {
        // Create new dog
        const { data, error } = await supabase
          .from('dogs')
          .insert([dogData])
          .select()
          .single();

        if (error) throw error;

        setDogs([...dogs, data]);
        setSelectedDog(data);
        setMessage({ type: 'success', text: 'Dog profile created successfully!' });
      }
      
      setShowForm(false);
    } catch (error) {
      console.error('Error saving dog profile:', error);
      setMessage({ type: 'error', text: 'Failed to save dog profile.' });
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>, dogId: string) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Please select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${dogId}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('dogs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('dogs')
        .update({ image_url: filePath })
        .eq('id', dogId);

      if (updateError) throw updateError;

      fetchDogs();
      setMessage({ type: 'success', text: 'Image uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: 'Failed to upload image.' });
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDog(dogId: string) {
    if (!confirm('Are you sure you want to delete this dog profile? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('dogs')
        .delete()
        .eq('id', dogId);
        
      if (error) throw error;
      
      setDogs(dogs.filter(dog => dog.id !== dogId));
      if (selectedDog?.id === dogId) {
        setSelectedDog(dogs.length > 1 ? dogs.find(dog => dog.id !== dogId) || null : null);
      }
      
      setMessage({ type: 'success', text: 'Dog profile deleted successfully!' });
    } catch (error) {
      console.error('Error deleting dog profile:', error);
      setMessage({ type: 'error', text: 'Failed to delete dog profile.' });
    }
  }

  function resetForm() {
    setName('');
    setBreed('');
    setBirthDate('');
    setGender('');
    setWeight('');
    setBio('');
    setTrainingLevel('beginner');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {message.text}
        </div>
      )}

      {/* Dog List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dogs.map(dog => (
          <div
            key={dog.id}
            className={`bg-white/5 backdrop-blur-lg rounded-2xl p-6 cursor-pointer transition-all hover:bg-white/10 ${
              selectedDog?.id === dog.id ? 'ring-2 ring-purple-500' : ''
            }`}
            onClick={() => {
              setSelectedDog(dog);
              setEditMode(false);
              setActiveTab('profile');
            }}
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden">
                  {dog.image_url ? (
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/dogs/${dog.image_url}`}
                      alt={dog.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera size={24} className="text-purple-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-purple-600 p-1.5 rounded-full cursor-pointer hover:bg-purple-500 transition-colors">
                  <Camera size={12} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, dog.id)}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{dog.name}</h3>
                <p className="text-gray-400 text-sm">{dog.breed}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4 mt-4">
              <div className="flex items-center text-sm">
                <User size={16} className="mr-2 text-purple-400" />
                <span>{dog.gender === 'male' ? 'Male' : dog.gender === 'female' ? 'Female' : 'Unknown'}</span>
              </div>
              {dog.birth_date && (
                <div className="flex items-center text-sm">
                  <Calendar size={16} className="mr-2 text-purple-400" />
                  <span>Age: {calculateAge(dog.birth_date)}</span>
                </div>
              )}
              {dog.weight && (
                <div className="flex items-center text-sm">
                  <Weight size={16} className="mr-2 text-purple-400" />
                  <span>Weight: {dog.weight} kg</span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDog(dog);
                  setActiveTab('diary');
                }}
                className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                title="View diary"
              >
                <Calendar size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDog(dog);
                  setEditMode(true);
                  setActiveTab('profile');
                }}
                className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                title="Edit profile"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteDog(dog.id);
                }}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Delete dog"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {/* Add New Dog Button */}
        <button
          onClick={() => {
            setSelectedDog(null);
            setEditMode(false);
            setShowForm(true);
            resetForm();
          }}
          className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 flex items-center justify-center hover:bg-white/10 transition-all border-2 border-dashed border-white/20 hover:border-purple-500/50"
        >
          <Plus size={24} className="mr-2" />
          <span>Add New Dog</span>
        </button>
      </div>

      {/* Dog Form or Details */}
      <AnimatePresence>
        {showForm && !selectedDog && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add New Dog</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleDogSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Breed</label>
                <input
                  type="text"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Birth Date</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Gender</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                      gender === 'male' ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                      gender === 'female' ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Training Level</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setTrainingLevel('beginner')}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                      trainingLevel === 'beginner' ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Beginner
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrainingLevel('intermediate')}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                      trainingLevel === 'intermediate' ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Intermediate
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrainingLevel('advanced')}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                      trainingLevel === 'advanced' ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Advanced
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">About the Dog</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={4}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300"
              >
                Add Dog
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedDog && (
        <div className="space-y-8">
          {/* Tabs */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'profile' ? 'bg-purple-600' : 'hover:bg-white/10'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('diary')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'diary' ? 'bg-purple-600' : 'hover:bg-white/10'
                }`}
              >
                Diary
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'media' ? 'bg-purple-600' : 'hover:bg-white/10'
                }`}
              >
                Media
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'training' ? 'bg-purple-600' : 'hover:bg-white/10'
                }`}
              >
                Training
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'health' ? 'bg-purple-600' : 'hover:bg-white/10'
                }`}
              >
                Health
              </button>
              <button
                onClick={() => setActiveTab('personality')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'personality' ? 'bg-purple-600' : 'hover:bg-white/10'
                }`}
              >
                Personality
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'analytics' ? 'bg-purple-600' : 'hover:bg-white/10'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {editMode ? (
                  <form onSubmit={handleDogSubmit} className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold">Edit {selectedDog.name}'s Profile</h2>
                      <button 
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Breed</label>
                      <input
                        type="text"
                        value={breed}
                        onChange={(e) => setBreed(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Birth Date</label>
                        <input
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Gender</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setGender('male')}
                          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                            gender === 'male' ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          Male
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender('female')}
                          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                            gender === 'female' ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          Female
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Training Level</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setTrainingLevel('beginner')}
                          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                            trainingLevel === 'beginner' ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          Beginner
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrainingLevel('intermediate')}
                          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                            trainingLevel === 'intermediate' ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          Intermediate
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrainingLevel('advanced')}
                          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                            trainingLevel === 'advanced' ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          Advanced
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">About the Dog</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden">
                          {selectedDog.image_url ? (
                            <img
                              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/dogs/${selectedDog.image_url}`}
                              alt={selectedDog.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera size={40} className="text-purple-400" />
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-500 transition-colors">
                          <Camera size={16} className="text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, selectedDog.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold">{selectedDog.name}</h2>
                        <p className="text-gray-400">{selectedDog.breed}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Age</h3>
                          <p>{selectedDog.birth_date ? calculateAge(selectedDog.birth_date) : 'Unknown'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Gender</h3>
                          <p>{selectedDog.gender === 'male' ? 'Male' : selectedDog.gender === 'female' ? 'Female' : 'Unknown'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Weight</h3>
                          <p>{selectedDog.weight ? `${selectedDog.weight} kg` : 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Training Level</h3>
                          <p>
                            {selectedDog.training_level === 'beginner' ? 'Beginner' : 
                             selectedDog.training_level === 'intermediate' ? 'Intermediate' : 
                             selectedDog.training_level === 'advanced' ? 'Advanced' : 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">About {selectedDog.name}</h3>
                          <p className="text-gray-300">{selectedDog.bio || 'No information available'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => setEditMode(true)}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'diary' && (
              <DogDiary dogId={selectedDog.id} dogName={selectedDog.name} />
            )}

            {activeTab === 'media' && (
              <MediaGallery dogId={selectedDog.id} />
            )}

            {activeTab === 'training' && (
              <TrainingPlan dogId={selectedDog.id} />
            )}

            {activeTab === 'analytics' && (
              <DogDiaryAnalytics dogId={selectedDog.id} dogName={selectedDog.name} />
            )}

            {activeTab === 'personality' && (
              <DogPersonalityProfile dogId={selectedDog.id} dogName={selectedDog.name} />
            )}

            {activeTab === 'health' && (
              <DogHealth dogId={selectedDog.id} dogName={selectedDog.name} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DogProfile;