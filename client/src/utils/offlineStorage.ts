import { type UrlItem } from '../stores/url';
import { nanoid } from 'nanoid';

export async function saveUrlForOffline(originalUrl: string, userId: string) {
  try {
    const db = await openDB();
    const transaction = db.transaction('offlineUrls', 'readwrite');
    const store = transaction.objectStore('offlineUrls');
    const offlineUrlId = nanoid(6); // Generate a string ID for offline URLs

    const urlData: UrlItem = {
      id: offlineUrlId, // Keep as string for offline URLs
      originalUrl,
      shortUrl: `${window.location.origin}/r/${offlineUrlId}`,
      clicks: 0,
      userId,
      createdAt: new Date().toISOString(),
      isOffline: true,
    };

    await store.add(urlData);

    // Try to register for background sync
    try {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await registration.sync.register('sync-new-urls');
        }
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
        resolve(Array.isArray(request.result) ? request.result : []);
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
