<template>
  <div v-if="!isLoginPage" class="app-container">
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

const route = useRoute();
const authStore = useAuthStore();
const personnelStore = usePersonnelStore();

const isLoginPage = computed(() => route.name === 'Login');

onMounted(async () => {
  authStore.initAuth();
  if (authStore.isLoggedIn) {
    await personnelStore.init();
  }
});
</script>
