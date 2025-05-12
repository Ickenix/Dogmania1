import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Users, MessageSquare, Heart, Flag, Send, Plus, Edit2, Trash2, MoreVertical, Lock, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateThreadModal from './CreateThreadModal';
import ReportModal from './ReportModal';

interface Group {
  id: string;
  name: string;
  description: string;
  is_private: boolean;
  image_url: string;
  creator_id: string;
  created_at: string;
  _count: {
    members: number;
  };
  is_member: boolean;
  is_admin: boolean;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  user_id: string;
  author: {
    username: string;
    avatar_url: string;
  };
  _count: {
    comments: number;
    likes: number;
  };
  user_has_liked: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author: {
    username: string;
    avatar_url: string;
  };
  _count: {
    likes: number;
  };
  user_has_liked: boolean;
}

const GroupPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'thread' | 'comment'>('thread');
  const [reportId, setReportId] = useState<string>('');

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
      fetchThreads();
    }
  }, [groupId, session]);

  useEffect(() => {
    if (selectedThread) {
      fetchComments(selectedThread.id);
    }
  }, [selectedThread]);

  async function fetchGroupDetails() {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          members:group_members(count)
        `)
        .eq('id', groupId)
        .single();

      if (error) throw error;

      // Check if user is a member
      const { data: memberData } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', session?.user.id)
        .single();

      setGroup({
        ...data,
        is_member: !!memberData,
        is_admin: memberData?.role === 'admin'
      });
    } catch (error) {
      console.error('Error fetching group details:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchThreads() {
    try {
      const { data: threadsData, error: threadsError } = await supabase
        .from('group_threads')
        .select(`
          *,
          author:user_id(username, avatar_url),
          comments:group_comments(count),
          likes:group_likes(count)
        `)
        .eq('group_id', groupId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (threadsError) throw threadsError;

      // Get likes for current user
      const { data: likesData } = await supabase
        .from('group_likes')
        .select('reference_id')
        .eq('user_id', session?.user.id)
        .eq('reference_type', 'thread');

      const likedThreadIds = new Set(likesData?.map(like => like.reference_id) || []);

      const threadsWithLikes = threadsData?.map(thread => ({
        ...thread,
        _count: {
          comments: thread.comments[0]?.count || 0,
          likes: thread.likes[0]?.count || 0
        },
        user_has_liked: likedThreadIds.has(thread.id)
      }));

      setThreads(threadsWithLikes || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  }

  async function fetchComments(threadId: string) {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('group_comments')
        .select(`
          *,
          author:user_id(username, avatar_url),
          likes:group_likes(count)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Get likes for current user
      const { data: likesData } = await supabase
        .from('group_likes')
        .select('reference_id')
        .eq('user_id', session?.user.id)
        .eq('reference_type', 'comment');

      const likedCommentIds = new Set(likesData?.map(like => like.reference_id) || []);

      const commentsWithLikes = commentsData?.map(comment => ({
        ...comment,
        _count: {
          likes: comment.likes[0]?.count || 0
        },
        user_has_liked: likedCommentIds.has(comment.id)
      }));

      setComments(commentsWithLikes || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }

  async function handleJoinGroup() {
    if (!session) {
      navigate('/login');
      return;
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: session.user.id,
          role: 'member'
        });

      if (error) throw error;
      fetchGroupDetails();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  }

  async function handleLeaveGroup() {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', session?.user.id);

      if (error) throw error;
      fetchGroupDetails();
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  }

  async function handleLikeThread(threadId: string, currentlyLiked: boolean) {
    if (!session) {
      navigate('/login');
      return;
    }

    try {
      if (currentlyLiked) {
        await supabase
          .from('group_likes')
          .delete()
          .eq('reference_type', 'thread')
          .eq('reference_id', threadId)
          .eq('user_id', session.user.id);
      } else {
        await supabase
          .from('group_likes')
          .insert({
            reference_type: 'thread',
            reference_id: threadId,
            user_id: session.user.id
          });
      }

      fetchThreads();
      if (selectedThread?.id === threadId) {
        setSelectedThread(prev => 
          prev ? {
            ...prev,
            _count: {
              ...prev._count,
              likes: currentlyLiked ? prev._count.likes - 1 : prev._count.likes + 1
            },
            user_has_liked: !currentlyLiked
          } : null
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  async function handleLikeComment(commentId: string, currentlyLiked: boolean) {
    if (!session) {
      navigate('/login');
      return;
    }

    try {
      if (currentlyLiked) {
        await supabase
          .from('group_likes')
          .delete()
          .eq('reference_type', 'comment')
          .eq('reference_id', commentId)
          .eq('user_id', session.user.id);
      } else {
        await supabase
          .from('group_likes')
          .insert({
            reference_type: 'comment',
            reference_id: commentId,
            user_id: session.user.id
          });
      }

      fetchComments(selectedThread!.id);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  async function handleSubmitComment() {
    if (!session || !selectedThread || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('group_comments')
        .insert({
          thread_id: selectedThread.id,
          user_id: session.user.id,
          content: newComment
        });

      if (error) throw error;

      setNewComment('');
      fetchComments(selectedThread.id);
      
      // Update comment count in selected thread
      setSelectedThread(prev => 
        prev ? {
          ...prev,
          _count: {
            ...prev._count,
            comments: prev._count.comments + 1
          }
        } : null
      );
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  }

  async function handleDeleteThread(threadId: string) {
    try {
      const { error } = await supabase
        .from('group_threads')
        .delete()
        .eq('id', threadId);

      if (error) throw error;
      
      if (selectedThread?.id === threadId) {
        setSelectedThread(null);
      }
      
      fetchThreads();
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      const { error } = await supabase
        .from('group_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      
      fetchComments(selectedThread!.id);
      
      // Update comment count in selected thread
      setSelectedThread(prev => 
        prev ? {
          ...prev,
          _count: {
            ...prev._count,
            comments: Math.max(0, prev._count.comments - 1)
          }
        } : null
      );
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  async function handlePinThread(threadId: string, currentlyPinned: boolean) {
    try {
      const { error } = await supabase
        .from('group_threads')
        .update({ is_pinned: !currentlyPinned })
        .eq('id', threadId);

      if (error) throw error;
      
      fetchThreads();
      if (selectedThread?.id === threadId) {
        setSelectedThread(prev => 
          prev ? { ...prev, is_pinned: !currentlyPinned } : null
        );
      }
    } catch (error) {
      console.error('Error pinning thread:', error);
    }
  }

  async function handleLockThread(threadId: string, currentlyLocked: boolean) {
    try {
      const { error } = await supabase
        .from('group_threads')
        .update({ is_locked: !currentlyLocked })
        .eq('id', threadId);

      if (error) throw error;
      
      fetchThreads();
      if (selectedThread?.id === threadId) {
        setSelectedThread(prev => 
          prev ? { ...prev, is_locked: !currentlyLocked } : null
        );
      }
    } catch (error) {
      console.error('Error locking thread:', error);
    }
  }

  function handleReportThread(threadId: string) {
    setReportType('thread');
    setReportId(threadId);
    setShowReportModal(true);
  }

  function handleReportComment(commentId: string) {
    setReportType('comment');
    setReportId(commentId);
    setShowReportModal(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Gruppe nicht gefunden</h2>
        <p className="text-gray-400 mb-6">Die gesuchte Gruppe existiert nicht oder du hast keinen Zugriff.</p>
        <button
          onClick={() => navigate('/community')}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
        >
          Zurück zur Community
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Group Header */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 h-40 md:h-auto rounded-xl overflow-hidden">
            <img
              src={group.image_url || 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'}
              alt={group.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{group.name}</h1>
              {group.is_private ? (
                <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm flex items-center">
                  <Lock size={14} className="mr-1" />
                  Privat
                </div>
              ) : (
                <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm flex items-center">
                  <Globe size={14} className="mr-1" />
                  Öffentlich
                </div>
              )}
            </div>
            
            <p className="text-gray-300 mb-4">{group.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
              <div className="flex items-center">
                <Users size={16} className="mr-1" />
                {group._count.members} Mitglieder
              </div>
            </div>
            
            {group.is_member ? (
              <button
                onClick={handleLeaveGroup}
                className="px-6 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
              >
                Gruppe verlassen
              </button>
            ) : (
              <button
                onClick={handleJoinGroup}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors"
              >
                Gruppe beitreten
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Threads List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Diskussionen</h2>
            {group.is_member && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
              >
                <Plus size={18} className="mr-2" />
                Neues Thema
              </button>
            )}
          </div>

          <div className="space-y-2">
            {threads.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 text-center">
                <MessageSquare size={32} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Keine Diskussionen</h3>
                <p className="text-gray-400 mb-4">
                  Sei der Erste, der eine Diskussion in dieser Gruppe startet!
                </p>
                {group.is_member && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors"
                  >
                    Diskussion starten
                  </button>
                )}
              </div>
            ) : (
              threads.map(thread => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`bg-white/5 backdrop-blur-lg rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-all ${
                    selectedThread?.id === thread.id ? 'ring-2 ring-purple-500' : ''
                  } ${thread.is_pinned ? 'border-l-4 border-yellow-500' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      {thread.author.avatar_url ? (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${thread.author.avatar_url}`}
                          alt={thread.author.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="text-sm font-bold text-purple-300">
                          {thread.author.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold truncate pr-2">{thread.title}</h3>
                        {thread.is_locked && (
                          <Lock size={14} className="text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">{thread.content}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span>{thread.author.username}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center mt-1 text-xs text-gray-400">
                        <div className="flex items-center mr-3">
                          <MessageSquare size={12} className="mr-1" />
                          {thread._count.comments}
                        </div>
                        <div className="flex items-center">
                          <Heart size={12} className="mr-1" />
                          {thread._count.likes}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Thread Detail */}
        <div className="lg:col-span-2">
          {selectedThread ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    {selectedThread.author.avatar_url ? (
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${selectedThread.author.avatar_url}`}
                        alt={selectedThread.author.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="text-lg font-bold text-purple-300">
                        {selectedThread.author.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedThread.title}</h2>
                    <div className="flex items-center text-sm text-gray-400">
                      <span>{selectedThread.author.username}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(selectedThread.created_at).toLocaleDateString()}</span>
                      {selectedThread.is_locked && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="flex items-center text-yellow-400">
                            <Lock size={14} className="mr-1" />
                            Geschlossen
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreVertical size={20} />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden invisible group-hover:visible z-10">
                    {(selectedThread.user_id === session?.user.id || group.is_admin) && (
                      <>
                        <button
                          onClick={() => handleDeleteThread(selectedThread.id)}
                          className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center space-x-2 text-red-400"
                        >
                          <Trash2 size={16} />
                          <span>Löschen</span>
                        </button>
                        {group.is_admin && (
                          <>
                            <button
                              onClick={() => handlePinThread(selectedThread.id, selectedThread.is_pinned)}
                              className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center space-x-2"
                            >
                              <Plus size={16} />
                              <span>{selectedThread.is_pinned ? 'Nicht mehr anpinnen' : 'Anpinnen'}</span>
                            </button>
                            <button
                              onClick={() => handleLockThread(selectedThread.id, selectedThread.is_locked)}
                              className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center space-x-2"
                            >
                              <Lock size={16} />
                              <span>{selectedThread.is_locked ? 'Entsperren' : 'Sperren'}</span>
                            </button>
                          </>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => handleReportThread(selectedThread.id)}
                      className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center space-x-2"
                    >
                      <Flag size={16} />
                      <span>Melden</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-gray-200 whitespace-pre-line">{selectedThread.content}</p>
              </div>

              <div className="flex items-center space-x-4 mb-8 border-t border-b border-white/10 py-4">
                <button
                  onClick={() => handleLikeThread(selectedThread.id, selectedThread.user_has_liked)}
                  className={`flex items-center space-x-1 ${
                    selectedThread.user_has_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  } transition-colors`}
                  disabled={!session}
                >
                  <Heart
                    size={20}
                    className={selectedThread.user_has_liked ? 'fill-current' : ''}
                  />
                  <span>{selectedThread._count.likes}</span>
                </button>
                <button
                  className="flex items-center space-x-1 text-gray-400"
                >
                  <MessageSquare size={20} />
                  <span>{selectedThread._count.comments}</span>
                </button>
              </div>

              {/* Comments */}
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Kommentare</h3>
                
                {comments.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    Noch keine Kommentare. Sei der Erste!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            {comment.author.avatar_url ? (
                              <img
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${comment.author.avatar_url}`}
                                alt={comment.author.username}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <div className="text-sm font-bold text-purple-300">
                                {comment.author.username[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-semibold">{comment.author.username}</div>
                                <div className="text-xs text-gray-400">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="relative group">
                                <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                  <MoreVertical size={16} />
                                </button>
                                <div className="absolute right-0 mt-1 w-40 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden invisible group-hover:visible z-10">
                                  {(comment.user_id === session?.user.id || group.is_admin) && (
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="w-full px-3 py-2 text-left hover:bg-white/10 transition-colors flex items-center space-x-2 text-red-400 text-sm"
                                    >
                                      <Trash2 size={14} />
                                      <span>Löschen</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleReportComment(comment.id)}
                                    className="w-full px-3 py-2 text-left hover:bg-white/10 transition-colors flex items-center space-x-2 text-sm"
                                  >
                                    <Flag size={14} />
                                    <span>Melden</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                            <p className="mt-2 text-gray-200">{comment.content}</p>
                            <div className="mt-2">
                              <button
                                onClick={() => handleLikeComment(comment.id, comment.user_has_liked)}
                                className={`flex items-center space-x-1 text-sm ${
                                  comment.user_has_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                                } transition-colors`}
                                disabled={!session}
                              >
                                <Heart
                                  size={14}
                                  className={comment.user_has_liked ? 'fill-current' : ''}
                                />
                                <span>{comment._count.likes}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Form */}
                {group.is_member && !selectedThread.is_locked && (
                  <div className="mt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        {session?.user && (
                          <div className="text-sm font-bold text-purple-300">
                            {session.user.email?.[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Schreibe einen Kommentar..."
                          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={handleSubmitComment}
                          disabled={!newComment.trim()}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedThread.is_locked && (
                  <div className="mt-4 bg-yellow-500/10 text-yellow-400 px-4 py-3 rounded-lg flex items-center">
                    <Lock size={18} className="mr-2" />
                    Diese Diskussion wurde geschlossen und kann nicht mehr kommentiert werden.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Wähle eine Diskussion</h3>
              <p className="text-gray-400">
                Wähle eine Diskussion aus der Liste oder starte eine neue.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Thread Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateThreadModal
            groupId={groupId!}
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              fetchThreads();
            }}
          />
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <ReportModal
            type={reportType}
            referenceId={reportId}
            onClose={() => setShowReportModal(false)}
            onSubmitted={() => {
              setShowReportModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupPage;