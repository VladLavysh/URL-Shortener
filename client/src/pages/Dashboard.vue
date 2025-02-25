<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
const toast = useToast();
const router = useRouter();

interface UrlItem {
  id: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: string;
  clicks: number;
}

const longUrl = ref('');
const urls = ref<UrlItem[]>([
  {
    id: '1',
    originalUrl: 'https://example.com/very/long/url/that/needs/to/be/shortened',
    shortUrl: 'http://short.url/abc123',
    createdAt: '2024-02-24',
    clicks: 42,
  },
]);

const createShortUrl = async () => {
  console.log('CREATE SHORT');
  toast.success('Created short URL');
  longUrl.value = '';
};

const copyToClipboard = (url: string) => {
  navigator.clipboard.writeText(url);
  toast.success('Copied to clipboard');
};

const deleteUrl = async (id: string) => {
  console.log('DELETE', id);
  toast.success('Deleted URL');
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
      <h2 class="text-xl font-semibold mb-4">Your URLs</h2>

      <div class="space-y-4">
        <div
          v-for="url in urls"
          :key="url.id"
          class="bg-gray-800 rounded-lg p-4"
          v-motion
          :initial="{ opacity: 0, x: -20 }"
          :enter="{ opacity: 1, x: 0 }"
          :transition="{ duration: 300 }"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 flex flex-col gap-1 min-w-0">
              <div class="flex items-center gap-2">
                <a
                  :href="url.originalUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm text-gray-400 truncate hover:text-gray-300"
                  >{{ url.originalUrl }}</a
                >
                <button
                  @click="copyToClipboard(url.originalUrl)"
                  class="!px-2 !py-1 ml-1 !text-xs text-gray-400 hover:text-gray-300"
                >
                  copy
                </button>
              </div>

              <div class="flex items-center gap-2">
                <a
                  :href="url.shortUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-indigo-400 font-medium truncate hover:text-indigo-300"
                  >{{ url.shortUrl }}</a
                >
                <button
                  @click="copyToClipboard(url.shortUrl)"
                  class="!px-2 !py-1 ml-1 !text-xs text-gray-400 hover:text-gray-300"
                >
                  copy
                </button>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <div>
                <div class="flex items-center justify-end gap-2">
                  <p class="text-sm text-gray-400">Clicks:</p>
                  <p>{{ url.clicks }}</p>
                </div>
                <div class="flex items-center justify-end gap-2">
                  <p class="text-sm text-gray-400">Created:</p>
                  <p>{{ url.createdAt }}</p>
                </div>
              </div>
              <button @click="deleteUrl(url.id)" class="!px-3 !py-2 !text-lg text-red-400 hover:text-red-300">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
