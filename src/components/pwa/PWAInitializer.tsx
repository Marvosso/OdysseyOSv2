'use client';

/**
 * PWA Initializer
 * 
 * Client component to initialize PWA features
 */

import { useEffect } from 'react';
import { PWAManager } from '@/lib/pwa/pwaManager';
import PWAInstallPrompt from './PWAInstallPrompt';

export default function PWAInitializer() {
  useEffect(() => {
    // Register service worker
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
