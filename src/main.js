import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import './assets/styles/main.css';

// Silence non-actionable theme license notices
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('PrimeUI license')) return;
  originalWarn.apply(console, args);
};

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Synchronously initialize auth
const authStore = useAuthStore(pinia);
authStore.initAuth();
if (!authStore.isLoggedIn) {
  authStore.user = {
    email: 'admin@demo.com',
    first_name: 'Quản trị viên',
    role: 'Admin',
  };
  authStore.isLoggedIn = true;
  localStorage.setItem('mvp_session', JSON.stringify(authStore.user));
}

app.use(router);

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-mode-disabled',
    },
  },
  ripple: true,
});

app.use(ConfirmationService);
app.use(ToastService);

app.mount('#app');
