import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { X, Image as ImageIcon, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreatePostModalProps {
  onClose: () => void;
  onCreated: () => void;
  groupId?: string;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onCreated, groupId }) => {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'training', name: 'Training' },
    { id: 'health', name: 'Gesundheit' },
    { id: 'nutrition', name: 'Ernährung' },
    { id: 'behavior', name: 'Verhalten' },
    { id: 'general', name: 'Allgemein' }
  ];

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
          .from('forum_images')
          .upload(filePath, selectedImage);

        if (uploadError) throw uploadError;
        imageUrl = filePath;
      }

      const { error: postError } = await supabase
        .from('forums')
        .insert({
          title,
          content,
          user_id: session.user.id,
          group_id: groupId || null,
          // In a real implementation, you would store the category and image_url
          // For now, we're just demonstrating the UI
        });

      if (postError) throw postError;

      onCreated();
    } catch (error) {
      console.error('Error creating post:', error);
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
        className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">Neuen Beitrag erstellen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              placeholder="Gib deinem Beitrag einen aussagekräftigen Titel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Kategorie</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg transition-colors flex items-center ${
                    category === cat.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <Tag size={16} className="mr-1" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Inhalt</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={8}
              required
              placeholder="Beschreibe dein Anliegen oder teile deine Erfahrungen..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bild hinzufügen (optional)</label>
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer">
                <div className="w-32 h-32 bg-white/10 border border-white/20 rounded-lg flex flex-col items-center justify-center hover:bg-white/20 transition-colors">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <ImageIcon size={24} className="mb-2 text-gray-400" />
                      <span className="text-sm text-gray-400">Bild auswählen</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Entfernen
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Wird erstellt...' : 'Beitrag erstellen'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreatePostModal;