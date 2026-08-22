<template>
  <aside class="app-sidebar">
    <div class="app-sidebar-header" style="padding: 1.15rem 0.5rem; text-align: center;">
      <img
        src="/bo-cong-an-logo.png"
        alt="Bộ Công An"
        style="width: 85px; height: 85px; object-fit: contain; margin-bottom: 8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));"
      />
      <div style="font-size: 0.8rem; font-weight: 800; color: #ffffff; text-transform: uppercase; line-height: 1.3; white-space: nowrap;">
        CÔNG AN THÀNH PHỐ HỒ CHÍ MINH
      </div>
      <div style="font-size: 0.72rem; font-weight: 700; color: #fde047; margin-top: 4px; line-height: 1.3; white-space: nowrap;">
        PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ
      </div>
      <div style="font-size: 0.68rem; font-weight: 600; color: #dcfce7; margin: 8px 0 0 0; line-height: 1.35; opacity: 0.95; padding: 0 4px;">
        <div>Dữ liệu quản lý cán bộ, đảng viên</div>
        <div style="margin-top: 2px;">và thân nhân có yếu tố nước ngoài</div>
      </div>
    </div>

    <nav class="app-sidebar-nav">
      <router-link to="/dashboard" class="app-nav-item">
        <i class="pi pi-chart-pie"></i>
        <span>Dashboard Thống kê</span>
      </router-link>

      <router-link to="/personnel" class="app-nav-item">
        <i class="pi pi-users"></i>
        <span>Quản lý Cán bộ</span>
      </router-link>

      <div class="app-nav-heading">Dashboard Chuyên đề</div>

      <router-link
        v-for="dash in dynamicDashboards"
        :key="dash.id"
        :to="getDashboardRoute(dash)"
        class="app-nav-item"
        :title="dash.title"
      >
        <i :class="dash.icon ? `pi ${dash.icon}` : 'pi pi-send'"></i>
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          {{ dash.title }}
        </span>
      </router-link>

      <div class="app-nav-heading">Báo cáo Phụ lục</div>

      <router-link
        v-for="pl in dynamicAppendices"
        :key="pl.id"
        :to="getAppendixRoute(pl)"
        class="app-nav-item"
        :title="pl.title"
      >
        <i :class="getAppendixIcon(pl.source)"></i>
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          {{ getAppendixNavLabel(pl) }}
        </span>
      </router-link>

      <template v-if="authStore.isAdmin">
        <div class="app-nav-heading">Hệ thống</div>

        <router-link to="/users" class="app-nav-item">
          <i class="pi pi-user-plus"></i>
          <span>Quản lý Người dùng</span>
        </router-link>

        <router-link to="/audit" class="app-nav-item">
          <i class="pi pi-history"></i>
          <span>Nhật ký Hệ thống</span>
        </router-link>

        <router-link to="/settings-import" class="app-nav-item">
          <i class="pi pi-cog"></i>
          <span>Cấu hình Cột & Phụ lục</span>
        </router-link>
      </template>
    </nav>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getAppSettings } from '@/api/settings';

const authStore = useAuthStore();

const DEFAULT_APPENDICES = [
  { id: 'pl1', code: 'PL1', title: 'PL1: Đi nước ngoài', source: 'trips' },
  { id: 'pl2', code: 'PL2', title: 'PL2: Thân nhân NN', source: 'relatives' },
  { id: 'pl3', code: 'PL3', title: 'PL3: Lịch sử & Lưu ý', source: 'personnel' },
];

const DEFAULT_DASHBOARDS = [
  {
    id: 'trips',
    code: 'CD-03',
    title: 'Danh sách Chuyến đi',
    icon: 'pi-send',
    source: 'trips',
  },
];

const dynamicAppendices = ref([...DEFAULT_APPENDICES]);
const dynamicDashboards = ref([...DEFAULT_DASHBOARDS]);

const loadSidebarData = async () => {
  try {
    const saved = await getAppSettings('custom_appendices_config', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      dynamicAppendices.value = saved;
    } else {
      const local = localStorage.getItem('custom_appendices_config');
      if (local) dynamicAppendices.value = JSON.parse(local);
    }
  } catch (e) {
    console.error('Error loading sidebar appendices:', e);
  }

  try {
    const savedDash = await getAppSettings('custom_dashboards_config', null);
    if (savedDash && Array.isArray(savedDash) && savedDash.length > 0) {
      dynamicDashboards.value = savedDash;
    } else {
      const local = localStorage.getItem('custom_dashboards_config');
      if (local) dynamicDashboards.value = JSON.parse(local);
    }
  } catch (e) {
    console.error('Error loading sidebar dashboards:', e);
  }
};

onMounted(() => {
  loadSidebarData();
});

const getDashboardRoute = (dash) => {
  if (dash.id === 'trips') return '/trips';
  return `/dashboard-topic/${dash.id}`;
};

const getAppendixRoute = (pl) => {
  if (pl.id === 'pl1') return '/pl1';
  if (pl.id === 'pl2') return '/pl2';
  if (pl.id === 'pl3') return '/pl3';
  return `/appendix/${pl.id}`;
};

const getAppendixIcon = (source) => {
  if (source === 'trips') return 'pi pi-globe';
  if (source === 'relatives') return 'pi pi-heart';
  return 'pi pi-exclamation-triangle';
};

const getAppendixNavLabel = (pl) => {
  if (pl.code) {
    const cleanTitle = (pl.title || '').replace(/^Phụ lục \d+:\s*/i, '').replace(/^PL\d+:\s*/i, '').trim();
    return `${pl.code}: ${cleanTitle || pl.title}`;
  }
  return pl.title || 'Phụ lục';
};
</script>
