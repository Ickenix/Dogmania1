import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  seller_id: string;
  created_at: string;
  condition: string;
  location: string;
  seller: {
    username: string;
    avatar_url: string;
  };
  images: {
    image_url: string;
    is_primary: boolean;
  }[];
}

const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { data, error } = await supabase
          .from('marketplace_products')
          .select(`
            *,
            seller:seller_id(username, avatar_url),
            images:marketplace_images(image_url, is_primary)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setListing(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch listing');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
          <p className="text-gray-300">{error || 'Listing not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8 p-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            {listing.images && listing.images.length > 0 ? (
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={listing.images.find(img => img.is_primary)?.image_url || listing.images[0].image_url}
                  alt={listing.title}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="aspect-w-16 aspect-h-9 bg-gray-700 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">No image available</p>
              </div>
            )}
          </div>

          {/* Listing Details */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">{listing.title}</h1>
            <p className="text-2xl text-purple-400">${listing.price}</p>
            
            <div className="space-y-2">
              <p className="text-gray-300"><span className="font-semibold">Condition:</span> {listing.condition}</p>
              <p className="text-gray-300"><span className="font-semibold">Location:</span> {listing.location}</p>
              <p className="text-gray-300"><span className="font-semibold">Posted:</span> {new Date(listing.created_at).toLocaleDateString()}</p>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-300 whitespace-pre-line">{listing.description}</p>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <h2 className="text-xl font-semibold mb-2">Seller Information</h2>
              <div className="flex items-center space-x-4">
                {listing.seller.avatar_url ? (
                  <img
                    src={listing.seller.avatar_url}
                    alt={listing.seller.username}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-xl text-gray-400">
                      {listing.seller.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{listing.seller.username}</p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200">
                Contact Seller
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;