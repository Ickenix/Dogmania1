import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, checkSupabaseConnection } from '../../lib/supabase';
import { AlertCircle } from 'lucide-react';

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({ children }) => {
  const { session } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    let mounted = true;

    if (session) {
      checkOnboardingStatus(mounted);
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [session, retryCount]);

  async function checkOnboardingStatus(mounted: boolean) {
    try {
      if (!mounted) return;
      
      setLoading(true);
      setError(null);

      // Check if we can connect to Supabase with exponential backoff
      const isConnected = await checkSupabaseConnection(3, 1000);
      if (!isConnected) {
        throw new Error('Verbindung zur Datenbank nicht möglich. Bitte überprüfen Sie Ihre Internetverbindung.');
      }

      if (!mounted) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session?.user.id)
        .single();

      if (!mounted) return;

      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found
          setShowOnboarding(true);
        } else {
          throw error;
        }
      } else {
        setShowOnboarding(data?.onboarding_completed !== true);
      }
      
      setError(null);
    } catch (error) {
      if (!mounted) return;

      console.error('Error checking onboarding status:', error);
      setError(error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten');
      // Default to not showing onboarding if we can't verify the status
      setShowOnboarding(false);
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  }

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-purple-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-purple-950">
        <div className="bg-blue-900/50 backdrop-blur-lg p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Verbindungsfehler</h3>
            <p className="text-gray-300 mb-4">
              {error}
            </p>
            {retryCount < maxRetries ? (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 transition-colors rounded-lg text-white font-medium"
              >
                Erneut versuchen
              </button>
            ) : (
              <p className="text-sm text-gray-400">
                Bitte überprüfen Sie Ihre Internetverbindung und laden Sie die Seite neu.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showOnboarding && session) {
    return <OnboardingFlow />;
  }

  return <>{children}</>;
};

export default OnboardingWrapper;