<template>
  <header class="app-header">
    <div class="app-header-title">
      {{ currentTitle }}
    </div>

    <div class="app-header-actions">
      <div v-if="authStore.isLoggedIn" style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; border-right: 1px solid var(--border-color); padding-right: 12px;">
        <span style="color: var(--text-secondary);">Xin chào,</span>
        <strong style="color: var(--text-primary);">{{ authStore.userDisplayName }}</strong>
        <Button
          label="Đăng xuất"
          severity="danger"
          text
          size="small"
          @click="handleLogout"
          style="padding: 2px 6px; font-size: 0.8rem;"
        />
      </div>

      <!-- Slot for view-specific actions -->
      <slot name="actions"></slot>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const currentTitle = computed(() => {
  return route.meta?.title || 'Hệ thống Quản lý Cán bộ';
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>
