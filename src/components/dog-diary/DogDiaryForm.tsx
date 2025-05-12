import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Calendar, Smile, MapPin, Image as ImageIcon, 
  Save, X, Tag, Check, Trash2 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface JournalEntry {
  id: string;
  user_id: string;
  dog_id: string;
  date: string;
  category: string;
  title: string;
  content: string | null;
  mood: string | null;
  image_url: string | null;
  created_at: string;
}

interface DogDiaryFormProps {
  dogId: string;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
  editEntry: JournalEntry | null;
}

const DogDiaryForm: React.FC<DogDiaryFormProps> = ({
  dogId,
  categories,
  onClose,
  onSave,
  editEntry
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('training');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState<string>('😊');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editEntry) {
      setTitle(editEntry.title);
      setContent(editEntry.content || '');
      setCategory(editEntry.category);
      setDate(editEntry.date);
      setMood(editEntry.mood || '😊');
      
      if (editEntry.image_url) {
        setPhotoPreview(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/dogmedia/${editEntry.image_url}`);
      }
    }
  }, [editEntry]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    setPhoto(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Bitte gib einen Titel ein');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      let photoUrl = editEntry?.image_url || null;
      
      // Upload photo if selected
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${dogId}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('dogmedia')
          .upload(fileName, photo);
          
        if (uploadError) throw uploadError;
        photoUrl = fileName;
      }
      
      if (editEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('dog_journals')
          .update({
            title,
            content,
            category,
            date,
            mood,
            image_url: photoUrl
          })
          .eq('id', editEntry.id);
          
        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase
          .from('dog_journals')
          .insert([{
            user_id: (await supabase.auth.getUser()).data.user?.id,
            dog_id: dogId,
            title,
            content,
            category,
            date,
            mood,
            image_url: photoUrl
          }]);
          
        if (error) throw error;
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      setError('Fehler beim Speichern des Eintrags');
    } finally {
      setLoading(false);
    }
  };

  const moods = ['😢', '😕', '😐', '😊', '😃'];

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {editEntry ? 'Eintrag bearbeiten' : 'Neuer Tagebucheintrag'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Datum</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stimmung</label>
            <div className="flex justify-between">
              {moods.map((moodEmoji) => (
                <button
                  key={moodEmoji}
                  type="button"
                  onClick={() => setMood(moodEmoji)}
                  className={`w-12 h-12 text-2xl flex items-center justify-center rounded-full transition-all ${
                    mood === moodEmoji
                      ? 'bg-purple-600 transform scale-110'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {moodEmoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Titel</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="z.B. Erste Trainingsstunde, Tierarztbesuch, ..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Kategorie</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center ${
                  category === cat.id
                    ? 'bg-purple-600 text-white'
                    : `bg-white/10 hover:bg-white/20 ${cat.color}`
                }`}
              >
                <Tag size={16} className="mr-2" />
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Beschreibung</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={4}
            placeholder="Was ist heute passiert? Wie hat sich dein Hund verhalten?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Foto (optional)</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
              <ImageIcon size={20} />
              <span>Foto auswählen</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
            
            {photoPreview && (
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  setPhotoPreview(null);
                }}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Foto entfernen"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
          
          {photoPreview && (
            <div className="mt-4 relative">
              <img
                src={photoPreview}
                alt="Vorschau"
                className="w-full max-h-64 object-contain rounded-lg"
              />
            </div>
          )}
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
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Wird gespeichert...
              </>
            ) : (
              <>
                <Save size={20} className="mr-2" />
                Speichern
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DogDiaryForm;