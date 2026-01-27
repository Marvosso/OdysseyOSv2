/**
 * Root Page - OdysseyOS Homepage
 * 
 * Redirects to authentication page
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/auth');
}
