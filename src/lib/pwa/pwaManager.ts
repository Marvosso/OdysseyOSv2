/**
 * PWA Manager
 * 
 * Utilities for managing PWA features:
 * - Service worker registration
 * - Background sync
 * - Push notifications
 * - Offline detection
 */

export class PWAManager {
  private static registration: ServiceWorkerRegistration | null = null;

  /**
   * Register service worker
   */
  static async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('[PWA] Service workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.registration = registration;
      console.log('[PWA] Service worker registered:', registration);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[PWA] New service worker available');
              this.showUpdateNotification();
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
      return null;
    }
  }

  /**
   * Unregister service worker
   */
  static async unregister(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const unregistered = await registration.unregister();
      console.log('[PWA] Service worker unregistered:', unregistered);
      return unregistered;
    } catch (error) {
      console.error('[PWA] Service worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Request background sync
   */
  static async requestBackgroundSync(tag: string): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        await (registration as any).sync.register(tag);
        console.log('[PWA] Background sync registered:', tag);
        return true;
      } else {
        console.warn('[PWA] Background sync not supported');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
      return false;
    }
  }

  /**
   * Request push notification permission
   */
  static async requestPushPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('[PWA] Push permission request failed:', error);
      return 'denied';
    }
  }

  /**
   * Show local notification
   */
  static async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      const permission = await this.requestPushPermission();
      if (permission !== 'granted') {
        return;
      }
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    });
  }

  /**
   * Schedule writing reminder notification
   */
  static async scheduleWritingReminder(hours: number): Promise<void> {
    // Store reminder in localStorage
    const reminderTime = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem('odysseyos-reminder-time', reminderTime.toString());

    // Use setTimeout for demo (in production, use proper scheduling)
    setTimeout(() => {
      this.showNotification('Time to Write!', {
        body: 'Your writing reminder: time to work on your story!',
        tag: 'writing-reminder',
        requireInteraction: false,
      });
    }, hours * 60 * 60 * 1000);
  }

  /**
   * Check if app is installed
   */
  static isInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check if running in standalone mode (installed PWA)
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  /**
   * Check if online
   */
  static isOnline(): boolean {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  }

  /**
   * Show update notification
   */
  private static showUpdateNotification(): void {
    // In a real app, show a UI notification to the user
    console.log('[PWA] New version available. Refresh to update.');
    
    // You could dispatch a custom event here to show a banner in the UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pwa-update-available'));
    }
  }

  /**
   * Update service worker
   */
  static async update(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.update();
      console.log('[PWA] Service worker updated');
    } catch (error) {
      console.error('[PWA] Service worker update failed:', error);
    }
  }
}
