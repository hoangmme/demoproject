<template>
  <header class="app-header">
    <div class="app-header-title">
      <div class="app-header-main-title">
        DỮ LIỆU QUẢN LÝ CÁN BỘ, ĐẢNG VIÊN VÀ THÂN NHÂN CÓ YẾU TỐ NƯỚC NGOÀI
      </div>
      <div class="app-header-sub-title">
        {{ currentTitle }}
      </div>
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
  if (route.name === 'DynamicTopicDashboard' || route.name === 'Trips' || route.path?.startsWith('/dashboard-topic') || route.path === '/trips') {
    return 'Chuyên đề';
  }
  const title = route.meta?.title || 'Hệ thống Quản lý Cán bộ';
  return title.replace(/Dashboard\s+Chuyên\s+đề/gi, 'Chuyên đề').replace(/Dashboard\s*Chuyên\s*đề/gi, 'Chuyên đề');
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>
