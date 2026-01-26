/**
 * Standalone Authentication Component Snippet
 * 
 * Ready-to-use component for Next.js with Supabase authentication
 * Copy this into your Next.js page component
 */

'use client';

import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthComponent() {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Sign up a new user and create profile
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
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Sign up failed: No user data returned');

      // Step 2: Create profile row linked to auth.users.id
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id, // Link to auth.users.id
          email: authData.user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      // Handle profile creation errors
      if (profileError && profileError.code !== '23505') {
        // Ignore duplicate key (might be created by trigger)
        throw new Error(`Profile setup failed: ${profileError.message}`);
      }

      setSuccess(
        authData.session
          ? 'Account created and signed in!'
          : 'Account created! Please check your email to confirm.'
      );
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log in an existing user
   */
  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        // Map common errors to user-friendly messages
        let message = authError.message;
        if (message.includes('Invalid login credentials')) {
          message = 'Invalid email or password. Please try again.';
        } else if (message.includes('Email not confirmed')) {
          message = 'Please confirm your email address before signing in.';
        }
        throw new Error(message);
      }

      if (!authData.user || !authData.session) {
        throw new Error('Sign in failed: No user or session returned');
      }

      setSuccess('Successfully signed in!');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = isSignUp ? handleSignUp : handleSignIn;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </h1>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <p>{error}</p>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
