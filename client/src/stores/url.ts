import { ref } from 'vue';
import { defineStore } from 'pinia';
import axios from '../utils/axios';
import { useToast } from 'vue-toastification';
import { saveUrlForOffline, getOfflineUrls } from '../utils/offlineStorage';

export interface UrlItem {
  id: number | string; // Can be number from server or string for offline URLs
  originalUrl: string;
  shortUrl: string;
  clicks: number;
  userId: string;
  createdAt: string;
  isOffline?: boolean;
}

export const useUrlStore = defineStore('url', () => {
  const urls = ref<UrlItem[]>([]);
  const offlineUrls = ref<UrlItem[]>([]);
  const currentPage = ref(1);
  const hasMoreUrls = ref(false);
  const isLoading = ref(false);
  const totalUrls = ref(0);
  const isOnline = ref(navigator.onLine);
  const toast = useToast();

  window.addEventListener('online', async () => {
    isOnline.value = true;
    toast.success('You are back online!');

    try {
      await syncOfflineUrls();

      if (urls.value.length > 0 && urls.value[0].userId) {
        await getAllUrls(urls.value[0].userId, 1, true);
        toast.info('URL list refreshed');
      }
    } catch (error) {
      console.error('Error handling online event:', error);
    }
  });

  window.addEventListener('offline', () => {
    isOnline.value = false;
    toast.warning('You are offline. Some features may be limited.');
  });

  // Listen for service worker messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        if (event.data.success) {
          toast.success('Successfully synced offline URLs');

          // Refresh the URL list if we have a user ID
          if (urls.value.length > 0 && urls.value[0].userId) {
            getAllUrls(urls.value[0].userId, 1, true);
          }
        } else {
          toast.error('Failed to sync some offline URLs');
          console.error('Sync error:', event.data.error);
        }
      }
    });
  }

  const getAllUrls = async (userId: string, page = 1, reset = false) => {
    try {
      isLoading.value = true;

      if (!isOnline.value) {
        offlineUrls.value = await getOfflineUrls();

        return;
      }

      const response = await axios.get(`/url?userId=${userId}&page=${page}&limit=5`);

      if (reset || page === 1) {
        urls.value = response.data.urls || [];
      } else {
        urls.value = [...urls.value, ...(response.data.urls || [])];
      }

      currentPage.value = page;
      hasMoreUrls.value = response.data.pagination?.hasMore || false;
      totalUrls.value = response.data.pagination?.total || 0;

      return response.data;
    } catch (error) {
      console.error('Error fetching URLs:', error);
      toast.error('Failed to load URLs');
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const loadMoreUrls = async (userId: string) => {
    if (hasMoreUrls.value && !isLoading.value) {
      try {
        return await getAllUrls(userId, currentPage.value + 1);
      } catch (error) {
        toast.error('Failed to load more URLs');
        throw error;
      }
    }
  };

  const createShortUrl = async (originalUrl: string, userId: string) => {
    try {
      isLoading.value = true;

      if (!isOnline.value) {
        const offlineUrl = await saveUrlForOffline(originalUrl, userId);

        urls.value.unshift(offlineUrl);
        totalUrls.value += 1;

        toast.info('URL saved offline. It will be synced when you reconnect.');
        return { data: offlineUrl, message: 'URL saved offline' };
      }

      const response = await axios.post('/url', { originalUrl, userId });

      if (response.data.urls && response.data.pagination) {
        urls.value = response.data.urls;
        currentPage.value = response.data.pagination.page;
        hasMoreUrls.value = response.data.pagination?.hasMore || false;
        totalUrls.value = response.data.pagination?.total || 0;
      }

      toast.success(response.data.message || 'URL shortened successfully');
      return response.data;
    } catch (error: any) {
      console.error('Error creating short URL:', error);
      toast.error(error.response?.data?.message || 'Failed to create short URL');
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteUrl = async (id: string | number) => {
    try {
      isLoading.value = true;

      if (!isOnline.value) {
        const isOfflineUrl = urls.value.find((url) => url.id === id && url.isOffline);
        if (isOfflineUrl) {
          urls.value = urls.value.filter((url) => url.id !== id);
          totalUrls.value -= 1;
          return { message: 'URL deleted offline' };
        } else {
          toast.error('Cannot delete URLs while offline');
          throw new Error('Cannot delete URLs while offline');
        }
      }

      const userId = urls.value.length > 0 ? urls.value[0].userId : '';
      const response = await axios.delete(`/url/${id}?userId=${userId}&page=${currentPage.value}&limit=5`);

      if (response.data.urls && response.data.pagination) {
        urls.value = response.data.urls;
        currentPage.value = response.data.pagination.page;
        hasMoreUrls.value = response.data.pagination?.hasMore || false;
        totalUrls.value = response.data.pagination?.total || 0;
      }

      toast.success(response.data.message || 'URL deleted successfully');
      return response.data;
    } catch (error: any) {
      console.error('Error deleting URL:', error);
      toast.error(error.response?.data?.message || 'Failed to delete URL');
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteAllUrls = async (userId: string) => {
    try {
      isLoading.value = true;

      if (!isOnline.value) {
        toast.error('Cannot delete all URLs while offline');
        throw new Error('Cannot delete all URLs while offline');
      }

      const response = await axios.delete(`/url/all?userId=${userId}`);

      urls.value = [];
      currentPage.value = 1;
      hasMoreUrls.value = false;
      totalUrls.value = 0;

      toast.success(response.data.message || 'All URLs deleted successfully');
      return response.data;
    } catch (error: any) {
      console.error('Error deleting all URLs:', error);
      toast.error(error.response?.data?.message || 'Failed to delete all URLs');
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const syncOfflineUrls = async () => {
    if (!isOnline.value) return;

    const offlineData = await getOfflineUrls();
    if (offlineData.length === 0) return;

    toast.info(`Syncing ${offlineData.length} offline URLs...`);

    try {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-new-urls');
      } else {
        await manualSyncOfflineUrls(offlineData);
      }
    } catch (error) {
      console.error('Error during sync:', error);
      toast.error('Failed to sync some offline URLs');
    }
  };

  const manualSyncOfflineUrls = async (offlineUrls: UrlItem[]) => {
    let syncedCount = 0;
    const failedUrls: string[] = [];

    for (const url of offlineUrls) {
      try {
        const response = await axios.post('/url', {
          originalUrl: url.originalUrl,
          userId: url.userId,
        });

        if (response.status === 200 || response.status === 201) {
          const db = await openIndexedDB();
          const transaction = db.transaction('offlineUrls', 'readwrite');
          const store = transaction.objectStore('offlineUrls');
          await store.delete(url.id);
          syncedCount++;
        } else {
          failedUrls.push(url.originalUrl);
        }
      } catch (error) {
        console.error('Failed to sync URL:', url.originalUrl, error);
        failedUrls.push(url.originalUrl);
      }
    }

    if (syncedCount > 0) {
      toast.success(`Successfully synced ${syncedCount} URLs`);
    }

    if (failedUrls.length > 0) {
      toast.error(`Failed to sync ${failedUrls.length} URLs`);
    }
  };

  const openIndexedDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
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
  };

  return {
    urls,
    offlineUrls,
    isOnline,
    getAllUrls,
    createShortUrl,
    loadMoreUrls,
    deleteUrl,
    deleteAllUrls,
    syncOfflineUrls,
    isLoading,
    currentPage,
    hasMoreUrls,
    totalUrls,
  };
});
