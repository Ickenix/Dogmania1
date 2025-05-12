import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeleteChatModalProps {
  conversationId: string;
  onClose: () => void;
  onDelete: () => void;
}

const DeleteChatModal: React.FC<DeleteChatModalProps> = ({ conversationId, onClose, onDelete }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);

      // In a real app, you would delete the conversation and all its messages
      // For now, we'll just simulate a successful deletion
      await new Promise(resolve => setTimeout(resolve, 1000));

      onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting conversation:', error);
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
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold">Chat löschen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} className="text-red-400" />
            </div>
            <p className="text-center text-gray-300">
              Bist du sicher, dass du diesen Chat löschen möchtest? 
              Alle Nachrichten werden unwiderruflich gelöscht.
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Wird gelöscht...
                </>
              ) : (
                <>
                  <Trash2 size={18} className="mr-2" />
                  Löschen
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DeleteChatModal;