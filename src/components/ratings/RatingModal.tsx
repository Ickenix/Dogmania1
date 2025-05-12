import React, { useState } from 'react';
import { X } from 'lucide-react';
import RatingStars from './RatingStars';

interface RatingModalProps {
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  title: string;
}

const RatingModal: React.FC<RatingModalProps> = ({ onClose, onSubmit, title }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    try {
      setLoading(true);
      await onSubmit(rating, comment);
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex flex-col items-center">
            <RatingStars
              rating={rating}
              interactive
              onChange={setRating}
              size={32}
            />
            <p className="mt-2 text-sm text-gray-400">
              {rating === 0
                ? 'Wähle eine Bewertung'
                : `${rating} von 5 Sternen`}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Dein Kommentar
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
              placeholder="Was hat dir besonders gefallen? Was könnte verbessert werden?"
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
              disabled={rating === 0 || loading}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Wird gespeichert...' : 'Bewertung abschicken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;