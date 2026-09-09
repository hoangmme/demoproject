<template>
  <div v-if="!isStandalonePage" class="app-container">
    <AppSidebar />
    <main class="app-main">
      <AppHeader />
      <router-view />
    </main>
  </div>
  <div v-else>
    <router-view />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '@/components/common/AppSidebar.vue';
import AppHeader from '@/components/common/AppHeader.vue';
import { useAuthStore } from '@/stores/auth';
import { usePersonnelStore } from '@/stores/personnel';
import { getAppSettings } from '@/api/settings';

const route = useRoute();
const authStore = useAuthStore();
const personnelStore = usePersonnelStore();

const isStandalonePage = computed(() => {
  return route.name === 'Login' || route.name === 'TableHelper' || route.path === '/bang-tuy-chinh';
});

const applyTableTypography = (cfg) => {
  if (!cfg || typeof cfg !== 'object') return;
  const root = document.documentElement;
  if (cfg.fontFamily) root.style.setProperty('--table-font-family', cfg.fontFamily);
  if (cfg.bodyFontSize) root.style.setProperty('--table-body-font-size', cfg.bodyFontSize);
  if (cfg.headerFontSize) root.style.setProperty('--table-header-font-size', cfg.headerFontSize);
};

onMounted(async () => {
  authStore.initAuth();

  // Load table typography settings
  try {
    const cachedTypo = localStorage.getItem('table_typography_config');
    if (cachedTypo) {
      applyTableTypography(JSON.parse(cachedTypo));
    }
    const dbTypo = await getAppSettings('table_typography_config');
    if (dbTypo) {
      applyTableTypography(dbTypo);
      localStorage.setItem('table_typography_config', JSON.stringify(dbTypo));
    }
  } catch (e) {}

  if (authStore.isLoggedIn) {
    await personnelStore.init();
  }
});
</script>
