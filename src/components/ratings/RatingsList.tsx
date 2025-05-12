import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import RatingStars from './RatingStars';

interface Rating {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface RatingsListProps {
  ratings: Rating[];
  emptyMessage?: string;
}

const RatingsList: React.FC<RatingsListProps> = ({
  ratings,
  emptyMessage = 'Noch keine Bewertungen'
}) => {
  if (ratings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ratings.map((rating) => (
        <div
          key={rating.id}
          className="bg-white/5 rounded-lg p-4"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              {rating.profiles.avatar_url ? (
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${rating.profiles.avatar_url}`}
                  alt={rating.profiles.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="text-lg font-bold text-purple-300">
                  {rating.profiles.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="font-semibold">{rating.profiles.username}</div>
              <div className="flex items-center text-sm text-gray-400">
                <RatingStars rating={rating.rating} size={16} />
                <span className="ml-2">
                  {format(new Date(rating.created_at), 'dd. MMMM yyyy', {
                    locale: de,
                  })}
                </span>
              </div>
            </div>
          </div>
          {rating.comment && (
            <p className="text-gray-300 mt-2">{rating.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default RatingsList;