'use client';

/**
 * Authentication Page Component
 * 
 * Complete Supabase authentication with signup, login, and profile creation
 * 
 * Features:
 * - Sign up new users with email/password
 * - Automatically creates profile row after signup
 * - Sign in existing users
 * - Error handling with user-friendly messages
 * - Modern React hooks and best practices
 */

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * Authentication error types
 */
type AuthError = {
  message: string;
  code?: string;
};

/**
 * Authentication page component
 */
export default function AuthPage() {
  const router = useRouter();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(true); // Start with true to check session
  const [error, setError] = useState<AuthError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  /**
   * Check if user is authenticated and redirect if needed
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session check error:', sessionError);
          setLoading(false);
          return;
        }

        if (session?.user) {
          // User is authenticated, redirect to dashboard
          setUser(session.user);
          router.replace('/dashboard');
          return;
        }

        // No session, user can stay on auth page
        setLoading(false);
      } catch (err) {
        console.error('Error checking session:', err);
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        router.replace('/dashboard');
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  /**
   * Sign up a new user
   * 
   * Steps:
   * 1. Sign up with email/password using Supabase Auth
   * 2. On success, create a profile row in the profiles table
   * 3. Handle errors gracefully
   */
  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          // Optional: Send email confirmation
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      // Handle authentication errors
      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Sign up failed: No user data returned');
      }

      // Step 2: Create profile row linked to auth.users.id
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id, // Link to auth.users.id
          email: authData.user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Add any other profile fields your schema requires
          // full_name: null,
          // avatar_url: null,
        });

      // Handle profile creation errors
      if (profileError) {
        // If profile creation fails, we should ideally rollback the auth user
        // For now, log the error and inform the user
        console.error('Profile creation error:', profileError);
        
        // Check if it's a duplicate (profile might already exist)
        if (profileError.code === '23505') {
          // Duplicate key - profile might have been created by a trigger
          // This is okay, continue
          console.log('Profile already exists (possibly created by trigger)');
        } else {
          throw new Error(
            `Account created but profile setup failed: ${profileError.message}`
          );
        }
      }

      // Redirect immediately after successful signup if session exists
      if (authData.session) {
        router.replace('/dashboard');
      } else {
        // Show success message if email confirmation is required
        setSuccess(
          'Account created successfully! Please check your email to confirm your account.'
        );
        setUser(authData.user);
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      // Step 3: Handle errors gracefully
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      const errorCode =
        err instanceof Error && 'code' in err ? String(err.code) : undefined;

      setError({
        message: errorMessage,
        code: errorCode,
      });

      // Log error for debugging (remove in production or use proper logging)
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log in an existing user
   * 
   * Steps:
   * 1. Sign in with email/password using Supabase Auth
   * 2. Handle errors gracefully
   */
  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      // Handle authentication errors
      if (authError) {
        // Map common Supabase errors to user-friendly messages
        let errorMessage = authError.message;
        
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (authError.message.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email address before signing in.';
        } else if (authError.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please try again later.';
        }

        throw new Error(errorMessage);
      }

      if (!authData.user || !authData.session) {
        throw new Error('Sign in failed: No user or session returned');
      }

      // Redirect immediately after successful login
      router.replace('/dashboard');
    } catch (err) {
      // Step 2: Handle errors gracefully
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      const errorCode =
        err instanceof Error && 'code' in err ? String(err.code) : undefined;

      setError({
        message: errorMessage,
        code: errorCode,
      });

      // Log error for debugging (remove in production or use proper logging)
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission (signup or login)
   */
  const handleSubmit = isSignUp ? handleSignUp : handleSignIn;

  /**
   * Sign out current user
   */
  const handleSignOut = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw new Error(signOutError.message);
      }

      setSuccess('Successfully signed out');
      setUser(null);
      // Redirect stays on auth page (no redirect needed)
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Sign out failed',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md mx-auto p-6 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700">
        <div className="text-center">
          <p className="text-gray-300">Checking authentication...</p>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-8 px-4">
      <div className="max-w-md w-full p-6 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-6">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </h1>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="font-semibold text-red-300">Error</p>
          <p className="text-red-200">{error.message}</p>
          {error.code && (
            <p className="text-sm text-red-300 mt-1">Code: {error.code}</p>
          )}
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="mb-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <p className="text-green-200">{success}</p>
        </div>
      )}

      {/* Auth Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder:text-gray-400 transition-colors"
            placeholder="your.email@example.com"
            autoComplete="email"
          />
        </div>

        {/* Password Input */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder:text-gray-400 transition-colors"
            placeholder="••••••••"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
          {isSignUp && (
            <p className="mt-1 text-sm text-gray-300">
              Password must be at least 6 characters
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:bg-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
        >
          {loading
            ? isSignUp
              ? 'Creating Account...'
              : 'Signing In...'
            : isSignUp
            ? 'Sign Up'
            : 'Sign In'}
        </button>
      </form>

      {/* Toggle Sign Up / Sign In */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setSuccess(null);
          }}
          disabled={loading}
          className="text-gray-300 hover:text-purple-300 text-sm disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </button>
      </div>
      </div>
    </div>
  );
}
