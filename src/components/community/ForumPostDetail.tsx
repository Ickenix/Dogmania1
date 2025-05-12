import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Heart, MessageSquare, User, Calendar, MoreVertical, Flag, Trash2, Edit2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportModal from './ReportModal';

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
  reactions_count: number;
  user_has_reacted: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  reactions_count: number;
  user_has_reacted: boolean;
}

const ForumPostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'post' | 'comment'>('post');
  const [reportId, setReportId] = useState<string>('');
  
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (postId) {
      fetchPostDetails();
      fetchComments();
      setupRealtimeSubscription();
    }
  }, [postId]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  function setupRealtimeSubscription() {
    const commentsSubscription = supabase
      .channel('public:forum_comments')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'forum_comments',
        filter: `forum_id=eq.${postId}`
      }, () => {
        fetchComments();
      })
      .subscribe();

    const reactionsSubscription = supabase
      .channel('public:forum_reactions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'forum_reactions' 
      }, () => {
        fetchPostDetails();
        fetchComments();
      })
      .subscribe();

    return () => {
      commentsSubscription.unsubscribe();
      reactionsSubscription.unsubscribe();
    };
  }

  async function fetchPostDetails() {
    try {
      const { data: postData, error: postError } = await supabase
        .from('forums')
        .select(`
          *,
          profiles:user_id(username, avatar_url),
          reactions_count:forum_reactions(count)
        `)
        .eq('id', postId)
        .single();

      if (postError) throw postError;

      // Get reaction status for current user
      let userHasReacted = false;
      if (session) {
        const { data: reactionData } = await supabase
          .from('forum_reactions')
          .select('id')
          .eq('reference_type', 'post')
          .eq('reference_id', postId)
          .eq('user_id', session.user.id)
          .maybeSingle();

        userHasReacted = !!reactionData;
      }

      setPost({
        ...postData,
        reactions_count: postData.reactions_count[0]?.count || 0,
        user_has_reacted: userHasReacted
      });
    } catch (error) {
      console.error('Error fetching post details:', error);
      navigate('/forum');
    } finally {
      setLoading(false);
    }
  }

  async function fetchComments() {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('forum_comments')
        .select(`
          *,
          profiles:user_id(username, avatar_url),
          reactions_count:forum_reactions(count)
        `)
        .eq('forum_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Get reaction status for current user
      let userReactions: string[] = [];
      if (session) {
        const { data: reactionsData } = await supabase
          .from('forum_reactions')
          .select('reference_id')
          .eq('reference_type', 'comment')
          .eq('user_id', session.user.id)
          .in('reference_id', commentsData.map(comment => comment.id));

        userReactions = reactionsData?.map(reaction => reaction.reference_id) || [];
      }

      const formattedComments = commentsData.map(comment => ({
        ...comment,
        reactions_count: comment.reactions_count[0]?.count || 0,
        user_has_reacted: userReactions.includes(comment.id)
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }

  async function handlePostReaction() {
    if (!session || !post) return;

    try {
      if (post.user_has_reacted) {
        // Remove reaction
        await supabase
          .from('forum_reactions')
          .delete()
          .eq('reference_type', 'post')
          .eq('reference_id', post.id)
          .eq('user_id', session.user.id);
      } else {
        // Add reaction
        await supabase
          .from('forum_reactions')
          .insert({
            reference_type: 'post',
            reference_id: post.id,
            user_id: session.user.id,
            reaction_type: 'like'
          });
      }

      // Update local state
      setPost(prev => {
        if (!prev) return null;
        return {
          ...prev,
          user_has_reacted: !prev.user_has_reacted,
          reactions_count: prev.user_has_reacted 
            ? prev.reactions_count - 1 
            : prev.reactions_count + 1
        };
      });
    } catch (error) {
      console.error('Error toggling post reaction:', error);
    }
  }

  async function handleCommentReaction(commentId: string, hasReacted: boolean) {
    if (!session) return;

    try {
      if (hasReacted) {
        // Remove reaction
        await supabase
          .from('forum_reactions')
          .delete()
          .eq('reference_type', 'comment')
          .eq('reference_id', commentId)
          .eq('user_id', session.user.id);
      } else {
        // Add reaction
        await supabase
          .from('forum_reactions')
          .insert({
            reference_type: 'comment',
            reference_id: commentId,
            user_id: session.user.id,
            reaction_type: 'like'
          });
      }

      // Update local state
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                user_has_reacted: !hasReacted,
                reactions_count: hasReacted 
                  ? comment.reactions_count - 1 
                  : comment.reactions_count + 1
              } 
            : comment
        )
      );
    } catch (error) {
      console.error('Error toggling comment reaction:', error);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !newComment.trim()) return;

    try {
      setCommentLoading(true);

      const { error } = await supabase
        .from('forum_comments')
        .insert({
          forum_id: postId,
          user_id: session.user.id,
          content: newComment
        });

      if (error) throw error;

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setCommentLoading(false);
    }
  }

  async function handleDeletePost() {
    if (!session || !post) return;
    if (!confirm('Bist du sicher, dass du diesen Beitrag löschen möchtest?')) return;

    try {
      const { error } = await supabase
        .from('forums')
        .delete()
        .eq('id', post.id)
        .eq('user_id', session.user.id);

      if (error) throw error;
      navigate('/forum');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!session) return;
    if (!confirm('Bist du sicher, dass du diesen Kommentar löschen möchtest?')) return;

    try {
      const { error } = await supabase
        .from('forum_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', session.user.id);

      if (error) throw error;
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  function handleReportPost() {
    if (!post) return;
    setReportType('post');
    setReportId(post.id);
    setShowReportModal(true);
  }

  function handleReportComment(commentId: string) {
    setReportType('comment');
    setReportId(commentId);
    setShowReportModal(true);
  }

  function scrollToBottom() {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Beitrag nicht gefunden</h2>
        <p className="text-gray-400 mb-6">Der gesuchte Beitrag existiert nicht oder wurde gelöscht.</p>
        <Link
          to="/forum"
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors inline-flex items-center"
        >
          <ArrowLeft size={20} className="mr-2" />
          Zurück zum Forum
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        to="/forum"
        className="inline-flex items-center text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Zurück zum Forum
      </Link>

      {/* Post */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mr-4">
              {post.profiles.avatar_url ? (
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${post.profiles.avatar_url}`}
                  alt={post.profiles.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={24} className="text-purple-400" />
              )}
            </div>
            <div>
              <div className="font-semibold text-lg">{post.profiles.username}</div>
              <div className="text-sm text-gray-400 flex items-center">
                <Calendar size={14} className="mr-1" />
                {new Date(post.created_at).toLocaleDateString('de-DE')}
              </div>
            </div>
          </div>

          <div className="relative group">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <MoreVertical size={20} />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-blue-900/90 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden invisible group-hover:visible z-10">
              {session?.user.id === post.user_id ? (
                <>
                  <Link
                    to={`/forum/edit/${post.id}`}
                    className="block px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center"
                  >
                    <Edit2 size={16} className="mr-2" />
                    Bearbeiten
                  </Link>
                  <button
                    onClick={handleDeletePost}
                    className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center text-red-400"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Löschen
                  </button>
                </>
              ) : (
                <button
                  onClick={handleReportPost}
                  className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center"
                >
                  <Flag size={16} className="mr-2" />
                  Melden
                </button>
              )}
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
        <p className="text-gray-200 whitespace-pre-line mb-6">{post.content}</p>

        <div className="flex items-center space-x-4 border-t border-white/10 pt-4">
          <button
            onClick={handlePostReaction}
            className={`flex items-center space-x-1 ${
              post.user_has_reacted ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            } transition-colors`}
            disabled={!session}
          >
            <Heart
              size={20}
              className={post.user_has_reacted ? 'fill-current' : ''}
            />
            <span>{post.reactions_count}</span>
          </button>
          <div className="flex items-center space-x-1 text-gray-400">
            <MessageSquare size={20} />
            <span>{comments.length}</span>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6">Kommentare</h2>

        <div className="space-y-6 mb-6">
          {comments.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              Noch keine Kommentare. Sei der Erste!
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    {comment.profiles.avatar_url ? (
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${comment.profiles.avatar_url}`}
                        alt={comment.profiles.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{comment.profiles.username}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(comment.created_at).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                      <div className="relative group">
                        <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                          <MoreVertical size={16} />
                        </button>
                        <div className="absolute right-0 mt-1 w-40 bg-blue-900/90 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden invisible group-hover:visible z-10">
                          {session?.user.id === comment.user_id ? (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="w-full px-3 py-2 text-left hover:bg-white/10 transition-colors flex items-center text-red-400 text-sm"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Löschen
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReportComment(comment.id)}
                              className="w-full px-3 py-2 text-left hover:bg-white/10 transition-colors flex items-center text-sm"
                            >
                              <Flag size={14} className="mr-2" />
                              Melden
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-200">{comment.content}</p>
                    <div className="mt-2">
                      <button
                        onClick={() => handleCommentReaction(comment.id, comment.user_has_reacted)}
                        className={`flex items-center space-x-1 text-sm ${
                          comment.user_has_reacted ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                        } transition-colors`}
                        disabled={!session}
                      >
                        <Heart
                          size={14}
                          className={comment.user_has_reacted ? 'fill-current' : ''}
                        />
                        <span>{comment.reactions_count}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment Form */}
        {session ? (
          <form onSubmit={handleSubmitComment} className="mt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-purple-400" />
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Schreibe einen Kommentar..."
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || commentLoading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {commentLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <p className="text-gray-300 mb-2">Melde dich an, um zu kommentieren</p>
            <Link
              to="/login"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors"
            >
              Anmelden
            </Link>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <ReportModal
            type={reportType}
            referenceId={reportId}
            onClose={() => setShowReportModal(false)}
            onSubmitted={() => setShowReportModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForumPostDetail;