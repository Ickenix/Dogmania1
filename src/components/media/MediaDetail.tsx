import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { X, Heart, Send, Trash2, Edit2, Tag, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface MediaDetailProps {
  mediaId: string;
  onClose: () => void;
  onDelete: (id: string) => void;
  onLike: (id: string, isLiked: boolean) => void;
  onUpdate: () => void;
}

interface MediaItem {
  id: string;
  user_id: string;
  file_url: string;
  file_type: 'image' | 'video';
  description: string;
  tags: string[];
  created_at: string;
  likes_count: number;
  user_has_liked: boolean;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

const MediaDetail: React.FC<MediaDetailProps> = ({
  mediaId,
  onClose,
  onDelete,
  onLike,
  onUpdate
}) => {
  const { session } = useAuth();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [processingLike, setProcessingLike] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMediaDetails();
    fetchComments();
  }, [mediaId]);

  useEffect(() => {
    // Scroll to bottom of comments when new ones are added
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  async function fetchMediaDetails() {
    try {
      const { data, error } = await supabase
        .from('media_uploads')
        .select(`
          *,
          profiles:user_id(username, avatar_url),
          likes:media_likes(count)
        `)
        .eq('id', mediaId)
        .single();

      if (error) throw error;

      // Get like status for current user
      let userHasLiked = false;
      if (session) {
        const { data: likeData } = await supabase
          .from('media_likes')
          .select('id')
          .eq('media_id', mediaId)
          .eq('user_id', session.user.id)
          .maybeSingle();

        userHasLiked = !!likeData;
      }

      setMedia({
        ...data,
        likes_count: data.likes[0]?.count || 0,
        user_has_liked: userHasLiked
      });

      setEditDescription(data.description);
      setEditTags(data.tags || []);
    } catch (error) {
      console.error('Error fetching media details:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchComments() {
    try {
      const { data, error } = await supabase
        .from('media_comments')
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .eq('media_id', mediaId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !newComment.trim() || sendingComment) return;

    try {
      setSendingComment(true);

      const { error } = await supabase
        .from('media_comments')
        .insert({
          media_id: mediaId,
          user_id: session.user.id,
          content: newComment
        });

      if (error) throw error;

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSendingComment(false);
    }
  }

  async function handleLocalLike() {
    if (!session || !media || processingLike) return;
    
    try {
      setProcessingLike(true);
      await onLike(media.id, media.user_has_liked);
      
      // Update local state
      setMedia(prev => prev ? {
        ...prev,
        user_has_liked: !prev.user_has_liked,
        likes_count: prev.user_has_liked ? prev.likes_count - 1 : prev.likes_count + 1
      } : null);
    } catch (error) {
      console.error('Error handling like:', error);
    } finally {
      setProcessingLike(false);
    }
  }

  async function handleSaveEdit() {
    if (!session || !media) return;

    try {
      const { error } = await supabase
        .from('media_uploads')
        .update({
          description: editDescription,
          tags: editTags
        })
        .eq('id', media.id);

      if (error) throw error;

      setEditing(false);
      fetchMediaDetails();
      onUpdate();
    } catch (error) {
      console.error('Error updating media:', error);
    }
  }

  function addTag() {
    if (!tagInput.trim()) return;
    
    // Remove # if present
    const formattedTag = tagInput.trim().startsWith('#') 
      ? tagInput.trim().substring(1) 
      : tagInput.trim();
    
    if (!editTags.includes(formattedTag)) {
      setEditTags([...editTags, formattedTag]);
    }
    
    setTagInput('');
  }

  function removeTag(tag: string) {
    setEditTags(editTags.filter(t => t !== tag));
  }

  function handleTagInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!media) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-blue-900/30 backdrop-blur-lg rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media Display */}
        <div className="w-full md:w-3/5 bg-black flex items-center justify-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors z-10"
          >
            <X size={20} />
          </button>
          
          {media.file_type === 'image' ? (
            <img
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/dogmedia/${media.file_url}`}
              alt={media.description}
              className="max-w-full max-h-[70vh] object-contain"
            />
          ) : (
            <video
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/dogmedia/${media.file_url}`}
              controls
              className="max-w-full max-h-[70vh]"
            />
          )}
        </div>
        
        {/* Details and Comments */}
        <div className="w-full md:w-2/5 flex flex-col h-[50vh] md:h-auto">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
              {media.profiles.avatar_url ? (
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${media.profiles.avatar_url}`}
                  alt={media.profiles.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={20} className="text-purple-400" />
              )}
            </div>
            <div>
              <div className="font-semibold">{media.profiles.username}</div>
              <div className="text-xs text-gray-400">{formatDate(media.created_at)}</div>
            </div>
            
            {session?.user.id === media.user_id && (
              <div className="ml-auto flex space-x-2">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveEdit}
                    className="p-2 text-green-400 hover:text-green-300 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
                <button
                  onClick={() => onDelete(media.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
          
          {/* Description and Tags */}
          <div className="p-4 border-b border-white/10">
            {editing ? (
              <div className="space-y-3">
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Beschreibung..."
                />
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {editTags.map(tag => (
                    <div 
                      key={tag} 
                      className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Neuer Tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="bg-purple-600 text-white px-3 py-2 rounded-r-lg hover:bg-purple-500 transition-colors"
                  >
                    <Tag size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-200 mb-3">{media.description}</p>
                
                {media.tags && media.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {media.tags.map(tag => (
                      <div 
                        key={tag} 
                        className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Likes */}
          <div className="p-4 border-b border-white/10 flex items-center space-x-4">
            <button
              onClick={handleLocalLike}
              disabled={processingLike}
              className={`flex items-center space-x-1 ${
                media.user_has_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              } transition-colors ${processingLike ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart
                size={20}
                className={media.user_has_liked ? 'fill-current' : ''}
              />
              <span>{media.likes_count}</span>
            </button>
          </div>
          
          {/* Comments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-4 text-gray-400">
                Noch keine Kommentare
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    {comment.profiles.avatar_url ? (
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${comment.profiles.avatar_url}`}
                        alt={comment.profiles.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={16} className="text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="font-semibold text-sm mb-1">
                        {comment.profiles.username}
                      </div>
                      <p className="text-sm text-gray-300">{comment.content}</p>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(comment.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>
          
          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="p-4 border-t border-white/10">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Schreibe einen Kommentar..."
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || sendingComment}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingComment ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MediaDetail;