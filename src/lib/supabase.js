import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Using local storage fallback.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database schema types for TypeScript support
export const TABLES = {
  USERS: 'users',
  LEADS: 'leads', 
  DEALS: 'deals',
  CUSTOMERS: 'customers',
  INTERACTIONS: 'interactions',
  FOLLOW_UPS: 'follow_ups'
};

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null;
};
