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
  const token = userStore.accessToken;

  if (token) {
    if (!userStore.userId) await userStore.fetchUser();
    next();
  } else {
    if (to.meta.requiresAuth) next('/auth');
    else next();
  }
});

export default router;
