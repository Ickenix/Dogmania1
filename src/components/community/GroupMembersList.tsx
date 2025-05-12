import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, Shield, MoreVertical, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface GroupMembersListProps {
  groupId: string;
  isAdmin: boolean;
}

const GroupMembersList: React.FC<GroupMembersListProps> = ({ groupId, isAdmin }) => {
  const { session } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  async function fetchMembers() {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('role', { ascending: false })
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!isAdmin) return;
    if (!confirm('Bist du sicher, dass du dieses Mitglied entfernen möchtest?')) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  }

  async function handlePromoteToAdmin(memberId: string) {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('id', memberId);

      if (error) throw error;
      fetchMembers();
    } catch (error) {
      console.error('Error promoting member:', error);
    }
  }

  async function handleInviteUser(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !inviteEmail.trim()) return;

    try {
      setInviteLoading(true);

      // In a real implementation, you would:
      // 1. Check if the user exists
      // 2. Send an invitation or add them directly to the group
      // 3. Notify the user

      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInviteSuccess(true);
      setInviteEmail('');
      
      setTimeout(() => {
        setInviteSuccess(false);
        setShowInviteModal(false);
      }, 2000);
    } catch (error) {
      console.error('Error inviting user:', error);
    } finally {
      setInviteLoading(false);
    }
  }

  const filteredMembers = members.filter(member =>
    member.profiles.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Mitglieder ({members.length})</h3>
        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
          >
            <UserPlus size={18} className="mr-2" />
            Mitglied einladen
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Nach Mitgliedern suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="space-y-2">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            Keine Mitglieder gefunden
          </div>
        ) : (
          filteredMembers.map(member => (
            <div
              key={member.id}
              className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                  {member.profiles.avatar_url ? (
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${member.profiles.avatar_url}`}
                      alt={member.profiles.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-purple-400" />
                  )}
                </div>
                <div>
                  <div className="font-semibold flex items-center">
                    {member.profiles.username}
                    {member.role === 'admin' && (
                      <span className="ml-2 bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs flex items-center">
                        <Shield size={12} className="mr-1" />
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Beigetreten am {new Date(member.joined_at).toLocaleDateString('de-DE')}
                  </div>
                </div>
              </div>

              {isAdmin && member.user_id !== session?.user.id && (
                <div className="relative group">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreVertical size={20} />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-blue-900/90 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden invisible group-hover:visible z-10">
                    {member.role !== 'admin' && (
                      <button
                        onClick={() => handlePromoteToAdmin(member.id)}
                        className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center"
                      >
                        <Shield size={16} className="mr-2 text-purple-400" />
                        Zum Admin machen
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center text-red-400"
                    >
                      <X size={16} className="mr-2" />
                      Entfernen
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold">Mitglied einladen</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {inviteSuccess ? (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus size={32} className="text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Einladung gesendet</h3>
                  <p className="text-gray-300">
                    Die Einladung wurde erfolgreich versendet.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInviteUser} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">E-Mail-Adresse</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                      placeholder="beispiel@email.com"
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      disabled={inviteLoading || !inviteEmail.trim()}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {inviteLoading ? 'Wird gesendet...' : 'Einladen'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupMembersList;