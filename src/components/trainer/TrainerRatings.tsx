import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Rating {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface TrainerRatingsProps {
  trainerId: string | undefined;
}

const TrainerRatings: React.FC<TrainerRatingsProps> = ({ trainerId }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ratingsPerPage = 5;

  useEffect(() => {
    if (trainerId) {
      fetchRatings();
    }
  }, [trainerId, page]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      
      // Get total count for pagination
      const { count } = await supabase
        .from('ratings')
        .select('*', { count: 'exact' })
        .eq('trainer_id', trainerId);
        
      setTotalPages(Math.ceil((count || 0) / ratingsPerPage));

      // Fetch ratings with pagination
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('trainer_id', trainerId)
        .order('created_at', { ascending: false })
        .range((page - 1) * ratingsPerPage, page * ratingsPerPage - 1);

      if (error) throw error;
      setRatings(data || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">Bewertungen</h2>

        {ratings.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Noch keine Bewertungen vorhanden
          </div>
        ) : (
          <div className="space-y-6">
            {ratings.map((rating) => (
              <div key={rating.id} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 flex-shrink-0">
                    {rating.profiles.avatar_url ? (
                      <img
                        src={rating.profiles.avatar_url}
                        alt={rating.profiles.username}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <Star size={20} className="text-purple-400" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{rating.profiles.username}</p>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              size={16}
                              className={`${
                                index < rating.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-400'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">
                        {formatDate(rating.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-300 mt-2">{rating.comment}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`p-2 rounded-lg ${
                    page === 1
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-purple-400 hover:bg-white/10'
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-gray-400">
                  Seite {page} von {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`p-2 rounded-lg ${
                    page === totalPages
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-purple-400 hover:bg-white/10'
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerRatings;