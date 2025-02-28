import { type UrlItem } from '../stores/url';
import { nanoid } from 'nanoid';

export async function saveUrlForOffline(originalUrl: string, userId: string) {
  try {
    const db = await openDB();
    const transaction = db.transaction('offlineUrls', 'readwrite');
    const store = transaction.objectStore('offlineUrls');
    const offlineUrlId = nanoid(6);

    const urlData: UrlItem = {
      id: offlineUrlId,
      originalUrl,
      shortUrl: `${window.location.origin}/r/${offlineUrlId}`,
      clicks: 0,
      userId,
      createdAt: new Date().toISOString(),
      isOffline: true,
    };

    await store.add(urlData);
    console.log('URL saved for offline use:', urlData);

    // Try to register for background sync
    try {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await registration.sync.register('sync-new-urls');
          console.log('Background sync registered for offline URLs');
        } else {
          console.log('Background Sync API not supported by this browser');
        }
      } else {
        console.log('Service Worker or SyncManager not supported by this browser');
      }
    } catch (syncError) {
      console.error('Error registering for background sync:', syncError);
    }

    return urlData;
  } catch (error) {
    console.error('Error saving URL for offline:', error);
    throw error;
  }
}

export async function getOfflineUrls(): Promise<UrlItem[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction('offlineUrls', 'readonly');
    const store = transaction.objectStore('offlineUrls');

    return new Promise<UrlItem[]>((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as UrlItem[]);
      };

      request.onerror = () => {
        console.error('Error getting offline URLs:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting offline URLs:', error);
    return [];
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('urlShortenerOfflineDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('offlineUrls')) {
        db.createObjectStore('offlineUrls', { keyPath: 'id' });
      }
    };
  });
}
