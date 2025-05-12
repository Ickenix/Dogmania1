import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Search, Send, ArrowLeft, User, Clock, Check } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface Conversation {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface TrainerMessagesProps {
  trainerId?: string;
}

const TrainerMessages: React.FC<TrainerMessagesProps> = ({ trainerId }) => {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      fetchConversations();
      setupRealtimeSubscription();
    }
  }, [session, trainerId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id, selectedConversation.user_id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function setupRealtimeSubscription() {
    const messagesSubscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        if (selectedConversation) {
          fetchMessages(selectedConversation.id);
        }
        fetchConversations();
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }

  async function fetchConversations() {
    try {
      // This is a simplified approach - in a real app, you'd need a more complex query
      // to get all conversations where the trainer is involved
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          user_id,
          user:user_id(
            id,
            profiles:profiles(username, avatar_url)
          )
        `)
        .eq('trainer_id', trainerId)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Get unique users from bookings
      const uniqueUsers = new Map();
      bookingsData?.forEach(booking => {
        if (booking.user && !uniqueUsers.has(booking.user.id)) {
          uniqueUsers.set(booking.user.id, {
            id: booking.id, // Using booking ID as conversation ID for simplicity
            user_id: booking.user.id,
            username: booking.user.profiles?.username || 'Unbekannt',
            avatar_url: booking.user.profiles?.avatar_url,
            last_message: '',
            last_message_time: '',
            unread_count: 0
          });
        }
      });

      // Get last messages and unread counts
      // This is simplified - in a real app, you'd need a more complex query
      const conversationsArray = Array.from(uniqueUsers.values());
      setConversations(conversationsArray);
      
      // If we have conversations and none is selected, select the first one
      if (conversationsArray.length > 0 && !selectedConversation) {
        setSelectedConversation(conversationsArray[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(conversationId: string) {
    try {
      // In a real app, you'd query the messages table with the actual conversation ID
      // This is a simplified approach
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }

  async function markMessagesAsRead(conversationId: string, senderId: string) {
    if (!session) return;
    
    try {
      // In a real app, you'd update the is_read status of messages
      // This is a simplified approach
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_id', senderId)
        .eq('is_read', false);

      if (error) throw error;
      
      // Update the unread count in the conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 } 
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim() || !session) return;

    try {
      // In a real app, you'd insert a new message into the messages table
      // This is a simplified approach
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: session.user.id,
          recipient_id: selectedConversation.user_id,
          content: newMessage
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const filteredConversations = conversations.filter(conversation =>
    conversation.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
        {/* Conversations List */}
        <div className={`md:col-span-1 border-r border-white/10 ${
          selectedConversation ? 'hidden md:block' : 'block'
        }`}>
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Suche nach Kunden..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(600px-73px)]">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Keine Konversationen gefunden
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-white/10' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      {conversation.avatar_url ? (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${conversation.avatar_url}`}
                          alt={conversation.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={20} className="text-purple-400" />
                      )}
                    </div>
                    {conversation.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {conversation.unread_count}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">
                        {conversation.username}
                      </h3>
                      {conversation.last_message_time && (
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(conversation.last_message_time), {
                            addSuffix: true,
                            locale: de
                          })}
                        </span>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className="text-sm text-gray-400 truncate">
                        {conversation.last_message}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className={`md:col-span-2 flex flex-col ${
          !selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    {selectedConversation.avatar_url ? (
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${selectedConversation.avatar_url}`}
                        alt={selectedConversation.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-purple-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold">
                      {selectedConversation.username}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Keine Nachrichten. Starte die Konversation!
                  </div>
                ) : (
                  messages.map((message) => {
                    const isSender = message.sender_id === session?.user.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isSender
                              ? 'bg-purple-600 text-white'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                          <div className={`flex items-center justify-end text-xs mt-1 ${
                            isSender ? 'text-purple-200' : 'text-gray-400'
                          }`}>
                            {format(new Date(message.created_at), 'HH:mm', { locale: de })}
                            {isSender && message.is_read && (
                              <Check size={12} className="ml-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Schreibe eine Nachricht..."
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Wähle eine Konversation aus
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerMessages;