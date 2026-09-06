<template>
  <aside
    class="app-sidebar"
    style="position: relative; overflow: hidden;"
    :style="{
      backgroundColor: sidebarCustomColor || '#889962',
      '--sidebar-bg': sidebarCustomColor || '#889962',
      '--sidebar-text-color': sidebarCustomTextColor || '#000000',
      '--sidebar-heading-color': sidebarCustomTextColor || '#1a2e05',
    }"
  >
    <!-- Lớp phủ ảnh nền tùy biến cover với độ trong suốt tùy chỉnh -->
    <div
      v-if="sidebarCustomBg"
      class="sidebar-bg-layer"
      :style="{
        backgroundImage: `url(${sidebarCustomBg})`,
        opacity: Number(sidebarBgOpacity) / 100
      }"
    ></div>

    <div class="app-sidebar-header" style="position: relative; z-index: 1; padding: 1.15rem 0.5rem; text-align: center;">
      <img
        src="/bo-cong-an-logo.png"
        alt="Bộ Công An"
        style="width: 85px; height: 85px; object-fit: contain; margin-bottom: 8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));"
      />
      <!-- Khối 1: Phiên hiệu đơn vị (2 dòng gắn kết chặt chẽ thành 1 khối) -->
      <div class="sidebar-header-org" style="display: flex; flex-direction: column; gap: 2px; margin: 0; padding: 0;">
        <div
          style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; line-height: 1.15; white-space: nowrap; margin: 0; padding: 0;"
          :style="{ color: sidebarOrgTextColor || sidebarCustomTextColor || '#000000' }"
        >
          CÔNG AN THÀNH PHỐ HỒ CHÍ MINH
        </div>
        <div
          style="font-size: 0.76rem; font-weight: 800; line-height: 1.15; white-space: nowrap; margin: 0; padding: 0;"
          :style="{ color: sidebarOrgTextColor || sidebarCustomTextColor || '#000000' }"
        >
          PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ
        </div>
      </div>
    </div>

    <nav class="app-sidebar-nav" style="position: relative; z-index: 1;">
      <router-link to="/dashboard" class="app-nav-item">
        <i class="pi pi-chart-pie"></i>
        <span>Thống kê</span>
      </router-link>

      <router-link to="/personnel" class="app-nav-item">
        <i class="pi pi-users"></i>
        <span>Hồ sơ cán bộ</span>
      </router-link>

      <div class="app-nav-heading" v-if="topicDashboards.length > 0">Chuyên đề</div>

      <router-link
        v-for="dash in topicDashboards"
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

      <router-link to="/advanced-search" class="app-nav-item" title="Tra cứu & Tìm kiếm nâng cao">
        <i class="pi pi-search-plus"></i>
        <span>Tìm kiếm nâng cao</span>
      </router-link>

      <!-- KHỐI NHẬP LIỆU (DANH SÁCH MENU TRỰC TIẾP TRÊN SIDEBAR) -->
      <div class="app-nav-heading">Nhập liệu</div>

      <a class="app-nav-item" href="javascript:void(0)" @click="handleInputClick('new_personnel')" title="Thêm cán bộ mới">
        <i class="pi pi-user-plus" style="color: #60a5fa;"></i>
        <span>Thêm cán bộ</span>
      </a>

      <a class="app-nav-item" href="javascript:void(0)" @click="openQuickRelativeDialog" title="Thêm thân nhân mới">
        <i class="pi pi-users" style="color: #c084fc;"></i>
        <span>Thêm thân nhân</span>
      </a>

      <a class="app-nav-item" href="javascript:void(0)" @click="openQuickTripDialog" title="Thêm chuyến đi nước ngoài">
        <i class="pi pi-send" style="color: #4ade80;"></i>
        <span>Thêm chuyến đi</span>
      </a>

      <div class="app-nav-heading" v-if="appendixDashboards.length > 0">Báo cáo phụ lục</div>

      <router-link
        v-for="pl in appendixDashboards"
        :key="pl.id"
        :to="getAppendixRoute(pl)"
        class="app-nav-item"
        :title="pl.title"
      >
        <i :class="pl.icon ? `pi ${pl.icon}` : 'pi pi-table'"></i>
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          {{ pl.title }}
        </span>
      </router-link>

      <template v-if="authStore.isAdmin">
        <div class="app-nav-heading">Hệ thống</div>

        <router-link to="/users" class="app-nav-item">
          <i class="pi pi-user-plus"></i>
          <span>Quản lý người dùng</span>
        </router-link>

        <router-link to="/audit" class="app-nav-item">
          <i class="pi pi-history"></i>
          <span>Nhật ký hệ thống</span>
        </router-link>

        <router-link to="/settings-import" class="app-nav-item">
          <i class="pi pi-cog"></i>
          <span>Cấu hình cột & phụ lục</span>
        </router-link>
      </template>
    </nav>

    <!-- Dialog 1: Chọn Cán bộ để Thêm Thân nhân mới -->
    <Dialog
      v-model:visible="isRelativeSelectOpen"
      modal
      header="Thêm Thân nhân mới"
      :style="{ width: '500px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 12px; padding: 4px 0;">
        <p style="font-size: 0.82rem; color: #475569; margin: 0;">
          Vui lòng chọn Cán bộ để thêm thân nhân mới vào hồ sơ:
        </p>

        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            Chọn Cán bộ liên quan: <span style="color: red;">*</span>
          </label>
          <select
            v-model="selectedParentCccdForRelative"
            style="width: 100%; font-size: 0.82rem; padding: 7px 10px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none;"
          >
            <option value="">-- Chọn Cán bộ từ danh sách --</option>
            <option
              v-for="p in personnelStore.personnelList"
              :key="p.id"
              :value="p.cccd || p.cccdparent || p.id"
            >
              {{ p.name }} - {{ p.positionName || p.position || 'Cán bộ' }} (CCCD: {{ p.cccd || p.cccdparent || '-' }})
            </option>
          </select>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isRelativeSelectOpen = false" />
        <Button
          label="Tiến hành Nhập thân nhân"
          icon="pi pi-arrow-right"
          severity="primary"
          size="small"
          :disabled="!selectedParentCccdForRelative"
          @click="confirmRelativeNavigate"
        />
      </template>
    </Dialog>

    <!-- Dialog 2: Chọn đối tượng để Thêm Chuyến đi Nước ngoài -->
    <Dialog
      v-model:visible="isQuickTripSelectOpen"
      modal
      header="Thêm Chuyến đi Nước ngoài"
      :style="{ width: '520px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #475569; display: block; margin-bottom: 6px;">
            1. ĐỐI TƯỢNG ĐI NƯỚC NGOÀI:
          </label>
          <div style="display: flex; gap: 18px; align-items: center; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; font-weight: 600; color: #1e293b;">
              <input type="radio" value="personnel" v-model="quickTripType" style="accent-color: #2563eb;" />
              <span>👤 Cán bộ (Cá nhân)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; font-weight: 600; color: #7c3aed;">
              <input type="radio" value="relative" v-model="quickTripType" style="accent-color: #7c3aed;" />
              <span>👥 Thân nhân của Cán bộ</span>
            </label>
          </div>
        </div>

        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
            2. CHỌN {{ quickTripType === 'personnel' ? 'CÁN BỘ' : 'THÂN NHÂN' }} LIÊN QUAN: <span style="color: red;">*</span>
          </label>
          
          <select v-if="quickTripType === 'personnel'" v-model="selectedQuickTripTargetKey" style="width: 100%; font-size: 0.82rem; padding: 7px 10px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none;">
            <option value="">-- Chọn Cán bộ từ danh sách --</option>
            <option v-for="p in personnelStore.personnelList" :key="p.id" :value="p.cccd || p.cccdparent || p.id">
              {{ p.name }} - {{ p.positionName || p.position || 'Cán bộ' }} (CCCD: {{ p.cccd || p.cccdparent || '-' }})
            </option>
          </select>

          <select v-else v-model="selectedQuickTripTargetKey" style="width: 100%; font-size: 0.82rem; padding: 7px 10px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none;">
            <option value="">-- Chọn Thân nhân từ danh sách --</option>
            <option v-for="r in personnelStore.relativesList" :key="r.id || r.code" :value="r.code || r.id">
              {{ r.relativeName || r.name }} ({{ r.relationshipName }} của {{ r.parentName || r.parentPersonnelName }}) - CCCD: {{ r.cccd || r.cccdthannhan || '-' }}
            </option>
          </select>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isQuickTripSelectOpen = false" />
        <Button
          label="Tiến hành Nhập chuyến đi"
          icon="pi pi-arrow-right"
          severity="primary"
          size="small"
          :disabled="!selectedQuickTripTargetKey"
          @click="confirmQuickTripNavigate"
        />
      </template>
    </Dialog>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { useAuthStore } from '@/stores/auth';
import { usePersonnelStore } from '@/stores/personnel';
import { getAppSettings } from '@/api/settings';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const personnelStore = usePersonnelStore();

const isInputMenuOpen = ref(false);
const isRelativeSelectOpen = ref(false);
const selectedParentCccdForRelative = ref('');

const isQuickTripSelectOpen = ref(false);
const quickTripType = ref('personnel');
const selectedQuickTripTargetKey = ref('');

const DEFAULT_DASHBOARDS = [
  {
    id: 'trips',
    code: 'CD-03',
    title: 'Danh sách Chuyến đi',
    icon: 'pi-send',
    source: 'trips',
  },
];

const getInitialDashboards = () => {
  try {
    const local = localStorage.getItem('custom_dashboards_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...DEFAULT_DASHBOARDS];
};

const dynamicDashboards = ref(getInitialDashboards());

const topicDashboards = computed(() => {
  return (dynamicDashboards.value || []).filter((d) => d.displayMode !== 'appendix');
});

const appendixDashboards = computed(() => {
  return (dynamicDashboards.value || []).filter((d) => d.displayMode === 'appendix');
});

const loadSidebarData = async () => {
  try {
    const savedDash = await getAppSettings('custom_dashboards_config', null);
    if (savedDash && Array.isArray(savedDash) && savedDash.length > 0) {
      dynamicDashboards.value = savedDash;
      try {
        localStorage.setItem('custom_dashboards_config', JSON.stringify(savedDash));
      } catch (e) {}
    }
  } catch (e) {
    console.error('Error loading sidebar dashboards:', e);
  }
};

const getDashboardRoute = (dash) => {
  if (dash.id === 'trips') return '/trips';
  return `/dashboard-topic/${dash.id}`;
};

const getAppendixRoute = (pl) => {
  return `/dashboard-topic/${pl.id}`;
};

const handleInputClick = (action) => {
  isInputMenuOpen.value = false;
  router.push({ path: '/personnel', query: { action } });
};

const openQuickRelativeDialog = () => {
  isInputMenuOpen.value = false;
  selectedParentCccdForRelative.value = personnelStore.personnelList.length > 0 ? (personnelStore.personnelList[0].cccd || personnelStore.personnelList[0].id) : '';
  isRelativeSelectOpen.value = true;
};

const confirmRelativeNavigate = () => {
  if (!selectedParentCccdForRelative.value) return;
  isRelativeSelectOpen.value = false;
  router.push({
    path: '/personnel',
    query: {
      action: 'new_relative',
      targetCccd: selectedParentCccdForRelative.value,
    },
  });
};

const openQuickTripDialog = () => {
  isInputMenuOpen.value = false;
  quickTripType.value = 'personnel';
  selectedQuickTripTargetKey.value = personnelStore.personnelList.length > 0 ? (personnelStore.personnelList[0].cccd || personnelStore.personnelList[0].id) : '';
  isQuickTripSelectOpen.value = true;
};

const confirmQuickTripNavigate = () => {
  if (!selectedQuickTripTargetKey.value) return;
  isQuickTripSelectOpen.value = false;

  if (quickTripType.value === 'personnel') {
    router.push({
      path: '/personnel',
      query: { action: 'new_trip', targetCccd: selectedQuickTripTargetKey.value },
    });
  } else {
    const foundRel = personnelStore.relativesList.find((r) => r.code === selectedQuickTripTargetKey.value || r.id === selectedQuickTripTargetKey.value);
    const parentCccd = foundRel?.parentPersonnelCccd || foundRel?.cccdparent || (foundRel?.parentPersonnelId ? personnelStore.personnelList.find(p => p.id === foundRel.parentPersonnelId)?.cccd : '') || '';
    router.push({
      path: '/personnel',
      query: {
        action: 'new_trip',
        targetCccd: parentCccd || selectedQuickTripTargetKey.value,
        targetRelativeCode: foundRel?.code || selectedQuickTripTargetKey.value,
      },
    });
  }
};

const sidebarCustomBg = ref(localStorage.getItem('sidebar_custom_bg') || '');
const sidebarBgOpacity = ref(Number(localStorage.getItem('sidebar_bg_opacity')) || 40);
const sidebarCustomColor = ref(localStorage.getItem('sidebar_custom_color') || '#889962');
const sidebarCustomTextColor = ref(localStorage.getItem('sidebar_custom_text_color') || '');
const sidebarOrgTextColor = ref(localStorage.getItem('sidebar_org_text_color') || '');
const sidebarSubtitleTextColor = ref(localStorage.getItem('sidebar_subtitle_text_color') || '');

const loadSidebarBg = async () => {
  try {
    const [bgRes, opRes, colRes, txtColRes, orgTxtColRes, subTxtColRes] = await Promise.allSettled([
      getAppSettings('sidebar_custom_bg', null),
      getAppSettings('sidebar_bg_opacity', null),
      getAppSettings('sidebar_custom_color', null),
      getAppSettings('sidebar_custom_text_color', null),
      getAppSettings('sidebar_org_text_color', null),
      getAppSettings('sidebar_subtitle_text_color', null),
    ]);

    if (bgRes.status === 'fulfilled') {
      const bg = bgRes.value;
      const val = bg ? (typeof bg === 'string' ? bg : (bg.value || '')) : '';
      sidebarCustomBg.value = val;
      try { localStorage.setItem('sidebar_custom_bg', val); } catch (e) {}
    }
    if (opRes.status === 'fulfilled' && opRes.value !== null && opRes.value !== undefined && opRes.value !== '') {
      sidebarBgOpacity.value = Number(opRes.value);
      try { localStorage.setItem('sidebar_bg_opacity', String(opRes.value)); } catch (e) {}
    }
    if (colRes.status === 'fulfilled' && colRes.value) {
      const col = typeof colRes.value === 'string' ? colRes.value : (colRes.value.value || '#889962');
      sidebarCustomColor.value = col;
      try { localStorage.setItem('sidebar_custom_color', col); } catch (e) {}
    }
    if (txtColRes.status === 'fulfilled' && txtColRes.value) {
      const txtCol = typeof txtColRes.value === 'string' ? txtColRes.value : (txtColRes.value.value || '');
      sidebarCustomTextColor.value = txtCol;
      try { localStorage.setItem('sidebar_custom_text_color', txtCol); } catch (e) {}
    }
    if (orgTxtColRes.status === 'fulfilled' && orgTxtColRes.value) {
      const orgCol = typeof orgTxtColRes.value === 'string' ? orgTxtColRes.value : (orgTxtColRes.value.value || '');
      sidebarOrgTextColor.value = orgCol;
      try { localStorage.setItem('sidebar_org_text_color', orgCol); } catch (e) {}
    }
    if (subTxtColRes.status === 'fulfilled' && subTxtColRes.value) {
      const subCol = typeof subTxtColRes.value === 'string' ? subTxtColRes.value : (subTxtColRes.value.value || '');
      sidebarSubtitleTextColor.value = subCol;
      try { localStorage.setItem('sidebar_subtitle_text_color', subCol); } catch (e) {}
    }
  } catch (e) {
    console.warn('Error loading sidebar background settings:', e);
  }
};

onMounted(() => {
  loadSidebarBg();
  loadSidebarData();
  window.addEventListener('sidebar-bg-updated', loadSidebarBg);
  window.addEventListener('custom-dashboards-updated', loadSidebarData);
});

onUnmounted(() => {
  window.removeEventListener('sidebar-bg-updated', loadSidebarBg);
  window.removeEventListener('custom-dashboards-updated', loadSidebarData);
});
</script>

<style scoped>
.sidebar-bg-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 0;
  transition: opacity 0.25s ease;
}

.sidebar-input-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: rgba(34, 197, 94, 0.18);
  border: 1px solid rgba(74, 222, 128, 0.35);
  border-radius: 8px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar-input-btn:hover {
  background: rgba(34, 197, 94, 0.3);
  border-color: rgba(74, 222, 128, 0.6);
}

.sidebar-flyout-menu {
  position: absolute;
  top: 0;
  left: calc(100% + 8px);
  width: 250px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
  border: 1px solid #e2e8f0;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1050;
}

.flyout-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.flyout-item:hover {
  background: #f1f5f9;
}
</style>
