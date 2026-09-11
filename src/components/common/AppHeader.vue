<template>
  <header class="app-header">
    <div class="app-header-title">
      <div
        class="app-header-main-title"
        :style="{
          color: headerTitleColor || '#1e3a8a',
          fontSize: headerTitleFontSize ? (headerTitleFontSize + 'px') : undefined
        }"
      >
        {{ headerTitleText || 'DỮ LIỆU QUẢN LÝ CÁN BỘ, ĐẢNG VIÊN VÀ THÂN NHÂN CÓ YẾU TỐ NƯỚC NGOÀI' }}
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getAppSettings } from '@/api/settings';
import Button from 'primevue/button';

const router = useRouter();
const authStore = useAuthStore();

const systemBranding = ref({});

const loadBranding = async () => {
  try {
    const local = localStorage.getItem('system_branding_config');
    if (local) {
      systemBranding.value = JSON.parse(local);
    }
    const saved = await getAppSettings('system_branding_config', null);
    if (saved && typeof saved === 'object') {
      systemBranding.value = saved;
      try { localStorage.setItem('system_branding_config', JSON.stringify(saved)); } catch (e) {}
    }
  } catch (e) {}
};

const onBrandingUpdated = (e) => {
  if (e && e.detail) {
    systemBranding.value = e.detail;
  } else {
    loadBranding();
  }
};

onMounted(() => {
  loadBranding();
  window.addEventListener('system-branding-updated', onBrandingUpdated);
});

onUnmounted(() => {
  window.removeEventListener('system-branding-updated', onBrandingUpdated);
});

const headerTitleText = computed(() => {
  return systemBranding.value?.headerMainTitle || 'DỮ LIỆU QUẢN LÝ CÁN BỘ, ĐẢNG VIÊN VÀ THÂN NHÂN CÓ YẾU TỐ NƯỚC NGOÀI';
});

const headerTitleColor = computed(() => {
  return systemBranding.value?.headerMainTitleColor || '#1e3a8a';
});

const headerTitleFontSize = computed(() => {
  return systemBranding.value?.headerTitleFontSize || null;
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>
