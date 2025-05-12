import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Dog, Trash2, Edit2, Eye, Calendar, Weight, User, X } from 'lucide-react';

interface DogProfile {
  id: string;
  name: string;
  breed: string;
  birth_date: string;
  gender: string;
  weight: number;
  bio: string;
  image_url: string;
  training_level: string;
  owner: {
    username: string;
    full_name: string;
    email: string;
  };
}

const DogManagement = () => {
  const [dogs, setDogs] = useState<DogProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, male, female
  const [selectedDog, setSelectedDog] = useState<DogProfile | null>(null);
  const [showDogDetails, setShowDogDetails] = useState(false);

  useEffect(() => {
    fetchDogs();
  }, []);

  async function fetchDogs() {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          owner:profiles!dogs_owner_id_fkey(username, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDogs(data || []);
    } catch (error) {
      console.error('Error fetching dogs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteDog(dogId: string) {
    if (!confirm('Bist du sicher, dass du diesen Hund löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('dogs')
        .delete()
        .eq('id', dogId);
        
      if (error) throw error;
      
      fetchDogs();
      if (selectedDog?.id === dogId) {
        setSelectedDog(null);
        setShowDogDetails(false);
      }
    } catch (error) {
      console.error('Error deleting dog:', error);
    }
  }

  function viewDogDetails(dog: DogProfile) {
    setSelectedDog(dog);
    setShowDogDetails(true);
  }

  function calculateAge(birthDate: string): string {
    if (!birthDate) return 'Unbekannt';
    
    const birth = new Date(birthDate);
    const now = new Date();
    
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    
    if (years === 0) {
      return `${months} Monate`;
    } else if (years === 1 && months === 0) {
      return `1 Jahr`;
    } else if (months === 0) {
      return `${years} Jahre`;
    } else {
      return `${years} Jahre, ${months} Monate`;
    }
  }

  const filteredDogs = dogs.filter(dog => {
    const matchesSearch = 
      dog.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      dog.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dog.owner.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'male' && dog.gender === 'male') ||
      (filter === 'female' && dog.gender === 'female');
      
    return matchesSearch && matchesFilter;
  });

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
        <h2 className="text-2xl font-bold">Hundeverwaltung</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Suche nach Hunden..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Alle Hunde</option>
            <option value="male">Rüden</option>
            <option value="female">Hündinnen</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDogs.map((dog) => (
          <div
            key={dog.id}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/10 transition-all"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden">
                {dog.image_url ? (
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/dogs/${dog.image_url}`}
                    alt={dog.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Dog size={32} className="text-purple-400" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{dog.name}</h3>
                <p className="text-gray-400">{dog.breed}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <User size={16} className="mr-2 text-purple-400" />
                <span>Besitzer: {dog.owner.username || dog.owner.full_name || 'Unbekannt'}</span>
              </div>
              {dog.birth_date && (
                <div className="flex items-center text-sm">
                  <Calendar size={16} className="mr-2 text-purple-400" />
                  <span>Alter: {calculateAge(dog.birth_date)}</span>
                </div>
              )}
              {dog.weight && (
                <div className="flex items-center text-sm">
                  <Weight size={16} className="mr-2 text-purple-400" />
                  <span>Gewicht: {dog.weight} kg</span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => viewDogDetails(dog)}
                className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                title="Details anzeigen"
              >
                <Eye size={18} />
              </button>
              <button
                onClick={() => deleteDog(dog.id)}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Löschen"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dog Details Modal */}
      {showDogDetails && selectedDog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">Hundedetails</h2>
              <button
                onClick={() => setShowDogDetails(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mr-6 overflow-hidden">
                  {selectedDog.image_url ? (
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/dogs/${selectedDog.image_url}`}
                      alt={selectedDog.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Dog size={40} className="text-purple-300" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedDog.name}</h3>
                  <p className="text-gray-400">{selectedDog.breed}</p>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedDog.gender === 'male' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-pink-500/20 text-pink-400'
                    }`}>
                      {selectedDog.gender === 'male' ? 'Rüde' : 'Hündin'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Besitzer</h4>
                    <p className="font-medium">{selectedDog.owner.username || selectedDog.owner.full_name}</p>
                    <p className="text-sm text-gray-400">{selectedDog.owner.email}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Alter</h4>
                    <p>{selectedDog.birth_date ? calculateAge(selectedDog.birth_date) : 'Unbekannt'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Gewicht</h4>
                    <p>{selectedDog.weight ? `${selectedDog.weight} kg` : 'Unbekannt'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Trainingslevel</h4>
                    <p>
                      {selectedDog.training_level === 'beginner' ? 'Anfänger' : 
                       selectedDog.training_level === 'intermediate' ? 'Fortgeschritten' : 
                       selectedDog.training_level === 'advanced' ? 'Profi' : 'Unbekannt'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Über {selectedDog.name}</h4>
                    <p className="text-gray-300">{selectedDog.bio || 'Keine Informationen vorhanden'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDogDetails(false)}
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Schließen
                </button>
                <button
                  onClick={() => deleteDog(selectedDog.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"
                >
                  Hund löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DogManagement;