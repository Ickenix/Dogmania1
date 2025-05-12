import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Users, Plus, Search, Lock, Globe, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CreateGroupModal from './CreateGroupModal';
import GroupCard from './GroupCard';

interface Group {
  id: string;
  name: string;
  description: string;
  is_private: boolean;
  image_url: string;
  creator_id: string;
  created_at: string;
  members_count: number;
  forums_count: number;
  is_member?: boolean;
}

const GroupsPage: React.FC = () => {
  const { session } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, my, public, private
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGroups();
  }, [session, filter]);

  async function fetchGroups() {
    try {
      setLoading(true);
      let query = supabase
        .from('groups')
        .select(`
          *,
          members_count: group_members(count),
          forums_count: forums(count),
          is_member: group_members!inner(user_id)
        `);

      // Apply filters
      if (filter === 'my' && session?.user?.id) {
        query = query.eq('group_members.user_id', session.user.id);
      } else if (filter === 'public') {
        query = query.eq('is_private', false);
      } else if (filter === 'private') {
        query = query.eq('is_private', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to match our Group interface
      const transformedGroups: Group[] = (data || []).map(group => ({
        ...group,
        members_count: group.members_count || 0,
        forums_count: group.forums_count || 0,
        is_member: Boolean(group.is_member)
      }));

      setGroups(transformedGroups);
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
          <h1 className="text-3xl font-bold mb-2">Gruppen</h1>
          <p className="text-gray-400">
            Entdecke Gruppen und tausche dich mit anderen Hundefreunden aus
          </p>
        </div>

        {session && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 md:mt-0 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Gruppe erstellen
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
              placeholder="Suche nach Gruppen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-3 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Alle
            </button>
            {session && (
              <button
                onClick={() => setFilter('my')}
                className={`px-4 py-3 rounded-lg transition-colors ${
                  filter === 'my' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                Meine Gruppen
              </button>
            )}
            <button
              onClick={() => setFilter('public')}
              className={`px-4 py-3 rounded-lg transition-colors ${
                filter === 'public' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Öffentlich
            </button>
            <button
              onClick={() => setFilter('private')}
              className={`px-4 py-3 rounded-lg transition-colors ${
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

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateGroupModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              fetchGroups();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupsPage;