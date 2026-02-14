/**
 * Supabase Client
 *
 * Singleton Supabase client for browser and server-side usage.
 * Uses dev or prod config based on NODE_ENV (see lib/supabase/config.ts).
 */

import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/config';

const supabaseUrl = getSupabaseUrl() || 'https://placeholder.supabase.co';
const supabaseAnonKey = getSupabaseAnonKey() || 'placeholder-key';

if (!getSupabaseUrl() || !getSupabaseAnonKey()) {
  if (typeof window === 'undefined') {
    console.warn(
      '[Supabase] URL or Anon Key not configured. Set NEXT_PUBLIC_SUPABASE_DEV_* / NEXT_PUBLIC_SUPABASE_PROD_* (or legacy NEXT_PUBLIC_SUPABASE_*) in env.'
    );
  }
}

/**
 * Supabase client instance
 * 
 * Use this client for all Supabase operations
 * Uses placeholder values during build if env vars are missing
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Get current user session
 */
export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return user;
}
