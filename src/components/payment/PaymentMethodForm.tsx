import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, Lock, AlertTriangle } from 'lucide-react';

const PaymentMethodForm = () => {
  const { session } = useAuth();
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Add a space after every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as MM/YY
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // This is a mock implementation
    // In a real app, you would use Stripe Elements or Stripe.js
    
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate success
      setSuccess(true);
      
      // Reset form
      setCardNumber('');
      setCardName('');
      setExpiryDate('');
      setCvc('');
    } catch (err) {
      setError('Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
          <CreditCard size={24} className="text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Zahlungsmethode hinzufügen</h2>
          <p className="text-gray-400">Füge eine neue Kreditkarte hinzu</p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertTriangle size={20} className="mr-2" />
          {error}
        </div>
      )}
      
      {success ? (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-6">
          Deine Zahlungsmethode wurde erfolgreich hinzugefügt!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Karteninhaber</label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Max Mustermann"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Kartennummer</label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="1234 5678 9012 3456"
                required
                maxLength={19}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
                <div className="w-8 h-5 bg-gray-700 rounded"></div>
                <div className="w-8 h-5 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ablaufdatum</label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="MM/YY"
                required
                maxLength={5}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">CVC</label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="123"
                required
                maxLength={3}
              />
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-400 bg-blue-900/20 p-3 rounded-lg">
            <Lock size={16} className="mr-2 text-blue-400" />
            Deine Zahlungsdaten werden sicher über Stripe verarbeitet und nicht auf unseren Servern gespeichert.
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Wird verarbeitet...
              </>
            ) : (
              'Zahlungsmethode hinzufügen'
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default PaymentMethodForm;