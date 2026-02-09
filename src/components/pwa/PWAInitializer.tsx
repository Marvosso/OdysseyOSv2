'use client';

/**
 * PWA Initializer
 *
 * - Registers the service worker
 * - Checks /api/version on load; if the deploy changed, unregisters SW, clears caches, and reloads
 *   so the user always gets the latest build instead of a cached old one
 */

import { useEffect } from 'react';
import { PWAManager } from '@/lib/pwa/pwaManager';
import PWAInstallPrompt from './PWAInstallPrompt';

const BUILD_STORAGE_KEY = 'odysseyos_build';

export default function PWAInitializer() {
  useEffect(() => {
    // Version check: if server has a new deploy, force refresh so we don't stick on an old cached build
    (async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const { build } = await res.json();
        const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(BUILD_STORAGE_KEY) : null;
        if (stored != null && stored !== build) {
          // New deploy: clear SW and caches so next load is fresh
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const reg of regs) await reg.unregister();
          }
          if ('caches' in window) {
            const names = await caches.keys();
            for (const name of names) await caches.delete(name);
          }
          sessionStorage.setItem(BUILD_STORAGE_KEY, build);
          window.location.reload();
          return;
        }
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(BUILD_STORAGE_KEY, build);
      } catch {
        // ignore
      }
    })();

    // Register service worker (will re-register after we just cleared it, or on first load)
    PWAManager.register().catch((error) => {
      console.error('[PWA] Registration failed:', error);
    });

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('[PWA] Online');
      // Trigger background sync when coming online
      PWAManager.requestBackgroundSync('sync-story-data');
    };

    const handleOffline = () => {
      console.log('[PWA] Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for PWA update events
    const handleUpdateAvailable = () => {
      console.log('[PWA] Update available');
      // You could show a UI notification here
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  return <PWAInstallPrompt />;
}
