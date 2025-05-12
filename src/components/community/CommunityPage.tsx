import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Users, Plus, Search, Lock, Globe, MessageSquare, Heart, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreateGroupModal from './CreateGroupModal';
import GroupCard from './GroupCard';
import Community from '../dashboard/Community';

interface Group {
  id: string;
  name: string;
  description: string;
  is_private: boolean;
  image_url: string;
  creator_id: string;
  created_at: string;
  member_count: number;
  thread_count: number;
}

const CommunityPage = () => {
  const { session } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, my, public, private
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'groups'>('feed');

  useEffect(() => {
    fetchGroups();
  }, [session, filter]);

  async function fetchGroups() {
    try {
      let query = supabase.from('groups').select('*');

      // Apply filters
      if (filter === 'my' && session) {
        // First get the groups where the user is a member
        const { data: memberGroups } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', session.user.id);

        if (memberGroups) {
          const groupIds = memberGroups.map(mg => mg.group_id);
          query = query.in('id', groupIds);
        }
      } else if (filter === 'public') {
        query = query.eq('is_private', false);
      } else if (filter === 'private') {
        query = query.eq('is_private', true);
      }

      const { data: groupsData, error: groupsError } = await query;
      if (groupsError) throw groupsError;

      // Fetch member counts separately
      const memberCountPromises = groupsData?.map(group =>
        supabase
          .from('group_members')
          .select('id', { count: 'exact' })
          .eq('group_id', group.id)
      );

      // Fetch thread counts separately
      const threadCountPromises = groupsData?.map(group =>
        supabase
          .from('group_threads')
          .select('id', { count: 'exact' })
          .eq('group_id', group.id)
      );

      const memberCounts = await Promise.all(memberCountPromises || []);
      const threadCounts = await Promise.all(threadCountPromises || []);

      // Combine the data
      const groupsWithCounts = groupsData?.map((group, index) => ({
        ...group,
        member_count: memberCounts[index].count || 0,
        thread_count: threadCounts[index].count || 0
      }));

      setGroups(groupsWithCounts || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Community</h1>
          <p className="text-gray-400">
            Entdecke Gruppen und tausche dich mit anderen Hundefreunden aus
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex gap-4">
          {session && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
            >
              <Plus size={20} className="mr-2" />
              Gruppe erstellen
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'feed'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'groups'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Gruppen
          </button>
        </div>
      </div>

      {activeTab === 'feed' ? (
        <Community />
      ) : (
        <>
          {/* Filters and Search */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Suche nach Gruppen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'all' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  Alle
                </button>
                {session && (
                  <button
                    onClick={() => setFilter('my')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filter === 'my' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Meine Gruppen
                  </button>
                )}
                <button
                  onClick={() => setFilter('public')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'public' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  Öffentlich
                </button>
                <button
                  onClick={() => setFilter('private')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'private' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  Privat
                </button>
              </div>
            </div>
          </div>

          {/* Groups Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Keine Gruppen gefunden</h3>
              <p className="text-gray-400">
                {searchQuery
                  ? 'Versuche es mit anderen Suchbegriffen'
                  : 'Erstelle eine neue Gruppe und starte die Community!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <GroupCard key={group.id} group={group} onUpdate={fetchGroups} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchGroups();
          }}
        />
      )}
    </div>
  );
};

export default CommunityPage;