'use client';

/**
 * Dashboard Layout
 * 
 * Main application shell with sidebar navigation and feature tabs
 * Wraps all dashboard feature pages
 */

import { useState, useEffect, useCallback } from 'react';
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
  Upload,
  Search,
  Info,
  User,
  X,
  TrendingUp,
  Keyboard,
} from 'lucide-react';
import GlobalSearch from '@/components/search/GlobalSearch';
import GuestManager from '@/components/session/GuestManager';
import MigrationWizard from '@/components/session/MigrationWizard';
import KeyboardShortcutsProvider, { openCheatsheet } from '@/components/shortcuts/KeyboardShortcutsProvider';
import { AccountStorage } from '@/lib/storage/accountStorage';
import { StoryStorage } from '@/lib/storage/storyStorage';

const navigationItems = [
  { id: 'welcome', label: 'Feature Tour', icon: Info, path: '/dashboard/welcome' },
  { id: 'import', label: 'Import', icon: Upload, path: '/dashboard/import' },
  { id: 'stories', label: 'Stories', icon: BookOpen, path: '/dashboard' },
  { id: 'characters', label: 'Characters', icon: Users, path: '/dashboard/characters' },
  { id: 'outline', label: 'Outline', icon: FileText, path: '/dashboard/outline' },
  { id: 'world', label: 'World', icon: Globe, path: '/dashboard/world' },
  { id: 'ai', label: 'AI Tools', icon: Sparkles, path: '/dashboard/ai' },
  { id: 'beats', label: 'Beats', icon: BarChart3, path: '/dashboard/beats' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/dashboard/analytics' },
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [guestId, setGuestId] = useState<string>('');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showMigrationWizard, setShowMigrationWizard] = useState(false);

  /**
   * Initialize guest session on first visit
   */
  useEffect(() => {
    const initGuestSession = () => {
      const id = StoryStorage.getOrCreateGuestSession();
      setGuestId(id);
      
      // Check if user has account, if not, show migration wizard
      if (!AccountStorage.hasAccount()) {
        // Show migration wizard after a delay to let the page load
        setTimeout(() => {
          setShowMigrationWizard(true);
        }, 2000);
      }
    };

    initGuestSession();
  }, []);

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

  /**
   * Handle keyboard shortcut for search (Cmd/Ctrl + K)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      
      // Close search on Escape
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  /**
   * Listen for migration wizard open event
   */
  useEffect(() => {
    const handleOpenMigration = () => {
      setShowMigrationWizard(true);
    };

    window.addEventListener('odysseyos:open-migration', handleOpenMigration);
    return () => {
      window.removeEventListener('odysseyos:open-migration', handleOpenMigration);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const handleShortcutAction = (action: string, event: KeyboardEvent) => {
    // Handle shortcut actions
    switch (action) {
      case 'new-scene':
        // Trigger new scene creation
        break;
      case 'delete-scene':
        // Trigger scene deletion
        break;
      case 'next-scene':
        // Navigate to next scene
        break;
      case 'prev-scene':
        // Navigate to previous scene
        break;
      case 'save':
        // Trigger save
        break;
      case 'export':
        router.push('/dashboard/export');
        break;
      case 'search':
        setIsSearchOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <KeyboardShortcutsProvider onAction={handleShortcutAction}>
      <div className="min-h-screen bg-gray-900 flex">
        {/* Global Search */}
        <GlobalSearch
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />

      {/* Sidebar */}
      <aside className="w-64 bg-gray-800/50 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white mb-3">OdysseyOS</h1>
          
          {/* Guest Session ID Display */}
          {guestId && (
            <div className="mb-3 p-2 bg-gray-900/50 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Guest Session</span>
                <button
                  onClick={() => setShowGuestModal(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  title="Manage session"
                >
                  <User className="w-3 h-3" />
                </button>
              </div>
              <div className="font-mono text-xs font-bold text-purple-400 tracking-wider">
                {guestId}
              </div>
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors text-sm mb-2"
            title="Search (Cmd/Ctrl + K)"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400">
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}K
            </kbd>
          </button>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={() => openCheatsheet?.()}
            className="w-full flex items-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors text-sm"
            title="Keyboard Shortcuts (Ctrl+Shift+?)"
          >
            <Keyboard className="w-4 h-4" />
            <span className="flex-1 text-left">Shortcuts</span>
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400">
              ?
            </kbd>
          </button>
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
                onClick={() => {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/layout.tsx:269',message:'nav link clicked',data:{itemId:item.id,itemPath:item.path,currentPath:pathname,willNavigate:item.path !== pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{console.log('[DEBUG] nav link clicked:', item.id, item.path, 'current:', pathname);});
                  // #endregion
                }}
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

      {/* Guest Session Modal */}
      {showGuestModal && guestId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                Guest Session Management
              </h2>
              <button
                onClick={() => setShowGuestModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <GuestManager
                guestId={guestId}
                onGuestIdChange={(newId) => {
                  setGuestId(newId);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Migration Wizard */}
      {showMigrationWizard && (
        <MigrationWizard
          onComplete={() => {
            setShowMigrationWizard(false);
            // Reload to refresh account state
            window.location.reload();
          }}
          onCancel={() => {
            setShowMigrationWizard(false);
          }}
        />
      )}
      </div>
    </KeyboardShortcutsProvider>
  );
}
