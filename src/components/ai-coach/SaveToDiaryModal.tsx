import React, { useState } from 'react';
import { X, Save, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SaveToDiaryModalProps {
  messages: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }[];
  dogId: string | null;
  onClose: () => void;
}

const SaveToDiaryModal: React.FC<SaveToDiaryModalProps> = ({ messages, dogId, onClose }) => {
  const { session } = useAuth();
  const [title, setTitle] = useState('KI-Coach Gespräch');
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize with all assistant messages selected
  React.useEffect(() => {
    const assistantMessageIds = messages
      .filter(msg => msg.role === 'assistant')
      .map(msg => msg.id);
    setSelectedMessages(assistantMessageIds);
  }, [messages]);

  const toggleMessageSelection = (messageId: string) => {
    if (selectedMessages.includes(messageId)) {
      setSelectedMessages(selectedMessages.filter(id => id !== messageId));
    } else {
      setSelectedMessages([...selectedMessages, messageId]);
    }
  };

  const handleSave = async () => {
    if (!session || !dogId) return;
    
    setLoading(true);
    
    try {
      // Prepare content from selected messages
      const selectedContent = messages
        .filter(msg => selectedMessages.includes(msg.id))
        .map(msg => {
          const role = msg.role === 'user' ? 'Du' : 'KI-Coach';
          return `${role}: ${msg.content}`;
        })
        .join('\n\n');
      
      // Save to diary_entries table
      const { error } = await supabase
        .from('diary_entries')
        .insert({
          dog_id: dogId,
          title,
          content: selectedContent,
          entry_date: new Date().toISOString().split('T')[0],
          entry_type: 'coaching',
          mood_rating: 3 // Neutral mood
        });
      
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error saving to diary:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">Im Tagebuch speichern</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Erfolgreich gespeichert!</h3>
            <p className="text-gray-300">
              Der Eintrag wurde erfolgreich im Tagebuch gespeichert.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {!dogId ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-lg">
                Bitte wähle zuerst einen Hund aus, um im Tagebuch zu speichern.
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Titel des Eintrags</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Zu speichernde Nachrichten</label>
                  <div className="max-h-60 overflow-y-auto bg-white/5 rounded-lg p-2 space-y-2">
                    {messages.map(message => (
                      <div 
                        key={message.id}
                        className={`flex items-center p-2 rounded-lg ${
                          selectedMessages.includes(message.id) 
                            ? 'bg-purple-600/20 border border-purple-500/50' 
                            : 'bg-white/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={message.id}
                          checked={selectedMessages.includes(message.id)}
                          onChange={() => toggleMessageSelection(message.id)}
                          className="h-4 w-4 text-purple-600 rounded border-white/20 bg-white/10 focus:ring-purple-500 mr-3"
                        />
                        <label htmlFor={message.id} className="flex-1 cursor-pointer text-sm">
                          <div className="font-medium">{message.role === 'user' ? 'Du' : 'KI-Coach'}</div>
                          <div className="text-gray-400 truncate">{message.content}</div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading || selectedMessages.length === 0}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Wird gespeichert...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        Speichern
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SaveToDiaryModal;