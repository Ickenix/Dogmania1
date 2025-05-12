import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Calendar, Filter, Search, Plus, Smile, MapPin, 
  Image as ImageIcon, Save, X, ChevronLeft, ChevronRight,
  BarChart2, Clock, Tag, Bookmark
} from 'lucide-react';
import { format, parseISO, isToday, isYesterday, isSameMonth, addMonths, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import DogDiaryEntry from './DogDiaryEntry';
import DogDiaryForm from './DogDiaryForm';
import DogDiaryCalendar from './DogDiaryCalendar';
import DogDiaryAnalytics from '../dashboard/DogDiaryAnalytics';

interface Dog {
  id: string;
  name: string;
  breed: string;
  birth_date: string;
  image_url: string | null;
}

interface JournalEntry {
  id: string;
  user_id: string;
  dog_id: string;
  entry_date: string;
  category: string;
  title: string;
  content: string | null;
  mood: string | null;
  photo_url: string | null;
  image_url: string | null;
  created_at: string;
}

const DogDiaryPage: React.FC = () => {
  const { dogId } = useParams<{ dogId: string }>();
  const { session } = useAuth();
  const [dog, setDog] = useState<Dog | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'analytics'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [userDogs, setUserDogs] = useState<Dog[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(dogId || null);

  useEffect(() => {
    if (session) {
      fetchUserDogs();
    }
  }, [session]);

  useEffect(() => {
    if (dogId) {
      setSelectedDogId(dogId);
    }
  }, [dogId]);

  useEffect(() => {
    if (selectedDogId) {
      fetchDogDetails();
      fetchEntries();
    }
  }, [selectedDogId]);

  useEffect(() => {
    filterEntries();
  }, [entries, searchQuery, categoryFilter]);

  async function fetchUserDogs() {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed, birth_date, image_url')
        .eq('owner_id', session?.user.id)
        .order('name');

      if (error) throw error;
      
      setUserDogs(data || []);
      
      if (data && data.length > 0 && !selectedDogId) {
        setSelectedDogId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching dogs:', error);
    }
  }

  async function fetchDogDetails() {
    if (!selectedDogId) return;
    
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed, birth_date, image_url')
        .eq('id', selectedDogId)
        .single();

      if (error) throw error;
      setDog(data);
    } catch (error) {
      console.error('Error fetching dog details:', error);
    }
  }

  async function fetchEntries() {
    if (!selectedDogId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('dog_id', selectedDogId)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterEntries() {
    let filtered = [...entries];
    
    if (searchQuery) {
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.content && entry.content.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(entry => entry.category === categoryFilter);
    }
    
    setFilteredEntries(filtered);
  }

  function handleEditEntry(entry: JournalEntry) {
    setEditingEntry(entry);
    setShowForm(true);
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm('Möchtest du diesen Eintrag wirklich löschen?')) return;
    
    try {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', entryId);
        
      if (error) throw error;
      
      setEntries(entries.filter(entry => entry.id !== entryId));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  }

  function formatDate(dateString: string) {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return 'Heute';
    } else if (isYesterday(date)) {
      return 'Gestern';
    } else {
      return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
    }
  }

  const categories = [
    { id: 'training', name: 'Training', color: 'bg-blue-500/20 text-blue-400' },
    { id: 'health', name: 'Gesundheit', color: 'bg-green-500/20 text-green-400' },
    { id: 'nutrition', name: 'Ernährung', color: 'bg-yellow-500/20 text-yellow-400' },
    { id: 'behavior', name: 'Verhalten', color: 'bg-red-500/20 text-red-400' },
    { id: 'other', name: 'Sonstiges', color: 'bg-gray-500/20 text-gray-400' }
  ];

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : 'bg-gray-500/20 text-gray-400';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  if (!selectedDogId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">Kein Hund ausgewählt</h2>
          <p className="text-gray-400 mb-6">
            Bitte wähle einen Hund aus, um sein Tagebuch zu sehen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tagebuch von {dog?.name || 'deinem Hund'}</h1>
          <p className="text-gray-400">
            Halte besondere Momente und Fortschritte fest
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          {userDogs.length > 1 && (
            <div className="flex gap-2">
              {userDogs.map(dog => (
                <button
                  key={dog.id}
                  onClick={() => setSelectedDogId(dog.id)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedDogId === dog.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {dog.name}
                </button>
              ))}
            </div>
          )}
          
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Neuer Eintrag
          </button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              viewMode === 'timeline' ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <Clock size={18} className="mr-2" />
            Chronik
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              viewMode === 'calendar' ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <Calendar size={18} className="mr-2" />
            Kalender
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              viewMode === 'analytics' ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <BarChart2 size={18} className="mr-2" />
            Stimmungsanalyse
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 overflow-hidden"
          >
            <DogDiaryForm
              dogId={selectedDogId}
              categories={categories}
              onClose={() => {
                setShowForm(false);
                setEditingEntry(null);
              }}
              onSave={() => {
                setShowForm(false);
                setEditingEntry(null);
                fetchEntries();
              }}
              editEntry={editingEntry}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'timeline' && (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Suche nach Einträgen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Alle Kategorien</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
              <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Keine Einträge gefunden</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || categoryFilter
                  ? 'Versuche es mit anderen Filtereinstellungen'
                  : 'Erstelle deinen ersten Tagebucheintrag für ' + dog?.name}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
              >
                Ersten Eintrag erstellen
              </button>
            </div>
          ) : (
            <>
              {Object.entries(
                filteredEntries.reduce<Record<string, JournalEntry[]>>((groups, entry) => {
                  const date = entry.entry_date;
                  if (!groups[date]) {
                    groups[date] = [];
                  }
                  groups[date].push(entry);
                  return groups;
                }, {})
              ).map(([date, dateEntries]) => (
                <div key={date} className="space-y-4">
                  <h3 className="text-xl font-semibold">{formatDate(date)}</h3>
                  
                  {dateEntries.map(entry => (
                    <DogDiaryEntry
                      key={entry.id}
                      entry={entry}
                      onEdit={() => handleEditEntry(entry)}
                      onDelete={() => handleDeleteEntry(entry.id)}
                      getCategoryColor={getCategoryColor}
                      getCategoryName={getCategoryName}
                    />
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {viewMode === 'calendar' && (
        <DogDiaryCalendar
          entries={entries}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
          getCategoryColor={getCategoryColor}
          getCategoryName={getCategoryName}
        />
      )}

      {viewMode === 'analytics' && selectedDogId && dog && (
        <DogDiaryAnalytics
          dogId={selectedDogId}
          dogName={dog.name}
        />
      )}
    </div>
  );
};

export default DogDiaryPage;