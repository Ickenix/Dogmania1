import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MapPin, Star, Filter, Search, Calendar, Clock, Award, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import BookTrainer from './BookTrainer';
import RatingStars from '../ratings/RatingStars';

interface Trainer {
  id: string;
  user_id: string;
  bio: string;
  location: string;
  specialization: string[];
  is_verified: boolean;
  latitude: number;
  longitude: number;
  hourly_rate: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
  ratings_aggregate: {
    aggregate: {
      avg: {
        rating: number;
      };
      count: number;
    };
  };
  certificates_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

const BookTrainerPage = () => {
  const { session } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [filteredTrainers, setFilteredTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [specialization, setSpecialization] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [expandedTrainer, setExpandedTrainer] = useState<string | null>(null);

  useEffect(() => {
    fetchTrainers();
  }, []);

  useEffect(() => {
    filterTrainers();
  }, [searchQuery, locationFilter, minRating, specialization, trainers]);

  async function fetchTrainers() {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select(`
          *,
          profiles:user_id(username, avatar_url, full_name),
          ratings_aggregate: ratings(
            avg: avg(rating),
            count: count(*)
          ),
          certificates_aggregate: certificates(count)
        `)
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTrainers = data?.map(trainer => ({
        ...trainer,
        ratings_aggregate: {
          aggregate: {
            avg: {
              rating: trainer.ratings_aggregate[0]?.avg || 0
            },
            count: trainer.ratings_aggregate[0]?.count || 0
          }
        },
        certificates_aggregate: {
          aggregate: {
            count: trainer.certificates_aggregate[0]?.count || 0
          }
        }
      })) || [];

      setTrainers(formattedTrainers);
      setFilteredTrainers(formattedTrainers);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterTrainers() {
    let filtered = [...trainers];

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(trainer => 
        trainer.profiles.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainer.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trainer.profiles.full_name && trainer.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(trainer => 
        trainer.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter(trainer => 
        trainer.ratings_aggregate.aggregate.avg.rating >= minRating
      );
    }

    // Specialization filter
    if (specialization) {
      filtered = filtered.filter(trainer => 
        trainer.specialization && trainer.specialization.includes(specialization)
      );
    }

    setFilteredTrainers(filtered);
  }

  function handleTrainerClick(trainerId: string) {
    if (expandedTrainer === trainerId) {
      setExpandedTrainer(null);
    } else {
      setExpandedTrainer(trainerId);
    }
  }

  function handleBookTrainer(trainer: Trainer) {
    setSelectedTrainer(trainer);
    setShowBookingModal(true);
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trainer buchen</h1>
          <p className="text-gray-400">
            Finde einen zertifizierten Hundetrainer in deiner Nähe
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Suche nach Trainern..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Ort"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <select
            value={minRating.toString()}
            onChange={(e) => setMinRating(parseInt(e.target.value))}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="0">Alle Bewertungen</option>
            <option value="3">3+ Sterne</option>
            <option value="4">4+ Sterne</option>
            <option value="5">5 Sterne</option>
          </select>

          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Alle Spezialisierungen</option>
            {specializationOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trainers List */}
      {filteredTrainers.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <Filter size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Keine Trainer gefunden</h3>
          <p className="text-gray-400">
            Versuche es mit anderen Filtereinstellungen oder komme später wieder.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredTrainers.map((trainer) => (
            <motion.div
              key={trainer.id}
              layout
              className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden hover:bg-white/10 transition-all"
            >
              <div 
                className="p-6 cursor-pointer"
                onClick={() => handleTrainerClick(trainer.id)}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden">
                      {trainer.profiles.avatar_url ? (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${trainer.profiles.avatar_url}`}
                          alt={trainer.profiles.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-2xl font-bold text-purple-300">
                          {trainer.profiles.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {trainer.profiles.full_name || trainer.profiles.username}
                        </h3>
                        <div className="flex items-center mt-1">
                          <RatingStars 
                            rating={trainer.ratings_aggregate.aggregate.avg.rating} 
                            size={16} 
                          />
                          <span className="ml-2 text-sm text-gray-400">
                            ({trainer.ratings_aggregate.aggregate.count} Bewertungen)
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 md:mt-0 flex items-center">
                        {trainer.is_verified && (
                          <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs flex items-center mr-3">
                            <CheckCircle size={12} className="mr-1" />
                            Verifiziert
                          </div>
                        )}
                        <div className="text-xl font-bold">{trainer.hourly_rate}€/h</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-400 mb-4">
                      <MapPin size={16} className="mr-1" />
                      <span>{trainer.location}</span>
                      
                      <span className="mx-2">•</span>
                      
                      <Award size={16} className="mr-1" />
                      <span>{trainer.certificates_aggregate.aggregate.count} Zertifikate</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {trainer.specialization && trainer.specialization.map((spec, index) => (
                        <span 
                          key={index}
                          className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Expanded content */}
              {expandedTrainer === trainer.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-6 pb-6"
                >
                  <div className="border-t border-white/10 pt-4 mb-4">
                    <h4 className="font-semibold mb-2">Über mich</h4>
                    <p className="text-gray-300">{trainer.bio}</p>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleBookTrainer(trainer)}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
                    >
                      <Calendar size={18} className="inline-block mr-2" />
                      Termin buchen
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedTrainer && (
        <BookTrainer
          trainerId={selectedTrainer.id}
          trainerName={selectedTrainer.profiles.full_name || selectedTrainer.profiles.username}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
};

export default BookTrainerPage;