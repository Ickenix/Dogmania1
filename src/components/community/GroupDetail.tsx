import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Users, MessageSquare, Info, Plus, ArrowLeft, 
  Lock, Globe, User, Calendar, MoreVertical, Flag 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreatePostModal from './CreatePostModal';
import GroupMembersList from './GroupMembersList';

interface Group {
  id: string;
  name: string;
  description: string;
  private: boolean;
  image_url: string;
  creator_id: string;
  created_at: string;
  _count: {
    members: number;
  };
  is_member: boolean;
  is_admin: boolean;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  _count: {
    comments: number;
    reactions: number;
  };
}

const GroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'info'>('posts');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
      fetchPosts();
    }
  }, [groupId, session]);

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
        _count: {
          members: data.members[0]?.count || 0
        },
        is_member: !!memberData,
        is_admin: memberData?.role === 'admin'
      });
    } catch (error) {
      console.error('Error fetching group details:', error);
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  }

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from('forums')
        .select(`
          *,
          profiles:user_id(username, avatar_url),
          comments:forum_comments(count),
          reactions:forum_reactions(count)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts = data.map(post => ({
        ...post,
        _count: {
          comments: post.comments[0]?.count || 0,
          reactions: post.reactions[0]?.count || 0
        }
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Gruppe nicht gefunden</h2>
        <p className="text-gray-400 mb-6">Die gesuchte Gruppe existiert nicht oder wurde gelöscht.</p>
        <Link
          to="/groups"
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors inline-flex items-center"
        >
          <ArrowLeft size={20} className="mr-2" />
          Zurück zu Gruppen
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        to="/groups"
        className="inline-flex items-center text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Zurück zu Gruppen
      </Link>

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

      {/* Tabs */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 mb-8">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'posts'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare size={18} className="inline-block mr-2" />
            Beiträge
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'members'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users size={18} className="inline-block mr-2" />
            Mitglieder
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'info'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Info size={18} className="inline-block mr-2" />
            Info
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {group.is_member && (
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
                >
                  <Plus size={18} className="mr-2" />
                  Neuen Beitrag erstellen
                </button>
              </div>
            )}

            {posts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Keine Beiträge</h3>
                <p className="text-gray-400 mb-6">
                  In dieser Gruppe wurden noch keine Beiträge erstellt.
                </p>
                {group.is_member && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
                  >
                    Ersten Beitrag erstellen
                  </button>
                )}
              </div>
            ) : (
              posts.map(post => (
                <div
                  key={post.id}
                  className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => navigate(`/forum/${post.id}`)}
                >
                  <div className="flex items-center mb-2">
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
                      <div className="text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold mb-2">{post.title}</h3>
                  <p className="text-gray-300 mb-3 line-clamp-2">{post.content}</p>
                  
                  <div className="flex items-center text-sm text-gray-400">
                    <div className="flex items-center mr-4">
                      <MessageSquare size={14} className="mr-1" />
                      {post._count.comments} Kommentare
                    </div>
                    <div className="flex items-center">
                      <Heart size={14} className="mr-1" />
                      {post._count.reactions} Likes
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <GroupMembersList groupId={group.id} isAdmin={group.is_admin} />
        )}

        {activeTab === 'info' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Über diese Gruppe</h3>
              <p className="text-gray-300">{group.description}</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Details</h3>
              <div className="bg-white/5 rounded-lg p-4 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Erstellt am</span>
                  <span>{new Date(group.created_at).toLocaleDateString('de-DE')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sichtbarkeit</span>
                  <span className="flex items-center">
                    {group.private ? (
                      <>
                        <Lock size={14} className="mr-1 text-yellow-400" />
                        Privat
                      </>
                    ) : (
                      <>
                        <Globe size={14} className="mr-1 text-green-400" />
                        Öffentlich
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mitglieder</span>
                  <span>{group._count.members}</span>
                </div>
              </div>
            </div>
            
            {group.is_member && (
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleLeaveGroup}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Gruppe verlassen
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePostModal
            groupId={group.id}
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

export default GroupDetail;