import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Users, MessageSquare, Flag, Trash2, Eye, CheckCircle, XCircle, Lock, Unlock, X } from 'lucide-react';

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
  creator: {
    username: string;
  };
}

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_id: string;
  author: {
    username: string;
  };
  like_count: number;
  comment_count: number;
}

interface Report {
  id: string;
  type: string;
  reference_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: {
    username: string;
  };
  content?: {
    title?: string;
    content: string;
    author?: {
      username: string;
    };
  };
}

const CommunityManagement = () => {
  const [activeTab, setActiveTab] = useState<'groups' | 'posts' | 'reports'>('groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'groups':
          await fetchGroups();
          break;
        case 'posts':
          await fetchPosts();
          break;
        case 'reports':
          await fetchReports();
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGroups() {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        creator:creator_id(username),
        member_count:group_members(count),
        thread_count:group_threads(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const groupsWithCounts = data?.map(group => ({
      ...group,
      member_count: group.member_count[0]?.count || 0,
      thread_count: group.thread_count[0]?.count || 0
    })) || [];
    
    setGroups(groupsWithCounts);
  }

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:author_id(username),
        like_count:community_likes(count),
        comment_count:community_comments(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const postsWithCounts = data?.map(post => ({
      ...post,
      like_count: post.like_count[0]?.count || 0,
      comment_count: post.comment_count[0]?.count || 0
    })) || [];
    
    setPosts(postsWithCounts);
  }

  async function fetchReports() {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:reported_by(username),
        content:reference_id (
          title,
          content,
          author:user_id (username)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setReports(data || []);
  }

  async function deleteGroup(groupId: string) {
    if (!confirm('Bist du sicher, dass du diese Gruppe löschen möchtest? Alle Diskussionen und Kommentare werden ebenfalls gelöscht.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);
        
      if (error) throw error;
      
      fetchGroups();
      if (selectedItem?.id === groupId) {
        setSelectedItem(null);
        setShowDetails(false);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  }

  async function deletePost(postId: string) {
    if (!confirm('Bist du sicher, dass du diesen Beitrag löschen möchtest? Alle Kommentare werden ebenfalls gelöscht.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);
        
      if (error) throw error;
      
      fetchPosts();
      if (selectedItem?.id === postId) {
        setSelectedItem(null);
        setShowDetails(false);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }

  async function updateReportStatus(reportId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: newStatus,
          resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', reportId);

      if (error) throw error;
      fetchReports();
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  }

  async function deleteReportedContent(reportId: string, type: string, contentId: string) {
    try {
      const table = type === 'thread' ? 'group_threads' : 'group_comments';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      // Mark report as resolved
      await updateReportStatus(reportId, 'resolved');
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  }

  async function toggleGroupPrivacy(groupId: string, isCurrentlyPrivate: boolean) {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ is_private: !isCurrentlyPrivate })
        .eq('id', groupId);
        
      if (error) throw error;
      
      fetchGroups();
      if (selectedItem?.id === groupId) {
        setSelectedItem(prev => ({ ...prev, is_private: !isCurrentlyPrivate }));
      }
    } catch (error) {
      console.error('Error toggling group privacy:', error);
    }
  }

  function viewDetails(item: any) {
    setSelectedItem(item);
    setShowDetails(true);
  }

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.creator?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = posts.filter(post =>
    post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReports = reports.filter(report =>
    report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.reporter?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.content?.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.content?.title?.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Community-Verwaltung</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Suche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        <div className="flex border-b border-white/10 mb-6">
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
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'posts'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Beiträge
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'reports'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Meldungen
          </button>
        </div>

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Keine Gruppen gefunden</h3>
                <p className="text-gray-400">
                  {searchQuery ? 'Versuche es mit anderen Suchbegriffen' : 'Es wurden noch keine Gruppen erstellt.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden hover:bg-white/10 transition-all"
                  >
                    <div className="relative">
                      <img
                        src={group.image_url || 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'}
                        alt={group.name}
                        className="w-full h-48 object-cover"
                      />
                      {group.is_private && (
                        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center">
                          <Lock size={14} className="mr-1" />
                          Privat
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {group.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
                        <div className="flex items-center">
                          <Users size={16} className="mr-1" />
                          {group.member_count} Mitglieder
                        </div>
                        <div className="flex items-center">
                          <MessageSquare size={16} className="mr-1" />
                          {group.thread_count} Threads
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <button
                          onClick={() => toggleGroupPrivacy(group.id, group.is_private)}
                          className={`p-2 rounded-lg transition-colors ${
                            group.is_private
                              ? 'text-yellow-400 hover:bg-yellow-500/20'
                              : 'text-green-400 hover:bg-green-500/20'
                          }`}
                          title={group.is_private ? 'Öffentlich machen' : 'Privat machen'}
                        >
                          {group.is_private ? <Unlock size={18} /> : <Lock size={18} />}
                        </button>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewDetails(group)}
                            className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                            title="Details anzeigen"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => deleteGroup(group.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Löschen"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Keine Beiträge gefunden</h3>
                <p className="text-gray-400">
                  {searchQuery ? 'Versuche es mit anderen Suchbegriffen' : 'Es wurden noch keine Beiträge erstellt.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white/5 backdrop-blur-lg rounded-lg p-6 hover:bg-white/10 transition-all"
                  >
                    <div className="flex justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{post.title}</h3>
                        <div className="flex items-center text-sm text-gray-400">
                          <span>Von {post.author?.username || 'Unbekannt'}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewDetails(post)}
                          className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                          title="Details anzeigen"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Löschen"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-4 line-clamp-3">{post.content}</p>
                    
                    <div className="flex items-center text-sm text-gray-400">
                      <div className="flex items-center mr-4">
                        <MessageSquare size={16} className="mr-1" />
                        {post.comment_count} Kommentare
                      </div>
                      <div className="flex items-center">
                        <Users size={16} className="mr-1" />
                        {post.like_count} Likes
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <Flag size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Keine Meldungen gefunden</h3>
                <p className="text-gray-400">
                  {searchQuery ? 'Versuche es mit anderen Suchbegriffen' : 'Es liegen keine Meldungen vor.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white/5 backdrop-blur-lg rounded-lg p-6 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                            {report.type === 'thread' ? 'Thread' : 'Kommentar'}
                          </span>
                          <span className="text-sm text-gray-400">
                            Gemeldet von {report.reporter?.username} • {new Date(report.created_at).toLocaleDateString()}
                          </span>
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                            report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            report.status === 'reviewed' ? 'bg-blue-500/20 text-blue-400' :
                            report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold mb-1">
                          {report.content?.title || 'Gemeldeter Inhalt'}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Von {report.content?.author?.username || 'Unbekannt'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateReportStatus(report.id, 'reviewed')}
                          className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                          title="Als 'In Prüfung' markieren"
                        >
                          <Flag size={20} />
                        </button>
                        <button
                          onClick={() => updateReportStatus(report.id, 'dismissed')}
                          className="p-2 text-gray-400 hover:bg-gray-500/20 rounded-lg transition-colors"
                          title="Meldung ablehnen"
                        >
                          <XCircle size={20} />
                        </button>
                        <button
                          onClick={() => deleteReportedContent(report.id, report.type, report.reference_id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Inhalt löschen"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 mb-4">
                      <p className="text-gray-300">{report.content?.content}</p>
                    </div>

                    <div className="bg-red-500/10 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Grund der Meldung</h4>
                      <p className="text-gray-300">{report.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">
                {activeTab === 'groups' ? 'Gruppendetails' : 
                 activeTab === 'posts' ? 'Beitragsdetails' : 'Meldungsdetails'}
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {activeTab === 'groups' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-lg overflow-hidden">
                      <img
                        src={selectedItem.image_url || 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'}
                        alt={selectedItem.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{selectedItem.name}</h3>
                      <div className="flex items-center text-sm text-gray-400">
                        <span>Erstellt von {selectedItem.creator?.username}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(selectedItem.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedItem.is_private 
                            ? 'bg-yellow-500/20 text-yellow-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {selectedItem.is_private ? 'Privat' : 'Öffentlich'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Beschreibung</h4>
                    <p className="text-gray-300">{selectedItem.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Users size={20} className="text-purple-400 mr-2" />
                        <h4 className="font-semibold">Mitglieder</h4>
                      </div>
                      <p className="text-2xl font-bold">{selectedItem.member_count}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <MessageSquare size={20} className="text-purple-400 mr-2" />
                        <h4 className="font-semibold">Diskussionen</h4>
                      </div>
                      <p className="text-2xl font-bold">{selectedItem.thread_count}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => toggleGroupPrivacy(selectedItem.id, selectedItem.is_private)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedItem.is_private
                          ? 'bg-green-600 hover:bg-green-500 text-white'
                          : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                      }`}
                    >
                      {selectedItem.is_private ? 'Öffentlich machen' : 'Privat machen'}
                    </button>
                    <button
                      onClick={() => {
                        deleteGroup(selectedItem.id);
                        setShowDetails(false);
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"
                    >
                      Gruppe löschen
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'posts' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{selectedItem.title}</h3>
                    <div className="flex items-center text-sm text-gray-400">
                      <span>Von {selectedItem.author?.username}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(selectedItem.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-6">
                    <p className="text-gray-300 whitespace-pre-line">{selectedItem.content}</p>
                  </div>
                  
                  {selectedItem.image_url && (
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Bild</h4>
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/community/${selectedItem.image_url}`}
                        alt="Post image"
                        className="w-full max-h-96 object-contain rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Users size={20} className="text-purple-400 mr-2" />
                        <h4 className="font-semibold">Likes</h4>
                      </div>
                      <p className="text-2xl font-bold">{selectedItem.like_count}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <MessageSquare size={20} className="text-purple-400 mr-2" />
                        <h4 className="font-semibold">Kommentare</h4>
                      </div>
                      <p className="text-2xl font-bold">{selectedItem.comment_count}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        deletePost(selectedItem.id);
                        setShowDetails(false);
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"
                    >
                      Beitrag löschen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityManagement;