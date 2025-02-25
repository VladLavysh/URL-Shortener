import axios from 'axios';
import { useUserStore } from '../stores/user';

const baseURL = import.meta.env.VITE_SERVER_URL;

const axiosInstance = axios.create({
  baseURL,
  timeout: 5000,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest.url === '/auth/refresh-token') {
      return Promise.reject(error);
    }

    try {
      const response = await axios.post(`${baseURL}/auth/refresh-token`, {}, { withCredentials: true });
      const { accessToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      const userStore = useUserStore();
      userStore.updateAccessToken(accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem('accessToken');
      const userStore = useUserStore();
      await userStore.signOut();
      window.location.href = '/auth';
      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
