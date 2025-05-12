import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Search, Shield, Ban, Trash2, CheckCircle, User, Dog, Calendar, Mail, Phone } from 'lucide-react';

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at: string;
  banned: boolean;
  dog_count: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, admin, trainer, banned
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userDogs, setUserDogs] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get auth users for email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Get dog counts for each user
      const { data: dogCounts, error: dogCountError } = await supabase
        .from('dogs')
        .select('owner_id, count')
        .group('owner_id');

      if (dogCountError) throw dogCountError;

      // Combine the data
      const dogCountMap = new Map();
      dogCounts?.forEach(item => {
        dogCountMap.set(item.owner_id, item.count);
      });

      const emailMap = new Map();
      authUsers.users.forEach(user => {
        emailMap.set(user.id, user.email);
      });

      const combinedUsers = profiles?.map(profile => ({
        ...profile,
        email: emailMap.get(profile.id) || 'No email',
        dog_count: dogCountMap.get(profile.id) || 0,
        banned: profile.banned || false
      })) || [];

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  }

  async function toggleUserBan(userId: string, currentBanStatus: boolean) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ banned: !currentBanStatus })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user ban:', error);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Bist du sicher, dass du diesen Nutzer löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    try {
      // Delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) throw authError;
      
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  async function viewUserDetails(user: User) {
    setSelectedUser(user);
    setShowUserDetails(true);
    
    // Fetch user's dogs
    try {
      const { data: dogs, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', user.id);
        
      if (error) throw error;
      setUserDogs(dogs || []);
    } catch (error) {
      console.error('Error fetching user dogs:', error);
      setUserDogs([]);
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'admin' && user.role === 'admin') ||
      (filter === 'trainer' && user.role === 'trainer') ||
      (filter === 'banned' && user.banned);
      
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Nutzerverwaltung</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Suche nach Nutzern..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Alle Nutzer</option>
            <option value="admin">Administratoren</option>
            <option value="trainer">Trainer</option>
            <option value="banned">Gesperrte Nutzer</option>
          </select>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left">Nutzer</th>
              <th className="px-6 py-4 text-left">E-Mail</th>
              <th className="px-6 py-4 text-left">Rolle</th>
              <th className="px-6 py-4 text-left">Registriert</th>
              <th className="px-6 py-4 text-left">Hunde</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                      {user.username ? (
                        <span className="text-lg font-bold text-purple-300">
                          {user.username[0].toUpperCase()}
                        </span>
                      ) : (
                        <User size={20} className="text-purple-300" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{user.username || 'Kein Benutzername'}</div>
                      <div className="text-sm text-gray-400">{user.full_name || 'Kein Name'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <select
                    value={user.role || 'user'}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    className="bg-transparent border border-white/20 rounded px-2 py-1"
                  >
                    <option value="user">Nutzer</option>
                    <option value="trainer">Trainer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Dog size={16} className="mr-2 text-purple-400" />
                    <span>{user.dog_count}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.banned ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                      Gesperrt
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      Aktiv
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => viewUserDetails(user)}
                      className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                      title="Details anzeigen"
                    >
                      <User size={18} />
                    </button>
                    <button
                      onClick={() => toggleUserBan(user.id, user.banned)}
                      className={`p-2 rounded-lg transition-colors ${
                        user.banned
                          ? 'text-green-400 hover:bg-green-500/20'
                          : 'text-red-400 hover:bg-red-500/20'
                      }`}
                      title={user.banned ? 'Entsperren' : 'Sperren'}
                    >
                      {user.banned ? <CheckCircle size={18} /> : <Ban size={18} />}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Löschen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">Nutzerdetails</h2>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mr-4">
                  {selectedUser.username ? (
                    <span className="text-2xl font-bold text-purple-300">
                      {selectedUser.username[0].toUpperCase()}
                    </span>
                  ) : (
                    <User size={32} className="text-purple-300" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedUser.username || 'Kein Benutzername'}</h3>
                  <p className="text-gray-400">{selectedUser.full_name || 'Kein Name'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Mail size={20} className="text-purple-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-400">E-Mail</p>
                      <p>{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Shield size={20} className="text-purple-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-400">Rolle</p>
                      <p className="capitalize">{selectedUser.role || 'Nutzer'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={20} className="text-purple-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-400">Registriert am</p>
                      <p>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Dog size={20} className="text-purple-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-400">Anzahl Hunde</p>
                      <p>{selectedUser.dog_count}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Phone size={20} className="text-purple-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <p>{selectedUser.banned ? 'Gesperrt' : 'Aktiv'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* User's Dogs */}
              {userDogs.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Hunde</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userDogs.map(dog => (
                      <div key={dog.id} className="bg-white/5 rounded-lg p-4 flex items-center">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                          {dog.image_url ? (
                            <img 
                              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/dogs/${dog.image_url}`} 
                              alt={dog.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Dog size={24} className="text-purple-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{dog.name}</p>
                          <p className="text-sm text-gray-400">{dog.breed}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => toggleUserBan(selectedUser.id, selectedUser.banned)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedUser.banned
                      ? 'bg-green-600 hover:bg-green-500 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {selectedUser.banned ? 'Nutzer entsperren' : 'Nutzer sperren'}
                </button>
                <button
                  onClick={() => deleteUser(selectedUser.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"
                >
                  Nutzer löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;