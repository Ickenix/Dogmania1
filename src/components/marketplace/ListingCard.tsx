import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Heart, MessageSquare, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    location: string;
    images: string[];
    is_available: boolean;
    seller: {
      username: string;
      avatar_url: string;
    };
  };
  onUpdate: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onUpdate }) => {
  const { session } = useAuth();
  const navigate = useNavigate();

  async function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    
    if (!session) {
      navigate('/login');
      return;
    }

    try {
      const { error } = await supabase
        .from('marketplace_favorites')
        .insert({
          user_id: session.user.id,
          product_id: listing.id,
        });

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error favoriting listing:', error);
    }
  }

  async function handleContact(e: React.MouseEvent) {
    e.stopPropagation();
    
    if (!session) {
      navigate('/login');
      return;
    }

    // Navigate to messages with this seller
    navigate('/messages');
  }

  const handleCardClick = () => {
    navigate(`/marketplace/${listing.id}`);
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={handleCardClick}
      className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden hover:bg-white/10 transition-all group cursor-pointer"
    >
      <div className="relative">
        <img
          src={listing.images[0] || 'https://via.placeholder.com/400x300'}
          alt={listing.title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400">
          {listing.price.toFixed(2)} €
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              {listing.seller.avatar_url ? (
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${listing.seller.avatar_url}`}
                  alt={listing.seller.username}
                  className="w-full h-full rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="text-lg font-bold text-purple-300">
                  {listing.seller.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="font-semibold">{listing.seller.username}</div>
              {listing.location && (
                <div className="text-sm text-gray-400 flex items-center">
                  <MapPin size={14} className="mr-1" />
                  {listing.location}
                </div>
              )}
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-2">{listing.title}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {listing.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleFavorite}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Als Favorit markieren"
            >
              <Heart size={20} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleContact}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Verkäufer kontaktieren"
            >
              <MessageSquare size={20} />
            </motion.button>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleContact}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors"
          >
            Kontaktieren
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ListingCard;