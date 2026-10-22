import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from './env.js';

/**
 * Standard Supabase client using Anon/Publishable Key
 * Safe for operations respecting Row Level Security (RLS)
 */
export const supabase: SupabaseClient = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/**
 * Admin Supabase client using Service Role Key (if available)
 * Used for server-side administrative tasks bypassing RLS
 */
export const supabaseAdmin: SupabaseClient = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/**
 * Verify Supabase connectivity
 */
export const testSupabaseConnection = async (): Promise<{ connected: boolean; message: string; error?: string }> => {
  try {
    const { error } = await supabase.from('_non_existent_probe_').select('count').limit(1);
    // If we get an error code PGRST204 or PGRST200 or 404/400 from postgrest, it means connection reached Supabase server successfully!
    return {
      connected: true,
      message: 'Supabase client connected successfully to ' + ENV.SUPABASE_URL
    };
  } catch (err: any) {
    return {
      connected: false,
      message: 'Failed to connect to Supabase',
      error: err.message
    };
  }
};
