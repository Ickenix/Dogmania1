import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { STRIPE_PRODUCTS, ProductId } from '../../stripe-config';
import { ShoppingCart, CreditCard, ArrowLeft, Shield, Check } from 'lucide-react';
import CheckoutButton from './CheckoutButton';

const CheckoutPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Validate product ID
  const isValidProduct = productId && Object.keys(STRIPE_PRODUCTS).includes(productId);
  const product = isValidProduct ? STRIPE_PRODUCTS[productId as ProductId] : null;

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Anmeldung erforderlich</h2>
          <p className="text-gray-400 mb-6">
            Bitte melde dich an, um fortzufahren.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
          >
            Zum Login
          </button>
        </div>
      </div>
    );
  }

  if (!isValidProduct || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Produkt nicht gefunden</h2>
          <p className="text-gray-400 mb-6">
            Das angeforderte Produkt existiert nicht.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-400 hover:text-white mb-8"
      >
        <ArrowLeft size={20} className="mr-2" />
        Zurück
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8">
            <h1 className="text-2xl font-bold mb-6">Checkout</h1>
            
            <div className="border-b border-white/10 pb-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Bestellübersicht</h2>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-gray-400 text-sm">{product.description}</p>
                </div>
                <div className="text-xl font-bold">{product.price.toFixed(2)}€</div>
              </div>
            </div>
            
            <div className="border-b border-white/10 pb-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Zahlungsmethode</h2>
              <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard size={20} className="text-purple-400 mr-3" />
                  <span>Kreditkarte</span>
                </div>
                <span className="text-sm text-gray-400">Sicher über Stripe</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Zusammenfassung</h2>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span>Zwischensumme</span>
                  <span>{product.price.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>MwSt. (19%)</span>
                  <span>{(product.price * 0.19).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
                  <span>Gesamtbetrag</span>
                  <span>{(product.price * 1.19).toFixed(2)}€</span>
                </div>
              </div>
              
              <CheckoutButton
                productId={productId as ProductId}
                className="w-full py-3"
              >
                <ShoppingCart size={20} className="mr-2" />
                Jetzt bezahlen
              </CheckoutButton>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Sicher bezahlen</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="bg-green-500/20 p-1 rounded-full mr-3 mt-0.5">
                  <Check size={16} className="text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium">Sichere Zahlung</h3>
                  <p className="text-sm text-gray-400">Alle Zahlungen werden sicher über Stripe abgewickelt.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-green-500/20 p-1 rounded-full mr-3 mt-0.5">
                  <Check size={16} className="text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium">Datenschutz</h3>
                  <p className="text-sm text-gray-400">Deine Zahlungsdaten werden nicht auf unseren Servern gespeichert.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-green-500/20 p-1 rounded-full mr-3 mt-0.5">
                  <Check size={16} className="text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium">Geld-zurück-Garantie</h3>
                  <p className="text-sm text-gray-400">14 Tage Geld-zurück-Garantie bei Unzufriedenheit.</p>
                </div>
              </li>
            </ul>
            
            <div className="flex items-center mt-6 text-sm text-gray-400">
              <Shield size={16} className="mr-2 text-purple-400" />
              <span>Verschlüsselte Verbindung</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;