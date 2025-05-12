import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Send, CheckCircle, Mail, MessageSquare, Clock, AlertTriangle, User, Search } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface SupportTicket {
  id: string;
  topic: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
  comments?: TicketComment[];
}

interface TicketComment {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  user?: {
    username: string;
    avatar_url: string;
  };
}

const SupportPage = () => {
  const { session } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    if (session) {
      fetchUserTickets();
    } else {
      setLoading(false);
    }
  }, [session]);

  async function fetchUserTickets() {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: false });

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
        .eq('is_internal', false) // Only show non-internal comments to users
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

  async function addComment() {
    if (!selectedTicket || !newComment.trim() || !session) return;

    try {
      setSendingComment(true);

      // Add comment to database
      const { error } = await supabase
        .from('ticket_comments')
        .insert([{
          ticket_id: selectedTicket.id,
          user_id: session.user.id,
          content: newComment,
          is_internal: false
        }]);

      if (error) throw error;

      // Clear form and refresh comments
      setNewComment('');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <Mail size={48} className="mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-bold mb-4">Support & Kontakt</h2>
          <p className="text-gray-300 mb-6">
            Bitte melde dich an, um deine Support-Anfragen zu verwalten oder eine neue Anfrage zu stellen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
            >
              Anmelden
            </Link>
            <Link
              to="/contact"
              className="bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors"
            >
              Kontaktformular
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Support & Hilfe</h1>
          <p className="text-gray-400">
            Hier findest du Hilfe und kannst deine Support-Anfragen verwalten
          </p>
        </div>

        <Link
          to="/contact"
          className="mt-4 md:mt-0 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
        >
          <Mail size={20} className="mr-2" />
          Neue Anfrage
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <Mail className="text-purple-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2">E-Mail</h3>
          <p className="text-gray-300 mb-4">Schreibe uns direkt eine E-Mail</p>
          <a href="mailto:support@dogmania.de" className="text-purple-400 hover:text-purple-300 transition-colors">
            support@dogmania.de
          </a>
        </div>
        
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <MessageSquare className="text-purple-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2">Live-Chat</h3>
          <p className="text-gray-300 mb-4">Chatte mit unserem Support-Team</p>
          <button className="text-purple-400 hover:text-purple-300 transition-colors">
            Chat starten
          </button>
        </div>
        
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <Clock className="text-purple-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2">Öffnungszeiten</h3>
          <p className="text-gray-300 mb-4">Unser Support ist für dich da</p>
          <p className="text-sm text-gray-400">
            Montag - Freitag<br />
            9:00 - 18:00 Uhr
          </p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Keine Support-Anfragen</h3>
          <p className="text-gray-400 mb-6">
            Du hast noch keine Support-Anfragen gestellt. Nutze das Kontaktformular, um eine neue Anfrage zu erstellen.
          </p>
          <Link
            to="/contact"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors inline-block"
          >
            Neue Anfrage stellen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-20rem)]">
          {/* Tickets List */}
          <div className="md:col-span-1 bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-semibold">Meine Anfragen</h3>
            </div>
            <div className="overflow-y-auto h-[calc(100%-57px)]">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => selectTicket(ticket)}
                  className={`p-4 border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id ? 'bg-white/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${getTopicColor(ticket.topic)}`}>
                      {getTopicLabel(ticket.topic)}
                    </span>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <p className="text-sm line-clamp-2 mb-2">{ticket.message}</p>
                  <div className="text-xs text-gray-400">
                    {format(new Date(ticket.created_at), 'dd.MM.yyyy, HH:mm', { locale: de })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Details */}
          <div className="md:col-span-2 bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden flex flex-col">
            {selectedTicket ? (
              <>
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${getTopicColor(selectedTicket.topic)}`}>
                      {getTopicLabel(selectedTicket.topic)}
                    </span>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <div className="text-sm text-gray-400">
                    Erstellt am {format(new Date(selectedTicket.created_at), 'dd. MMMM yyyy, HH:mm', { locale: de })}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Original Message */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">Du</span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(selectedTicket.created_at), 'HH:mm', { locale: de })}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-200 whitespace-pre-line">{selectedTicket.message}</p>
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  {selectedTicket.comments?.map((comment) => (
                    <div key={comment.id} className="bg-white/5 rounded-lg p-4">
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
                            <span className="font-medium text-sm">
                              {comment.user?.username === session?.user?.email ? 'Du' : (comment.user?.username || 'Support-Team')}
                            </span>
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

                {selectedTicket.status !== 'resolved' && (
                  <div className="p-4 border-t border-white/10">
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
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Wähle eine Anfrage aus, um Details zu sehen</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;