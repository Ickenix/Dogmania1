import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Edit2, Calendar, User, X, Save, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HealthRecord {
  id: string;
  dog_id: string;
  type: string;
  date: string;
  title: string;
  description: string | null;
  vet_name: string | null;
  created_at: string;
}

interface DogHealthRecordsProps {
  dogId: string;
  dogName: string;
}

const DogHealthRecords: React.FC<DogHealthRecordsProps> = ({ dogId, dogName }) => {
  const { session } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [type, setType] = useState('checkup');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [vetName, setVetName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Record types
  const recordTypes = [
    { id: 'checkup', name: 'Routineuntersuchung' },
    { id: 'emergency', name: 'Notfall' },
    { id: 'surgery', name: 'Operation' },
    { id: 'dental', name: 'Zahnpflege' },
    { id: 'grooming', name: 'Fellpflege' },
    { id: 'other', name: 'Sonstiges' }
  ];

  useEffect(() => {
    if (session && dogId) {
      fetchHealthRecords();
    }
  }, [session, dogId]);

  async function fetchHealthRecords() {
    try {
      const { data, error } = await supabase
        .from('dog_health_records')
        .select('*')
        .eq('dog_id', dogId)
        .order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching health records:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update existing record
        const { error } = await supabase
          .from('dog_health_records')
          .update({
            type,
            date,
            title,
            description: description || null,
            vet_name: vetName || null
          })
          .eq('id', editingId);
          
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('dog_health_records')
          .insert({
            dog_id: dogId,
            type,
            date,
            title,
            description: description || null,
            vet_name: vetName || null
          });
          
        if (error) throw error;
      }
      
      resetForm();
      fetchHealthRecords();
    } catch (error) {
      console.error('Error saving health record:', error);
    }
  }

  function editRecord(record: HealthRecord) {
    setType(record.type);
    setDate(record.date);
    setTitle(record.title);
    setDescription(record.description || '');
    setVetName(record.vet_name || '');
    setEditingId(record.id);
    setShowForm(true);
  }

  async function deleteRecord(id: string) {
    if (!confirm('Sind Sie sicher, dass Sie diesen Gesundheitseintrag löschen möchten?')) return;
    
    try {
      const { error } = await supabase
        .from('dog_health_records')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchHealthRecords();
    } catch (error) {
      console.error('Error deleting health record:', error);
    }
  }

  function resetForm() {
    setType('checkup');
    setDate(new Date().toISOString().split('T')[0]);
    setTitle('');
    setDescription('');
    setVetName('');
    setEditingId(null);
    setShowForm(false);
  }

  function getTypeLabel(typeId: string): string {
    const type = recordTypes.find(t => t.id === typeId);
    return type ? type.name : typeId;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{dogName}'s Gesundheitsakte</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Eintrag hinzufügen
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                {editingId ? 'Gesundheitseintrag bearbeiten' : 'Neuer Gesundheitseintrag'}
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
                <label className="block text-sm font-medium mb-2">Art des Eintrags</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {recordTypes.map(recordType => (
                    <button
                      key={recordType.id}
                      type="button"
                      onClick={() => setType(recordType.id)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        type === recordType.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {recordType.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Datum</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tierarzt</label>
                  <input
                    type="text"
                    value={vetName}
                    onChange={(e) => setVetName(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Name des Tierarztes"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Titel</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="z.B. Jährliche Untersuchung, Zahnreinigung, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Beschreibung</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Details zum Besuch oder Verfahren..."
                />
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
                  Speichern
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Records List */}
      {records.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Keine Gesundheitseinträge</h3>
          <p className="text-gray-400 mb-6">
            Beginne damit, die Gesundheitsbesuche und Verfahren deines Hundes zu verfolgen, um eine vollständige Krankengeschichte zu führen.
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
          >
            Ersten Gesundheitseintrag hinzufügen
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white/5 backdrop-blur-lg rounded-lg p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs mr-2">
                      {getTypeLabel(record.type)}
                    </span>
                    <h3 className="font-semibold">{record.title}</h3>
                  </div>
                  <div className="flex items-center text-sm text-gray-400 mt-1">
                    <Calendar size={14} className="mr-1" />
                    {new Date(record.date).toLocaleDateString()}
                    {record.vet_name && (
                      <>
                        <span className="mx-2">•</span>
                        <User size={14} className="mr-1" />
                        {record.vet_name}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => editRecord(record)}
                    className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteRecord(record.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {record.description && (
                <p className="text-gray-300 mt-2">{record.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DogHealthRecords;