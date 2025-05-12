import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Flag } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReportUserModalProps {
  userId: string;
  username: string;
  onClose: () => void;
}

const ReportUserModal: React.FC<ReportUserModalProps> = ({ userId, username, onClose }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    try {
      setLoading(true);

      // In a real app, you would insert into a reports table
      // For now, we'll just simulate a successful report
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error reporting user:', error);
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
          <h2 className="text-xl font-semibold">Nutzer melden</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flag size={32} className="text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Meldung gesendet</h3>
            <p className="text-gray-300">
              Vielen Dank für deine Meldung. Wir werden den Fall überprüfen.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="mb-4">
              <p className="text-gray-300">
                Du möchtest <span className="font-semibold">{username}</span> melden. Bitte gib einen Grund an:
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Grund der Meldung</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                rows={4}
                placeholder="Beschreibe, warum du diesen Nutzer melden möchtest..."
                required
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={!reason.trim() || loading}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Flag size={18} className="mr-2" />
                    Melden
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ReportUserModal;