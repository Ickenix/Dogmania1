import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Validate the URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error('Invalid Supabase URL format');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});

// Enhanced health check function with exponential backoff
export async function checkSupabaseConnection(maxRetries = 3, initialTimeout = 1000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const timeout = initialTimeout * Math.pow(2, i); // Exponential backoff
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      
      if (!error) {
        return true;
      }
      
      console.warn(`Attempt ${i + 1}/${maxRetries} failed:`, error.message);
      
      // Wait before retrying, but not on the last attempt
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, timeout));
      }
    } catch (error) {
      console.warn(`Attempt ${i + 1}/${maxRetries} failed with error:`, error);
      
      if (i === maxRetries - 1) {
        console.error('Failed to connect to Supabase after all retries');
        return false;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, initialTimeout * Math.pow(2, i)));
    }
  }
  
  return false;
}