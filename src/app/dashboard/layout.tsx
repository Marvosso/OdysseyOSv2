'use client';

/**
 * Dashboard Layout
 * 
 * Main application shell with sidebar navigation and feature tabs
 * Wraps all dashboard feature pages
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  BookOpen,
  Users,
  Sparkles,
  Download,
  FileText,
  Globe,
  Share2,
  BarChart3,
  Upload,
  Search,
  Info,
  User,
  X,
  TrendingUp,
  Keyboard,
  CloudUpload,
  Check,
  CreditCard,
  Loader2,
} from 'lucide-react';
import GlobalSearch from '@/components/search/GlobalSearch';
import GuestManager from '@/components/session/GuestManager';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import { clearEnteredProject } from '@/components/session/StorySelector';
import KeyboardShortcutsProvider, { openCheatsheet } from '@/components/shortcuts/KeyboardShortcutsProvider';
import { StoryStorage } from '@/lib/storage/storyStorage';
import { cloudSync } from '@/lib/cloud/minimalCloudSync';
import { useUserTier } from '@/hooks/useUserTier';
import { syncService } from '@/lib/sync/syncService';

const navigationItems = [
  { id: 'welcome', label: 'Feature Tour', icon: Info, path: '/dashboard/welcome' },
  { id: 'import', label: 'Import', icon: Upload, path: '/dashboard/import' },
  { id: 'stories', label: 'Stories', icon: BookOpen, path: '/dashboard' },
  { id: 'export', label: 'Export', icon: Download, path: '/dashboard/export' },
  { id: 'characters', label: 'Characters', icon: Users, path: '/dashboard/characters' },
  { id: 'outline', label: 'Outline', icon: FileText, path: '/dashboard/outline' },
  { id: 'world', label: 'World', icon: Globe, path: '/dashboard/world' },
  { id: 'ai', label: 'AI Tools', icon: Sparkles, path: '/dashboard/ai' },
  { id: 'beats', label: 'Beats', icon: BarChart3, path: '/dashboard/beats' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/dashboard/analytics' },
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
  const [user, setUser] = useState<{ email?: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = sessionStorage.getItem('odysseyos_user_email');
    return stored ? { email: stored } : null;
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [guestId, setGuestId] = useState<string>('');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [currentStoryTitle, setCurrentStoryTitle] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const { tier, loading: tierLoading } = useUserTier();
  const hasPulledOnLoadRef = useRef(false);

  useEffect(() => {
    document.title = 'OdysseyOS · latest';
    return () => { document.title = 'OdysseyOS'; };
  }, []);

  /**
   * Initialize guest session on first visit
   */
  useEffect(() => {
    const initGuestSession = () => {
      const id = StoryStorage.getOrCreateGuestSession();
      setGuestId(id);
    };
    initGuestSession();
  }, []);

  /** Current project title for sidebar */
  useEffect(() => {
    const load = () => {
      const story = StoryStorage.loadStory();
      setCurrentStoryTitle(story?.title?.trim() || null);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  /** Auto-sync: when tab becomes visible (debounced) and every 60s when visible + signed in */
  useEffect(() => {
    if (!user) return;
    let visibilityTimer: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;

    const runSync = () => {
      if (StoryStorage.loadStory()) {
        cloudSync.syncStory().catch(() => {});
      }
    };

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      visibilityTimer = setTimeout(runSync, 1500);
    };

    document.addEventListener('visibilitychange', onVisible);
    intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && StoryStorage.loadStory()) runSync();
    }, 60_000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearTimeout(visibilityTimer);
      clearInterval(intervalId);
    };
  }, [user]);

  const handleSidebarSync = useCallback(async () => {
    if (isSyncing || !user) return;
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      const ok = await cloudSync.syncStory();
      setSyncSuccess(ok);
      if (ok) setTimeout(() => setSyncSuccess(false), 2500);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing]);

  // Speech error interceptor removed - using ResponsiveVoice instead

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
          sessionStorage.removeItem('odysseyos_user_email');
          router.replace('/auth');
          return;
        }

        setUser(session.user);
        if (session.user.email) {
          sessionStorage.setItem('odysseyos_user_email', session.user.email);
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
      if (session?.user) {
        setUser(session.user);
        if (session.user.email) {
          sessionStorage.setItem('odysseyos_user_email', session.user.email);
        }
      } else {
        sessionStorage.removeItem('odysseyos_user_email');
        router.replace('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  /**
   * Pro/Studio: once after auth is confirmed, pull stories from Supabase and replace localStorage.
   */
  useEffect(() => {
    if (loading || tierLoading || !user) return;
    if (tier !== 'pro' && tier !== 'studio') return;
    if (hasPulledOnLoadRef.current) return;
    hasPulledOnLoadRef.current = true;

    const run = async () => {
      const localStory = StoryStorage.loadStory();
      if (localStory) {
        await syncService.pullFromCloud();
      } else {
        const cloudStories = await cloudSync.getCloudStories();
        if (cloudStories.length > 0) {
          await cloudSync.loadStoryFromCloud(cloudStories[0].id);
        }
      }
    };
    run();
  }, [loading, tierLoading, user, tier]);

  /**
   * Handle keyboard shortcut for search (Cmd/Ctrl + K)
   * Also handle Escape to close modals
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }
      
      // Close modals/search on Escape
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false);
          e.preventDefault();
        }
        if (showGuestModal) {
          setShowGuestModal(false);
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, showGuestModal]);

  // Do not open migration wizard when user is logged in (dashboard only shows when authenticated)
  // So we do not listen for 'odysseyos:open-migration' here; wizard stays closed.

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

      {/* Sidebar - fixed so nothing can cover it; full-page links so nav always works */}
      <aside className="fixed left-0 top-0 bottom-0 z-[9999] w-64 flex flex-col bg-gray-800/95 border-r border-gray-700 pointer-events-auto">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white mb-3">OdysseyOS · latest</h1>
          {currentStoryTitle && (
            <div className="mb-3 p-2 bg-gray-900/50 rounded-lg border border-gray-700/50">
              <div className="text-xs text-gray-400 truncate" title={currentStoryTitle}>
                Project
              </div>
              <div className="text-sm font-medium text-white truncate" title={currentStoryTitle}>
                {currentStoryTitle}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                {user && (
                  <button
                    onClick={handleSidebarSync}
                    disabled={isSyncing}
                    title="Sync to cloud"
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                  >
                    {syncSuccess ? <Check className="w-3 h-3" /> : <CloudUpload className="w-3 h-3" />}
                    {isSyncing ? 'Syncing…' : syncSuccess ? 'Synced' : 'Sync'}
                  </button>
                )}
                <button
                  onClick={() => {
                    clearEnteredProject();
                    router.push('/dashboard');
                    window.location.reload();
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Switch project
                </button>
              </div>
            </div>
          )}
          
          {/* Signed-in user: show email, tier, and profile/session */}
          {user && (
            <div className="mb-3 p-2 bg-gray-900/50 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Signed in</span>
                <button
                  onClick={() => setShowGuestModal(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  title="Session, backup & subscription"
                >
                  <User className="w-3 h-3" />
                </button>
              </div>
              <div className="text-xs font-medium text-white truncate" title={user.email}>
                {user.email || 'Signed in'}
              </div>
              {!tierLoading && (
                <div className="text-xs text-gray-400 mt-0.5 capitalize" title="Your plan">
                  Plan: {tier}
                </div>
              )}
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
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path ||
              (item.path === '/dashboard' && pathname === '/dashboard');

            return (
              <a
                key={item.id}
                href={item.path}
                target="_self"
                rel="noopener noreferrer"
                className={`block w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace('/auth');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <span className="font-medium">Sign Out</span>
          </button>
          <p className="text-center text-xs text-gray-500" title="Latest build">
            OdysseyOS · latest
          </p>
        </div>
      </aside>

      {/* Main content - offset so fixed sidebar doesn't overlap */}
      <main className="relative z-0 flex-1 overflow-auto ml-64">
        <div className="p-6">
          {/* If you see this banner, you are on the latest deployment */}
          <div className="mb-4 rounded-lg border-2 border-amber-500 bg-amber-950/50 px-4 py-2 text-center text-sm font-semibold text-amber-200">
            ✓ LATEST BUILD — No migration wizard when signed in. Sidebar shows your email. If you don’t see this, you’re on an old deployment or cache.
          </div>
          {children}
        </div>
      </main>

      {/* Guest Session Modal - click backdrop to close */}
      {showGuestModal && guestId && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowGuestModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                Account & subscription
              </h2>
              <button
                onClick={() => setShowGuestModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Subscription: choose plan (free) or manage (pro/studio) */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  Subscription
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  {tier === 'free'
                    ? 'Choose a plan to subscribe. You can change or cancel later in the billing portal.'
                    : 'Upgrade, downgrade, or manage billing in Stripe.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {tier === 'free' ? (
                    <>
                      <button
                        onClick={async () => {
                          setPortalError(null);
                          setPortalLoading(true);
                          try {
                            const { data: { session: authSession } } = await supabase.auth.getSession();
                            if (!authSession?.access_token) {
                              setPortalError('Please sign in again.');
                              return;
                            }
                            const res = await fetch('/api/stripe/create-checkout-session', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${authSession.access_token}`,
                              },
                              body: JSON.stringify({ plan: 'pro' }),
                            });
                            const data = await res.json().catch(() => ({}));
                            if (data.url) {
                              window.location.href = data.url;
                              return;
                            }
                            setPortalError(data.error || 'Could not start checkout.');
                          } finally {
                            setPortalLoading(false);
                          }
                        }}
                        disabled={portalLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                      >
                        {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Subscribe to Pro
                      </button>
                      <button
                        onClick={async () => {
                          setPortalError(null);
                          setPortalLoading(true);
                          try {
                            const { data: { session: authSession } } = await supabase.auth.getSession();
                            if (!authSession?.access_token) {
                              setPortalError('Please sign in again.');
                              return;
                            }
                            const res = await fetch('/api/stripe/create-checkout-session', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${authSession.access_token}`,
                              },
                              body: JSON.stringify({ plan: 'studio' }),
                            });
                            const data = await res.json().catch(() => ({}));
                            if (data.url) {
                              window.location.href = data.url;
                              return;
                            }
                            setPortalError(data.error || 'Could not start checkout.');
                          } finally {
                            setPortalLoading(false);
                          }
                        }}
                        disabled={portalLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                      >
                        {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Subscribe to Studio
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={async () => {
                        setPortalError(null);
                        setPortalLoading(true);
                        try {
                          const { data: { session: authSession } } = await supabase.auth.getSession();
                          if (!authSession?.access_token) {
                            setPortalError('Please sign in again.');
                            return;
                          }
                          const res = await fetch('/api/stripe/create-portal-session', {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${authSession.access_token}` },
                          });
                          const data = await res.json().catch(() => ({}));
                          if (data.url) {
                            window.location.href = data.url;
                            return;
                          }
                          if (data.needsSubscribe) {
                            const checkRes = await fetch('/api/stripe/create-checkout-session', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${authSession.access_token}`,
                              },
                              body: JSON.stringify({ plan: 'pro' }),
                            });
                            const checkData = await checkRes.json().catch(() => ({}));
                            if (checkData.url) {
                              window.location.href = checkData.url;
                              return;
                            }
                            setPortalError(checkData.error || 'Could not start checkout.');
                            return;
                          }
                          setPortalError(data.error || 'Could not open billing. Try again.');
                        } finally {
                          setPortalLoading(false);
                        }
                      }}
                      disabled={portalLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                    >
                      {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      {portalLoading ? 'Opening…' : 'Manage subscription'}
                    </button>
                  )}
                  {portalError && (
                    <p className="text-xs text-amber-400 mt-2 w-full">{portalError}</p>
                  )}
                </div>
              </div>

              <GuestManager
                guestId={guestId}
                onGuestIdChange={(newId) => setGuestId(newId)}
                hideClaimAccount
              />
            </div>
          </div>
        </div>
      )}

      </div>

      <FeedbackButton />
    </KeyboardShortcutsProvider>
  );
}
