import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Heart, MessageCircle, Image as ImageIcon, MoreVertical, Trash2, Edit2 } from 'lucide-react';

interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  category: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

const Community = () => {
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPosts();
    setupRealtimeSubscription();
  }, []);

  function setupRealtimeSubscription() {
    const postsSubscription = supabase
      .channel('public:community_posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    const likesSubscription = supabase
      .channel('public:community_likes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_likes' }, () => {
        fetchPosts();
      })
      .subscribe();

    const commentsSubscription = supabase
      .channel('public:community_comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_comments' }, () => {
        Object.keys(expandedComments).forEach(postId => {
          if (expandedComments[postId]) {
            fetchComments(postId);
          }
        });
      })
      .subscribe();

    return () => {
      postsSubscription.unsubscribe();
      likesSubscription.unsubscribe();
      commentsSubscription.unsubscribe();
    };
  }

  async function fetchPosts() {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles (username, avatar_url),
          likes_count: community_likes (count),
          comments_count: community_comments (count)
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Get likes for current user
      const { data: likesData } = await supabase
        .from('community_likes')
        .select('post_id')
        .eq('user_id', session?.user.id);

      const likedPostIds = new Set(likesData?.map(like => like.post_id));

      const postsWithLikes = postsData?.map(post => ({
        ...post,
        likes_count: post.likes_count[0]?.count || 0,
        comments_count: post.comments_count[0]?.count || 0,
        user_has_liked: likedPostIds.has(post.id)
      }));

      setPosts(postsWithLikes || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    try {
      let imageUrl = null;
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const filePath = `${session.user.id}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('community')
          .upload(filePath, selectedImage);

        if (uploadError) throw uploadError;
        imageUrl = filePath;
      }

      const { error: postError } = await supabase
        .from('community_posts')
        .insert([{
          author_id: session.user.id,
          title,
          content,
          image_url: imageUrl
        }]);

      if (postError) throw postError;

      setContent('');
      setTitle('');
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  }

  async function handleLike(postId: string, currentlyLiked: boolean) {
    if (!session) return;

    try {
      if (currentlyLiked) {
        await supabase
          .from('community_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id);
      } else {
        await supabase
          .from('community_likes')
          .insert([{
            post_id: postId,
            user_id: session.user.id
          }]);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  async function fetchComments(postId: string) {
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(prev => ({ ...prev, [postId]: data }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }

  async function handleComment(postId: string) {
    if (!session || !newComment[postId]) return;

    try {
      const { error } = await supabase
        .from('community_comments')
        .insert([{
          post_id: postId,
          user_id: session.user.id,
          content: newComment[postId]
        }]);

      if (error) throw error;

      setNewComment(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  }

  async function handleDeletePost(postId: string) {
    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Create Post Form */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel deines Beitrags"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={100}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Was möchtest du teilen?"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={3}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                <ImageIcon size={20} />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <span className="text-sm text-gray-400">Bild hinzufügen</span>
            </label>
            <button
              type="submit"
              disabled={!content.trim()}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Posten
            </button>
          </div>
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 bg-black/50 p-1 rounded-full hover:bg-black/70 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  {post.profiles.avatar_url ? (
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${post.profiles.avatar_url}`}
                      alt={post.profiles.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="text-lg font-bold text-purple-300">
                      {post.profiles.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold">{post.profiles.username}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {post.author_id === session?.user.id && (
                <div className="relative group">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreVertical size={20} />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden invisible group-hover:visible">
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center space-x-2 text-red-400"
                    >
                      <Trash2 size={16} />
                      <span>Löschen</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Post Content */}
            {post.title && (
              <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
            )}
            <p className="text-gray-300 mb-4">{post.content}</p>
            {post.image_url && (
              <img
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/community/${post.image_url}`}
                alt="Post image"
                className="w-full rounded-lg mb-4"
              />
            )}

            {/* Post Actions */}
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => handleLike(post.id, post.user_has_liked)}
                className={`flex items-center space-x-1 ${
                  post.user_has_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                } transition-colors`}
              >
                <Heart
                  size={20}
                  className={post.user_has_liked ? 'fill-current' : ''}
                />
                <span>{post.likes_count}</span>
              </button>
              <button
                onClick={() => {
                  setExpandedComments(prev => ({
                    ...prev,
                    [post.id]: !prev[post.id]
                  }));
                  if (!comments[post.id]) {
                    fetchComments(post.id);
                  }
                }}
                className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
              >
                <MessageCircle size={20} />
                <span>{post.comments_count}</span>
              </button>
            </div>

            {/* Comments Section */}
            {expandedComments[post.id] && (
              <div className="space-y-4">
                <div className="border-t border-white/10 pt-4">
                  {comments[post.id]?.map(comment => (
                    <div key={comment.id} className="flex space-x-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        {comment.profiles.avatar_url ? (
                          <img
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${comment.profiles.avatar_url}`}
                            alt={comment.profiles.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="text-sm font-bold text-purple-300">
                            {comment.profiles.username[0].toUpperCase()}
                          </div>
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
                          {new Date(comment.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* New Comment Input */}
                <div className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    {session?.user && (
                      <div className="text-sm font-bold text-purple-300">
                        {session.user.email?.[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex space-x-2">
                    <input
                      type="text"
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment(prev => ({
                        ...prev,
                        [post.id]: e.target.value
                      }))}
                      placeholder="Schreibe einen Kommentar..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      disabled={!newComment[post.id]?.trim()}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Senden
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Community;