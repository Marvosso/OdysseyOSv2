/**
 * Authentication Hook
 * 
 * React hook for managing Supabase authentication state
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Authentication state
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Authentication hook result
 */
export interface UseAuthResult extends AuthState {
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refresh: () => Promise<void>;
}

/**
 * React hook for Supabase authentication
 * 
 * Manages authentication state and provides signup/login/signout functions
 * 
 * Usage:
 * ```typescript
 * const { user, loading, signUp, signIn, signOut } = useAuth();
 * ```
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Initialize auth state
   */
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setError(null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign up a new user
   */
  const signUp = async (
    email: string,
    password: string
  ): Promise<{ user: User | null; error: Error | null }> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) {
        const error = new Error(authError.message);
        setError(error);
        setLoading(false);
        return { user: null, error };
      }

      if (!data.user) {
        const error = new Error('Sign up failed: No user data returned');
        setError(error);
        setLoading(false);
        return { user: null, error };
      }

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError && profileError.code !== '23505') {
        // Ignore duplicate key errors (profile might exist from trigger)
        const error = new Error(
          `Account created but profile setup failed: ${profileError.message}`
        );
        setError(error);
        setLoading(false);
        return { user: data.user, error };
      }

      setUser(data.user);
      setSession(data.session);
      setLoading(false);
      return { user: data.user, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setLoading(false);
      return { user: null, error };
    }
  };

  /**
   * Sign in an existing user
   */
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ user: User | null; error: Error | null }> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        const error = new Error(authError.message);
        setError(error);
        setLoading(false);
        return { user: null, error };
      }

      if (!data.user || !data.session) {
        const error = new Error('Sign in failed: No user or session returned');
        setError(error);
        setLoading(false);
        return { user: null, error };
      }

      setUser(data.user);
      setSession(data.session);
      setLoading(false);
      return { user: data.user, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setLoading(false);
      return { user: null, error };
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async (): Promise<{ error: Error | null }> => {
    setLoading(true);
    setError(null);

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        const error = new Error(signOutError.message);
        setError(error);
        setLoading(false);
        return { error };
      }

      setUser(null);
      setSession(null);
      setLoading(false);
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setLoading(false);
      return { error };
    }
  };

  /**
   * Refresh authentication state
   */
  const refresh = async (): Promise<void> => {
    setLoading(true);
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      setError(error);
    } else {
      setSession(session);
      setUser(session?.user ?? null);
    }
    setLoading(false);
  };

  return {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    refresh,
  };
}
