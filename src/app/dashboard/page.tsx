'use client';

/**
 * Dashboard Page Component
 * 
 * Protected route for authenticated users
 * 
 * Features:
 * - Displays user information
 * - Provides sign out functionality
 * - Redirects unauthenticated users to /auth
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Check authentication and redirect if not authenticated
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session check error:', sessionError);
          router.push('/auth');
          return;
        }

        if (!session?.user) {
          // No session, redirect to auth
          router.push('/auth');
          return;
        }

        // User is authenticated
        setUser(session.user);
        setLoading(false);
      } catch (err) {
        console.error('Error checking session:', err);
        router.push('/auth');
      }
    };

    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  /**
   * Handle sign out
   */
  const handleSignOut = async () => {
    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error('Sign out error:', signOutError);
        return;
      }

      // Redirect to auth page after sign out
      router.push('/auth');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Show loading state while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
              <p className="text-gray-600">
                You are signed in as: <span className="font-medium">{user?.email}</span>
              </p>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">User Information</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Email Verified:</strong> {user?.email_confirmed_at ? 'Yes' : 'No'}</p>
                <p><strong>Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
              <p className="text-blue-800">
                <strong>Note:</strong> This is a placeholder dashboard. 
                Future OdysseyOS features (story canvas, character hub, etc.) will be added here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
