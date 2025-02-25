<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-gray-100 overflow-hidden">
    <RouterView v-slot="{ Component }">
      <component
        :is="Component"
        v-motion
        :initial="{ opacity: 0, y: 100 }"
        :enter="{ opacity: 1, y: 0 }"
        :transition="{ duration: 500 }"
      />
    </RouterView>
  </div>
</template>
