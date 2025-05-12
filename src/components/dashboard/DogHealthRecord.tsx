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

interface WeightRecord {
  id: string;
  dog_id: string;
  weight: number;
  date: string;
  notes: string | null;
  created_at: string;
}

interface DogHealthRecordProps {
  dogId: string;
  dogName: string;
}

const DogHealthRecord: React.FC<DogHealthRecordProps> = ({ dogId, dogName }) => {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'records' | 'vaccinations' | 'medications' | 'weight'>('records');
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [showWeightForm, setShowWeightForm] = useState(false);
  
  // Record form
  const [recordType, setRecordType] = useState('checkup');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordTitle, setRecordTitle] = useState('');
  const [recordDescription, setRecordDescription] = useState('');
  const [recordVetName, setRecordVetName] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  
  // Vaccination form
  const [vaccinationName, setVaccinationName] = useState('');
  const [vaccinationDate, setVaccinationDate] = useState(new Date().toISOString().split('T')[0]);
  const [vaccinationExpiryDate, setVaccinationExpiryDate] = useState('');
  const [vaccinationVetName, setVaccinationVetName] = useState('');
  const [vaccinationNotes, setVaccinationNotes] = useState('');
  const [editingVaccinationId, setEditingVaccinationId] = useState<string | null>(null);
  
  // Medication form
  const [medicationName, setMedicationName] = useState('');
  const [medicationDosage, setMedicationDosage] = useState('');
  const [medicationFrequency, setMedicationFrequency] = useState('');
  const [medicationStartDate, setMedicationStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [medicationEndDate, setMedicationEndDate] = useState('');
  const [medicationNotes, setMedicationNotes] = useState('');
  const [editingMedicationId, setEditingMedicationId] = useState<string | null>(null);
  
  // Weight form
  const [weightValue, setWeightValue] = useState('');
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightNotes, setWeightNotes] = useState('');
  const [editingWeightId, setEditingWeightId] = useState<string | null>(null);

  useEffect(() => {
    if (session && dogId) {
      fetchHealthRecords();
      fetchVaccinations();
      fetchMedications();
      fetchWeightRecords();
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
      setHealthRecords(data || []);
    } catch (error) {
      console.error('Error fetching health records:', error);
    }
  }

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
    }
  }

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
    }
  }

  async function fetchWeightRecords() {
    try {
      const { data, error } = await supabase
        .from('dog_weight_history')
        .select('*')
        .eq('dog_id', dogId)
        .order('date', { ascending: false });

      if (error) throw error;
      setWeightRecords(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching weight records:', error);
      setLoading(false);
    }
  }

  // Health Record CRUD
  async function handleSaveRecord(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (editingRecordId) {
        // Update existing record
        const { error } = await supabase
          .from('dog_health_records')
          .update({
            type: recordType,
            date: recordDate,
            title: recordTitle,
            description: recordDescription,
            vet_name: recordVetName
          })
          .eq('id', editingRecordId);
          
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('dog_health_records')
          .insert({
            dog_id: dogId,
            type: recordType,
            date: recordDate,
            title: recordTitle,
            description: recordDescription,
            vet_name: recordVetName
          });
          
        if (error) throw error;
      }
      
      resetRecordForm();
      fetchHealthRecords();
    } catch (error) {
      console.error('Error saving health record:', error);
    }
  }

  function editRecord(record: HealthRecord) {
    setRecordType(record.type);
    setRecordDate(record.date);
    setRecordTitle(record.title);
    setRecordDescription(record.description || '');
    setRecordVetName(record.vet_name || '');
    setEditingRecordId(record.id);
    setShowRecordForm(true);
  }

  async function deleteRecord(id: string) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
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

  function resetRecordForm() {
    setRecordType('checkup');
    setRecordDate(new Date().toISOString().split('T')[0]);
    setRecordTitle('');
    setRecordDescription('');
    setRecordVetName('');
    setEditingRecordId(null);
    setShowRecordForm(false);
  }

  // Vaccination CRUD
  async function handleSaveVaccination(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (editingVaccinationId) {
        // Update existing vaccination
        const { error } = await supabase
          .from('dog_vaccinations')
          .update({
            name: vaccinationName,
            date: vaccinationDate,
            expiry_date: vaccinationExpiryDate || null,
            vet_name: vaccinationVetName,
            notes: vaccinationNotes
          })
          .eq('id', editingVaccinationId);
          
        if (error) throw error;
      } else {
        // Create new vaccination
        const { error } = await supabase
          .from('dog_vaccinations')
          .insert({
            dog_id: dogId,
            name: vaccinationName,
            date: vaccinationDate,
            expiry_date: vaccinationExpiryDate || null,
            vet_name: vaccinationVetName,
            notes: vaccinationNotes
          });
          
        if (error) throw error;
      }
      
      resetVaccinationForm();
      fetchVaccinations();
    } catch (error) {
      console.error('Error saving vaccination:', error);
    }
  }

  function editVaccination(vaccination: Vaccination) {
    setVaccinationName(vaccination.name);
    setVaccinationDate(vaccination.date);
    setVaccinationExpiryDate(vaccination.expiry_date || '');
    setVaccinationVetName(vaccination.vet_name || '');
    setVaccinationNotes(vaccination.notes || '');
    setEditingVaccinationId(vaccination.id);
    setShowVaccinationForm(true);
  }

  async function deleteVaccination(id: string) {
    if (!confirm('Are you sure you want to delete this vaccination record?')) return;
    
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

  function resetVaccinationForm() {
    setVaccinationName('');
    setVaccinationDate(new Date().toISOString().split('T')[0]);
    setVaccinationExpiryDate('');
    setVaccinationVetName('');
    setVaccinationNotes('');
    setEditingVaccinationId(null);
    setShowVaccinationForm(false);
  }

  // Medication CRUD
  async function handleSaveMedication(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (editingMedicationId) {
        // Update existing medication
        const { error } = await supabase
          .from('dog_medications')
          .update({
            name: medicationName,
            dosage: medicationDosage,
            frequency: medicationFrequency,
            start_date: medicationStartDate,
            end_date: medicationEndDate || null,
            notes: medicationNotes
          })
          .eq('id', editingMedicationId);
          
        if (error) throw error;
      } else {
        // Create new medication
        const { error } = await supabase
          .from('dog_medications')
          .insert({
            dog_id: dogId,
            name: medicationName,
            dosage: medicationDosage,
            frequency: medicationFrequency,
            start_date: medicationStartDate,
            end_date: medicationEndDate || null,
            notes: medicationNotes
          });
          
        if (error) throw error;
      }
      
      resetMedicationForm();
      fetchMedications();
    } catch (error) {
      console.error('Error saving medication:', error);
    }
  }

  function editMedication(medication: Medication) {
    setMedicationName(medication.name);
    setMedicationDosage(medication.dosage);
    setMedicationFrequency(medication.frequency);
    setMedicationStartDate(medication.start_date);
    setMedicationEndDate(medication.end_date || '');
    setMedicationNotes(medication.notes || '');
    setEditingMedicationId(medication.id);
    setShowMedicationForm(true);
  }

  async function deleteMedication(id: string) {
    if (!confirm('Are you sure you want to delete this medication record?')) return;
    
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

  function resetMedicationForm() {
    setMedicationName('');
    setMedicationDosage('');
    setMedicationFrequency('');
    setMedicationStartDate(new Date().toISOString().split('T')[0]);
    setMedicationEndDate('');
    setMedicationNotes('');
    setEditingMedicationId(null);
    setShowMedicationForm(false);
  }

  // Weight CRUD
  async function handleSaveWeight(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (editingWeightId) {
        // Update existing weight record
        const { error } = await supabase
          .from('dog_weight_history')
          .update({
            weight: parseFloat(weightValue),
            date: weightDate,
            notes: weightNotes
          })
          .eq('id', editingWeightId);
          
        if (error) throw error;
      } else {
        // Create new weight record
        const { error } = await supabase
          .from('dog_weight_history')
          .insert({
            dog_id: dogId,
            weight: parseFloat(weightValue),
            date: weightDate,
            notes: weightNotes
          });
          
        if (error) throw error;
      }
      
      resetWeightForm();
      fetchWeightRecords();
    } catch (error) {
      console.error('Error saving weight record:', error);
    }
  }

  function editWeight(weight: WeightRecord) {
    setWeightValue(weight.weight.toString());
    setWeightDate(weight.date);
    setWeightNotes(weight.notes || '');
    setEditingWeightId(weight.id);
    setShowWeightForm(true);
  }

  async function deleteWeight(id: string) {
    if (!confirm('Are you sure you want to delete this weight record?')) return;
    
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

  function resetWeightForm() {
    setWeightValue('');
    setWeightDate(new Date().toISOString().split('T')[0]);
    setWeightNotes('');
    setEditingWeightId(null);
    setShowWeightForm(false);
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
        <h2 className="text-2xl font-bold">{dogName}'s Health Records</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('records')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'records'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText size={18} className="inline-block mr-2" />
          Health Records
        </button>
        <button
          onClick={() => setActiveTab('vaccinations')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'vaccinations'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText size={18} className="inline-block mr-2" />
          Vaccinations
        </button>
        <button
          onClick={() => setActiveTab('medications')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'medications'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText size={18} className="inline-block mr-2" />
          Medications
        </button>
        <button
          onClick={() => setActiveTab('weight')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'weight'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText size={18} className="inline-block mr-2" />
          Weight History
        </button>
      </div>

      {/* Health Records */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                resetRecordForm();
                setShowRecordForm(true);
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Add Health Record
            </button>
          </div>

          <AnimatePresence>
            {showRecordForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    {editingRecordId ? 'Edit Health Record' : 'New Health Record'}
                  </h3>
                  <button
                    onClick={resetRecordForm}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveRecord} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Record Type</label>
                    <select
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="checkup">Regular Checkup</option>
                      <option value="illness">Illness</option>
                      <option value="injury">Injury</option>
                      <option value="surgery">Surgery</option>
                      <option value="dental">Dental</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="date"
                      value={recordDate}
                      onChange={(e) => setRecordDate(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                      type="text"
                      value={recordTitle}
                      onChange={(e) => setRecordTitle(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Annual Checkup, Ear Infection, etc."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={recordDescription}
                      onChange={(e) => setRecordDescription(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="Details about the health record..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Veterinarian</label>
                    <input
                      type="text"
                      value={recordVetName}
                      onChange={(e) => setRecordVetName(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Veterinarian's name"
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={resetRecordForm}
                      className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
                    >
                      <Save size={18} className="mr-2" />
                      Save
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {healthRecords.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Health Records</h3>
              <p className="text-gray-400 mb-6">
                Start tracking your dog's health records to keep a comprehensive medical history.
              </p>
              <button
                onClick={() => {
                  resetRecordForm();
                  setShowRecordForm(true);
                }}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
              >
                Add First Health Record
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {healthRecords.map((record) => (
                <div
                  key={record.id}
                  className="bg-white/5 backdrop-blur-lg rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center">
                        <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs mr-2">
                          {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
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
      )}

      {/* Vaccinations */}
      {activeTab === 'vaccinations' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                resetVaccinationForm();
                setShowVaccinationForm(true);
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Add Vaccination
            </button>
          </div>

          <AnimatePresence>
            {showVaccinationForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    {editingVaccinationId ? 'Edit Vaccination' : 'New Vaccination'}
                  </h3>
                  <button
                    onClick={resetVaccinationForm}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveVaccination} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Vaccination Name</label>
                    <input
                      type="text"
                      value={vaccinationName}
                      onChange={(e) => setVaccinationName(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Rabies, Distemper, etc."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={vaccinationDate}
                        onChange={(e) => setVaccinationDate(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Expiry Date (Optional)</label>
                      <input
                        type="date"
                        value={vaccinationExpiryDate}
                        onChange={(e) => setVaccinationExpiryDate(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Veterinarian</label>
                    <input
                      type="text"
                      value={vaccinationVetName}
                      onChange={(e) => setVaccinationVetName(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Veterinarian's name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <textarea
                      value={vaccinationNotes}
                      onChange={(e) => setVaccinationNotes(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={resetVaccinationForm}
                      className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
                    >
                      <Save size={18} className="mr-2" />
                      Save
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {vaccinations.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Vaccinations</h3>
              <p className="text-gray-400 mb-6">
                Start tracking your dog's vaccinations to ensure they stay up to date.
              </p>
              <button
                onClick={() => {
                  resetVaccinationForm();
                  setShowVaccinationForm(true);
                }}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
              >
                Add First Vaccination
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {vaccinations.map((vaccination) => (
                <div
                  key={vaccination.id}
                  className="bg-white/5 backdrop-blur-lg rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{vaccination.name}</h3>
                      <div className="flex items-center text-sm text-gray-400 mt-1">
                        <Calendar size={14} className="mr-1" />
                        {new Date(vaccination.date).toLocaleDateString()}
                        {vaccination.expiry_date && (
                          <span className="ml-2">
                            (Expires: {new Date(vaccination.expiry_date).toLocaleDateString()})
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
      )}

      {/* Medications */}
      {activeTab === 'medications' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                resetMedicationForm();
                setShowMedicationForm(true);
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Add Medication
            </button>
          </div>

          <AnimatePresence>
            {showMedicationForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    {editingMedicationId ? 'Edit Medication' : 'New Medication'}
                  </h3>
                  <button
                    onClick={resetMedicationForm}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveMedication} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Medication Name</label>
                    <input
                      type="text"
                      value={medicationName}
                      onChange={(e) => setMedicationName(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Antibiotics, Pain medication, etc."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Dosage</label>
                      <input
                        type="text"
                        value={medicationDosage}
                        onChange={(e) => setMedicationDosage(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., 10mg, 1 tablet, etc."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Frequency</label>
                      <input
                        type="text"
                        value={medicationFrequency}
                        onChange={(e) => setMedicationFrequency(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., Once daily, Twice daily, etc."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Date</label>
                      <input
                        type="date"
                        value={medicationStartDate}
                        onChange={(e) => setMedicationStartDate(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Date (Optional)</label>
                      <input
                        type="date"
                        value={medicationEndDate}
                        onChange={(e) => setMedicationEndDate(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <textarea
                      value={medicationNotes}
                      onChange={(e) => setMedicationNotes(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={resetMedicationForm}
                      className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
                    >
                      <Save size={18} className="mr-2" />
                      Save
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {medications.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Medications</h3>
              <p className="text-gray-400 mb-6">
                Track your dog's medications to ensure proper administration.
              </p>
              <button
                onClick={() => {
                  resetMedicationForm();
                  setShowMedicationForm(true);
                }}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
              >
                Add First Medication
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {medications.map((medication) => (
                <div
                  key={medication.id}
                  className="bg-white/5 backdrop-blur-lg rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{medication.name}</h3>
                      <div className="flex items-center text-sm text-gray-400 mt-1">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">
                          {medication.dosage}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{medication.frequency}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-400 mt-1">
                        <Calendar size={14} className="mr-1" />
                        {new Date(medication.start_date).toLocaleDateString()}
                        {medication.end_date && (
                          <span className="ml-2">
                            to {new Date(medication.end_date).toLocaleDateString()}
                          </span>
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
          )}
        </div>
      )}

      {/* Weight History */}
      {activeTab === 'weight' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                resetWeightForm();
                setShowWeightForm(true);
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Add Weight Record
            </button>
          </div>

          <AnimatePresence>
            {showWeightForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    {editingWeightId ? 'Edit Weight Record' : 'New Weight Record'}
                  </h3>
                  <button
                    onClick={resetWeightForm}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveWeight} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={weightValue}
                        onChange={(e) => setWeightValue(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., 15.5"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={weightDate}
                        onChange={(e) => setWeightDate(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <textarea
                      value={weightNotes}
                      onChange={(e) => setWeightNotes(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={resetWeightForm}
                      className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
                    >
                      <Save size={18} className="mr-2" />
                      Save
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {weightRecords.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Weight Records</h3>
              <p className="text-gray-400 mb-6">
                Track your dog's weight over time to monitor their health.
              </p>
              <button
                onClick={() => {
                  resetWeightForm();
                  setShowWeightForm(true);
                }}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
              >
                Add First Weight Record
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4">Weight Chart</h3>
                <div className="h-64 bg-white/5 rounded-lg p-4">
                  {/* Weight chart would go here - simplified for now */}
                  <div className="h-full flex items-end">
                    {weightRecords.slice(0, 10).reverse().map((record, index) => (
                      <div key={record.id} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-purple-600 rounded-t transition-all hover:bg-purple-500"
                          style={{ 
                            height: `${(record.weight / Math.max(...weightRecords.map(r => r.weight))) * 100}%`,
                            maxWidth: '80%' 
                          }}
                        ></div>
                        <div className="mt-2 text-xs text-gray-400 rotate-45 origin-left">
                          {new Date(record.date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Weight History</h3>
                {weightRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white/5 backdrop-blur-lg rounded-lg p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-semibold">{record.weight} kg</h3>
                        </div>
                        <div className="flex items-center text-sm text-gray-400 mt-1">
                          <Calendar size={14} className="mr-1" />
                          {new Date(record.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editWeight(record)}
                          className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteWeight(record.id)}
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
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DogHealthRecord;