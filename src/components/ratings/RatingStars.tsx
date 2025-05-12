import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 20,
  interactive = false,
  onChange
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <div className="flex items-center">
      {Array.from({ length: maxRating }).map((_, index) => {
        const starRating = index + 1;
        const isFilled = interactive
          ? (hoverRating || rating) >= starRating
          : rating >= starRating;

        return (
          <button
            key={index}
            className={`p-0.5 transition-colors ${
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } ${
              isFilled ? 'text-yellow-400' : 'text-gray-400'
            }`}
            onClick={() => {
              if (interactive && onChange) {
                onChange(starRating);
              }
            }}
            onMouseEnter={() => {
              if (interactive) {
                setHoverRating(starRating);
              }
            }}
            onMouseLeave={() => {
              if (interactive) {
                setHoverRating(0);
              }
            }}
            disabled={!interactive}
          >
            <Star
              size={size}
              fill={isFilled ? 'currentColor' : 'none'}
              className="transition-transform"
            />
          </button>
        );
      })}
    </div>
  );
};

export default RatingStars;