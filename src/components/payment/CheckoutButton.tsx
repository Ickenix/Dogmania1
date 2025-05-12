import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { STRIPE_PRODUCTS, ProductId } from '../../stripe-config';
import { ShoppingCart, CreditCard, Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
  productId: ProductId;
  className?: string;
  children?: React.ReactNode;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({ 
  productId, 
  className = '',
  children
}) => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!session) {
      alert('Bitte melde dich an, um fortzufahren.');
      return;
    }

    try {
      setLoading(true);
      const product = STRIPE_PRODUCTS[productId];
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: product.priceId,
          success_url: `${window.location.origin}/dashboard?checkout=success`,
          cancel_url: `${window.location.origin}/dashboard?checkout=cancelled`,
          mode: product.mode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Checkout konnte nicht erstellt werden');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 size={20} className="animate-spin mr-2" />
      ) : (
        <CreditCard size={20} className="mr-2" />
      )}
      {children || `${STRIPE_PRODUCTS[productId].price.toFixed(2)}€ - Jetzt kaufen`}
    </button>
  );
};

export default CheckoutButton;