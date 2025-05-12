import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Heart, MessageSquare, Trash2, Edit2, Tag, Filter, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MediaUpload from './MediaUpload';
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
}

interface MediaGalleryProps {
  dogId?: string;
  userId?: string;
  showUpload?: boolean;
  maxItems?: number;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({
  dogId,
  userId,
  showUpload = true,
  maxItems
}) => {
  const { session } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, [dogId, userId]);

  async function fetchMedia() {
    try {
      let query = supabase
        .from('media_uploads')
        .select(`
          *,
          profiles:user_id(username, avatar_url),
          likes:media_likes(count),
          comments:media_comments(count)
        `)
        .order('created_at', { ascending: false });

      if (dogId) {
        query = query.eq('dog_id', dogId);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (maxItems) {
        query = query.limit(maxItems);
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
    if (!session) return;

    try {
      if (currentlyLiked) {
        // Unlike
        await supabase
          .from('media_likes')
          .delete()
          .eq('media_id', mediaId)
          .eq('user_id', session.user.id);
      } else {
        // Like
        await supabase
          .from('media_likes')
          .insert({
            media_id: mediaId,
            user_id: session.user.id
          });
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
    }
  }

  async function handleDelete(mediaId: string) {
    if (!session) return;
    
    if (!confirm('Möchtest du dieses Medium wirklich löschen?')) {
      return;
    }

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

  const filteredMedia = media.filter(item => {
    // Filter by search query
    const matchesSearch = 
      !searchQuery || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    // Filter by tag
    const matchesTag = 
      !tagFilter || 
      (item.tags && item.tags.some(tag => tag.toLowerCase() === tagFilter.toLowerCase()));
    
    // Filter by type
    const matchesType = 
      typeFilter === 'all' || 
      item.file_type === typeFilter;
    
    return matchesSearch && matchesTag && matchesType;
  });

  const allTags = Array.from(new Set(
    media.flatMap(item => item.tags || [])
  )).sort();

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold">Mediengalerie</h2>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Suche nach Medien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors flex items-center"
          >
            <Filter size={18} className="mr-2" />
            Filter
          </button>
          
          {showUpload && (
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
            >
              {showUploadForm ? 'Abbrechen' : 'Hochladen'}
            </button>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Medientyp</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      typeFilter === 'all' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Alle
                  </button>
                  <button
                    onClick={() => setTypeFilter('image')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      typeFilter === 'image' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Bilder
                  </button>
                  <button
                    onClick={() => setTypeFilter('video')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      typeFilter === 'video' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Videos
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.length > 0 ? (
                    <>
                      <button
                        onClick={() => setTagFilter('')}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          tagFilter === '' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        Alle
                      </button>
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setTagFilter(tag)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            tagFilter === tag ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </>
                  ) : (
                    <span className="text-gray-400 text-sm">Keine Tags vorhanden</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Active filters */}
            {(searchQuery || tagFilter || typeFilter !== 'all') && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Aktive Filter</h3>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setTagFilter('');
                      setTypeFilter('all');
                    }}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Alle zurücksetzen
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {searchQuery && (
                    <div className="bg-white/10 px-3 py-1 rounded-full text-sm flex items-center">
                      Suche: {searchQuery}
                      <button
                        onClick={() => setSearchQuery('')}
                        className="ml-2 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {tagFilter && (
                    <div className="bg-white/10 px-3 py-1 rounded-full text-sm flex items-center">
                      Tag: #{tagFilter}
                      <button
                        onClick={() => setTagFilter('')}
                        className="ml-2 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {typeFilter !== 'all' && (
                    <div className="bg-white/10 px-3 py-1 rounded-full text-sm flex items-center">
                      Typ: {typeFilter === 'image' ? 'Bilder' : 'Videos'}
                      <button
                        onClick={() => setTypeFilter('all')}
                        className="ml-2 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Upload Form */}
      <AnimatePresence>
        {showUploadForm && showUpload && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MediaUpload 
              dogId={dogId} 
              onUploadComplete={() => {
                setShowUploadForm(false);
                fetchMedia();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {typeFilter === 'video' ? (
              <video className="text-gray-400" width="32" height="32" />
            ) : (
              <img className="text-gray-400" width="32" height="32" />
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2">Keine Medien gefunden</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery || tagFilter || typeFilter !== 'all'
              ? 'Versuche es mit anderen Filtereinstellungen'
              : 'Lade deine ersten Medien hoch, um sie hier zu sehen'}
          </p>
          {showUpload && !showUploadForm && (
            <button
              onClick={() => setShowUploadForm(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
            >
              Medien hochladen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredMedia.map(item => (
            <div 
              key={item.id} 
              className="aspect-square bg-white/5 backdrop-blur-lg rounded-lg overflow-hidden group relative cursor-pointer"
              onClick={() => setSelectedMediaId(item.id)}
            >
              {item.file_type === 'image' ? (
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/dogmedia/${item.file_url}`}
                  alt={item.description}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black/40">
                  <video
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/dogmedia/${item.file_url}`}
                    className="w-full h-full object-cover"
                    muted
                    onMouseOver={e => e.currentTarget.play()}
                    onMouseOut={e => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                </div>
              )}
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(item.id, item.user_has_liked);
                      }}
                      className={`p-1.5 rounded-full ${
                        item.user_has_liked 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      } transition-colors`}
                    >
                      <Heart size={16} className={item.user_has_liked ? 'fill-white' : ''} />
                    </button>
                    <span className="text-xs text-white">{item.likes_count}</span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMediaId(item.id);
                      }}
                      className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                    >
                      <MessageSquare size={16} />
                    </button>
                    <span className="text-xs text-white">{item.comments_count}</span>
                  </div>
                  
                  {session?.user.id === item.user_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="p-1.5 rounded-full bg-white/20 text-white hover:bg-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 3).map(tag => (
                      <div 
                        key={tag} 
                        className="bg-black/40 text-white px-2 py-0.5 rounded text-xs"
                      >
                        #{tag}
                      </div>
                    ))}
                    {item.tags.length > 3 && (
                      <div className="bg-black/40 text-white px-2 py-0.5 rounded text-xs">
                        +{item.tags.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Media Detail Modal */}
      <AnimatePresence>
        {selectedMediaId && (
          <MediaDetail
            mediaId={selectedMediaId}
            onClose={() => setSelectedMediaId(null)}
            onDelete={handleDelete}
            onLike={handleLike}
            onUpdate={fetchMedia}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MediaGallery;