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

import { useState, FormEvent } from 'react';
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
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

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

      // Success!
      setSuccess(
        'Account created successfully! ' +
        (authData.session
          ? 'You are now logged in.'
          : 'Please check your email to confirm your account.')
      );
      setUser(authData.user);
      setEmail('');
      setPassword('');

      // Optional: Redirect after successful signup
      // router.push('/dashboard');
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

      // Success!
      setSuccess('Successfully signed in!');
      setUser(authData.user);
      setEmail('');
      setPassword('');

      // Optional: Redirect after successful login
      // router.push('/dashboard');
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
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Sign out failed',
      });
    } finally {
      setLoading(false);
    }
  };

  // If user is logged in, show sign out option
  if (user) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
        <p className="mb-4">You are signed in as: {user.email}</p>
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </h1>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <p className="font-semibold">Error</p>
          <p>{error.message}</p>
          {error.code && (
            <p className="text-sm text-red-600 mt-1">Code: {error.code}</p>
          )}
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
          <p>{success}</p>
        </div>
      )}

      {/* Auth Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="your.email@example.com"
            autoComplete="email"
          />
        </div>

        {/* Password Input */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="••••••••"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
          {isSignUp && (
            <p className="mt-1 text-sm text-gray-500">
              Password must be at least 6 characters
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          className="text-blue-600 hover:text-blue-700 text-sm disabled:opacity-50"
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
