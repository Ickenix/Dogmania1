import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Upload, X, Image, Video, Tag, Camera, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MediaUploadProps {
  onUploadComplete?: (mediaId: string) => void;
  dogId?: string;
  showInFeed?: boolean;
}

const MediaUpload: React.FC<MediaUploadProps> = ({ 
  onUploadComplete, 
  dogId,
  showInFeed = true
}) => {
  const { session } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [userDogs, setUserDogs] = useState<{id: string, name: string}[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(dogId || null);

  useEffect(() => {
    // Clean up object URLs on unmount
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [previews]);

  useEffect(() => {
    if (session) {
      fetchUserDogs();
    }
  }, [session]);

  async function fetchUserDogs() {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name')
        .eq('owner_id', session?.user.id);

      if (error) throw error;
      setUserDogs(data || []);
      
      // If dogId is provided, use it, otherwise use the first dog
      if (dogId) {
        setSelectedDogId(dogId);
      } else if (data && data.length > 0 && !selectedDogId) {
        setSelectedDogId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching user dogs:', error);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files);
    
    // Validate file types
    const validFiles = newFiles.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (validFiles.length !== newFiles.length) {
      setError('Nur Bild- und Videodateien sind erlaubt.');
      return;
    }
    
    // Validate file size (max 10MB)
    const validSizeFiles = validFiles.filter(file => file.size <= 10 * 1024 * 1024);
    
    if (validSizeFiles.length !== validFiles.length) {
      setError('Dateien dürfen maximal 10MB groß sein.');
      return;
    }
    
    setSelectedFiles([...selectedFiles, ...validSizeFiles]);
    
    // Create previews
    const newPreviews = validSizeFiles.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
    
    setError('');
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      
      // Validate file types
      const validFiles = newFiles.filter(file => 
        file.type.startsWith('image/') || file.type.startsWith('video/')
      );
      
      if (validFiles.length !== newFiles.length) {
        setError('Nur Bild- und Videodateien sind erlaubt.');
        return;
      }
      
      // Validate file size (max 10MB)
      const validSizeFiles = validFiles.filter(file => file.size <= 10 * 1024 * 1024);
      
      if (validSizeFiles.length !== validFiles.length) {
        setError('Dateien dürfen maximal 10MB groß sein.');
        return;
      }
      
      setSelectedFiles([...selectedFiles, ...validSizeFiles]);
      
      // Create previews
      const newPreviews = validSizeFiles.map(file => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
      
      setError('');
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index]);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    
    // Remove # if present
    const formattedTag = tagInput.trim().startsWith('#') 
      ? tagInput.trim().substring(1) 
      : tagInput.trim();
    
    if (!tags.includes(formattedTag)) {
      setTags([...tags, formattedTag]);
    }
    
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      setError('Du musst angemeldet sein, um Medien hochzuladen.');
      return;
    }
    
    if (selectedFiles.length === 0) {
      setError('Bitte wähle mindestens eine Datei aus.');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setError('');
    
    try {
      const uploadedFiles = [];
      
      // Upload each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}-${i}.${fileExt}`;
        const filePath = `${fileName}`;
        
        // Upload to Supabase Storage
        const { data: fileData, error: uploadError } = await supabase.storage
          .from('dogmedia')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Determine file type
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        
        // Add to uploaded files
        uploadedFiles.push({
          file_url: filePath,
          file_type: fileType
        });
        
        // Update progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }
      
      // Save media info to database
      for (const fileInfo of uploadedFiles) {
        const { data, error: dbError } = await supabase
          .from('media_uploads')
          .insert({
            user_id: session.user.id,
            file_url: fileInfo.file_url,
            file_type: fileInfo.file_type,
            description,
            tags,
            dog_id: selectedDogId || null,
            show_in_feed: showInFeed
          })
          .select()
          .single();
        
        if (dbError) throw dbError;
        
        // Notify parent component
        if (onUploadComplete && data) {
          onUploadComplete(data.id);
        }
      }
      
      // Reset form
      setSelectedFiles([]);
      setPreviews([]);
      setDescription('');
      setTags([]);
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error uploading media:', error);
      setError('Fehler beim Hochladen. Bitte versuche es erneut.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const isVideo = (file: File) => file.type.startsWith('video/');

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Camera className="mr-2 text-purple-400" size={24} />
        Medien hochladen
      </h2>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-4">
          Medien erfolgreich hochgeladen!
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drag & Drop Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive 
              ? 'border-purple-500 bg-purple-500/10' 
              : 'border-white/20 hover:border-purple-500/50 hover:bg-white/5'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="media-upload"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <label htmlFor="media-upload" className="cursor-pointer">
            <Upload size={40} className="mx-auto mb-4 text-purple-400" />
            <p className="text-lg font-medium mb-2">Dateien hier ablegen oder klicken</p>
            <p className="text-sm text-gray-400">Unterstützt werden JPG, PNG, GIF und Videos</p>
          </label>
        </div>
        
        {/* File Previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-black/20">
                  {isVideo(selectedFiles[index]) ? (
                    <div className="w-full h-full flex items-center justify-center bg-black/40">
                      <Video size={32} className="text-white" />
                    </div>
                  ) : (
                    <img 
                      src={preview} 
                      alt={`Preview ${index}`} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  {isVideo(selectedFiles[index]) ? 'Video' : 'Bild'}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Dog Selection */}
        {userDogs.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Hund auswählen</label>
            <div className="flex flex-wrap gap-2">
              {userDogs.map(dog => (
                <button
                  key={dog.id}
                  type="button"
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
              <button
                type="button"
                onClick={() => setSelectedDogId(null)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedDogId === null
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                Kein Hund
              </button>
            </div>
          </div>
        )}
        
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Beschreibung
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={3}
            placeholder="Beschreibe deine Medien..."
          />
        </div>
        
        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <div 
                key={tag} 
                className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 hover:text-red-400"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="z.B. Training, Ernährung (Enter zum Hinzufügen)"
            />
            <button
              type="button"
              onClick={addTag}
              className="bg-purple-600 text-white px-4 py-3 rounded-r-lg hover:bg-purple-500 transition-colors"
            >
              <Tag size={20} />
            </button>
          </div>
        </div>
        
        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Hochladen...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || selectedFiles.length === 0}
          className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              Wird hochgeladen...
            </>
          ) : (
            <>
              <Upload size={20} className="mr-2" />
              Hochladen
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default MediaUpload;