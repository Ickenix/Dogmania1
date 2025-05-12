import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Search, Send, ArrowLeft, User, X, Plus, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import NewConversationModal from './NewConversationModal';

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  updated_at: string;
  other_user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const MessagesPage = () => {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (session) {
      fetchConversations();
      setupRealtimeSubscription();
    }
  }, [session]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle mobile view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowSidebar(!selectedConversation);
      } else {
        setShowSidebar(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedConversation]);

  function setupRealtimeSubscription() {
    const conversationsSubscription = supabase
      .channel('conversations_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `user1_id=eq.${session?.user.id} OR user2_id=eq.${session?.user.id}`
      }, () => {
        fetchConversations();
      })
      .subscribe();

    const messagesSubscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        // If we have a selected conversation and the message belongs to it
        if (selectedConversation && payload.new && payload.new.conversation_id === selectedConversation.id) {
          fetchMessages(selectedConversation.id);
          
          // If the message is from the other user, mark it as read
          if (payload.new.sender_id !== session?.user.id) {
            markMessageAsRead(payload.new.id);
          }
        }
        
        // Refresh conversations to update last message and unread counts
        fetchConversations();
      })
      .subscribe();

    return () => {
      conversationsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }

  async function fetchConversations() {
    if (!session) return;
    
    try {
      // Get all conversations where the user is either user1 or user2
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:profiles!conversations_user1_id_fkey(id, username, avatar_url),
          user2:profiles!conversations_user2_id_fkey(id, username, avatar_url)
        `)
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Get the last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        (conversationsData || []).map(async (conversation) => {
          // Determine the other user in the conversation
          const otherUser = conversation.user1_id === session.user.id 
            ? conversation.user2 
            : conversation.user1;

          // Get the last message
          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id)
            .eq('sender_id', otherUser.id)
            .eq('is_read', false);

          return {
            ...conversation,
            other_user: otherUser,
            last_message: lastMessageData,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithLastMessage);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(conversationId: string) {
    try {
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

  async function markMessagesAsRead(conversationId: string) {
    if (!session) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', session.user.id)
        .eq('is_read', false);

      if (error) throw error;
      
      // Update unread count in the conversations list
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

  async function markMessageAsRead(messageId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim() || !session) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: session.user.id,
          content: newMessage,
          is_read: false
        });

      if (error) throw error;

      // Update the conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const handleBackToList = () => {
    setSelectedConversation(null);
    setShowSidebar(true);
  };

  const handleCreateConversation = async (userId: string) => {
    if (!session) return;
    
    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${session.user.id})`)
        .maybeSingle();
      
      if (existingConv) {
        // Find the conversation in our list
        const conversation = conversations.find(c => c.id === existingConv.id);
        if (conversation) {
          setSelectedConversation(conversation);
          if (window.innerWidth < 768) {
            setShowSidebar(false);
          }
        } else {
          // Refresh conversations and then select it
          await fetchConversations();
          const { data } = await supabase
            .from('conversations')
            .select(`
              *,
              user1:profiles!conversations_user1_id_fkey(id, username, avatar_url),
              user2:profiles!conversations_user2_id_fkey(id, username, avatar_url)
            `)
            .eq('id', existingConv.id)
            .single();
            
          if (data) {
            const otherUser = data.user1_id === session.user.id ? data.user2 : data.user1;
            setSelectedConversation({
              ...data,
              other_user: otherUser,
              unread_count: 0
            });
            if (window.innerWidth < 768) {
              setShowSidebar(false);
            }
          }
        }
      } else {
        // Create new conversation
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            user1_id: session.user.id,
            user2_id: userId
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Get user details
        const { data: userData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', userId)
          .single();
        
        if (newConv && userData) {
          const newConversation = {
            ...newConv,
            other_user: userData,
            unread_count: 0
          };
          
          setSelectedConversation(newConversation);
          setConversations([newConversation, ...conversations]);
          
          if (window.innerWidth < 768) {
            setShowSidebar(false);
          }
        }
      }
      
      setShowNewConversationModal(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    return conversation.other_user.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row">
      {/* Mobile header with toggle */}
      <div className="md:hidden flex items-center justify-between p-4 bg-blue-900/30 backdrop-blur-sm">
        {selectedConversation ? (
          <button
            onClick={handleBackToList}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Back to conversations"
          >
            <ArrowLeft size={24} />
          </button>
        ) : (
          <h2 className="font-semibold text-lg">Nachrichten</h2>
        )}
        
        {selectedConversation ? (
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-2">
              {selectedConversation.other_user.avatar_url ? (
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${selectedConversation.other_user.avatar_url}`}
                  alt={selectedConversation.other_user.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={16} className="text-purple-400" />
              )}
            </div>
            <span className="font-medium">{selectedConversation.other_user.username}</span>
          </div>
        ) : (
          <button
            onClick={() => setShowNewConversationModal(true)}
            className="p-2 bg-purple-600 rounded-full hover:bg-purple-500 transition-colors"
            aria-label="New conversation"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {/* Conversations Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full md:w-80 bg-white/5 backdrop-blur-lg md:h-full flex flex-col"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Suche nach Nachrichten..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                />
              </div>
              <button
                onClick={() => setShowNewConversationModal(true)}
                className="ml-2 p-3 bg-purple-600 rounded-full hover:bg-purple-500 transition-colors"
                aria-label="New conversation"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {searchQuery ? 'Keine Ergebnisse gefunden' : 'Keine Konversationen'}
                </div>
              ) : (
                <ConversationList
                  conversations={filteredConversations}
                  selectedConversation={selectedConversation}
                  onSelectConversation={(conversation) => {
                    setSelectedConversation(conversation);
                    if (window.innerWidth < 768) {
                      setShowSidebar(false);
                    }
                  }}
                  currentUserId={session?.user.id || ''}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <AnimatePresence>
        {selectedConversation ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full md:h-auto"
          >
            {/* Chat Header - Desktop */}
            <div className="hidden md:flex items-center p-4 border-b border-white/10">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  {selectedConversation.other_user.avatar_url ? (
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${selectedConversation.other_user.avatar_url}`}
                      alt={selectedConversation.other_user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-purple-400" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold">
                    {selectedConversation.other_user.username}
                  </h3>
                </div>
              </div>
              
              <div className="ml-auto">
                <button
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  aria-label="More options"
                >
                  <Menu size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <MessageList
              messages={messages}
              currentUserId={session?.user.id || ''}
              messagesEndRef={messagesEndRef}
            />

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Schreibe eine Nachricht..."
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 hidden md:flex items-center justify-center text-gray-400"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Send size={24} className="text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Deine Nachrichten</h3>
              <p className="text-gray-500 mb-4">Wähle eine Konversation aus oder starte eine neue</p>
              <button
                onClick={() => setShowNewConversationModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors"
              >
                Neue Nachricht
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Conversation Modal */}
      <AnimatePresence>
        {showNewConversationModal && (
          <NewConversationModal
            onClose={() => setShowNewConversationModal(false)}
            onSelectUser={handleCreateConversation}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessagesPage;