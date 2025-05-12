import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { X, Flag } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReportModalProps {
  type: 'post' | 'comment' | 'thread';
  referenceId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ 
  type, 
  referenceId, 
  onClose, 
  onSubmitted 
}) => {
  const { session } = useAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('reports')
        .insert({
          type,
          reference_id: referenceId,
          reason,
          reported_by: session.user.id
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onSubmitted();
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
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
        className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">Inhalt melden</h2>
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
              <Flag size={32} className="text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Vielen Dank für deine Meldung</h3>
            <p className="text-gray-300">
              Wir werden den gemeldeten Inhalt überprüfen und gegebenenfalls Maßnahmen ergreifen.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Flag size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {type === 'post' ? 'Beitrag melden' : 
                   type === 'comment' ? 'Kommentar melden' : 
                   'Thread melden'}
                </h3>
                <p className="text-sm text-gray-400">
                  Hilf uns, die Community sicher zu halten
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Grund der Meldung</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={4}
                required
                placeholder="Beschreibe, warum du diesen Inhalt meldest..."
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
                disabled={loading || !reason.trim()}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird gesendet...' : 'Melden'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ReportModal;