import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { X, Upload, MapPin } from 'lucide-react';

interface CreateListingModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreateListingModal: React.FC<CreateListingModalProps> = ({ onClose, onCreated }) => {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('accessories');
  const [condition, setCondition] = useState('new');
  const [location, setLocation] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newImages: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newImages.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedImages([...selectedImages, ...newImages]);
    setImagePreview([...imagePreview, ...newPreviews]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    try {
      setLoading(true);

      // Upload images
      const imageUrls: string[] = [];
      for (const image of selectedImages) {
        const fileExt = image.name.split('.').pop();
        const filePath = `${session.user.id}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('marketplace')
          .upload(filePath, image);

        if (uploadError) throw uploadError;
        imageUrls.push(filePath);
      }

      // Create listing
      const { error: listingError } = await supabase
        .from('marketplace_listings')
        .insert({
          user_id: session.user.id,
          title,
          description,
          price: parseFloat(price),
          category,
          condition,
          location,
          images: imageUrls,
        });

      if (listingError) throw listingError;

      onCreated();
    } catch (error) {
      console.error('Error creating listing:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">Neues Angebot erstellen</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Preis (€)</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Kategorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="accessories">Hundezubehör</option>
                <option value="food">Futter & Snacks</option>
                <option value="training">Trainingszubehör</option>
                <option value="services">Dienstleistungen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Zustand</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="new">Neu</option>
                <option value="like_new">Wie neu</option>
                <option value="good">Gut</option>
                <option value="fair">Akzeptabel</option>
                <option value="poor">Gebraucht</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Standort</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Stadt, Land"
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
                >
                  <MapPin size={20} />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bilder</label>
            <div className="flex flex-wrap gap-4">
              {imagePreview.map((preview, index) => (
                <div key={index} className="relative w-24 h-24">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImages(selectedImages.filter((_, i) => i !== index));
                      setImagePreview(imagePreview.filter((_, i) => i !== index));
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 flex flex-col items-center justify-center bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                <Upload size={24} className="mb-2" />
                <span className="text-xs">Upload</span>
                <input
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </label>
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
              disabled={loading || !title.trim() || !price}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Erstelle...' : 'Angebot erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListingModal;