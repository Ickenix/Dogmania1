import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Download, ShoppingBag, CreditCard, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Order {
  order_id: string;
  checkout_session_id: string;
  payment_intent_id: string;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

interface Subscription {
  subscription_id: string;
  subscription_status: string;
  price_id: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  payment_method_brand: string;
  payment_method_last4: string;
}

const OrderHistory = () => {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'subscription'>('orders');

  useEffect(() => {
    if (session) {
      fetchOrderHistory();
      fetchSubscription();
    }
  }, [session]);

  async function fetchOrderHistory() {
    try {
      const { data, error } = await supabase
        .from('stripe_user_orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching order history:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubscription() {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('de-DE');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'active':
      case 'trialing':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
      case 'incomplete':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'canceled':
      case 'unpaid':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'active':
      case 'trialing':
        return <CheckCircle size={16} className="mr-1" />;
      case 'canceled':
      case 'unpaid':
        return <XCircle size={16} className="mr-1" />;
      default:
        return null;
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
    <div className="space-y-6">
      <div className="flex border-b border-white/10 mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'orders'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ShoppingBag size={18} className="inline-block mr-2" />
          Bestellungen
        </button>
        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'subscription'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <CreditCard size={18} className="inline-block mr-2" />
          Abonnement
        </button>
      </div>

      {activeTab === 'orders' && (
        <>
          {orders.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
              <ShoppingBag size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Keine Bestellungen</h3>
              <p className="text-gray-400">
                Du hast noch keine Bestellungen getätigt.
              </p>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left">Bestellnummer</th>
                      <th className="px-6 py-4 text-left">Datum</th>
                      <th className="px-6 py-4 text-left">Betrag</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.order_id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="px-6 py-4">#{order.order_id.slice(-6)}</td>
                        <td className="px-6 py-4">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {formatCurrency(order.amount_total, order.currency)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.payment_status)}`}>
                            {getStatusIcon(order.payment_status)}
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                            title="Rechnung herunterladen"
                          >
                            <Download size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'subscription' && (
        <>
          {!subscription ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
              <CreditCard size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Kein aktives Abonnement</h3>
              <p className="text-gray-400 mb-6">
                Du hast derzeit kein aktives Abonnement.
              </p>
              <a
                href="/pricing"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors inline-block"
              >
                Abonnement auswählen
              </a>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">Dein Abonnement</h3>
                  <p className="text-gray-400">
                    {subscription.subscription_status === 'active' ? 'Aktiv' : subscription.subscription_status}
                  </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.subscription_status)}`}>
                  {getStatusIcon(subscription.subscription_status)}
                  {subscription.subscription_status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Calendar size={20} className="text-purple-400 mr-2" />
                    <h4 className="font-semibold">Abrechnungszeitraum</h4>
                  </div>
                  <p>
                    {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CreditCard size={20} className="text-purple-400 mr-2" />
                    <h4 className="font-semibold">Zahlungsmethode</h4>
                  </div>
                  <p>
                    {subscription.payment_method_brand} •••• {subscription.payment_method_last4}
                  </p>
                </div>
              </div>

              {subscription.cancel_at_period_end && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-lg mb-6">
                  Dein Abonnement endet am {formatDate(subscription.current_period_end)} und wird nicht automatisch verlängert.
                </div>
              )}

              <div className="flex justify-end">
                <button
                  className={`px-6 py-3 rounded-lg transition-colors ${
                    subscription.cancel_at_period_end
                      ? 'bg-green-600 hover:bg-green-500 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {subscription.cancel_at_period_end
                    ? 'Abonnement fortsetzen'
                    : 'Abonnement kündigen'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderHistory;