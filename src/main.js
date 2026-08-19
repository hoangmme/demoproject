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

// Silence non-actionable theme license notices & overlay orientation errors
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('PrimeUI license')) return;
  originalWarn.apply(console, args);
};

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event?.message?.includes("Cannot read properties of undefined (reading 'style')") || event?.message?.includes('alignOverlay') || event?.message?.includes('matchMediaOrientationListener')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return true;
    }
  });
}

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Synchronously initialize auth
const authStore = useAuthStore(pinia);
authStore.initAuth();

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
