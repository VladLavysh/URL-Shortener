// Only listen for sync events when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-new-urls') {
    event.waitUntil(syncUrls());
  }
});

// Sync offline URLs when connection is restored
async function syncUrls() {
  try {
    console.log('Service worker: Starting URL sync');
    const db = await openDB();
    const transaction = db.transaction('offlineUrls', 'readonly');
    const store = transaction.objectStore('offlineUrls');
    const offlineUrls = await store.getAll();

    // Ensure offlineUrls is an array
    if (!offlineUrls || !Array.isArray(offlineUrls) || offlineUrls.length === 0) {
      console.log('Service worker: No offline URLs to sync');
      return;
    }

    console.log(`Service worker: Found ${offlineUrls.length} offline URLs to sync`);
    let successCount = 0;
    let failCount = 0;

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
          successCount++;
        } else {
          console.error('Service worker: Failed to sync URL, server returned:', response.status);
          failCount++;
        }
      } catch (error) {
        console.error('Service worker: Failed to sync URL:', error);
        failCount++;
      }
    }

    // Notify the main thread that sync is complete
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          success: true,
          successCount,
          failCount
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
