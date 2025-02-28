<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useUserStore } from '../stores/user';
import { useUrlStore } from '../stores/url';
import NetworkStatus from '../components/NetworkStatus.vue';

const userStore = useUserStore();
const urlStore = useUrlStore();
const toast = useToast();
const router = useRouter();

const longUrl = ref('');

const createShortUrl = async () => {
  if (!longUrl.value.trim()) return;
  try {
    await urlStore.createShortUrl(longUrl.value, userStore.userId);
    longUrl.value = '';
  } catch (error) {
    console.error('Error creating short URL:', error);
  }
};

const copyToClipboard = (url: string) => {
  navigator.clipboard.writeText(url);
  toast.success('Copied to clipboard');
};

const deleteUrl = async (id: string) => {
  try {
    await urlStore.deleteUrl(id);
  } catch (error) {
    console.error('Error deleting URL:', error);
  }
};

const loadMoreUrls = async () => {
  await urlStore.loadMoreUrls(userStore.userId);
};

const signOut = async () => {
  const response = await userStore.signOut();

  if (response) {
    router.push({ path: '/auth' });
    toast.success(response.message);
  } else {
    toast.error('Failed to sign out');
  }
};

onMounted(() => {
  urlStore.getAllUrls(userStore.userId);
});
</script>

<template>
  <div
    class="min-h-screen p-6"
    v-motion
    :initial="{ opacity: 0, y: 100 }"
    :enter="{ opacity: 1, y: 0 }"
    :transition="{ duration: 500 }"
  >
    <!-- Header -->
    <header class="max-w-5xl mx-auto flex justify-between items-center mb-12">
      <h1 class="text-2xl font-bold">URL Shortener</h1>
      <div class="flex items-center">
        <span
          class="text-sm mr-3 px-2 py-1 rounded-md"
          :class="urlStore.isOnline ? 'bg-green-600' : 'bg-red-600'"
        >
          {{ urlStore.isOnline ? 'Online' : 'Offline' }}
        </span>
        <span class="text-lg text-gray-400 mr-5">{{ userStore.name }}</span>
        <button class="btn btn-secondary" @click="signOut">Sign Out</button>
      </div>
    </header>

    <!-- URL Creation Form -->
    <div class="max-w-5xl mx-auto bg-gray-800 rounded-xl p-6 mb-8">
      <form @submit.prevent="createShortUrl" class="flex gap-4">
        <input
          v-model="longUrl"
          type="url"
          required
          placeholder="Enter your long URL here"
          class="input flex-1 px-4 bg-gray-900 rounded-md"
        />
        <button type="submit" class="btn btn-primary whitespace-nowrap">Shorten URL</button>
      </form>
    </div>

    <!-- URLs List -->
    <div
      class="max-w-5xl mx-auto"
      v-motion
      :initial="{ opacity: 0, y: 20 }"
      :enter="{ opacity: 1, y: 0 }"
      :transition="{ duration: 300, delay: 100 }"
    >
      <h2 class="text-xl font-semibold mb-4">
        Your URLs <span class="text-sm text-gray-400">({{ urlStore.totalUrls }} total)</span>
      </h2>

      <div class="space-y-4 max-h-[70vh] overflow-auto">
        <div v-if="urlStore.isLoading" class="text-center py-10">
          <div class="spinner"></div>
          <p class="mt-4 text-gray-400">Loading URLs...</p>
        </div>

        <div v-else-if="urlStore.urls.length === 0" class="bg-gray-800 rounded-lg p-8 text-center">
          <p class="text-gray-400">You haven't created any URLs yet.</p>
          <p class="text-gray-500 mt-2">Enter a URL above to get started!</p>
        </div>

        <div
          v-for="url in urlStore.urls"
          :key="url.id"
          class="bg-gray-800 rounded-lg p-4"
          v-motion
          :initial="{ opacity: 0, y: 10 }"
          :enter="{ opacity: 1, y: 0 }"
          :transition="{ duration: 200 }"
        >
          <div class="flex justify-between items-center gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center">
                <a
                  :href="url.shortUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-400 hover:text-blue-300 truncate text-lg"
                >
                  {{ url.shortUrl }}
                </a>
                <span
                  v-if="url.isOffline"
                  class="ml-2 px-2 py-0.5 text-xs bg-yellow-700 text-yellow-200 rounded-md"
                  >Offline</span
                >
              </div>
              <div class="mb-2 flex flex-wrap gap-2 items-center text-sm text-gray-400">
                <span>{{ url.id }},</span>
                <span>{{ url.createdAt }},</span>
                <span class="inline-flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  {{ url.clicks }} clicks
                </span>
              </div>
              <h3 class="font-medium truncate text-gray-300">{{ url.originalUrl }}</h3>
              <div v-if="url.isOffline" class="mt-2 text-yellow-400 text-sm">
                Saved offline - will sync when online
              </div>
            </div>
            <div class="flex flex-col justify-between gap-2">
              <button
                @click="copyToClipboard(url.shortUrl)"
                class="p-1 text-gray-400 hover:text-white"
                title="Copy to clipboard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
              </button>
              <button
                @click="deleteUrl(url.id)"
                class="p-2 text-gray-400 hover:text-red-400"
                title="Delete URL"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div v-if="urlStore.hasMoreUrls" class="text-center mt-6">
          <button @click="loadMoreUrls" class="btn btn-secondary">
            {{ urlStore.isLoading ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Network Status Component -->
    <NetworkStatus />
  </div>
</template>
