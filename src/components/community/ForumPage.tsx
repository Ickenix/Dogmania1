import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Search, Filter, Plus, MessageSquare, Heart, User, Calendar, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CreatePostModal from './CreatePostModal';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  group_id: string | null;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  comments_count: number;
  reactions_count: number;
  user_has_reacted: boolean;
}

const ForumPage: React.FC = () => {
  const { session } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPosts();
    setupRealtimeSubscription();
  }, [categoryFilter]);

  function setupRealtimeSubscription() {
    const postsSubscription = supabase
      .channel('public:forums')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forums' }, () => {
        fetchPosts();
      })
      .subscribe();

    const commentsSubscription = supabase
      .channel('public:forum_comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_comments' }, () => {
        fetchPosts();
      })
      .subscribe();

    const reactionsSubscription = supabase
      .channel('public:forum_reactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_reactions' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      postsSubscription.unsubscribe();
      commentsSubscription.unsubscribe();
      reactionsSubscription.unsubscribe();
    };
  }

  async function fetchPosts() {
    try {
      let query = supabase
        .from('forums')
        .select(`
          *,
          profiles:user_id(username, avatar_url),
          comments_count:forum_comments(count),
          reactions_count:forum_reactions(count)
        `)
        .order('created_at', { ascending: false });

      if (categoryFilter !== 'all') {
        // In a real implementation, you would have a category column
        // This is a placeholder for demonstration
        // query = query.eq('category', categoryFilter);
      }

      const { data: postsData, error: postsError } = await query;

      if (postsError) throw postsError;

      // Get reactions for current user
      let userReactions: string[] = [];
      if (session) {
        const { data: reactionsData } = await supabase
          .from('forum_reactions')
          .select('reference_id')
          .eq('user_id', session.user.id)
          .eq('reference_type', 'post');

        userReactions = reactionsData?.map(reaction => reaction.reference_id) || [];
      }

      const formattedPosts = postsData?.map(post => ({
        ...post,
        comments_count: post.comments_count[0]?.count || 0,
        reactions_count: post.reactions_count[0]?.count || 0,
        user_has_reacted: userReactions.includes(post.id)
      })) || [];

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReaction(postId: string, hasReacted: boolean) {
    if (!session) return;

    try {
      if (hasReacted) {
        // Remove reaction
        await supabase
          .from('forum_reactions')
          .delete()
          .eq('reference_type', 'post')
          .eq('reference_id', postId)
          .eq('user_id', session.user.id);
      } else {
        // Add reaction
        await supabase
          .from('forum_reactions')
          .insert({
            reference_type: 'post',
            reference_id: postId,
            user_id: session.user.id,
            reaction_type: 'like'
          });
      }

      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                user_has_reacted: !hasReacted,
                reactions_count: hasReacted 
                  ? post.reactions_count - 1 
                  : post.reactions_count + 1
              } 
            : post
        )
      );
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  }

  const filteredPosts = posts.filter(post => {
    return post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           post.profiles.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const categories = [
    { id: 'all', name: 'Alle Themen' },
    { id: 'training', name: 'Training' },
    { id: 'health', name: 'Gesundheit' },
    { id: 'nutrition', name: 'Ernährung' },
    { id: 'behavior', name: 'Verhalten' },
    { id: 'general', name: 'Allgemein' }
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
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Community Forum</h1>
          <p className="text-gray-400">
            Diskutiere mit anderen Hundefreunden und teile deine Erfahrungen
          </p>
        </div>

        {session && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 md:mt-0 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Neuen Beitrag erstellen
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Suche im Forum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors flex items-center"
            >
              <Filter size={20} className="mr-2" />
              Filter
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 overflow-hidden"
            >
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setCategoryFilter(category.id)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      categoryFilter === category.id ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Keine Beiträge gefunden</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? 'Versuche es mit anderen Suchbegriffen'
                : 'Sei der Erste, der einen Beitrag erstellt!'}
            </p>
            {session && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
              >
                Ersten Beitrag erstellen
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map(post => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                  {post.profiles.avatar_url ? (
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${post.profiles.avatar_url}`}
                      alt={post.profiles.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-purple-400" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">{post.profiles.username}</div>
                  <div className="text-xs text-gray-400 flex items-center">
                    <Calendar size={12} className="mr-1" />
                    {new Date(post.created_at).toLocaleDateString('de-DE')}
                  </div>
                </div>
              </div>

              <Link to={`/forum/${post.id}`}>
                <h3 className="text-xl font-semibold mb-2 hover:text-purple-400 transition-colors">
                  {post.title}
                </h3>
              </Link>

              <p className="text-gray-300 mb-4 line-clamp-3">{post.content}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleReaction(post.id, post.user_has_reacted)}
                    className={`flex items-center space-x-1 ${
                      post.user_has_reacted ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    } transition-colors`}
                  >
                    <Heart
                      size={20}
                      className={post.user_has_reacted ? 'fill-current' : ''}
                    />
                    <span>{post.reactions_count}</span>
                  </button>
                  <Link
                    to={`/forum/${post.id}`}
                    className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <MessageSquare size={20} />
                    <span>{post.comments_count}</span>
                  </Link>
                </div>

                <div className="flex items-center">
                  <Tag size={16} className="text-purple-400 mr-1" />
                  <span className="text-sm text-gray-400">Training</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePostModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              fetchPosts();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForumPage;