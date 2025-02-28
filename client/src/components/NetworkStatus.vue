<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const isOnline = ref(navigator.onLine);
const showStatus = ref(false);

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine;
  showStatus.value = true;

  // Hide the status after 3 seconds
  setTimeout(() => {
    showStatus.value = false;
  }, 3000);
};

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});
</script>

<template>
  <div
    v-if="showStatus"
    class="fixed bottom-4 right-4 px-4 py-2 rounded-md transition-all duration-300"
    :class="isOnline ? 'bg-green-600' : 'bg-red-600'"
  >
    <span v-if="isOnline">You are online</span>
    <span v-else>You are offline</span>
  </div>
</template>
