import React, { useState } from 'react';
import MediaGallery from './MediaGallery';
import MediaUpload from './MediaUpload';
import MediaFeed from './MediaFeed';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, Grid, Activity } from 'lucide-react';

const MediaPage: React.FC = () => {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <Camera size={48} className="mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-bold mb-4">Anmeldung erforderlich</h2>
          <p className="text-gray-400 mb-6">
            Bitte melde dich an, um Medien hochzuladen und anzusehen.
          </p>
          <a href="/login" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors inline-block">
            Zum Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Medien</h1>
          <p className="text-gray-400">
            Teile Bilder und Videos von deinem Hund mit der Community
          </p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'feed'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity size={18} className="inline-block mr-2" />
            Feed
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'gallery'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Grid size={18} className="inline-block mr-2" />
            Meine Galerie
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'upload'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Camera size={18} className="inline-block mr-2" />
            Hochladen
          </button>
        </div>
      </div>

      <div>
        {activeTab === 'feed' && <MediaFeed />}
        {activeTab === 'gallery' && <MediaGallery userId={session.user.id} />}
        {activeTab === 'upload' && <MediaUpload />}
      </div>
    </div>
  );
};

export default MediaPage;