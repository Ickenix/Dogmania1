import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Mail, MessageSquare, CheckCircle, Clock, AlertTriangle, X, Send, User, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface SupportTicket {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
    avatar_url: string;
  };
  comments?: TicketComment[];
}

interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  user?: {
    username: string;
    avatar_url: string;
  };
}

const SupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [topicFilter, setTopicFilter] = useState<string>('all');

  useEffect(() => {
    fetchTickets();
  }, [filter, topicFilter]);

  async function fetchTickets() {
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          user:user_id(username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (topicFilter !== 'all') {
        query = query.eq('topic', topicFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTicketComments(ticketId: string) {
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          user:user_id(username, avatar_url)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Update the selected ticket with comments
      setSelectedTicket(prev => {
        if (prev && prev.id === ticketId) {
          return { ...prev, comments: data || [] };
        }
        return prev;
      });
    } catch (error) {
      console.error('Error fetching ticket comments:', error);
    }
  }

  async function updateTicketStatus(ticketId: string, status: 'open' | 'in_progress' | 'resolved') {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;

      // Update local state
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? { ...ticket, status } : ticket
        )
      );

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null);
      }

      // If user is logged in, send notification
      if (selectedTicket?.user_id) {
        const statusMessage = 
          status === 'in_progress' ? 'Deine Support-Anfrage wird nun bearbeitet.' :
          status === 'resolved' ? 'Deine Support-Anfrage wurde gelöst.' : '';

        if (statusMessage) {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert([{
              user_id: selectedTicket.user_id,
              title: 'Update zu deiner Support-Anfrage',
              message: statusMessage,
              type: 'support',
              is_read: false
            }]);

          if (notificationError) console.error('Error creating notification:', notificationError);
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  }

  async function addComment() {
    if (!selectedTicket || !newComment.trim()) return;

    try {
      setSendingComment(true);

      // Add comment to database
      const { error } = await supabase
        .from('ticket_comments')
        .insert([{
          ticket_id: selectedTicket.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          content: newComment,
          is_internal: isInternalComment
        }]);

      if (error) throw error;

      // If not internal and user is logged in, send notification
      if (!isInternalComment && selectedTicket.user_id) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([{
            user_id: selectedTicket.user_id,
            title: 'Neue Antwort auf deine Support-Anfrage',
            message: 'Wir haben auf deine Support-Anfrage geantwortet. Bitte überprüfe deine E-Mails oder den Support-Bereich.',
            type: 'support',
            is_read: false
          }]);

        if (notificationError) console.error('Error creating notification:', notificationError);
      }

      // Update ticket status to in_progress if it's open
      if (selectedTicket.status === 'open') {
        await updateTicketStatus(selectedTicket.id, 'in_progress');
      }

      // Clear form and refresh comments
      setNewComment('');
      setIsInternalComment(false);
      fetchTicketComments(selectedTicket.id);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSendingComment(false);
    }
  }

  function selectTicket(ticket: SupportTicket) {
    setSelectedTicket(ticket);
    fetchTicketComments(ticket.id);
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs flex items-center"><AlertTriangle size={14} className="mr-1" />Offen</span>;
      case 'in_progress':
        return <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs flex items-center"><Clock size={14} className="mr-1" />In Bearbeitung</span>;
      case 'resolved':
        return <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs flex items-center"><CheckCircle size={14} className="mr-1" />Gelöst</span>;
      default:
        return null;
    }
  };

  const getTopicLabel = (topic: string) => {
    switch (topic) {
      case 'general':
        return 'Allgemein';
      case 'technical':
        return 'Technisches Problem';
      case 'trainer':
        return 'Trainer-Frage';
      case 'course':
        return 'Kursfrage';
      case 'billing':
        return 'Zahlungen & Abonnement';
      default:
        return topic;
    }
  };

  const getTopicColor = (topic: string) => {
    switch (topic) {
      case 'general':
        return 'bg-gray-500/20 text-gray-400';
      case 'technical':
        return 'bg-red-500/20 text-red-400';
      case 'trainer':
        return 'bg-purple-500/20 text-purple-400';
      case 'course':
        return 'bg-blue-500/20 text-blue-400';
      case 'billing':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

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
        <h2 className="text-2xl font-bold">Support-Tickets</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Suche nach Tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Alle Tickets</option>
            <option value="open">Offene Tickets</option>
            <option value="in_progress">In Bearbeitung</option>
            <option value="resolved">Gelöste Tickets</option>
          </select>
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Alle Themen</option>
            <option value="general">Allgemein</option>
            <option value="technical">Technisches Problem</option>
            <option value="trainer">Trainer-Frage</option>
            <option value="course">Kursfrage</option>
            <option value="billing">Zahlungen & Abonnement</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Tickets List */}
        <div className="md:col-span-1 bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold">Tickets</h3>
            <Filter size={18} className="text-gray-400" />
          </div>
          <div className="overflow-y-auto h-[calc(100%-57px)]">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Keine Tickets gefunden
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => selectTicket(ticket)}
                  className={`p-4 border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id ? 'bg-white/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                        {ticket.user?.avatar_url ? (
                          <img
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${ticket.user.avatar_url}`}
                            alt={ticket.user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User size={16} className="text-purple-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{ticket.name}</div>
                        <div className="text-xs text-gray-400">{ticket.email}</div>
                      </div>
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-xs ${getTopicColor(ticket.topic)}`}>
                      {getTopicLabel(ticket.topic)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(ticket.created_at), 'dd.MM.yyyy', { locale: de })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="md:col-span-2 bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden flex flex-col">
          {selectedTicket ? (
            <>
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{selectedTicket.name}</h3>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    <div className="relative group">
                      <button className="p-1 hover:bg-white/10 rounded transition-colors">
                        <Filter size={18} className="text-gray-400" />
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden invisible group-hover:visible z-10">
                        <button
                          onClick={() => updateTicketStatus(selectedTicket.id, 'open')}
                          className={`w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center space-x-2 ${
                            selectedTicket.status === 'open' ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          <AlertTriangle size={16} />
                          <span>Als offen markieren</span>
                        </button>
                        <button
                          onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress')}
                          className={`w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center space-x-2 ${
                            selectedTicket.status === 'in_progress' ? 'text-blue-400' : 'text-gray-300'
                          }`}
                        >
                          <Clock size={16} />
                          <span>In Bearbeitung</span>
                        </button>
                        <button
                          onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                          className={`w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center space-x-2 ${
                            selectedTicket.status === 'resolved' ? 'text-green-400' : 'text-gray-300'
                          }`}
                        >
                          <CheckCircle size={16} />
                          <span>Als gelöst markieren</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <Mail size={14} className="mr-1" />
                  <span>{selectedTicket.email}</span>
                  <span className="mx-2">•</span>
                  <span>{format(new Date(selectedTicket.created_at), 'dd. MMMM yyyy, HH:mm', { locale: de })}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Original Message */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${getTopicColor(selectedTicket.topic)}`}>
                      {getTopicLabel(selectedTicket.topic)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(selectedTicket.created_at), 'HH:mm', { locale: de })}
                    </span>
                  </div>
                  <p className="text-gray-200 whitespace-pre-line">{selectedTicket.message}</p>
                </div>

                {/* Comments */}
                {selectedTicket.comments?.map((comment) => (
                  <div 
                    key={comment.id} 
                    className={`rounded-lg p-4 ${
                      comment.is_internal 
                        ? 'bg-purple-900/30 border border-purple-500/30' 
                        : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        {comment.user?.avatar_url ? (
                          <img
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${comment.user.avatar_url}`}
                            alt={comment.user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User size={16} className="text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="font-medium text-sm">{comment.user?.username || 'Support-Team'}</span>
                            {comment.is_internal && (
                              <span className="ml-2 bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs">
                                Intern
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {format(new Date(comment.created_at), 'dd.MM.yyyy, HH:mm', { locale: de })}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-200 whitespace-pre-line">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/10">
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="internal-comment"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="h-4 w-4 text-purple-600 rounded border-white/20 bg-white/10 focus:ring-purple-500"
                    />
                    <label htmlFor="internal-comment" className="ml-2 text-sm text-gray-300">
                      Interner Kommentar (nur für Support-Team sichtbar)
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Schreibe eine Antwort..."
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={2}
                  />
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim() || sendingComment}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingComment ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>Wähle ein Ticket aus, um Details zu sehen</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTickets;