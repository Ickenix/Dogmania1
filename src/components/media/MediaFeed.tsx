import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Heart, MessageSquare, User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import MediaDetail from './MediaDetail';

interface MediaItem {
  id: string;
  user_id: string;
  file_url: string;
  file_type: 'image' | 'video';
  description: string;
  tags: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  dog: {
    name: string;
    id: string;
  } | null;
}

interface MediaFeedProps {
  limit?: number;
  showHeader?: boolean;
}

const MediaFeed: React.FC<MediaFeedProps> = ({ 
  limit,
  showHeader = true
}) => {
  const { session } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [processingLikes, setProcessingLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMedia();
  }, []);

  async function fetchMedia() {
    try {
      let query = supabase
        .from('media_uploads')
        .select(`
          *,
          profiles:user_id(username, avatar_url),
          dog:dog_id(name, id),
          likes:media_likes(count),
          comments:media_comments(count)
        `)
        .eq('show_in_feed', true)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get likes for current user
      let userLikes: string[] = [];
      if (session) {
        const { data: likesData } = await supabase
          .from('media_likes')
          .select('media_id')
          .eq('user_id', session.user.id);

        userLikes = likesData?.map(like => like.media_id) || [];
      }

      // Format media data
      const formattedMedia = data?.map(item => ({
        ...item,
        likes_count: item.likes[0]?.count || 0,
        comments_count: item.comments[0]?.count || 0,
        user_has_liked: userLikes.includes(item.id)
      })) || [];

      setMedia(formattedMedia);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(mediaId: string, currentlyLiked: boolean) {
    if (!session || processingLikes.has(mediaId)) return;

    try {
      setProcessingLikes(prev => new Set([...prev, mediaId]));

      if (currentlyLiked) {
        // Unlike - Delete the existing like
        const { error: deleteError } = await supabase
          .from('media_likes')
          .delete()
          .eq('media_id', mediaId)
          .eq('user_id', session.user.id);

        if (deleteError) throw deleteError;
      } else {
        // First check if like already exists
        const { data: existingLike } = await supabase
          .from('media_likes')
          .select('id')
          .eq('media_id', mediaId)
          .eq('user_id', session.user.id)
          .maybeSingle();

        // Only insert if no like exists
        if (!existingLike) {
          const { error: insertError } = await supabase
            .from('media_likes')
            .insert({
              media_id: mediaId,
              user_id: session.user.id
            });

          if (insertError) throw insertError;
        }
      }

      // Update local state
      setMedia(prevMedia => 
        prevMedia.map(item => 
          item.id === mediaId 
            ? { 
                ...item, 
                user_has_liked: !currentlyLiked,
                likes_count: currentlyLiked 
                  ? item.likes_count - 1 
                  : item.likes_count + 1
              } 
            : item
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setProcessingLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
    }
  }

  async function handleDelete(mediaId: string) {
    if (!session) return;

    try {
      // Get the file URL
      const mediaItem = media.find(item => item.id === mediaId);
      if (!mediaItem) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('dogmedia')
        .remove([mediaItem.file_url]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_uploads')
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      // Update local state
      setMedia(prevMedia => prevMedia.filter(item => item.id !== mediaId));
      
      // Close detail view if open
      if (selectedMediaId === mediaId) {
        setSelectedMediaId(null);
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <img className="text-gray-400" width="32" height="32" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Keine Medien im Feed</h3>
        <p className="text-gray-400">
          Hier werden Medien von dir und anderen Nutzern angezeigt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <h2 className="text-2xl font-bold">Neueste Medien</h2>
      )}
      
      <div className="space-y-6">
        {media.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                  {item.profiles.avatar_url ? (
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${item.profiles.avatar_url}`}
                      alt={item.profiles.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-purple-400" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">{item.profiles.username}</div>
                  <div className="text-xs text-gray-400 flex items-center">
                    <Calendar size={12} className="mr-1" />
                    {formatDate(item.created_at)}
                    {item.dog && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{item.dog.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Media */}
            <div 
              className="cursor-pointer"
              onClick={() => setSelectedMediaId(item.id)}
            >
              {item.file_type === 'image' ? (
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/dogmedia/${item.file_url}`}
                  alt={item.description}
                  className="w-full max-h-[500px] object-contain bg-black"
                  loading="lazy"
                />
              ) : (
                <video
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/dogmedia/${item.file_url}`}
                  controls
                  className="w-full max-h-[500px]"
                />
              )}
            </div>
            
            {/* Description and Actions */}
            <div className="p-4">
              {/* Actions */}
              <div className="flex items-center space-x-4 mb-3">
                <button
                  onClick={() => handleLike(item.id, item.user_has_liked)}
                  disabled={processingLikes.has(item.id)}
                  className={`flex items-center space-x-1 ${
                    item.user_has_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  } transition-colors ${processingLikes.has(item.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Heart
                    size={20}
                    className={item.user_has_liked ? 'fill-current' : ''}
                  />
                  <span>{item.likes_count}</span>
                </button>
                
                <button
                  onClick={() => setSelectedMediaId(item.id)}
                  className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
                >
                  <MessageSquare size={20} />
                  <span>{item.comments_count}</span>
                </button>
              </div>
              
              {/* Description */}
              {item.description && (
                <p className="text-gray-200 mb-2">{item.description}</p>
              )}
              
              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <div 
                      key={tag} 
                      className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Media Detail Modal */}
      {selectedMediaId && (
        <MediaDetail
          mediaId={selectedMediaId}
          onClose={() => setSelectedMediaId(null)}
          onDelete={handleDelete}
          onLike={handleLike}
          onUpdate={fetchMedia}
        />
      )}
    </div>
  );
};

export default MediaFeed;