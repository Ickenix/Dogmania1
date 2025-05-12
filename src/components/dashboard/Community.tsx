import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Heart, MessageCircle, Image as ImageIcon, MoreVertical, Trash2, Edit2, Filter, MapPin, Search, Dog, Tag, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    location: string;
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
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [dogTypeFilter, setDogTypeFilter] = useState('');
  const [postTypeFilter, setPostTypeFilter] = useState('');
  const [localOnlyFilter, setLocalOnlyFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [postCategory, setPostCategory] = useState('');
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  // Available filter options
  const dogTypes = ['Kangal', 'Maremmano', 'Labrador', 'Golden Retriever', 'Deutscher Schäferhund', 'Dackel', 'Mops', 'Mischling'];
  const postTypes = ['Frage', 'Erfahrung', 'Tipp', 'Bild', 'Video'];
  const categories = ['Training', 'Ernährung', 'Gesundheit', 'Verhalten', 'Spiel & Spaß', 'Sonstiges'];

  useEffect(() => {
    fetchPosts();
    setupRealtimeSubscription();
    
    // Get user's location for local filtering
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  async function fetchPosts() {
    try {
      setError(null);
      setLoading(true);

      // First fetch posts with profiles
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles (username, avatar_url, location, latitude, longitude)
        `)
        .order('created_at', { ascending: false });

      if (postsError) {
        throw new Error(`Error fetching posts: ${postsError.message}`);
      }

      if (!postsData) {
        throw new Error('No posts data received');
      }

      // Then fetch likes count for each post
      const likesPromises = postsData.map(post =>
        supabase
          .from('community_likes')
          .select('id', { count: 'exact' })
          .eq('post_id', post.id)
      );

      // Fetch comments count for each post
      const commentsPromises = postsData.map(post =>
        supabase
          .from('community_comments')
          .select('id', { count: 'exact' })
          .eq('post_id', post.id)
      );

      // Get user's likes if logged in
      let userLikes = new Set();
      if (session?.user.id) {
        const { data: likesData, error: likesError } = await supabase
          .from('community_likes')
          .select('post_id')
          .eq('user_id', session.user.id);

        if (likesError) {
          console.error('Error fetching user likes:', likesError);
        } else {
          userLikes = new Set(likesData?.map(like => like.post_id));
        }
      }

      // Wait for all counts to be fetched
      const likesResults = await Promise.all(likesPromises);
      const commentsResults = await Promise.all(commentsPromises);

      // Combine all data
      const postsWithCounts = postsData.map((post, index) => ({
        ...post,
        likes_count: likesResults[index].count || 0,
        comments_count: commentsResults[index].count || 0,
        user_has_liked: userLikes.has(post.id)
      }));

      setPosts(postsWithCounts);
    } catch (error: any) {
      console.error('Error in fetchPosts:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('community_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Header with filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold">Community</h1>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filter
            </button>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Suche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white rounded-lg shadow p-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hunderasse
                  </label>
                  <select
                    value={dogTypeFilter}
                    onChange={(e) => setDogTypeFilter(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Alle Rassen</option>
                    {dogTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beitragstyp
                  </label>
                  <select
                    value={postTypeFilter}
                    onChange={(e) => setPostTypeFilter(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Alle Typen</option>
                    {postTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategorie
                  </label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Alle Kategorien</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localOnlyFilter}
                    onChange={(e) => setLocalOnlyFilter(e.target.checked)}
                    className="rounded text-blue-500"
                  />
                  <span className="text-sm text-gray-700">Nur Beiträge in meiner Nähe</span>
                </label>

                <button
                  onClick={() => {
                    setDogTypeFilter('');
                    setPostTypeFilter('');
                    setPostCategory('');
                    setLocalOnlyFilter(false);
                    setSearchQuery('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Filter zurücksetzen
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">Keine Beiträge gefunden</p>
            </div>
          ) : (
            posts.map(post => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {/* Post header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={post.profiles.avatar_url || 'https://via.placeholder.com/40'}
                        alt={post.profiles.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-medium">{post.profiles.username}</h3>
                        {post.profiles.location && (
                          <p className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {post.profiles.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <button className="text-gray-500 hover:text-gray-700">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Post content */}
                <div className="p-4">
                  <h4 className="font-medium mb-2">{post.title}</h4>
                  <p className="text-gray-600 mb-4">{post.content}</p>
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Post image"
                      className="rounded-lg w-full h-48 object-cover mb-4"
                    />
                  )}
                  {post.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      <Tag className="w-4 h-4 mr-1" />
                      {post.category}
                    </span>
                  )}
                </div>

                {/* Post actions */}
                <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      className={`flex items-center space-x-1 ${
                        post.user_has_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${post.user_has_liked ? 'fill-current' : ''}`} />
                      <span>{post.likes_count}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.comments_count}</span>
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;