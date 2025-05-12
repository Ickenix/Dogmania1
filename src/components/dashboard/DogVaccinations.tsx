import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Edit2, Calendar, User, X, Save, FileText, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Vaccination {
  id: string;
  dog_id: string;
  name: string;
  date: string;
  expiry_date: string | null;
  vet_name: string | null;
  notes: string | null;
  created_at: string;
}

interface DogVaccinationsProps {
  dogId: string;
  dogName: string;
}

const DogVaccinations: React.FC<DogVaccinationsProps> = ({ dogId, dogName }) => {
  const { session } = useAuth();
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [vetName, setVetName] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (session && dogId) {
      fetchVaccinations();
    }
  }, [session, dogId]);

  async function fetchVaccinations() {
    try {
      const { data, error } = await supabase
        .from('dog_vaccinations')
        .select('*')
        .eq('dog_id', dogId)
        .order('date', { ascending: false });

      if (error) throw error;
      setVaccinations(data || []);
    } catch (error) {
      console.error('Error fetching vaccinations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update existing vaccination
        const { error } = await supabase
          .from('dog_vaccinations')
          .update({
            name,
            date,
            expiry_date: expiryDate || null,
            vet_name: vetName || null,
            notes: notes || null
          })
          .eq('id', editingId);
          
        if (error) throw error;
      } else {
        // Create new vaccination
        const { error } = await supabase
          .from('dog_vaccinations')
          .insert({
            dog_id: dogId,
            name,
            date,
            expiry_date: expiryDate || null,
            vet_name: vetName || null,
            notes: notes || null
          });
          
        if (error) throw error;
      }
      
      resetForm();
      fetchVaccinations();
    } catch (error) {
      console.error('Error saving vaccination:', error);
    }
  }

  function editVaccination(vaccination: Vaccination) {
    setName(vaccination.name);
    setDate(vaccination.date);
    setExpiryDate(vaccination.expiry_date || '');
    setVetName(vaccination.vet_name || '');
    setNotes(vaccination.notes || '');
    setEditingId(vaccination.id);
    setShowForm(true);
  }

  async function deleteVaccination(id: string) {
    if (!confirm('Sind Sie sicher, dass Sie diesen Impfungseintrag löschen möchten?')) return;
    
    try {
      const { error } = await supabase
        .from('dog_vaccinations')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchVaccinations();
    } catch (error) {
      console.error('Error deleting vaccination:', error);
    }
  }

  function resetForm() {
    setName('');
    setDate(new Date().toISOString().split('T')[0]);
    setExpiryDate('');
    setVetName('');
    setNotes('');
    setEditingId(null);
    setShowForm(false);
  }

  // Check for expired or soon-to-expire vaccinations
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const expiredVaccinations = vaccinations.filter(v => 
    v.expiry_date && new Date(v.expiry_date) < today
  );

  const soonToExpireVaccinations = vaccinations.filter(v => 
    v.expiry_date && 
    new Date(v.expiry_date) >= today && 
    new Date(v.expiry_date) <= thirtyDaysFromNow
  );

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
        <h2 className="text-2xl font-bold">{dogName}'s Impfungen</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Impfung hinzufügen
        </button>
      </div>

      {/* Alerts */}
      {expiredVaccinations.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-start">
          <AlertTriangle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Abgelaufene Impfungen</p>
            <ul className="mt-1 list-disc list-inside">
              {expiredVaccinations.map(v => (
                <li key={v.id}>
                  {v.name} - Abgelaufen am {new Date(v.expiry_date!).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {soonToExpireVaccinations.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-lg flex items-start">
          <AlertTriangle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Bald ablaufende Impfungen</p>
            <ul className="mt-1 list-disc list-inside">
              {soonToExpireVaccinations.map(v => (
                <li key={v.id}>
                  {v.name} - Läuft ab am {new Date(v.expiry_date!).toLocaleDateString()}
                </li>
              ))}
            </ul>
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
                {editingId ? 'Impfung bearbeiten' : 'Neue Impfung'}
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
                <label className="block text-sm font-medium mb-2">Impfungsname</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="z.B. Tollwut, Staupe, etc."
                  required
                />
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
                  <label className="block text-sm font-medium mb-2">Ablaufdatum (Optional)</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
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

      {/* Vaccinations List */}
      {vaccinations.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Keine Impfungen</h3>
          <p className="text-gray-400 mb-6">
            Beginne damit, die Impfungen deines Hundes zu verfolgen, um sicherzustellen, dass sie aktuell bleiben.
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
          >
            Erste Impfung hinzufügen
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {vaccinations.map((vaccination) => (
            <div
              key={vaccination.id}
              className={`bg-white/5 backdrop-blur-lg rounded-lg p-4 hover:bg-white/10 transition-all ${
                vaccination.expiry_date && new Date(vaccination.expiry_date) < today
                  ? 'border-l-4 border-red-500'
                  : vaccination.expiry_date && new Date(vaccination.expiry_date) <= thirtyDaysFromNow
                  ? 'border-l-4 border-yellow-500'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{vaccination.name}</h3>
                  <div className="flex items-center text-sm text-gray-400 mt-1">
                    <Calendar size={14} className="mr-1" />
                    {new Date(vaccination.date).toLocaleDateString()}
                    {vaccination.expiry_date && (
                      <span className={`ml-2 ${
                        new Date(vaccination.expiry_date) < today
                          ? 'text-red-400'
                          : new Date(vaccination.expiry_date) <= thirtyDaysFromNow
                          ? 'text-yellow-400'
                          : ''
                      }`}>
                        (Läuft ab: {new Date(vaccination.expiry_date).toLocaleDateString()})
                      </span>
                    )}
                    {vaccination.vet_name && (
                      <>
                        <span className="mx-2">•</span>
                        <User size={14} className="mr-1" />
                        {vaccination.vet_name}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => editVaccination(vaccination)}
                    className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteVaccination(vaccination.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {vaccination.notes && (
                <p className="text-gray-300 mt-2">{vaccination.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DogVaccinations;