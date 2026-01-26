'use client';

/**
 * Authentication Form Component
 * 
 * Handles user signup and login with Supabase
 * Automatically creates profile after successful signup
 */

import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Authentication form component
 * 
 * Features:
 * - Sign up new users with email/password
 * - Auto-create profile row after signup
 * - Login existing users
 * - Error handling with user-friendly messages
 * - Modern React hooks pattern
 */
export default function AuthForm() {
  // Form input state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI state
  const [mode, setMode] = useState<'signup' | 'login'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Handle sign up
   * 
   * Steps:
   * 1. Sign up user with Supabase Auth using email/password
   * 2. On success, automatically create a linked row in profiles table
   * 3. Handle errors and display user-friendly messages
   */
  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Sign up with Supabase email/password authentication
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

      // Step 2: Automatically create linked row in profiles table
      // The profile.id links to auth.users.id (foreign key relationship)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id, // Links to auth.users.id
          email: authData.user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      // Handle profile creation errors
      if (profileError) {
        // Check if profile already exists (might be created by database trigger)
        if (profileError.code === '23505') {
          // Duplicate key - profile might exist from trigger, this is okay
          console.log('Profile may already exist (possibly from trigger)');
        } else {
          // Other profile creation errors
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
      }

      // Success - user and profile created
      setSuccess(
        authData.session
          ? 'Account created successfully! You are now signed in.'
          : 'Account created! Please check your email to confirm your account.'
      );
      
      // Clear form
      setEmail('');
      setPassword('');

    } catch (err) {
      // Step 3: Handle errors and display user-friendly messages
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle login
   * 
   * Steps:
   * 1. Sign in existing user with Supabase Auth using email/password
   * 2. Handle errors and display user-friendly messages
   */
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Sign in with Supabase email/password authentication
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

      // Verify login was successful
      if (!authData.user || !authData.session) {
        throw new Error('Login failed: No user or session returned');
      }

      // Success - user logged in
      setSuccess('Successfully signed in!');
      
      // Clear form
      setEmail('');
      setPassword('');

    } catch (err) {
      // Step 2: Handle errors and display user-friendly messages
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission based on current mode
   */
  const handleSubmit = mode === 'signup' ? handleSignUp : handleLogin;

  /**
   * Toggle between signup and login modes
   */
  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setSuccess(null);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        {mode === 'signup' ? 'Sign Up' : 'Sign In'}
      </h1>

      {/* Error message display */}
      {error && (
        <div style={{ 
          padding: '0.75rem', 
          marginBottom: '1rem', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '4px', 
          color: '#991b1b' 
        }}>
          {error}
        </div>
      )}

      {/* Success message display */}
      {success && (
        <div style={{ 
          padding: '0.75rem', 
          marginBottom: '1rem', 
          backgroundColor: '#f0fdf4', 
          border: '1px solid #bbf7d0', 
          borderRadius: '4px', 
          color: '#166534' 
        }}>
          {success}
        </div>
      )}

      {/* Authentication form */}
      <form onSubmit={handleSubmit}>
        {/* Email input field */}
        <div style={{ marginBottom: '1rem' }}>
          <label 
            htmlFor="email" 
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            placeholder="your.email@example.com"
            autoComplete="email"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Password input field */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label 
            htmlFor="password" 
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
          >
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
            placeholder="••••••••"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />
          {mode === 'signup' && (
            <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Password must be at least 6 characters
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !email || !password}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loading ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '1rem',
          }}
        >
          {loading
            ? (mode === 'signup' ? 'Creating Account...' : 'Signing In...')
            : (mode === 'signup' ? 'Sign Up' : 'Sign In')}
        </button>
      </form>

      {/* Toggle between signup and login */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={toggleMode}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563eb',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '0.875rem',
          }}
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
