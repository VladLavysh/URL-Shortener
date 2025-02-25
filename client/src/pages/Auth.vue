<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useUserStore } from '../stores/user';

const router = useRouter();
const toast = useToast();
const userStore = useUserStore();

const isLogin = ref(true);
const name = ref('');
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  name.value = '';
  password.value = '';
  confirmPassword.value = '';
  showPassword.value = false;
  showConfirmPassword.value = false;
};

const signInAsGuest = async () => {
  name.value = 'Guest';
  password.value = 'guest_pass_123';
  await handleSubmit();
};

const handleSubmit = async () => {
  if (name.value === '' || password.value === '') {
    toast.warning("Name and password can't be empty");
    return;
  }

  try {
    isLoading.value = true;
    const action = isLogin.value ? 'signIn' : 'signUp';
    if (!isLogin.value && password.value !== confirmPassword.value) {
      toast.error('Passwords do not match');
      return;
    }

    const response = await userStore[action](name.value, password.value, confirmPassword.value);

    if (response) {
      router.push({ path: '/' });
      toast.success(response.message);
    }
  } catch (error: any) {
    toast.error(error.message);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4">
    <h1 class="text-4xl font-bold mb-8">URL Shortener</h1>
    <div
      class="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-lg"
      v-motion
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="{ opacity: 1, scale: 1 }"
      :transition="{ duration: 300 }"
    >
      <h1 class="text-3xl font-bold text-center mb-8">
        {{ isLogin ? 'Welcome Back' : 'Create Account' }}
      </h1>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-2">Name</label>
          <input
            v-model.trim="name"
            type="text"
            required
            :disabled="isLoading"
            class="input w-full p-2 bg-gray-900 rounded-md"
            placeholder="Alex"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Password</label>
          <div class="relative">
            <input
              v-model.trim="password"
              :type="showPassword ? 'text' : 'password'"
              required
              :disabled="isLoading"
              class="input w-full p-2 pr-10 bg-gray-900 rounded-md"
              placeholder="••••••••"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              :disabled="isLoading"
              class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              :title="showPassword ? 'Hide password' : 'Show password'"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5"
              >
                <path
                  v-if="!showPassword"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  v-if="showPassword"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="!isLogin">
          <label class="block text-sm font-medium mb-2">Confirm Password</label>
          <div class="relative">
            <input
              v-model.trim="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              :disabled="isLoading"
              class="input w-full p-2 pr-10 bg-gray-900 rounded-md"
              placeholder="••••••••"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              :disabled="isLoading"
              class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              :title="showConfirmPassword ? 'Hide password' : 'Show password'"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5"
              >
                <path
                  v-if="!showConfirmPassword"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  v-if="showConfirmPassword"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{
            isLogin
              ? isLoading
                ? 'Signing in...'
                : 'Sign In'
              : isLoading
                ? 'Creating Account...'
                : 'Create Account'
          }}
        </button>
      </form>

      <div class="flex justify-between gap-2 mt-6 text-center">
        <button
          :disabled="isLoading"
          @click="toggleMode"
          class="text-indigo-400 hover:text-indigo-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
        </button>
        <button
          :disabled="isLoading"
          @click="signInAsGuest"
          class="text-indigo-400 hover:text-indigo-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sign In as Guest
        </button>
      </div>
    </div>
  </div>
</template>
