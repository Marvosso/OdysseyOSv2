'use client';

/**
 * Dashboard Layout
 * 
 * Main application shell with sidebar navigation and feature tabs
 * Wraps all dashboard feature pages
 */

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Sparkles,
  Download,
  FileText,
  Globe,
  Target,
  Music,
  Share2,
  BarChart3,
} from 'lucide-react';

const navigationItems = [
  { id: 'stories', label: 'Stories', icon: BookOpen, path: '/dashboard' },
  { id: 'characters', label: 'Characters', icon: Users, path: '/dashboard/characters' },
  { id: 'ai', label: 'AI Tools', icon: Sparkles, path: '/dashboard/ai' },
  { id: 'outline', label: 'Outline', icon: FileText, path: '/dashboard/outline' },
  { id: 'world', label: 'World', icon: Globe, path: '/dashboard/world' },
  { id: 'beats', label: 'Beats', icon: BarChart3, path: '/dashboard/beats' },
  { id: 'export', label: 'Export', icon: Download, path: '/dashboard/export' },
  { id: 'publish', label: 'Publish', icon: Share2, path: '/dashboard/publish' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
          router.replace('/auth');
          return;
        }

        if (!session?.user) {
          router.replace('/auth');
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error('Error checking session:', err);
        router.replace('/auth');
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800/50 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">OdysseyOS</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || 
              (item.path === '/dashboard' && pathname === '/dashboard');
            
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace('/auth');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
