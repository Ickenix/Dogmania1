import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Tag } from 'lucide-react';

interface DogDiaryEntryProps {
  entry: {
    id: string;
    title: string;
    content: string | null;
    date: string;
    entry_date?: string;
    category?: string;
    entry_type?: string;
    mood?: string;
    image_url?: string;
    photo_url?: string;
    location?: string;
  };
  onEdit: () => void;
  onDelete: (id: string) => void;
  getCategoryColor: (category: string) => string;
  getCategoryName: (category: string) => string;
}

const DogDiaryEntry: React.FC<DogDiaryEntryProps> = ({ entry, onEdit, onDelete, getCategoryColor, getCategoryName }) => {
  const date = entry.entry_date || entry.date;
  const category = entry.category || entry.entry_type || '';
  const imageUrl = entry.image_url || entry.photo_url;
  
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 hover:bg-white/10 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center">
            <span className={`px-3 py-1 rounded-full text-xs mr-2 ${getCategoryColor(category)}`}>
              {getCategoryName(category)}
            </span>
            <h3 className="font-semibold">{entry.title}</h3>
          </div>
          <div className="flex items-center text-sm text-gray-400 mt-1">
            <Calendar size={14} className="mr-1" />
            {format(new Date(date), 'EEEE, d. MMMM yyyy')}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {image_url && (
        <div className="mt-3 mb-3">
          <img 
            src={image_url} 
            alt="Diary entry" 
            className="w-full rounded-lg"
          />
        </div>
      )}

      {entry.content && (
        <p className="text-gray-300 mt-2">{entry.content}</p>
      )}
      
      {entry.mood && (
        <div className="mt-2 text-xl">{entry.mood}</div>
      )}
      
      {entry.location && (
        <div className="flex items-center mt-2 text-sm text-gray-400">
          <MapPin size={14} className="mr-1" />
          {entry.location}
        </div>
      )}
    </div>
  );
};

export default DogDiaryEntry;