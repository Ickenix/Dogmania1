import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface MoodChartProps {
  entries: {
    entry_date: string;
    mood_rating: number;
  }[];
  days?: number;
}

const DogDiaryMoodChart: React.FC<MoodChartProps> = ({ entries, days = 30 }) => {
  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  );
  
  // Get the mood emoji for a rating
  const getMoodEmoji = (rating: number) => {
    switch (rating) {
      case 1: return '😢';
      case 2: return '😕';
      case 3: return '😊';
      case 4: return '😃';
      case 5: return '🥰';
      default: return '';
    }
  };
  
  // Calculate max height for normalization
  const maxRating = 5;
  
  return (
    <div className="w-full">
      <div className="flex items-end h-40 space-x-1">
        {sortedEntries.map((item, index) => (
          <div 
            key={index} 
            className="flex-1 flex flex-col items-center group relative"
          >
            {item.mood_rating > 0 && (
              <>
                <div 
                  className="w-full bg-purple-600 hover:bg-purple-500 rounded-t transition-all"
                  style={{ 
                    height: `${(item.mood_rating / maxRating) * 100}%`,
                    maxWidth: '90%'
                  }}
                ></div>
                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 rounded px-2 py-1 text-xs whitespace-nowrap">
                  {format(new Date(item.entry_date), 'dd.MM.yyyy', { locale: de })}: {getMoodEmoji(item.mood_rating)}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>{sortedEntries.length > 0 ? format(new Date(sortedEntries[0].entry_date), 'dd.MM', { locale: de }) : ''}</span>
        <span>{sortedEntries.length > 0 ? format(new Date(sortedEntries[Math.floor(sortedEntries.length / 2)].entry_date), 'dd.MM', { locale: de }) : ''}</span>
        <span>{sortedEntries.length > 0 ? format(new Date(sortedEntries[sortedEntries.length - 1].entry_date), 'dd.MM', { locale: de }) : ''}</span>
      </div>
    </div>
  );
};

export default DogDiaryMoodChart;