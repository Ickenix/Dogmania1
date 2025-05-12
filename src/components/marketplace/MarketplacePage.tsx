import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Search, Filter, Plus, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import ListingCard from './ListingCard';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  images: string[];
  is_available: boolean;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

const MarketplacePage = () => {
  const { session } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [location, setLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, location]);

  async function fetchListings() {
    try {
      let query = supabase
        .from('marketplace_listings')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (location) {
        query = query.ilike('location', `%${location}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredListings = listings.filter(listing => {
    const matchesSearch = 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrice = 
      listing.price >= priceRange[0] && listing.price <= priceRange[1];

    return matchesSearch && matchesPrice;
  });

  const categories = [
    { id: 'all', name: 'Alle Kategorien' },
    { id: 'accessories', name: 'Zubehör' },
    { id: 'food', name: 'Futter' },
    { id: 'toys', name: 'Spielzeug' },
    { id: 'training', name: 'Training' },
    { id: 'health', name: 'Gesundheit' },
    { id: 'services', name: 'Dienstleistungen' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Marktplatz</h1>
          <p className="text-gray-400">
            Entdecke Produkte und Dienstleistungen rund um deinen Hund
          </p>
        </div>

        {session && (
          <Link
            to="/marketplace/create"
            className="mt-4 md:mt-0 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Inserat erstellen
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Suche nach Produkten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors flex items-center"
                aria-label="Toggle filters"
              >
                <Filter size={20} className="mr-2" />
                Filter
              </button>
              
              <div className="relative md:block">
                <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Standort"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-auto"
                />
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 overflow-x-auto pb-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preisbereich</label>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                    className="flex-1 w-full"
                  />
                  <span className="text-sm">€{priceRange[0]}</span>
                  <span>-</span>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="flex-1 w-full"
                  />
                  <span className="text-sm">€{priceRange[1]}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <Filter size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Keine Inserate gefunden</h3>
          <p className="text-gray-400">
            {searchQuery
              ? 'Versuche es mit anderen Suchbegriffen'
              : 'Erstelle ein neues Inserat und starte den Marktplatz!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onUpdate={fetchListings} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;