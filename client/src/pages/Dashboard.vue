<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useUserStore } from '../stores/user';
import { useUrlStore } from '../stores/url';

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
  <div class="min-h-screen p-6">
    <!-- Header -->
    <header class="max-w-5xl mx-auto flex justify-between items-center mb-12">
      <h1 class="text-2xl font-bold">URL Shortener</h1>
      <div>
        <span class="text-lg text-gray-400 mr-5">{{ userStore.name }}</span>
        <button class="btn btn-secondary" @click="signOut">Sign Out</button>
      </div>
    </header>

    <!-- URL Creation Form -->
    <div
      class="max-w-5xl mx-auto bg-gray-800 rounded-xl p-6 mb-8"
      v-motion
      :initial="{ opacity: 0, y: 20 }"
      :enter="{ opacity: 1, y: 0 }"
      :transition="{ duration: 300 }"
    >
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

      <div class="space-y-4">
        <h2 v-if="urlStore.urls.length === 0" class="text-xl font-semibold text-center text-gray-400">
          No URLs found
        </h2>
        <div
          v-for="url in urlStore.urls"
          :key="url.id"
          class="bg-gray-800 rounded-lg p-4"
          v-motion
          :initial="{ opacity: 0, x: -20 }"
          :enter="{ opacity: 1, x: 0 }"
          :transition="{ duration: 300 }"
        >
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-medium truncate">{{ url.originalUrl }}</h3>
                <span class="text-xs text-gray-400 whitespace-nowrap">{{ url.createdAt }}</span>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <a class="text-blue-400 truncate" :href="url.shortUrl" target="_blank">{{ url.shortUrl }}</a>
                <button
                  @click="copyToClipboard(url.shortUrl)"
                  class="text-gray-400 hover:text-white transition-colors !px-2 !py-1 ml-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
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
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
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
                <span>{{ url.clicks }}</span>
              </div>
              <button @click="deleteUrl(url.id)" class="text-red-400 hover:text-red-300 transition-colors">
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

        <!-- Load More Button -->
        <div v-if="urlStore.hasMoreUrls" class="flex justify-center mt-6">
          <button @click="loadMoreUrls" class="btn btn-secondary px-6" :disabled="urlStore.isLoading">
            <span v-if="urlStore.isLoading">Loading...</span>
            <span v-else>Load More</span>
          </button>
        </div>

        <!-- Loading Indicator -->
        <div v-if="urlStore.isLoading && !urlStore.urls.length" class="text-center py-8">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"
          ></div>
          <p class="mt-2 text-gray-400">Loading URLs...</p>
        </div>
      </div>
    </div>
  </div>
</template>
