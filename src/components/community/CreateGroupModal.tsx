import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { X, Upload, Globe, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreated }) => {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (!session) return;

    try {
      setLoading(true);

      let imageUrl = null;
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const filePath = `${session.user.id}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('groups')
          .upload(filePath, selectedImage);

        if (uploadError) throw uploadError;
        imageUrl = filePath;
      }

      const { data, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          is_private: isPrivate,
          image_url: imageUrl,
          creator_id: session.user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Automatically add creator as admin
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: data.id,
          user_id: session.user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      onCreated();
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">Neue Gruppe erstellen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Gruppenname</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Gruppenbild</label>
            <div className="flex items-center space-x-4">
              {imagePreview ? (
                <div className="relative w-24 h-24">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="w-24 h-24 flex flex-col items-center justify-center bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                  <Upload size={24} className="mb-2" />
                  <span className="text-xs">Upload</span>
                  <input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Privatsphäre</label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  !isPrivate ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <Globe size={20} className="mr-3" />
                <div className="text-left">
                  <div className="font-medium">Öffentlich</div>
                  <div className="text-sm text-gray-400">Jeder kann beitreten</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isPrivate ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <Lock size={20} className="mr-3" />
                <div className="text-left">
                  <div className="font-medium">Privat</div>
                  <div className="text-sm text-gray-400">Nur auf Einladung</div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Erstelle...' : 'Gruppe erstellen'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateGroupModal;