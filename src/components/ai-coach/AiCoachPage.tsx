import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Send, Mic, Download, Save, Sparkles, Loader2, X, ChevronDown, ChevronUp, Dog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AiChatMessage from './AiChatMessage';
import AiCoachSidebar from './AiCoachSidebar';
import ExportToPdfModal from './ExportToPdfModal';
import SaveToDiaryModal from './SaveToDiaryModal';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface UserDog {
  id: string;
  name: string;
  breed: string;
  age: number;
  training_level: string;
}

const AiCoachPage: React.FC = () => {
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userDogs, setUserDogs] = useState<UserDog[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize speech recognition if supported
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'de-DE';
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchChatHistory();
      fetchUserDogs();
    }
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchChatHistory() {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('ai_chats')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedMessages = data.map(item => ({
          id: item.id,
          role: item.role as 'user' | 'assistant',
          content: item.content,
          created_at: item.created_at
        }));
        setMessages(formattedMessages);
      } else {
        // Add welcome message if no history
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: 'Hallo! Ich bin dein persönlicher Hunde-Coach. Ich kann dir bei Fragen zu Training, Verhalten, Ernährung und Gesundheit deines Hundes helfen. Wie kann ich dir heute behilflich sein?',
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setInitialLoading(false);
    }
  }

  async function fetchUserDogs() {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed, birth_date, training_level')
        .eq('owner_id', session.user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const dogsWithAge = data.map(dog => {
          // Calculate age in years
          const birthDate = dog.birth_date ? new Date(dog.birth_date) : null;
          const age = birthDate 
            ? Math.floor((new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) 
            : 0;
          
          return {
            ...dog,
            age
          };
        });
        
        setUserDogs(dogsWithAge);
        setSelectedDogId(dogsWithAge[0].id);
      }
    } catch (error) {
      console.error('Error fetching user dogs:', error);
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
      const { data: savedMessage, error: saveError } = await supabase
        .from('ai_chats')
        .insert({
          user_id: session.user.id,
          role: 'user',
          content: input,
          dog_id: selectedDogId
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Get selected dog info for context
      let dogContext = '';
      if (selectedDogId) {
        const selectedDog = userDogs.find(dog => dog.id === selectedDogId);
        if (selectedDog) {
          dogContext = `Der Nutzer hat einen ${selectedDog.breed} namens ${selectedDog.name}, ${selectedDog.age} Jahre alt, mit Trainingslevel ${selectedDog.training_level}.`;
        }
      }

      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer AIzaSyCV26uwFi-ejRBHS_IaOxE5x8CnCPUvMHc`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Du bist ein freundlicher und hilfreicher KI-Hundecoach, der sich auf Hunde spezialisiert hat. 
              Du hilfst Hundebesitzern mit Fragen zu Verhalten, Training, Gesundheit, Ernährung und Rasseeigenschaften.
              Deine Antworten sind informativ, freundlich und leicht verständlich.
              Du sprichst Deutsch und verwendest eine warme, unterstützende Sprache.
              Wenn du eine Frage nicht beantworten kannst oder sie nicht hundebezogen ist, bitte den Benutzer höflich, eine hundebezogene Frage zu stellen.
              Halte deine Antworten prägnant und hilfreich.
              
              ${dogContext ? `Kontext zum Hund des Nutzers: ${dogContext}` : ''}
              
              Beantworte die Fragen basierend auf wissenschaftlichen Erkenntnissen und modernen, positiven Trainingsmethoden.
              Vermeide aversive oder bestrafende Trainingsmethoden.`
            },
            ...messages.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: "user",
              content: input
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      const answer = data.choices[0].message.content;

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
        .from('ai_chats')
        .insert({
          user_id: session.user.id,
          role: 'assistant',
          content: answer,
          dog_id: selectedDogId
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

  function toggleRecording() {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
    } else {
      setIsRecording(true);
      recognition.start();
    }
  }

  function clearChat() {
    if (confirm('Möchtest du wirklich den gesamten Chatverlauf löschen?')) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hallo! Ich bin dein persönlicher Hunde-Coach. Ich kann dir bei Fragen zu Training, Verhalten, Ernährung und Gesundheit deines Hundes helfen. Wie kann ich dir heute behilflich sein?',
          created_at: new Date().toISOString()
        }
      ]);
      
      // Delete chat history from database
      if (session) {
        supabase
          .from('ai_chats')
          .delete()
          .eq('user_id', session.user.id)
          .then(() => {
            console.log('Chat history deleted');
          })
          .catch(error => {
            console.error('Error deleting chat history:', error);
          });
      }
    }
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <Dog size={48} className="mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-bold mb-4">Anmeldung erforderlich</h2>
          <p className="text-gray-400 mb-6">
            Bitte melde dich an, um den KI-Hundecoach zu nutzen.
          </p>
          <a href="/login" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors inline-block">
            Zum Login
          </a>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="md:hidden bg-white/5 backdrop-blur-lg rounded-lg p-3 flex items-center justify-between"
        >
          <span className="font-medium">Einstellungen & Optionen</span>
          {showSidebar ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {/* Sidebar */}
        <AnimatePresence>
          {(showSidebar || window.innerWidth >= 768) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full md:w-80 md:flex-shrink-0 overflow-hidden"
            >
              <AiCoachSidebar 
                userDogs={userDogs}
                selectedDogId={selectedDogId}
                onSelectDog={setSelectedDogId}
                onClearChat={clearChat}
                onExport={() => setShowExportModal(true)}
                onSaveToDiary={() => setShowSaveModal(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div className="flex-1 bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 p-4 border-b border-white/10 flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
              <Sparkles size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold">KI-Hundecoach</h2>
              <p className="text-xs text-gray-400">Powered by GPT</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <AiChatMessage
                key={message.id}
                message={message}
                isLastMessage={message.id === messages[messages.length - 1]?.id}
              />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
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
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-3 rounded-lg transition-colors ${
                  isRecording 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
                disabled={!recognition}
                title={recognition ? 'Spracheingabe' : 'Spracheingabe nicht unterstützt'}
              >
                <Mic size={20} />
              </button>
              
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
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Export to PDF Modal */}
      <AnimatePresence>
        {showExportModal && (
          <ExportToPdfModal
            messages={messages}
            onClose={() => setShowExportModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Save to Diary Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <SaveToDiaryModal
            messages={messages}
            dogId={selectedDogId}
            onClose={() => setShowSaveModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiCoachPage;