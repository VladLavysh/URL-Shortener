import { createApp } from 'vue';
import { MotionPlugin } from '@vueuse/motion';
import { createPinia } from 'pinia';
import Toast, { type PluginOptions } from 'vue-toastification';
import './style.css';
import 'vue-toastification/dist/index.css';
import App from './App.vue';
import router from './router';

const pinia = createPinia();
const app = createApp(App);

const options: PluginOptions = {
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: true,
  closeButton: 'button',
  icon: true,
  rtl: false,
};

app.use(router);
app.use(pinia);
app.use(MotionPlugin);
app.use(Toast, options);
app.mount('#app');
