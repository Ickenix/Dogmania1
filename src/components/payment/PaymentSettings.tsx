import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { CreditCard, Plus, Trash2, CheckCircle } from 'lucide-react';
import PaymentMethodForm from './PaymentMethodForm';
import OrderHistory from './OrderHistory';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

const PaymentSettings = () => {
  const { session } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'methods' | 'history'>('methods');

  useEffect(() => {
    if (session) {
      fetchPaymentMethods();
    }
  }, [session]);

  async function fetchPaymentMethods() {
    try {
      // In a real app, you'd fetch from your database
      // This is mock data for demonstration
      setPaymentMethods([
        {
          id: 'pm_1',
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
          is_default: true
        }
      ]);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  }

  async function setDefaultPaymentMethod(id: string) {
    try {
      // In a real app, you'd update your database
      setPaymentMethods(methods => 
        methods.map(method => ({
          ...method,
          is_default: method.id === id
        }))
      );
    } catch (error) {
      console.error('Error setting default payment method:', error);
    }
  }

  async function deletePaymentMethod(id: string) {
    try {
      // In a real app, you'd delete from your database
      setPaymentMethods(methods => 
        methods.filter(method => method.id !== id)
      );
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  }

  const getBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳 Visa';
      case 'mastercard':
        return '💳 Mastercard';
      case 'amex':
        return '💳 American Express';
      default:
        return '💳 ' + brand;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex border-b border-white/10 mb-6">
        <button
          onClick={() => setActiveTab('methods')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'methods'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <CreditCard size={18} className="inline-block mr-2" />
          Zahlungsmethoden
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'history'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <CreditCard size={18} className="inline-block mr-2" />
          Zahlungsverlauf
        </button>
      </div>

      {activeTab === 'methods' && (
        <>
          {showAddForm ? (
            <PaymentMethodForm />
          ) : (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Deine Zahlungsmethoden</h2>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
                >
                  <Plus size={18} className="mr-2" />
                  Hinzufügen
                </button>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  Keine Zahlungsmethoden vorhanden
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="mr-4">
                          {getBrandIcon(method.brand)}
                        </div>
                        <div>
                          <p className="font-medium">•••• •••• •••• {method.last4}</p>
                          <p className="text-sm text-gray-400">
                            Läuft ab: {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {method.is_default && (
                          <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs flex items-center">
                            <CheckCircle size={12} className="mr-1" />
                            Standard
                          </span>
                        )}
                        {!method.is_default && (
                          <button
                            onClick={() => setDefaultPaymentMethod(method.id)}
                            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            Als Standard
                          </button>
                        )}
                        <button
                          onClick={() => deletePaymentMethod(method.id)}
                          className="p-1 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <OrderHistory />
      )}
    </div>
  );
};

export default PaymentSettings;