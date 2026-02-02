/**
 * Service Worker for OdysseyOS
 * 
 * Handles:
 * - Offline functionality
 * - Background sync for story data
 * - Push notifications for writing reminders
 * - Cache management
 */

const CACHE_NAME = 'odysseyos-v1';
const OFFLINE_CACHE = 'odysseyos-offline-v1';
const SYNC_QUEUE = 'odysseyos-sync-queue';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Don't cache root page - it redirects
      return cache.addAll([
        '/offline',
        '/manifest.json',
      ]);
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== OFFLINE_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip root page - it redirects and shouldn't be cached
  const url = new URL(event.request.url);
  if (url.pathname === '/' || url.pathname === '') {
    // Let the browser handle the redirect naturally
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Try network with redirect following
      return fetch(event.request, {
        redirect: 'follow',
      })
        .then((response) => {
          // Don't cache redirects or non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic' || response.redirected) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // If navigation request, return offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline');
          }
          
          // Otherwise return a basic response
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
    })
  );
});

// Background Sync - sync story data when online
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-story-data') {
    event.waitUntil(syncStoryData());
  } else if (event.tag === 'sync-characters') {
    event.waitUntil(syncCharacters());
  } else if (event.tag === 'sync-scenes') {
    event.waitUntil(syncScenes());
  }
});

// Sync story data from localStorage to server (when available)
async function syncStoryData() {
  try {
    // Get pending sync items from IndexedDB
    const db = await openDB();
    const items = await getAllFromStore(db, SYNC_QUEUE);

    for (const item of items) {
      try {
        // In a real app, this would sync to a backend API
        // For now, we'll just mark as synced
        console.log('[Service Worker] Syncing:', item.type, item.id);
        
        // Simulate API call
        // await fetch('/api/sync', {
        //   method: 'POST',
        //   body: JSON.stringify(item.data),
        // });

        // Remove from queue after successful sync
        await deleteFromStore(db, SYNC_QUEUE, item.id);
      } catch (error) {
        console.error('[Service Worker] Sync error:', error);
        // Keep item in queue for retry
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

async function syncCharacters() {
  // Similar to syncStoryData but for characters
  return syncStoryData();
}

async function syncScenes() {
  // Similar to syncStoryData but for scenes
  return syncStoryData();
}

// Push notifications for writing reminders
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'Time to write!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'writing-reminder',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open OdysseyOS',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('OdysseyOS Writing Reminder', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// IndexedDB helpers for sync queue
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('odysseyos-sync', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SYNC_QUEUE)) {
        db.createObjectStore(SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
