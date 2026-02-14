/**
 * Server-side Supabase Session Check
 *
 * Helper functions for checking Supabase sessions on the server.
 * Uses dev/prod config based on NODE_ENV (service role key is server-only).
 */

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabaseUrl, getSupabaseAnonKey, getSupabaseServiceRoleKey } from '@/lib/supabase/config';
import { logError } from '@/lib/logger';

/**
 * Get Supabase client for server-side session checking (anon key)
 */
function getSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Server Supabase client with service role for API routes.
 * Bypasses RLS; use only server-side and never expose the key.
 * Returns null if service role key is not set.
 */
export function getSupabaseServiceClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * Check if user has an active session by checking for Supabase auth cookies
 * 
 * Supabase stores session in cookies with names like:
 * - sb-<project-ref>-auth-token
 * - sb-<project-ref>-auth-token.0, sb-<project-ref>-auth-token.1, etc.
 */
export async function hasActiveSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Check for Supabase auth cookies
    // Supabase uses cookies with pattern: sb-<project-ref>-auth-token
    const supabaseUrl = getSupabaseUrl();
    if (!supabaseUrl) {
      return false;
    }

    // Extract project ref from URL (e.g., https://xxx.supabase.co -> xxx)
    const projectRefMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (!projectRefMatch) {
      return false;
    }

    const projectRef = projectRefMatch[1];
    const authCookieName = `sb-${projectRef}-auth-token`;

    // Check if any auth token cookie exists
    const hasAuthCookie = allCookies.some(
      cookie => cookie.name.startsWith(authCookieName)
    );

    if (!hasAuthCookie) {
      return false;
    }

    // If cookie exists, verify the session is valid by checking the token
    // For a more robust check, we could decode and validate the JWT
    // For now, presence of the cookie is sufficient
    return true;
  } catch (error) {
    logError('Session check failed', error);
    return false;
  }
}
