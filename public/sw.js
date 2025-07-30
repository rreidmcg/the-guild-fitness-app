const CACHE_NAME = 'guild-fitness-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// API endpoints that can work offline with cached data
const CACHEABLE_APIS = [
  '/api/user/stats',
  '/api/achievements', 
  '/api/exercises',
  '/api/workout-sessions',
  '/api/inventory'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    // For cacheable APIs, use cache-first strategy
    if (CACHEABLE_APIs.some(api => url.pathname.startsWith(api))) {
      event.respondWith(
        caches.match(event.request)
          .then((response) => {
            if (response) {
              // Serve from cache and update in background
              fetch(event.request)
                .then((freshResponse) => {
                  if (freshResponse.ok) {
                    caches.open(CACHE_NAME)
                      .then((cache) => {
                        cache.put(event.request, freshResponse.clone());
                      });
                  }
                })
                .catch(() => {
                  // Network failed, cached version is still good
                });
              return response;
            }
            
            // Not in cache, fetch from network
            return fetch(event.request)
              .then((response) => {
                if (response.ok) {
                  const responseClone = response.clone();
                  caches.open(CACHE_NAME)
                    .then((cache) => {
                      cache.put(event.request, responseClone);
                    });
                }
                return response;
              });
          })
      );
    } else {
      // For other APIs, use network-first
      event.respondWith(
        fetch(event.request)
          .catch(() => {
            return caches.match(event.request);
          })
      );
    }
    return;
  }

  // Handle static assets - cache first
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            // Cache valid responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return response;
          });
      })
  );
});

// Background sync for offline workout sessions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workout') {
    console.log('Background sync: workout session');
    event.waitUntil(syncWorkoutSessions());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: event.data?.text() || 'Time for your daily workout!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open-app',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Dumbbells & Dragons', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open-app' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' })
        .then((clients) => {
          // Check if app is already open
          for (const client of clients) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window if not already open
          if (self.clients.openWindow) {
            return self.clients.openWindow('/');
          }
        })
    );
  }
});

// Sync offline workout sessions when back online
async function syncWorkoutSessions() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const offlineWorkouts = await cache.match('/offline-workouts');
    
    if (offlineWorkouts) {
      const workouts = await offlineWorkouts.json();
      
      for (const workout of workouts) {
        try {
          await fetch('/api/workout-sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(workout)
          });
        } catch (error) {
          console.error('Failed to sync workout:', error);
        }
      }
      
      // Clear synced workouts
      await cache.delete('/offline-workouts');
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}