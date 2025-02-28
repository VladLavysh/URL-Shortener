const STATIC_CACHE = 'url-shortener-static-v1';
const DYNAMIC_CACHE = 'url-shortener-dynamic-v1';
const URL_CACHE = 'url-shortener-urls-v1';

const STATIC_ASSETS = ['/', '/index.html', '/vite.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName.startsWith('url-shortener-') &&
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== URL_CACHE
            );
          })
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
});

const isApiRequest = (url) => {
  return url.pathname.startsWith('/auth') || url.pathname.startsWith('/url');
};

const isRedirectRequest = (url) => {
  return url.pathname.startsWith('/r/');
};

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.hostname === 'localhost' && (url.port === '3000' || url.port === '5173')) {
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();

          if (event.request.method === 'GET' && response.status === 200) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else if (isRedirectRequest(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-new-urls') {
    event.waitUntil(syncUrls());
  }
});

async function syncUrls() {
  try {
    console.log('Service worker: Starting URL sync');
    const db = await openDB();
    const transaction = db.transaction('offlineUrls', 'readonly');
    const store = transaction.objectStore('offlineUrls');
    const offlineUrls = await store.getAll();

    console.log(`Service worker: Found ${offlineUrls.length} offline URLs to sync`);

    for (const urlData of offlineUrls) {
      try {
        console.log('Service worker: Syncing URL:', urlData.originalUrl);
        const response = await fetch('/url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originalUrl: urlData.originalUrl,
            userId: urlData.userId,
          }),
        });

        if (response.ok) {
          console.log('Service worker: Successfully synced URL:', urlData.originalUrl);
          const deleteTransaction = db.transaction('offlineUrls', 'readwrite');
          const deleteStore = deleteTransaction.objectStore('offlineUrls');
          await deleteStore.delete(urlData.id);
          console.log('Service worker: Removed synced URL from offline storage');
        } else {
          console.error('Service worker: Failed to sync URL, server returned:', response.status);
        }
      } catch (error) {
        console.error('Service worker: Failed to sync URL:', error);
      }
    }

    // Notify the main thread that sync is complete
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          success: true,
        });
      });
    });
  } catch (error) {
    console.error('Service worker: Error syncing offline URLs:', error);

    // Notify the main thread about the error
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          success: false,
          error: error.message,
        });
      });
    });
  }
}

// IndexedDB for offline storage
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('urlShortenerOfflineDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineUrls')) {
        db.createObjectStore('offlineUrls', { keyPath: 'id' });
      }
    };
  });
}
