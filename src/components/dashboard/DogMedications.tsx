import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Edit2, Calendar, X, Save, FileText, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Medication {
  id: string;
  dog_id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
}

interface DogMedicationsProps {
  dogId: string;
  dogName: string;
}

const DogMedications: React.FC<DogMedicationsProps> = ({ dogId, dogName }) => {
  const { session } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (session && dogId) {
      fetchMedications();
    }
  }, [session, dogId]);

  async function fetchMedications() {
    try {
      const { data, error } = await supabase
        .from('dog_medications')
        .select('*')
        .eq('dog_id', dogId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update existing medication
        const { error } = await supabase
          .from('dog_medications')
          .update({
            name,
            dosage,
            frequency,
            start_date: startDate,
            end_date: endDate || null,
            notes: notes || null
          })
          .eq('id', editingId);
          
        if (error) throw error;
      } else {
        // Create new medication
        const { error } = await supabase
          .from('dog_medications')
          .insert({
            dog_id: dogId,
            name,
            dosage,
            frequency,
            start_date: startDate,
            end_date: endDate || null,
            notes: notes || null
          });
          
        if (error) throw error;
      }
      
      resetForm();
      fetchMedications();
    } catch (error) {
      console.error('Error saving medication:', error);
    }
  }

  function editMedication(medication: Medication) {
    setName(medication.name);
    setDosage(medication.dosage);
    setFrequency(medication.frequency);
    setStartDate(medication.start_date);
    setEndDate(medication.end_date || '');
    setNotes(medication.notes || '');
    setEditingId(medication.id);
    setShowForm(true);
  }

  async function deleteMedication(id: string) {
    if (!confirm('Sind Sie sicher, dass Sie diesen Medikamenteneintrag löschen möchten?')) return;
    
    try {
      const { error } = await supabase
        .from('dog_medications')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchMedications();
    } catch (error) {
      console.error('Error deleting medication:', error);
    }
  }

  function resetForm() {
    setName('');
    setDosage('');
    setFrequency('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
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

  // Sort medications by active status
  const today = new Date();
  const activeMedications = medications.filter(m => 
    !m.end_date || new Date(m.end_date) >= today
  );

  const inactiveMedications = medications.filter(m => 
    m.end_date && new Date(m.end_date) < today
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{dogName}'s Medikamente</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Medikament hinzufügen
        </button>
      </div>

      {/* Active Medications Alert */}
      {activeMedications.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-3 rounded-lg">
          <h3 className="font-medium mb-2">Aktive Medikamente ({activeMedications.length})</h3>
          <ul className="space-y-2">
            {activeMedications.map(med => (
              <li key={med.id} className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                <span>{med.name} - {med.dosage} ({med.frequency})</span>
              </li>
            ))}
          </ul>
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
                {editingId ? 'Medikament bearbeiten' : 'Neues Medikament'}
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
                <label className="block text-sm font-medium mb-2">Medikamentenname</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="z.B. Antibiotika, Schmerzmittel, etc."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Dosierung</label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="z.B. 10mg, 1 Tablette, etc."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Häufigkeit</label>
                  <input
                    type="text"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="z.B. Einmal täglich, Zweimal täglich, etc."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Startdatum</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Enddatum (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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

      {/* Medications List */}
      {medications.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Keine Medikamente</h3>
          <p className="text-gray-400 mb-6">
            Verfolge die Medikamente deines Hundes, um sicherzustellen, dass er die richtige Behandlung erhält.
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
          >
            Erstes Medikament hinzufügen
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Medications */}
          {activeMedications.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Aktive Medikamente</h3>
              <div className="space-y-2">
                {activeMedications.map((medication) => (
                  <div
                    key={medication.id}
                    className="bg-white/5 backdrop-blur-lg rounded-lg p-4 hover:bg-white/10 transition-all border-l-4 border-blue-500"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{medication.name}</h3>
                        <div className="flex items-center text-sm text-gray-400 mt-1">
                          <span className="mr-3">{medication.dosage}</span>
                          <Clock size={14} className="mr-1" />
                          <span>{medication.frequency}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-400 mt-1">
                          <Calendar size={14} className="mr-1" />
                          <span>
                            {new Date(medication.start_date).toLocaleDateString()}
                            {medication.end_date && ` - ${new Date(medication.end_date).toLocaleDateString()}`}
                          </span>
                          {!medication.end_date && (
                            <span className="ml-2 text-blue-400">(Laufend)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editMedication(medication)}
                          className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteMedication(medication.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {medication.notes && (
                      <p className="text-gray-300 mt-2">{medication.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Medications */}
          {inactiveMedications.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Vergangene Medikamente</h3>
              <div className="space-y-2">
                {inactiveMedications.map((medication) => (
                  <div
                    key={medication.id}
                    className="bg-white/5 backdrop-blur-lg rounded-lg p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{medication.name}</h3>
                        <div className="flex items-center text-sm text-gray-400 mt-1">
                          <span className="mr-3">{medication.dosage}</span>
                          <Clock size={14} className="mr-1" />
                          <span>{medication.frequency}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-400 mt-1">
                          <Calendar size={14} className="mr-1" />
                          <span>
                            {new Date(medication.start_date).toLocaleDateString()} - {new Date(medication.end_date!).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editMedication(medication)}
                          className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteMedication(medication.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {medication.notes && (
                      <p className="text-gray-300 mt-2">{medication.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DogMedications;