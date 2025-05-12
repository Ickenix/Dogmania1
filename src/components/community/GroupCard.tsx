import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Users, Lock, Globe, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description: string;
    private: boolean;
    image_url: string;
    _count: {
      members: number;
      forums: number;
    };
  };
  onUpdate: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onUpdate }) => {
  const { session } = useAuth();
  const navigate = useNavigate();

  async function handleJoin(e: React.MouseEvent) {
    e.stopPropagation();
    
    if (!session) {
      navigate('/login');
      return;
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: session.user.id,
          role: 'member'
        });

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  }

  const handleCardClick = () => {
    navigate(`/groups/${group.id}`);
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={handleCardClick}
      className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden hover:bg-white/10 transition-all group cursor-pointer"
    >
      <div className="relative">
        <img
          src={group.image_url || 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'}
          alt={group.name}
          className="w-full h-48 object-cover"
        />
        {group.is_private && (
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center">
            <Lock size={14} className="mr-1" />
            Privat
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {group.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
          <div className="flex items-center">
            <Users size={16} className="mr-1" />
            {group._count.members} Mitglieder
          </div>
          <div className="flex items-center">
            <MessageSquare size={16} className="mr-1" />
            {group._count.forums} Beiträge
          </div>
        </div>

        <button
          onClick={handleJoin}
          className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center justify-center"
        >
          Beitreten
        </button>
      </div>
    </motion.div>
  );
};

export default GroupCard;