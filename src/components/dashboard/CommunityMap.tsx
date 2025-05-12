import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { supabase } from '../../lib/supabase';
import { Users, Search, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  latitude: number;
  longitude: number;
  role: string;
  show_on_map: boolean;
  dogs: {
    id: string;
    name: string;
    breed: string;
    image_url: string | null;
  }[];
}

const CommunityMap = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, trainers, users

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          dogs (
            id,
            name,
            breed,
            image_url
          )
        `)
        .eq('show_on_map', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (profile.full_name && profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      profile.dogs.some(dog => dog.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = 
      filter === 'all' ||
      (filter === 'trainers' && profile.role === 'trainer') ||
      (filter === 'users' && profile.role === 'user');

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
    <div className="h-[calc(100vh-6rem)]">
      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="text-purple-400" />
            <h2 className="text-xl font-semibold">Community-Karte</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Suche nach Namen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Alle anzeigen</option>
              <option value="trainers">Nur Trainer</option>
              <option value="users">Nur Hundebesitzer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-full rounded-2xl overflow-hidden">
        <MapContainer
          center={[51.1657, 10.4515]} // Germany center
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {filteredProfiles.map((profile) => (
            <Marker
              key={profile.id}
              position={[profile.latitude, profile.longitude]}
            >
              <Popup>
                <div className="p-2">
                  <div className="flex items-center gap-3 mb-2">
                    {profile.avatar_url ? (
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`}
                        alt={profile.username}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                        <Users size={20} className="text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{profile.username}</h3>
                      <span className="text-sm text-gray-400 capitalize">{profile.role}</span>
                    </div>
                  </div>

                  {profile.dogs.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Hunde:</h4>
                      <div className="space-y-2">
                        {profile.dogs.map(dog => (
                          <div key={dog.id} className="flex items-center gap-2">
                            {dog.image_url ? (
                              <img
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/dogs/${dog.image_url}`}
                                alt={dog.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <span className="text-sm font-medium">{dog.name[0]}</span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium">{dog.name}</p>
                              <p className="text-xs text-gray-400">{dog.breed}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/profile/${profile.id}`}
                    className="block w-full bg-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-500 transition-colors text-center"
                  >
                    Profil ansehen
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default CommunityMap;