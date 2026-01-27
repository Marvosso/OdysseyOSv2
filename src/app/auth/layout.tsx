/**
 * Auth Layout
 * 
 * Server-side layout that checks for authenticated sessions
 * and redirects authenticated users away from the auth page
 */

import { redirect } from 'next/navigation';
import { hasActiveSession } from '@/lib/supabase/server';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user has an active session
  const hasSession = await hasActiveSession();

  // If authenticated, redirect to dashboard
  if (hasSession) {
    redirect('/dashboard');
  }

  // If not authenticated, show auth page
  return <>{children}</>;
}
