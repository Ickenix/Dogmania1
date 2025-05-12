import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Camera, MapPin, DollarSign, Save, Tag, Check } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icons in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface TrainerProfileProps {
  trainer: any;
  onUpdate: () => void;
}

// Location picker component
const LocationPicker = ({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return (
    <Marker position={position} draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          setPosition([position.lat, position.lng]);
        },
      }}
    >
      <Popup>Dein Standort</Popup>
    </Marker>
  );
};

const TrainerProfile: React.FC<TrainerProfileProps> = ({ trainer, onUpdate }) => {
  const { session } = useAuth();
  const [bio, setBio] = useState(trainer?.bio || '');
  const [location, setLocation] = useState(trainer?.location || '');
  const [hourlyRate, setHourlyRate] = useState(trainer?.hourly_rate?.toString() || '');
  const [specializations, setSpecializations] = useState<string[]>(trainer?.specialization || []);
  const [position, setPosition] = useState<[number, number]>([
    trainer?.latitude || 51.1657,
    trainer?.longitude || 10.4515
  ]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const specializationOptions = [
    'Grundgehorsam',
    'Leinenführigkeit',
    'Agility',
    'Clickertraining',
    'Welpenerziehung',
    'Problemverhalten',
    'Mantrailing',
    'Hundesport',
    'Therapiehundeausbildung'
  ];

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  }

  async function handleSave() {
    if (!session) return;
    
    try {
      setSaving(true);
      setSuccess(false);
      
      // Upload profile image if selected
      let avatarUrl = null;
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, profileImage);
          
        if (uploadError) throw uploadError;
        
        // Update user profile with new avatar
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ avatar_url: fileName })
          .eq('id', session.user.id);
          
        if (profileError) throw profileError;
      }
      
      // Update trainer profile
      const { error } = await supabase
        .from('trainers')
        .update({
          bio,
          location,
          specialization: specializations,
          hourly_rate: parseFloat(hourlyRate) || 0,
          latitude: position[0],
          longitude: position[1],
          updated_at: new Date().toISOString()
        })
        .eq('id', trainer.id);

      if (error) throw error;
      
      setSuccess(true);
      onUpdate();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating trainer profile:', error);
    } finally {
      setSaving(false);
    }
  }

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setPosition([position.coords.latitude, position.coords.longitude]);
      });
    }
  };

  const toggleSpecialization = (specialization: string) => {
    if (specializations.includes(specialization)) {
      setSpecializations(specializations.filter(s => s !== specialization));
    } else {
      setSpecializations([...specializations, specialization]);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Trainer-Profil</h2>
      
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center">
          <Check size={20} className="mr-2" />
          Dein Profil wurde erfolgreich aktualisiert.
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile preview" 
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
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-400">Profilbild ändern</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Stundensatz (€)</label>
                <div className="relative">
                  <DollarSign size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="z.B. 45"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Standort</label>
                <div className="relative">
                  <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="z.B. Berlin, Deutschland"
                  />
                </div>
              </div>
              
              <button
                onClick={handleDetectLocation}
                className="w-full bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-lg flex items-center justify-center"
              >
                <MapPin size={18} className="mr-2" />
                Standort erkennen
              </button>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Tag size={18} className="mr-2 text-purple-400" />
              Spezialisierungen
            </h3>
            <div className="flex flex-wrap gap-2">
              {specializationOptions.map(option => (
                <button
                  key={option}
                  onClick={() => toggleSpecialization(option)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    specializations.includes(option)
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column - Map and Bio */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Über mich</h3>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={6}
              placeholder="Beschreibe deine Erfahrung, Qualifikationen und deinen Trainingsstil..."
            />
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Standort auf der Karte</h3>
            <p className="text-sm text-gray-400 mb-4">
              Klicke auf die Karte, um deinen genauen Standort festzulegen. Dieser wird anderen Nutzern angezeigt.
            </p>
            <div className="h-80 rounded-lg overflow-hidden">
              <MapContainer 
                center={position} 
                zoom={6} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationPicker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Koordinaten: {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={20} className="mr-2" />
              )}
              Profil speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerProfile;