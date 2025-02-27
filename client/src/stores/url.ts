import { ref } from 'vue';
import { defineStore } from 'pinia';
import axios from '../utils/axios';
import { useToast } from 'vue-toastification';

export interface UrlItem {
  id: string;
  originalUrl: string;
  shortUrl: string;
  clicks: number;
  userId: string;
  createdAt: string;
}

export const useUrlStore = defineStore('url', () => {
  const urls = ref<UrlItem[]>([]);
  const currentPage = ref(1);
  const hasMoreUrls = ref(false);
  const isLoading = ref(false);
  const totalUrls = ref(0);
  const toast = useToast();

  const getAllUrls = async (userId: string, page = 1, reset = false) => {
    try {
      isLoading.value = true;
      const response = await axios.get(`/url?userId=${userId}&page=${page}&limit=5`);

      if (reset || page === 1) {
        urls.value = response.data.urls;
      } else {
        urls.value = [...urls.value, ...response.data.urls];
      }

      currentPage.value = page;
      hasMoreUrls.value = response.data.pagination.hasMore;
      totalUrls.value = response.data.pagination.total;

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
      const response = await axios.post('/url', { originalUrl, userId });

      if (response.data.urls && response.data.pagination) {
        urls.value = response.data.urls;
        currentPage.value = response.data.pagination.page;
        hasMoreUrls.value = response.data.pagination.hasMore;
        totalUrls.value = response.data.pagination.total;
      } else {
        urls.value.unshift(response.data.data);
        totalUrls.value += 1;
      }

      toast.success(response.data.message || 'URL shortened successfully');
      return response.data;
    } catch (error: any) {
      console.error('Error creating short URL:', error);
      toast.error(error.response?.data?.message || 'Failed to create short URL');
      throw error;
    }
  };

  const deleteUrl = async (id: string) => {
    try {
      const userId = urls.value.length > 0 ? urls.value[0].userId : '';
      const response = await axios.delete(`/url/${id}?userId=${userId}&page=${currentPage.value}&limit=5`);

      if (response.data.urls && response.data.pagination) {
        urls.value = response.data.urls;
        currentPage.value = response.data.pagination.page;
        hasMoreUrls.value = response.data.pagination.hasMore;
        totalUrls.value = response.data.pagination.total;
      } else {
        urls.value = urls.value.filter((url) => url.id !== id);
        totalUrls.value -= 1;

        if (urls.value.length === 0 && currentPage.value > 1) {
          currentPage.value -= 1;
          getAllUrls(userId, currentPage.value);
        }
      }

      toast.success(response.data.message || 'URL deleted successfully');
      return { message: 'URL deleted successfully' };
    } catch (error) {
      console.error('Error deleting URL:', error);
      toast.error('Failed to delete URL');
      throw error;
    }
  };

  const deleteAllUrls = async (userId: string) => {
    try {
      const response = await axios.delete('/url', { data: { userId } });

      if (response.data.urls && response.data.pagination) {
        urls.value = response.data.urls;
        currentPage.value = response.data.pagination.page;
        hasMoreUrls.value = response.data.pagination.hasMore;
        totalUrls.value = response.data.pagination.total;
      } else {
        urls.value = [];
        totalUrls.value = 0;
        currentPage.value = 1;
        hasMoreUrls.value = false;
      }

      toast.success(response.data.message || 'All URLs deleted successfully');
      return { message: 'All URLs deleted successfully' };
    } catch (error) {
      console.error('Error deleting all URLs:', error);
      toast.error('Failed to delete all URLs');
      throw error;
    }
  };

  const redirectToOriginalUrl = async (shortCode: string) => {
    try {
      const response = await axios.get(`/r/${shortCode}`);
      toast.success('Redirecting to original URL');
      return response.data.originalUrl;
    } catch (error) {
      console.error('Error redirecting to original URL:', error);
      toast.error('Failed to redirect to original URL');
      throw error;
    }
  };

  return {
    urls,
    getAllUrls,
    createShortUrl,
    deleteUrl,
    deleteAllUrls,
    redirectToOriginalUrl,
    loadMoreUrls,
    hasMoreUrls,
    isLoading,
    currentPage,
    totalUrls,
  };
});
