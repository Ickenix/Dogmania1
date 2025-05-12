import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Upload, X, Award, Calendar, FileText } from 'lucide-react';

interface TrainerCertificateUploadProps {
  trainerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TrainerCertificateUpload: React.FC<TrainerCertificateUploadProps> = ({
  trainerId,
  onSuccess,
  onCancel
}) => {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError('Bitte wähle eine PDF-, JPG- oder PNG-Datei aus.');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Die Datei darf maximal 5MB groß sein.');
        return;
      }
      
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session || !selectedFile) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(fileName, selectedFile);
        
      if (uploadError) throw uploadError;
      
      // Save certificate info to database
      const { error: dbError } = await supabase
        .from('certificates')
        .insert({
          trainer_id: trainerId,
          title,
          issuer,
          issue_date: issueDate,
          expiry_date: expiryDate || null,
          file_url: fileName
        });
        
      if (dbError) throw dbError;
      
      onSuccess();
    } catch (error) {
      console.error('Error uploading certificate:', error);
      setError('Fehler beim Hochladen des Zertifikats. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Neues Zertifikat hochladen</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Award size={24} className="text-purple-400" />
          </div>
          <div>
            <h4 className="font-semibold">Trainer-Zertifikat</h4>
            <p className="text-sm text-gray-400">Lade deine Qualifikationen hoch, um dein Profil zu vervollständigen</p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Titel des Zertifikats</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
            placeholder="z.B. Hundetrainer-Zertifikat"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Aussteller</label>
          <input
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
            placeholder="z.B. Hundeschule XYZ"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ausstellungsdatum</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Ablaufdatum (optional)</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Zertifikat-Datei</label>
          <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
            {selectedFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText size={24} className="text-purple-400 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center">
                <Upload size={32} className="text-purple-400 mb-2" />
                <span className="text-gray-300 mb-1">Datei hier ablegen oder klicken zum Auswählen</span>
                <span className="text-xs text-gray-400">PDF, JPG oder PNG (max. 5MB)</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  required
                />
              </label>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading || !selectedFile}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Wird hochgeladen...
              </>
            ) : (
              <>
                <Upload size={18} className="mr-2" />
                Zertifikat hochladen
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TrainerCertificateUpload;