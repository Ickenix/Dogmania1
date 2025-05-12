import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function usePremium() {
  const { session } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      checkPremiumStatus();
    }
  }, [session]);

  async function checkPremiumStatus() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, premium_until')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;

      const isPremiumActive = 
        data.subscription_status === 'premium' && 
        (!data.premium_until || new Date(data.premium_until) > new Date());

      setIsPremium(isPremiumActive);
    } catch (error) {
      console.error('Error checking premium status:', error);
    } finally {
      setLoading(false);
    }
  }

  return { isPremium, loading };
}