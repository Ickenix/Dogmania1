import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Users, Star, Award, Upload, MapPin, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Trainer {
  id: string;
  bio: string;
  location: string;
  specialization: string[];
  is_verified: boolean;
  latitude: number;
  longitude: number;
  hourly_rate: number;
}

interface Booking {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issue_date: string;
  expiry_date: string | null;
  file_url: string;
}

interface Rating {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

const TrainerDashboard = () => {
  const { session } = useAuth();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchTrainerData();
    }
  }, [session]);

  async function fetchTrainerData() {
    try {
      // Fetch trainer profile
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .select('*')
        .eq('user_id', session?.user.id)
        .single();

      if (trainerError) throw trainerError;
      setTrainer(trainerData);

      if (trainerData) {
        // Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            profiles (username, avatar_url)
          `)
          .eq('trainer_id', trainerData.id)
          .order('date', { ascending: true });

        if (bookingsError) throw bookingsError;
        setBookings(bookingsData || []);

        // Fetch certificates
        const { data: certificatesData, error: certificatesError } = await supabase
          .from('certificates')
          .select('*')
          .eq('trainer_id', trainerData.id)
          .order('issue_date', { ascending: false });

        if (certificatesError) throw certificatesError;
        setCertificates(certificatesData || []);

        // Fetch ratings
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('ratings')
          .select(`
            *,
            profiles (username, avatar_url)
          `)
          .eq('trainer_id', trainerData.id)
          .order('created_at', { ascending: false });

        if (ratingsError) throw ratingsError;
        setRatings(ratingsData || []);
      }
    } catch (error) {
      console.error('Error fetching trainer data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCertificateUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Please select a file to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${session?.user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('certificates')
        .insert([{
          trainer_id: trainer?.id,
          title: 'New Certificate', // You might want to add a form for these details
          issuer: 'Certificate Issuer',
          issue_date: new Date().toISOString(),
          file_url: filePath
        }]);

      if (dbError) throw dbError;

      fetchTrainerData();
    } catch (error) {
      console.error('Error uploading certificate:', error);
    } finally {
      setUploading(false);
    }
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      fetchTrainerData();
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  }

  if (loading) {
    return <div>Loading trainer dashboard...</div>;
  }

  const averageRating = ratings.length > 0
    ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length
    : 0;

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="text-purple-400" size={24} />
            <span className="text-3xl font-bold">{bookings.filter(b => b.status === 'pending').length}</span>
          </div>
          <h3 className="text-gray-300">Offene Anfragen</h3>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="text-purple-400" size={24} />
            <span className="text-3xl font-bold">{bookings.filter(b => b.status === 'completed').length}</span>
          </div>
          <h3 className="text-gray-300">Abgeschlossene Trainings</h3>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Star className="text-purple-400" size={24} />
            <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
          </div>
          <h3 className="text-gray-300">Durchschnittliche Bewertung</h3>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Award className="text-purple-400" size={24} />
            <span className="text-3xl font-bold">{certificates.length}</span>
          </div>
          <h3 className="text-gray-300">Zertifikate</h3>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'profile' ? 'bg-purple-600' : 'hover:bg-white/10'
            }`}
          >
            Profil
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'bookings' ? 'bg-purple-600' : 'hover:bg-white/10'
            }`}
          >
            Buchungen
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'certificates' ? 'bg-purple-600' : 'hover:bg-white/10'
            }`}
          >
            Zertifikate
          </button>
          <button
            onClick={() => setActiveTab('ratings')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'ratings' ? 'bg-purple-600' : 'hover:bg-white/10'
            }`}
          >
            Bewertungen
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4">Trainer-Profil</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Über mich</label>
                    <textarea
                      value={trainer?.bio || ''}
                      onChange={async (e) => {
                        const { error } = await supabase
                          .from('trainers')
                          .update({ bio: e.target.value })
                          .eq('id', trainer?.id);
                        if (!error) setTrainer({ ...trainer!, bio: e.target.value });
                      }}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Standort</label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={trainer?.location || ''}
                        onChange={async (e) => {
                          const { error } = await supabase
                            .from('trainers')
                            .update({ location: e.target.value })
                            .eq('id', trainer?.id);
                          if (!error) setTrainer({ ...trainer!, location: e.target.value });
                        }}
                        className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Stadt, Land"
                      />
                      <button className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors">
                        <MapPin size={20} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Stundensatz (€)</label>
                    <input
                      type="number"
                      value={trainer?.hourly_rate || ''}
                      onChange={async (e) => {
                        const { error } = await supabase
                          .from('trainers')
                          .update({ hourly_rate: parseFloat(e.target.value) })
                          .eq('id', trainer?.id);
                        if (!error) setTrainer({ ...trainer!, hourly_rate: parseFloat(e.target.value) });
                      }}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="w-96">
                <h3 className="text-xl font-semibold mb-4">Standort</h3>
                <div className="h-64 rounded-lg overflow-hidden">
                  {trainer?.latitude && trainer?.longitude && (
                    <MapContainer
                      center={[trainer.latitude, trainer.longitude]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={[trainer.latitude, trainer.longitude]}>
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-semibold">Mein Standort</h3>
                            <p className="text-sm">{trainer.location}</p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Buchungsanfragen</h3>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      {booking.profiles.avatar_url ? (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${booking.profiles.avatar_url}`}
                          alt={booking.profiles.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Users size={20} className="text-purple-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{booking.profiles.username}</h4>
                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar size={16} className="mr-1" />
                        {new Date(booking.date).toLocaleDateString()}
                        <Clock size={16} className="ml-3 mr-1" />
                        {booking.start_time} - {booking.end_time}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-500 transition-colors"
                        >
                          Bestätigen
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500 transition-colors"
                        >
                          Ablehnen
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                        className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
                      >
                        Als abgeschlossen markieren
                      </button>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                      booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                      booking.status === 'completed' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Zertifikate</h3>
              <label className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors cursor-pointer">
                <Upload size={20} className="inline mr-2" />
                Zertifikat hochladen
                <input
                  type="file"
                  onChange={handleCertificateUpload}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white/5 rounded-lg p-4 space-y-2"
                >
                  <h4 className="font-semibold">{cert.title}</h4>
                  <p className="text-sm text-gray-400">{cert.issuer}</p>
                  <div className="text-sm">
                    <span className="text-gray-400">Ausgestellt am: </span>
                    {new Date(cert.issue_date).toLocaleDateString()}
                  </div>
                  {cert.expiry_date && (
                    <div className="text-sm">
                      <span className="text-gray-400">Gültig bis: </span>
                      {new Date(cert.expiry_date).toLocaleDateString()}
                    </div>
                  )}
                  <a
                    href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/certificates/${cert.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-3 py-1 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors text-sm"
                  >
                    Anzeigen
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ratings' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-xl font-semibold">Bewertungen</h3>
              <div className="flex items-center bg-white/5 px-4 py-2 rounded-lg">
                <Star className="text-yellow-400 mr-2" size={20} />
                <span className="font-semibold">{averageRating.toFixed(1)}</span>
                <span className="text-gray-400 ml-1">/ 5</span>
              </div>
            </div>

            <div className="space-y-4">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="bg-white/5 rounded-lg p-4"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      {rating.profiles.avatar_url ? (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${rating.profiles.avatar_url}`}
                          alt={rating.profiles.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Users size={16} className="text-purple-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{rating.profiles.username}</div>
                      <div className="flex items-center text-sm text-gray-400">
                        <div className="flex items-center text-yellow-400 mr-2">
                          {Array.from({ length: rating.rating }).map((_, i) => (
                            <Star key={i} size={16} fill="currentColor" />
                          ))}
                        </div>
                        <span>{new Date(rating.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300">{rating.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerDashboard;