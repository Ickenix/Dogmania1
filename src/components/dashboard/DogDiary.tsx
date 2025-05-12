import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Calendar, Image as ImageIcon, Smile, Trash2, Edit2, Save, X, ChevronLeft, ChevronRight, 
  Download, FileText, MapPin, Tag, Search, Filter, Clock, CheckCircle, Circle 
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import DogDiaryExport from './DogDiaryExport';

interface DiaryEntry {
  id: string;
  dog_id: string;
  title: string;
  content: string;
  entry_date: string;
  entry_type: string;
  mood_rating: number;
  image_url: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

interface DogDiaryProps {
  dogId: string;
  dogName: string;
}

const DogDiary: React.FC<DogDiaryProps> = ({ dogId, dogName }) => {
  const { session } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'export'>('timeline');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<[Date | null, Date | null]>([null, null]);
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryType, setEntryType] = useState('training');
  const [moodRating, setMoodRating] = useState(3);
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [location, setLocation] = useState('');

  const entryTypes = [
    { id: 'training', name: 'Training', color: 'text-blue-400' },
    { id: 'health', name: 'Gesundheit', color: 'text-green-400' },
    { id: 'nutrition', name: 'Ernährung', color: 'text-yellow-400' },
    { id: 'behavior', name: 'Verhalten', color: 'text-red-400' },
    { id: 'experience', name: 'Erlebnis', color: 'text-purple-400' },
    { id: 'other', name: 'Sonstiges', color: 'text-gray-400' }
  ];

  useEffect(() => {
    fetchEntries();
    setupRealtimeSubscription();
  }, [dogId]);

  function setupRealtimeSubscription() {
    const subscription = supabase
      .channel('diary_entries_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'diary_entries',
        filter: `dog_id=eq.${dogId}`
      }, () => {
        fetchEntries();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  async function fetchEntries() {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('dog_id', dogId)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching diary entries:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      let imageUrl = editingEntry?.image_url || null;
      
      // Upload new image if selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const filePath = `${dogId}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('diary_images')
          .upload(filePath, selectedImage);

        if (uploadError) throw uploadError;
        imageUrl = filePath;
      }

      const entryData = {
        dog_id: dogId,
        title,
        content,
        entry_date: entryDate,
        entry_type: entryType,
        mood_rating: moodRating,
        image_url: imageUrl,
        location
      };

      if (editingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('diary_entries')
          .update(entryData)
          .eq('id', editingEntry.id);

        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase
          .from('diary_entries')
          .insert([entryData]);

        if (error) throw error;
      }

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving diary entry:', error);
    }
  }

  async function handleDelete(entryId: string) {
    if (!confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting diary entry:', error);
    }
  }

  function handleEdit(entry: DiaryEntry) {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content || '');
    setEntryType(entry.entry_type);
    setMoodRating(entry.mood_rating);
    setEntryDate(entry.entry_date);
    setLocation(entry.location || '');
    setImagePreview(entry.image_url ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/diary_images/${entry.image_url}` : null);
    setShowForm(true);
  }

  function resetForm() {
    setTitle('');
    setContent('');
    setEntryType('training');
    setMoodRating(3);
    setEntryDate(format(new Date(), 'yyyy-MM-dd'));
    setLocation('');
    setSelectedImage(null);
    setImagePreview(null);
    setEditingEntry(null);
    setShowForm(false);
  }

  function handleLocationDetect() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Use reverse geocoding to get location name
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then(response => response.json())
          .then(data => {
            const locationName = data.display_name.split(',').slice(0, 3).join(', ');
            setLocation(locationName);
          })
          .catch(error => {
            console.error('Error getting location name:', error);
            setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          });
      });
    }
  }

  const getEntryTypeColor = (type: string) => {
    const entryType = entryTypes.find(t => t.id === type);
    return entryType ? entryType.color : 'text-gray-400';
  };

  const getEntryTypeName = (type: string) => {
    const entryType = entryTypes.find(t => t.id === type);
    return entryType ? entryType.name : type;
  };

  const getMoodEmoji = (rating: number) => {
    switch (rating) {
      case 1: return '😢';
      case 2: return '😕';
      case 3: return '😊';
      case 4: return '😃';
      case 5: return '🥰';
      default: return '😊';
    }
  };

  const getMoodLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Sehr schlecht';
      case 2: return 'Schlecht';
      case 3: return 'Neutral';
      case 4: return 'Gut';
      case 5: return 'Sehr gut';
      default: return 'Neutral';
    }
  };

  // Calendar functions
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const hasEntryOnDate = (date: Date) => {
    return entries.some(entry => 
      isSameDay(new Date(entry.entry_date), date)
    );
  };

  const entriesForDate = (date: Date) => {
    return entries.filter(entry => 
      isSameDay(new Date(entry.entry_date), date)
    );
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    // Filter by search query
    const matchesSearch = !searchQuery || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.content && entry.content.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by category
    const matchesCategory = !categoryFilter || entry.entry_type === categoryFilter;
    
    // Filter by date range
    const entryDate = new Date(entry.entry_date);
    const matchesDateRange = 
      (!dateFilter[0] || entryDate >= dateFilter[0]) &&
      (!dateFilter[1] || entryDate <= dateFilter[1]);
    
    return matchesSearch && matchesCategory && matchesDateRange;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Tagebuch von {dogName}</h2>
          <p className="text-gray-400">Halte besondere Momente und Fortschritte fest</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-white/5 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 ${viewMode === 'timeline' ? 'bg-purple-600' : 'hover:bg-white/10'} transition-colors`}
            >
              Chronik
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 ${viewMode === 'calendar' ? 'bg-purple-600' : 'hover:bg-white/10'} transition-colors`}
            >
              Kalender
            </button>
            <button
              onClick={() => setViewMode('export')}
              className={`px-4 py-2 ${viewMode === 'export' ? 'bg-purple-600' : 'hover:bg-white/10'} transition-colors flex items-center`}
            >
              <Download size={16} className="mr-1" />
              Export
            </button>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingEntry(null);
              resetForm();
              setEntryDate(format(new Date(), 'yyyy-MM-dd'));
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors"
          >
            Neuer Eintrag
          </button>
        </div>
      </div>

      {/* Entry Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  {editingEntry ? 'Eintrag bearbeiten' : 'Neuer Tagebucheintrag'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Datum</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Titel</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    placeholder="z.B. Erste Trainingsstunde, Tierarztbesuch, ..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Kategorie</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {entryTypes.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setEntryType(type.id)}
                        className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center ${
                          entryType === type.id
                            ? 'bg-purple-600 text-white'
                            : `bg-white/10 hover:bg-white/20 ${type.color}`
                        }`}
                      >
                        <Tag size={16} className="mr-2" />
                        {type.name}
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
                  <label className="block text-sm font-medium mb-2">Stimmung</label>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setMoodRating(rating)}
                          className={`w-12 h-12 text-2xl rounded-full flex items-center justify-center transition-all ${
                            moodRating === rating
                              ? 'bg-purple-600 transform scale-110'
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                          title={getMoodLabel(rating)}
                        >
                          {getMoodEmoji(rating)}
                        </button>
                      ))}
                    </div>
                    <div className="text-center text-sm text-gray-400">
                      {getMoodLabel(moodRating)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Standort (optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="z.B. Hundepark, Wald, ..."
                    />
                    <button
                      type="button"
                      onClick={handleLocationDetect}
                      className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
                      title="Standort erkennen"
                    >
                      <MapPin size={20} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                      <ImageIcon size={20} />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <span className="text-sm text-gray-400">Bild hinzufügen</span>
                  </label>
                  {imagePreview && (
                    <div className="mt-2 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 bg-black/50 p-1 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
                  >
                    <Save size={18} className="mr-2" />
                    {editingEntry ? 'Aktualisieren' : 'Speichern'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      {viewMode !== 'export' && (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Filter size={18} className="mr-2" />
              {showFilters ? 'Filter ausblenden' : 'Filter anzeigen'}
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{entries.length} Einträge</span>
            </div>
          </div>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Suche nach Einträgen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Kategorie</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                      >
                        <option value="">Alle Kategorien</option>
                        {entryTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Zeitraum</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dateFilter[0] ? format(dateFilter[0], 'yyyy-MM-dd') : ''}
                          onChange={(e) => setDateFilter([e.target.value ? new Date(e.target.value) : null, dateFilter[1]])}
                          className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                          placeholder="Von"
                        />
                        <input
                          type="date"
                          value={dateFilter[1] ? format(dateFilter[1], 'yyyy-MM-dd') : ''}
                          onChange={(e) => setDateFilter([dateFilter[0], e.target.value ? new Date(e.target.value) : null])}
                          className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                          placeholder="Bis"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center">
                        <Search size={12} className="mr-1" />
                        {searchQuery}
                        <button
                          onClick={() => setSearchQuery('')}
                          className="ml-2 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    
                    {categoryFilter && (
                      <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center">
                        <Tag size={12} className="mr-1" />
                        {getEntryTypeName(categoryFilter)}
                        <button
                          onClick={() => setCategoryFilter('')}
                          className="ml-2 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    
                    {(dateFilter[0] || dateFilter[1]) && (
                      <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {dateFilter[0] ? format(dateFilter[0], 'dd.MM.yyyy') : 'Anfang'} - {dateFilter[1] ? format(dateFilter[1], 'dd.MM.yyyy') : 'Ende'}
                        <button
                          onClick={() => setDateFilter([null, null])}
                          className="ml-2 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    
                    {(searchQuery || categoryFilter || dateFilter[0] || dateFilter[1]) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('');
                          setDateFilter([null, null]);
                        }}
                        className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-sm transition-colors"
                      >
                        Alle Filter zurücksetzen
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Export View */}
      {viewMode === 'export' && (
        <DogDiaryExport dogId={dogId} dogName={dogName} entries={entries} />
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-xl font-semibold">
              {format(currentMonth, 'MMMM yyyy', { locale: de })}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
              <div key={day} className="text-center text-sm font-medium py-2">
                {day}
              </div>
            ))}
            
            {Array.from({ length: startOfMonth(currentMonth).getDay() === 0 ? 6 : startOfMonth(currentMonth).getDay() - 1 }).map((_, i) => (
              <div key={`empty-start-${i}`} className="h-24 p-1"></div>
            ))}
            
            {daysInMonth.map((day) => {
              const hasEntry = hasEntryOnDate(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              
              return (
                <div
                  key={day.toString()}
                  onClick={() => {
                    setSelectedDate(day);
                  }}
                  className={`h-24 p-1 relative cursor-pointer ${
                    !isSameMonth(day, currentMonth) ? 'opacity-50' : ''
                  }`}
                >
                  <div className={`h-full rounded-lg p-2 ${
                    isSelected ? 'bg-purple-600' : 
                    isToday ? 'bg-white/10 border border-purple-500' : 
                    hasEntry ? 'bg-white/5' : ''
                  } hover:bg-white/10 transition-colors`}>
                    <div className="text-right text-sm">
                      {format(day, 'd')}
                    </div>
                    
                    {hasEntry && (
                      <div className="mt-1 space-y-1">
                        {entriesForDate(day).slice(0, 2).map((entry, i) => (
                          <div 
                            key={entry.id}
                            className={`text-xs truncate px-1 py-0.5 rounded ${getEntryTypeColor(entry.entry_type)}`}
                          >
                            {entry.title}
                          </div>
                        ))}
                        {entriesForDate(day).length > 2 && (
                          <div className="text-xs text-center text-gray-400">
                            +{entriesForDate(day).length - 2} mehr
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {Array.from({ length: (7 - ((daysInMonth.length + (startOfMonth(currentMonth).getDay() === 0 ? 6 : startOfMonth(currentMonth).getDay() - 1)) % 7)) % 7 }).map((_, i) => (
              <div key={`empty-end-${i}`} className="h-24 p-1"></div>
            ))}
          </div>
          
          {/* Selected day entries */}
          {entriesForDate(selectedDate).length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <h4 className="font-semibold mb-4">
                Einträge für {format(selectedDate, 'd. MMMM yyyy', { locale: de })}
              </h4>
              <div className="space-y-4">
                {entriesForDate(selectedDate).map(entry => (
                  <div
                    key={entry.id}
                    className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl" title={`Stimmung: ${entry.mood_rating}/5`}>
                            {getMoodEmoji(entry.mood_rating)}
                          </span>
                          <h3 className="font-semibold text-lg">{entry.title}</h3>
                        </div>
                        <div className="flex items-center space-x-3 mt-1">
                          <div className={`px-3 py-1 rounded-full text-xs ${getEntryTypeColor(entry.entry_type)}`}>
                            {getEntryTypeName(entry.entry_type)}
                          </div>
                          {entry.location && (
                            <div className="flex items-center text-xs text-gray-400">
                              <MapPin size={12} className="mr-1" />
                              {entry.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(entry)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {entry.content && (
                      <p className="text-gray-300 mt-3">{entry.content}</p>
                    )}
                    
                    {entry.image_url && (
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/diary_images/${entry.image_url}`}
                        alt="Entry image"
                        className="w-full rounded-lg mt-3"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
              <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Noch keine Einträge</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || categoryFilter || dateFilter[0] || dateFilter[1]
                  ? 'Keine Einträge mit diesen Filterkriterien gefunden.'
                  : 'Beginne damit, besondere Momente und Fortschritte deines Hundes festzuhalten.'}
              </p>
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingEntry(null);
                  resetForm();
                }}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
              >
                Ersten Eintrag erstellen
              </button>
            </div>
          ) : (
            filteredEntries.map(entry => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{entry.title}</h3>
                    <div className="flex items-center space-x-3 mt-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar size={16} className="text-gray-400" />
                        <span>{format(new Date(entry.entry_date), 'd. MMMM yyyy', { locale: de })}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm ${getEntryTypeColor(entry.entry_type)}`}>
                        {getEntryTypeName(entry.entry_type)}
                      </div>
                      <div className="text-2xl" title={`Stimmung: ${entry.mood_rating}/5`}>
                        {getMoodEmoji(entry.mood_rating)}
                      </div>
                    </div>
                    {entry.location && (
                      <div className="flex items-center mt-2 text-sm text-gray-400">
                        <MapPin size={16} className="mr-1" />
                        {entry.location}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEdit(entry)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-gray-300 mt-4 mb-4">{entry.content}</p>

                {entry.image_url && (
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/diary_images/${entry.image_url}`}
                    alt="Entry image"
                    className="w-full rounded-lg"
                  />
                )}
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DogDiary;