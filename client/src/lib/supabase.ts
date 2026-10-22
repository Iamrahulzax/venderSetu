import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aaifibfkfzkqkipdolxg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xZ603UnH1N8UwS8aRPHpfw_f4HJ9nMP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
