import { ref } from 'vue';
import { defineStore } from 'pinia';
import axios from '../utils/axios';

interface AuthResponse {
  user?: {
    id: string;
    name: string;
  };
  accessToken?: string;
  message?: string;
}

export const useUserStore = defineStore('user', () => {
  const name = ref('');
  const userId = ref('');
  const accessToken = ref('');

  const storedToken = localStorage.getItem('accessToken');
  if (storedToken) {
    accessToken.value = storedToken;
  }

  async function fetchUser() {
    try {
      const { data } = await axios.get<AuthResponse>('/auth/me', {
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
      });
      updateUserData(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      clearUserData();
    }
  }

  async function signIn(name: string, password: string) {
    return auth('sign-in', { name, password });
  }

  async function signUp(name: string, password: string, confirmPassword: string) {
    return auth('sign-up', { name, password, confirmPassword });
  }

  async function signOut() {
    try {
      const { data } = await axios.post<{ message: string }>('/auth/sign-out');
      if (data) {
        clearUserData();
        return data;
      }
    } catch (error) {
      console.error('Sign out error:', error);
      return { message: 'Sign out failed' };
    }
  }

  async function auth(endpoint: string, payload: object) {
    try {
      const { data } = await axios.post<AuthResponse>(`/auth/${endpoint}`, payload);

      if (data.user) {
        updateUserData(data);
      }

      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Authentication failed';
      throw new Error(message);
    }
  }

  function updateUserData(data: AuthResponse) {
    name.value = data.user?.name || '';
    userId.value = data.user?.id || '';
    if (data.accessToken) {
      accessToken.value = data.accessToken;
      localStorage.setItem('accessToken', data.accessToken);
    }
  }

  function updateAccessToken(token: string) {
    accessToken.value = token;
  }

  function clearUserData() {
    name.value = '';
    userId.value = '';
    accessToken.value = '';
    localStorage.removeItem('accessToken');
  }

  return {
    name,
    userId,
    accessToken,
    fetchUser,
    signIn,
    signUp,
    signOut,
    updateAccessToken,
    clearUserData,
  };
});
