import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ShoppingBag, Check, X, AlertTriangle, Search, Filter, Tag, DollarSign, MapPin } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
  seller: {
    username: string;
  };
  images: {
    image_url: string;
    is_primary: boolean;
  }[];
  category: string;
  condition: string;
  location: string;
}

interface Report {
  id: string;
  listing_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  user: {
    username: string;
  };
  listing: {
    title: string;
  };
}

const MarketplaceControl = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'reports'>('listings');
  const [filter, setFilter] = useState('active'); // active, pending, blocked
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);

  useEffect(() => {
    if (activeTab === 'listings') {
      fetchProducts();
    } else {
      fetchReports();
    }
  }, [activeTab, filter]);

  async function fetchProducts() {
    try {
      let query = supabase
        .from('marketplace_products')
        .select(`
          *,
          seller:seller_id (username),
          images:marketplace_images(image_url, is_primary)
        `);
        
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchReports() {
    try {
      let query = supabase
        .from('marketplace_reports')
        .select(`
          *,
          user:user_id (username),
          listing:listing_id (title)
        `);
        
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProductStatus(productId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ status: newStatus })
        .eq('id', productId);

      if (error) throw error;
      
      if (activeTab === 'listings') {
        fetchProducts();
      }
      
      if (selectedProduct?.id === productId) {
        setSelectedProduct(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  }
  
  async function updateReportStatus(reportId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('marketplace_reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;
      fetchReports();
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  }
  
  async function deleteProduct(productId: string) {
    if (!confirm('Bist du sicher, dass du dieses Produkt löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', productId);
        
      if (error) throw error;
      
      if (activeTab === 'listings') {
        fetchProducts();
      }
      
      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
        setShowProductDetails(false);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }
  
  function viewProductDetails(product: Product) {
    setSelectedProduct(product);
    setShowProductDetails(true);
  }
  
  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'new': return 'Neu';
      case 'like_new': return 'Wie neu';
      case 'good': return 'Gut';
      case 'fair': return 'Akzeptabel';
      case 'poor': return 'Gebraucht';
      default: return condition;
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'sold': return 'Verkauft';
      case 'reserved': return 'Reserviert';
      case 'inactive': return 'Inaktiv';
      case 'blocked': return 'Gesperrt';
      default: return status;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'sold': return 'bg-blue-500/20 text-blue-400';
      case 'reserved': return 'bg-yellow-500/20 text-yellow-400';
      case 'inactive': return 'bg-gray-500/20 text-gray-400';
      case 'blocked': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'reviewed': return 'bg-blue-500/20 text-blue-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.seller.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredReports = reports.filter(report =>
    report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.listing.title.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h2 className="text-2xl font-bold">Marktplatz-Kontrolle</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Suche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {activeTab === 'listings' ? (
              <>
                <option value="active">Aktive Anzeigen</option>
                <option value="inactive">Inaktive Anzeigen</option>
                <option value="blocked">Gesperrte Anzeigen</option>
                <option value="all">Alle Anzeigen</option>
              </>
            ) : (
              <>
                <option value="pending">Ausstehende Meldungen</option>
                <option value="reviewed">In Prüfung</option>
                <option value="resolved">Erledigte Meldungen</option>
                <option value="all">Alle Meldungen</option>
              </>
            )}
          </select>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        <div className="flex border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'listings'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Anzeigen
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'reports'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Meldungen
          </button>
        </div>

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <ShoppingBag size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Keine Anzeigen gefunden</h3>
                <p className="text-gray-400">
                  {searchQuery
                    ? 'Versuche es mit anderen Suchbegriffen'
                    : `Es gibt keine ${filter === 'active' ? 'aktiven' : filter === 'blocked' ? 'gesperrten' : 'inaktiven'} Anzeigen.`}
                </p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden">
                  <div className="relative">
                    <img
                      src={product.images.find(img => img.is_primary)?.image_url || product.images[0]?.image_url || 'https://via.placeholder.com/400x300?text=Kein+Bild'}
                      alt={product.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400">
                      {product.price.toFixed(2)} €
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {getStatusLabel(product.status)}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <span>Von {product.seller.username}</span>
                      <span>{new Date(product.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <div className="bg-white/5 px-2 py-1 rounded-lg text-xs flex items-center">
                        <Tag size={12} className="mr-1" />
                        {product.category}
                      </div>
                      <div className="bg-white/5 px-2 py-1 rounded-lg text-xs flex items-center">
                        <Filter size={12} className="mr-1" />
                        {getConditionLabel(product.condition)}
                      </div>
                      {product.location && (
                        <div className="bg-white/5 px-2 py-1 rounded-lg text-xs flex items-center">
                          <MapPin size={12} className="mr-1" />
                          {product.location}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => viewProductDetails(product)}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        Details
                      </button>
                      {product.status !== 'active' ? (
                        <button
                          onClick={() => updateProductStatus(product.id, 'active')}
                          className="flex-1 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Check size={20} className="mr-2" />
                          Freigeben
                        </button>
                      ) : (
                        <button
                          onClick={() => updateProductStatus(product.id, 'blocked')}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <X size={20} className="mr-2" />
                          Sperren
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Keine Meldungen gefunden</h3>
                <p className="text-gray-400">
                  {searchQuery
                    ? 'Versuche es mit anderen Suchbegriffen'
                    : `Es gibt keine ${filter === 'pending' ? 'ausstehenden' : filter === 'reviewed' ? 'in Prüfung befindlichen' : 'erledigten'} Meldungen.`}
                </p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <div key={report.id} className="bg-white/5 backdrop-blur-lg rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                        <span className="text-sm text-gray-400">
                          Gemeldet von {report.user.username} • {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mb-1">
                        {report.listing.title}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      {report.status === 'pending' && (
                        <button
                          onClick={() => updateReportStatus(report.id, 'reviewed')}
                          className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                          title="Als 'In Prüfung' markieren"
                        >
                          <Check size={20} />
                        </button>
                      )}
                      {report.status !== 'resolved' && (
                        <button
                          onClick={() => updateReportStatus(report.id, 'resolved')}
                          className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                          title="Als erledigt markieren"
                        >
                          <Check size={20} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-red-500/10 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2">Grund der Meldung</h4>
                    <p className="text-gray-300">{report.reason}</p>
                    {report.description && (
                      <p className="text-gray-300 mt-2">{report.description}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        // Find the product in the products list
                        const product = products.find(p => p.id === report.listing_id);
                        if (product) {
                          viewProductDetails(product);
                        }
                      }}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors"
                    >
                      Anzeige prüfen
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">Anzeigendetails</h2>
              <button
                onClick={() => setShowProductDetails(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="w-full md:w-1/2">
                  <div className="rounded-lg overflow-hidden mb-4">
                    <img
                      src={selectedProduct.images.find(img => img.is_primary)?.image_url || selectedProduct.images[0]?.image_url || 'https://via.placeholder.com/400x300?text=Kein+Bild'}
                      alt={selectedProduct.title}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  
                  {selectedProduct.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProduct.images.slice(0, 4).map((image, index) => (
                        <div key={index} className="rounded-lg overflow-hidden">
                          <img
                            src={image.image_url}
                            alt={`${selectedProduct.title} ${index + 1}`}
                            className="w-full h-16 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="w-full md:w-1/2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold">{selectedProduct.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProduct.status)}`}>
                      {getStatusLabel(selectedProduct.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-400 mb-4">
                    <span>Von {selectedProduct.seller.username}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(selectedProduct.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <DollarSign size={20} className="text-purple-400 mr-2" />
                    <span className="text-2xl font-bold">{selectedProduct.price.toFixed(2)} €</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <Tag size={16} className="text-purple-400 mr-2" />
                      <span>Kategorie: {selectedProduct.category}</span>
                    </div>
                    <div className="flex items-center">
                      <Filter size={16} className="text-purple-400 mr-2" />
                      <span>Zustand: {getConditionLabel(selectedProduct.condition)}</span>
                    </div>
                    {selectedProduct.location && (
                      <div className="flex items-center">
                        <MapPin size={16} className="text-purple-400 mr-2" />
                        <span>Standort: {selectedProduct.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4 mb-6">
                    <h4 className="font-medium mb-2">Beschreibung</h4>
                    <p className="text-gray-300">{selectedProduct.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                {selectedProduct.status !== 'active' ? (
                  <button
                    onClick={() => {
                      updateProductStatus(selectedProduct.id, 'active');
                      setShowProductDetails(false);
                    }}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-500 transition-colors"
                  >
                    Anzeige freigeben
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      updateProductStatus(selectedProduct.id, 'blocked');
                      setShowProductDetails(false);
                    }}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-500 transition-colors"
                  >
                    Anzeige sperren
                  </button>
                )}
                <button
                  onClick={() => {
                    deleteProduct(selectedProduct.id);
                    setShowProductDetails(false);
                  }}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-500 transition-colors"
                >
                  Anzeige löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceControl;