import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreateThreadModalProps {
  groupId: string;
  onClose: () => void;
  onCreated: () => void;
}

const CreateThreadModal: React.FC<CreateThreadModalProps> = ({ groupId, onClose, onCreated }) => {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('group_threads')
        .insert({
          group_id: groupId,
          user_id: session.user.id,
          title,
          content
        });

      if (error) throw error;

      onCreated();
    } catch (error) {
      console.error('Error creating thread:', error);
    } finally {
      setLoading(false);
    }
  }

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
        className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">Neue Diskussion erstellen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              placeholder="Gib deiner Diskussion einen aussagekräftigen Titel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Inhalt</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={8}
              required
              placeholder="Beschreibe dein Thema ausführlich..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Erstelle...' : 'Diskussion erstellen'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateThreadModal;