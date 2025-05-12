import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

if (!Deno.env.get('SUPABASE_URL') || !Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
  throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined');
}

export const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);