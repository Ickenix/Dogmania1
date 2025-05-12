import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Edit2, Calendar, X, Save, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WeightRecord {
  id: string;
  dog_id: string;
  weight: number;
  date: string;
  notes: string | null;
  created_at: string;
}

interface DogWeightHistoryProps {
  dogId: string;
  dogName: string;
}

const DogWeightHistory: React.FC<DogWeightHistoryProps> = ({ dogId, dogName }) => {
  const { session } = useAuth();
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (session && dogId) {
      fetchWeightRecords();
    }
  }, [session, dogId]);

  async function fetchWeightRecords() {
    try {
      const { data, error } = await supabase
        .from('dog_weight_history')
        .select('*')
        .eq('dog_id', dogId)
        .order('date', { ascending: false });

      if (error) throw error;
      setWeightRecords(data || []);
    } catch (error) {
      console.error('Error fetching weight records:', error);
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
          .from('dog_weight_history')
          .update({
            weight: parseFloat(weight),
            date,
            notes: notes || null
          })
          .eq('id', editingId);
          
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('dog_weight_history')
          .insert({
            dog_id: dogId,
            weight: parseFloat(weight),
            date,
            notes: notes || null
          });
          
        if (error) throw error;
      }
      
      resetForm();
      fetchWeightRecords();
    } catch (error) {
      console.error('Error saving weight record:', error);
    }
  }

  function editWeightRecord(record: WeightRecord) {
    setWeight(record.weight.toString());
    setDate(record.date);
    setNotes(record.notes || '');
    setEditingId(record.id);
    setShowForm(true);
  }

  async function deleteWeightRecord(id: string) {
    if (!confirm('Sind Sie sicher, dass Sie diesen Gewichtseintrag löschen möchten?')) return;
    
    try {
      const { error } = await supabase
        .from('dog_weight_history')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchWeightRecords();
    } catch (error) {
      console.error('Error deleting weight record:', error);
    }
  }

  function resetForm() {
    setWeight('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setEditingId(null);
    setShowForm(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Sort records by date for the chart
  const sortedRecords = [...weightRecords].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate statistics
  const currentWeight = weightRecords.length > 0 ? 
    weightRecords.reduce((latest, record) => 
      new Date(record.date) > new Date(latest.date) ? record : latest
    , weightRecords[0]).weight : 0;

  const averageWeight = weightRecords.length > 0 ? 
    weightRecords.reduce((sum, record) => sum + record.weight, 0) / weightRecords.length : 0;

  const minWeight = weightRecords.length > 0 ? 
    Math.min(...weightRecords.map(record => record.weight)) : 0;

  const maxWeight = weightRecords.length > 0 ? 
    Math.max(...weightRecords.map(record => record.weight)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{dogName}'s Gewichtsverlauf</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Gewicht hinzufügen
        </button>
      </div>

      {/* Statistics */}
      {weightRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Aktuelles Gewicht</h3>
            <p className="text-2xl font-bold">{currentWeight} kg</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Durchschnittsgewicht</h3>
            <p className="text-2xl font-bold">{averageWeight.toFixed(1)} kg</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Min. Gewicht</h3>
            <p className="text-2xl font-bold">{minWeight} kg</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Max. Gewicht</h3>
            <p className="text-2xl font-bold">{maxWeight} kg</p>
          </div>
        </div>
      )}

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
                {editingId ? 'Gewichtseintrag bearbeiten' : 'Neuer Gewichtseintrag'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Gewicht (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="z.B. 15.5"
                    required
                  />
                </div>
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
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notizen</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Zusätzliche Notizen..."
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

      {/* Weight Chart */}
      {weightRecords.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Gewichtsverlauf</h3>
          <div className="h-64 bg-white/5 rounded-lg p-4">
            <div className="h-full flex items-end">
              {sortedRecords.map((record, index) => (
                <div 
                  key={record.id} 
                  className="flex-1 flex flex-col items-center group relative"
                >
                  <div 
                    className="w-full bg-purple-600 rounded-t transition-all hover:bg-purple-500"
                    style={{ 
                      height: `${(record.weight / maxWeight) * 100}%`,
                      maxWidth: '80%' 
                    }}
                  ></div>
                  <div className="mt-2 text-xs text-gray-400 truncate max-w-full">
                    {new Date(record.date).toLocaleDateString()}
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-white/10 backdrop-blur-sm rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {record.weight} kg am {new Date(record.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weight Records List */}
      {weightRecords.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Keine Gewichtseinträge</h3>
          <p className="text-gray-400 mb-6">
            Beginne damit, das Gewicht deines Hundes zu verfolgen, um seine Gesundheit im Laufe der Zeit zu überwachen.
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
          >
            Ersten Gewichtseintrag hinzufügen
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Gewichtsverlauf</h3>
          {weightRecords.map((record) => (
            <div
              key={record.id}
              className="bg-white/5 backdrop-blur-lg rounded-lg p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{record.weight} kg</h3>
                  <div className="flex items-center text-sm text-gray-400 mt-1">
                    <Calendar size={14} className="mr-1" />
                    {new Date(record.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => editWeightRecord(record)}
                    className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteWeightRecord(record.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {record.notes && (
                <p className="text-gray-300 mt-2">{record.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DogWeightHistory;