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
 * Authentication Page Component
 */
export default function AuthPage() {
  // Form state - email and password inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI mode - toggle between signup and login
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Loading state - prevents multiple submissions
  const [loading, setLoading] = useState(false);
  
  // Error state - displays error messages to user
  const [error, setError] = useState<string | null>(null);
  
  // Success state - displays success messages
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Handle Sign Up
   * 
   * Steps:
   * 1. Sign up user with Supabase Auth using email/password
   * 2. On success, create a profile row in the profiles table
   * 3. Link profile to auth.users.id
   * 4. Handle any errors gracefully
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

      // Handle authentication errors
      if (authError) {
        throw new Error(authError.message);
      }

      // Verify user was created
      if (!authData.user) {
        throw new Error('Sign up failed: No user data returned');
      }

      // Step 2: Create profile row linked to auth.users.id
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id, // Link profile to auth.users.id
          email: authData.user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      // Step 3: Handle profile creation errors
      if (profileError) {
        // Check if profile already exists (might be created by database trigger)
        if (profileError.code === '23505') {
          // Duplicate key - profile already exists, this is okay
          console.log('Profile already exists (possibly created by trigger)');
        } else {
          // Other profile creation error
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
      }

      // Step 4: Success - clear form and show message
      setSuccess(
        authData.session
          ? 'Account created successfully! You are now signed in.'
          : 'Account created! Please check your email to confirm your account.'
      );
      setEmail('');
      setPassword('');

    } catch (err) {
      // Step 5: Handle errors gracefully
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Sign In
   * 
   * Steps:
   * 1. Sign in user with Supabase Auth using email/password
   * 2. Handle errors gracefully with user-friendly messages
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

      // Step 2: Handle authentication errors
      if (authError) {
        // Map Supabase errors to user-friendly messages
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

      // Verify sign in was successful
      if (!authData.user || !authData.session) {
        throw new Error('Sign in failed: No user or session returned');
      }

      // Step 3: Success - clear form and show message
      setSuccess('Successfully signed in!');
      setEmail('');
      setPassword('');

    } catch (err) {
      // Step 4: Handle errors gracefully
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission
   * Routes to signup or login based on current mode
   */
  const handleSubmit = isSignUp ? handleSignUp : handleSignIn;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </h1>

      {/* Error Message Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* Success Message Display */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
          <p>{success}</p>
        </div>
      )}

      {/* Authentication Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input Field */}
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

        {/* Password Input Field */}
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

      {/* Toggle Between Sign Up and Sign In */}
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
