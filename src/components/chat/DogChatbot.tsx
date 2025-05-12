import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Send, Dog, Bot, User, X, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const DogChatbot: React.FC = () => {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session && showChatbot) {
      fetchChatHistory();
    }
  }, [session, showChatbot]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchChatHistory() {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
      
      // If no messages, add welcome message
      if (!data || data.length === 0) {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: 'Hallo! Ich bin DogBot, dein KI-Assistent für alle Fragen rund um deinen Hund. Wie kann ich dir heute helfen?',
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  }

  async function sendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!input.trim() || !session || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: input,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Save user message to database
      const { error: saveError } = await supabase
        .from('chat_history')
        .insert({
          user_id: session.user.id,
          role: 'user',
          content: input
        });

      if (saveError) throw saveError;

      // Call Supabase Edge Function for AI response
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dog-chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          message: input,
          history: messages.slice(-10) // Send last 10 messages for context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const { answer } = await response.json();

      // Add AI response to messages
      const aiMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: answer,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to database
      await supabase
        .from('chat_history')
        .insert({
          user_id: session.user.id,
          role: 'assistant',
          content: answer
        });

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev, 
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Entschuldigung, ich konnte deine Anfrage nicht verarbeiten. Bitte versuche es später noch einmal.',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-20 md:bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg z-40"
        aria-label={showChatbot ? "Close chatbot" : "Open chatbot"}
      >
        {showChatbot ? <X size={24} /> : <Dog size={24} />}
      </motion.button>

      {/* Chatbot window */}
      <AnimatePresence>
        {showChatbot && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 md:bottom-24 right-6 w-[calc(100%-3rem)] md:w-full max-w-md h-[500px] md:h-[600px] bg-blue-900/90 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden z-40 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold">DogBot</h3>
                <p className="text-xs text-white/80">Dein KI-Assistent für Hundefragen</p>
              </div>
              <button 
                onClick={() => setShowChatbot(false)}
                className="ml-auto p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close chatbot"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-2 flex-shrink-0">
                      <Bot size={16} className="text-purple-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-none'
                        : 'bg-white/10 text-white rounded-tl-none'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    <div className={`text-xs mt-1 text-right ${
                      message.role === 'user' ? 'text-purple-200' : 'text-gray-400'
                    }`}>
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center ml-2 flex-shrink-0">
                      <User size={16} className="text-purple-400" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-2 flex-shrink-0">
                    <Bot size={16} className="text-purple-400" />
                  </div>
                  <div className="bg-white/10 text-white rounded-2xl rounded-tl-none px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Stelle eine Frage zu deinem Hund..."
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
              <div className="flex items-center mt-2 text-xs text-gray-400">
                <Sparkles size={12} className="mr-1" />
                <span>Powered by AI - Frage nach Trainingstipps, Verhalten oder Rasseeigenschaften</span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DogChatbot;