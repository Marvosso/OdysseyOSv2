/**
 * Server-side Supabase Session Check
 * 
 * Helper functions for checking Supabase sessions on the server
 * Uses cookies to detect existing authentication sessions
 */

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Get Supabase client for server-side session checking
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
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
    console.error('Error checking session:', error);
    return false;
  }
}
