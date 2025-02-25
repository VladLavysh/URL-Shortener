import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from './stores/user';
import Auth from './pages/Auth.vue';
import Dashboard from './pages/Dashboard.vue';

const routes = [
  {
    path: '/',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/auth',
    component: Auth,
    meta: { requiresGuest: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _, next) => {
  const userStore = useUserStore();

  if (userStore.accessToken) {
    if (!userStore.userId) {
      const response = await userStore.fetchUser();
      if (!response.user) {
        next('/auth');
      }
    }
    next();
  } else {
    if (to.meta.requiresAuth) next('/auth');
    else next();
  }
});

export default router;
