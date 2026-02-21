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
  Menu,
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
import { ProjectsProvider, useProjectsContext } from '@/contexts/ProjectsContext';

function SwitchProjectModal({ onClose }: { onClose: () => void }) {
  const ctx = useProjectsContext();
  const [switching, setSwitching] = useState(false);
  if (!ctx) return null;
  const { projects, loading, activeProjectId, switchProject } = ctx;
  const handleSelect = async (id: string) => {
    if (id === activeProjectId) { onClose(); return; }
    setSwitching(true);
    const ok = await switchProject(id);
    setSwitching(false);
    if (ok) {
      onClose();
      window.dispatchEvent(new Event('storage'));
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Switch project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
        </div>
        <div className="p-2 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : projects.length === 0 ? (
            <p className="text-gray-400 text-sm">No projects yet. Create one from the Stories tab.</p>
          ) : (
            <ul className="space-y-1">
              {projects.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => handleSelect(p.id)}
                    disabled={switching}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      p.id === activeProjectId
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {p.title || 'Untitled'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSwitchProjectModal, setShowSwitchProjectModal] = useState(false);

  const { tier, loading: tierLoading } = useUserTier();
  const hasPulledOnLoadRef = useRef(false);

  useEffect(() => {
    document.title = process.env.NODE_ENV === 'development' ? 'OdysseyOS · dev' : 'OdysseyOS';
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
    <ProjectsProvider>
    <KeyboardShortcutsProvider onAction={handleShortcutAction}>
      <div className="min-h-screen bg-gray-900 flex flex-col md:flex-row">
        {/* Global Search */}
        <GlobalSearch
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-[9998] md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

      {/* Sidebar - drawer on mobile, fixed on desktop */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-[9999] w-64 flex flex-col bg-gray-800/95 border-r border-gray-700 pointer-events-auto transition-transform duration-200 ease-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white mb-3">{process.env.NODE_ENV === 'development' ? 'OdysseyOS · dev' : 'OdysseyOS'}</h1>
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
                    if (user) setShowSwitchProjectModal(true);
                    else {
                      clearEnteredProject();
                      router.push('/dashboard');
                      window.location.reload();
                    }
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
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left min-h-[44px] ${
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors min-h-[44px]"
          >
            <span className="font-medium">Sign Out</span>
          </button>
          <p className="text-center text-xs text-gray-500" title={process.env.NODE_ENV === 'development' ? 'Development build' : undefined}>
            {process.env.NODE_ENV === 'development' ? 'OdysseyOS · dev' : 'OdysseyOS'}
          </p>
        </div>
      </aside>

      {/* Main content - offset so fixed sidebar doesn't overlap */}
      <main className="relative z-0 flex-1 min-w-0 overflow-auto ml-0 md:ml-64">
        <div className="px-4 py-4 md:p-6">
          {/* Mobile: menu button */}
          <div className="flex items-center gap-2 mb-4 md:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-gray-400 truncate">
              {currentStoryTitle || 'OdysseyOS'}
            </span>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 rounded-lg border-2 border-amber-500 bg-amber-950/50 px-4 py-2 text-center text-sm font-semibold text-amber-200 max-w-prose mx-auto">
              ✓ DEV — No migration wizard when signed in. Sidebar shows your email.
            </div>
          )}
          <div className="max-w-prose md:max-w-none mx-auto md:mx-0">
            {children}
          </div>
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

      {showSwitchProjectModal && user && (
        <SwitchProjectModal onClose={() => setShowSwitchProjectModal(false)} />
      )}

      <FeedbackButton />
    </KeyboardShortcutsProvider>
    </ProjectsProvider>
  );
}
