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
        :src="systemBranding.logoUrl || '/bo-cong-an-logo.png'"
        alt="Logo"
        style="width: 85px; height: 85px; object-fit: contain; margin-bottom: 8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));"
      />
      <!-- Khối 1: Phiên hiệu đơn vị (2 dòng gắn kết chặt chẽ thành 1 khối) -->
      <div class="sidebar-header-org" style="display: flex; flex-direction: column; gap: 2px; margin: 0; padding: 0;">
        <div
          style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; line-height: 1.15; white-space: nowrap; margin: 0; padding: 0;"
          :style="{ color: sidebarOrgTextColor || sidebarCustomTextColor || '#000000' }"
        >
          {{ systemBranding.orgNameLine1 || 'CÔNG AN THÀNH PHỐ HỒ CHÍ MINH' }}
        </div>
        <div
          style="font-size: 0.76rem; font-weight: 800; line-height: 1.15; white-space: nowrap; margin: 0; padding: 0;"
          :style="{ color: sidebarOrgTextColor || sidebarCustomTextColor || '#000000' }"
        >
          {{ systemBranding.orgNameLine2 || 'PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ' }}
        </div>
      </div>
    </div>

    <nav class="app-sidebar-nav" style="position: relative; z-index: 1;">
      <router-link to="/dashboard" class="app-nav-item">
        <i class="pi pi-chart-pie"></i>
        <span>Thống kê</span>
      </router-link>

      <div class="app-nav-heading" style="display: flex; justify-content: space-between; align-items: center; padding-right: 12px;">
        <span>{{ systemBranding.sectionLabelTopics || 'Bảng dữ liệu (Tables)' }}</span>
        <button
          type="button"
          @click.stop="openAddTableDialog"
          title="Thêm Bảng / Chuyên đề Mới"
          style="background: transparent; border: none; color: inherit; cursor: pointer; padding: 2px 6px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; opacity: 0.85;"
        >
          <i class="pi pi-plus" style="font-weight: 800;"></i>
        </button>
      </div>

      <!-- Bảng 1: Cán bộ (Table 1 trong Base) -->
      <router-link to="/personnel" class="app-nav-item" :title="systemBranding.menuLabelPersonnel || 'Cán bộ'">
        <i class="pi pi-table" style="color: #0284c7;"></i>
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          {{ systemBranding.menuLabelPersonnel || 'Cán bộ' }} ({{ personnelStore.personnelList.length }})
        </span>
      </router-link>

      <!-- Bảng 2: Thân nhân (Table 2 độc lập) -->
      <router-link
        v-if="personnelStore.relativesList.length > 0 || systemBranding.showSecondaryInputs"
        to="/relatives"
        class="app-nav-item"
        :title="systemBranding.menuLabelRelatives || 'Thân nhân'"
      >
        <i class="pi pi-users" style="color: #a855f7;"></i>
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          {{ systemBranding.menuLabelRelatives || 'Thân nhân' }} ({{ personnelStore.relativesList.length }})
        </span>
      </router-link>

      <router-link
        v-for="dash in topicDashboards"
        :key="dash.id"
        :to="getDashboardRoute(dash)"
        class="app-nav-item"
        :title="dash.title"
      >
        <i :class="dash.icon ? `pi ${dash.icon}` : 'pi pi-table'"></i>
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

      <a class="app-nav-item" href="javascript:void(0)" @click="handleInputClick('new_personnel')" :title="'Thêm bản ghi vào ' + (systemBranding.menuLabelPersonnel || 'Cán bộ')">
        <i class="pi pi-user-plus" style="color: #0284c7;"></i>
        <span>+ Thêm {{ (systemBranding.menuLabelPersonnel || 'Cán bộ') }}</span>
      </a>

      <!-- Thêm Thân nhân nếu có quản lý -->
      <a v-if="personnelStore.relativesList.length > 0 || systemBranding.showSecondaryInputs" class="app-nav-item" href="javascript:void(0)" @click="openQuickRelativeDialog" :title="'Thêm ' + (systemBranding.menuLabelRelatives || 'Thân nhân')">
        <i class="pi pi-users" style="color: #a855f7;"></i>
        <span>+ Thêm {{ (systemBranding.menuLabelRelatives || 'Thân nhân') }}</span>
      </a>

      <!-- Nút Thêm Bảng mới trực tiếp từ Nhập liệu -->
      <a class="app-nav-item" href="javascript:void(0)" @click="openAddTableDialog" title="Thêm Bảng / Chuyên đề mới">
        <i class="pi pi-plus-circle" style="color: #34d399;"></i>
        <span>+ Thêm Bảng mới</span>
      </a>

      <a v-if="systemBranding.showSecondaryInputs" class="app-nav-item" href="javascript:void(0)" @click="openQuickTripDialog" :title="'Thêm ' + (systemBranding.menuLabelTrips || 'chuyến đi')">
        <i class="pi pi-send" style="color: #4ade80;"></i>
        <span>Thêm {{ (systemBranding.menuLabelTrips || 'chuyến đi') }}</span>
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
          Vui lòng chọn {{ systemBranding.menuLabelPersonnel || 'Cán bộ' }} để thêm thân nhân mới vào hồ sơ:
        </p>

        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            Chọn {{ systemBranding.menuLabelPersonnel || 'Cán bộ' }} liên quan: <span style="color: red;">*</span>
          </label>
          <select
            v-model="selectedParentCccdForRelative"
            style="width: 100%; font-size: 0.82rem; padding: 7px 10px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none;"
          >
            <option value="">-- Chọn {{ systemBranding.menuLabelPersonnel || 'Cán bộ' }} từ danh sách --</option>
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
          :label="'Tiến hành Nhập ' + (systemBranding.menuLabelRelatives || 'thân nhân')"
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
      :header="'Thêm ' + (systemBranding.menuLabelTrips || 'Chuyến đi Nước ngoài')"
      :style="{ width: '520px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #475569; display: block; margin-bottom: 6px;">
            1. ĐỐI TƯỢNG:
          </label>
          <div style="display: flex; gap: 18px; align-items: center; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; font-weight: 600; color: #2563eb;">
              <input type="radio" value="personnel" v-model="quickTripType" style="accent-color: #2563eb;" />
              <span>👤 {{ systemBranding.menuLabelPersonnel || 'Cán bộ' }} (Cá nhân)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; font-weight: 600; color: #7c3aed;">
              <input type="radio" value="relative" v-model="quickTripType" style="accent-color: #7c3aed;" />
              <span>👥 {{ systemBranding.menuLabelRelatives || 'Thân nhân' }} của {{ systemBranding.menuLabelPersonnel || 'Cán bộ' }}</span>
            </label>
          </div>
        </div>

        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
            2. CHỌN {{ quickTripType === 'personnel' ? (systemBranding.menuLabelPersonnel || 'CÁN BỘ').toUpperCase() : (systemBranding.menuLabelRelatives || 'THÂN NHÂN').toUpperCase() }} LIÊN QUAN: <span style="color: red;">*</span>
          </label>
          
          <select v-if="quickTripType === 'personnel'" v-model="selectedQuickTripTargetKey" style="width: 100%; font-size: 0.82rem; padding: 7px 10px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none;">
            <option value="">-- Chọn {{ systemBranding.menuLabelPersonnel || 'Cán bộ' }} từ danh sách --</option>
            <option v-for="p in personnelStore.personnelList" :key="p.id" :value="p.cccd || p.cccdparent || p.id">
              {{ p.name }} - {{ p.positionName || p.position || 'Cán bộ' }} (CCCD: {{ p.cccd || p.cccdparent || '-' }})
            </option>
          </select>

          <select v-else v-model="selectedQuickTripTargetKey" style="width: 100%; font-size: 0.82rem; padding: 7px 10px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none;">
            <option value="">-- Chọn {{ systemBranding.menuLabelRelatives || 'Thân nhân' }} từ danh sách --</option>
            <option v-for="r in personnelStore.relativesList" :key="r.id || r.code" :value="r.code || r.id">
              {{ r.relativeName || r.name }} ({{ r.relationshipName }} của {{ r.parentName || r.parentPersonnelName }}) - CCCD: {{ r.cccd || r.cccdthannhan || '-' }}
            </option>
          </select>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isQuickTripSelectOpen = false" />
        <Button
          :label="'Tiến hành Nhập ' + (systemBranding.menuLabelTrips || 'chuyến đi')"
          icon="pi pi-arrow-right"
          severity="primary"
          size="small"
          :disabled="!selectedQuickTripTargetKey"
          @click="confirmQuickTripNavigate"
        />
      </template>
    </Dialog>

    <!-- Dialog Thêm Bảng / Chuyên đề mới từ Sidebar -->
    <Dialog
      v-model:visible="isAddTableDialogOpen"
      modal
      header="Thêm Bảng / Chuyên đề Mới"
      :style="{ width: '480px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 14px; padding: 8px 0;">
        <div class="field-item">
          <label style="font-size: 0.8rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Tên Bảng / Chuyên đề <span style="color: #ef4444;">*</span>
          </label>
          <InputText
            v-model="newTableForm.title"
            placeholder="VD: Danh sách Học sinh giỏi, Giáo viên chủ nhiệm..."
            style="width: 100%; font-size: 0.85rem;"
            autofocus
            @keyup.enter="saveNewTable"
          />
        </div>

        <div class="field-item">
          <label style="font-size: 0.8rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Nguồn dữ liệu cơ sở:
          </label>
          <select v-model="newTableForm.source" class="settings-select" style="width: 100%; font-size: 0.82rem; height: 36px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff;">
            <option value="personnel">Bảng Cán bộ ({{ systemBranding.menuLabelPersonnel || 'Cán bộ' }})</option>
            <option value="trips">Bảng Sự kiện / Hoạt động ({{ systemBranding.menuLabelTrips || 'Chuyến đi' }})</option>
            <option value="relatives">Bảng Phụ liên quan ({{ systemBranding.menuLabelRelatives || 'Thân nhân' }})</option>
          </select>
          <span style="font-size: 0.72rem; color: #64748b; margin-top: 4px; display: block;">
            💡 Chọn bảng dữ liệu gốc để Bảng / Chuyên đề này kế thừa các cột và dữ liệu tương ứng.
          </span>
        </div>

        <div class="field-item">
          <label style="font-size: 0.8rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Biểu tượng (Icon):
          </label>
          <select v-model="newTableForm.icon" class="settings-select" style="width: 100%; font-size: 0.82rem; height: 36px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff;">
            <option value="pi-table">📋 Bảng dữ liệu (pi-table)</option>
            <option value="pi-folder">📁 Thư mục / Chuyên đề (pi-folder)</option>
            <option value="pi-users">👥 Danh sách người dùng (pi-users)</option>
            <option value="pi-bookmark">🔖 Dấu trang quan trọng (pi-bookmark)</option>
            <option value="pi-star">⭐ Danh sách nổi bật (pi-star)</option>
            <option value="pi-chart-bar">📊 Thống kê / Báo cáo (pi-chart-bar)</option>
            <option value="pi-tag">🏷️ Phân loại / Thẻ (pi-tag)</option>
            <option value="pi-send">✈️ Sự kiện / Chuyến đi (pi-send)</option>
          </select>
        </div>

        <div class="field-item">
          <label style="font-size: 0.8rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Mô tả / Ghi chú (Tùy chọn):
          </label>
          <InputText
            v-model="newTableForm.description"
            placeholder="Ghi chú về mục đích sử dụng bảng này..."
            style="width: 100%; font-size: 0.85rem;"
          />
        </div>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
          <Button label="Hủy" severity="secondary" text size="small" @click="isAddTableDialogOpen = false" />
          <Button label="Tạo Bảng" icon="pi pi-check" severity="success" size="small" @click="saveNewTable" />
        </div>
      </template>
    </Dialog>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useAuthStore } from '@/stores/auth';
import { usePersonnelStore } from '@/stores/personnel';
import { getAppSettings, saveAppSettings } from '@/api/settings';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const personnelStore = usePersonnelStore();

const isAddTableDialogOpen = ref(false);
const newTableForm = ref({
  title: '',
  source: 'personnel',
  icon: 'pi-table',
  description: '',
});

const openAddTableDialog = () => {
  newTableForm.value = {
    title: '',
    source: 'personnel',
    icon: 'pi-table',
    description: '',
  };
  isAddTableDialogOpen.value = true;
};

const saveNewTable = async () => {
  if (!newTableForm.value.title?.trim()) {
    alert('Vui lòng nhập Tên Bảng / Chuyên đề!');
    return;
  }
  const newId = 'topic_' + Date.now();
  const newTable = {
    id: newId,
    code: `TB-${String((dynamicDashboards.value || []).length + 1).padStart(2, '0')}`,
    title: newTableForm.value.title.trim(),
    source: newTableForm.value.source || 'personnel',
    icon: newTableForm.value.icon || 'pi-table',
    description: newTableForm.value.description || '',
    metricCards: [
      { id: 'all', label: 'Toàn bộ', condition: 'all', color: 'blue' }
    ],
    scopeConditions: [],
    customColumns: [],
  };

  const updatedList = [...(dynamicDashboards.value || []), newTable];
  dynamicDashboards.value = updatedList;

  try {
    localStorage.setItem('custom_dashboards_config', JSON.stringify(updatedList));
  } catch (e) {}

  try {
    await saveAppSettings('custom_dashboards_config', updatedList);
  } catch (e) {
    console.error('Error saving new table to DB:', e);
  }

  window.dispatchEvent(new CustomEvent('custom-dashboards-updated', { detail: updatedList }));

  isAddTableDialogOpen.value = false;
  router.push(`/dashboard-topic/${newId}`);
};

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

// Cấu hình Nhận diện Hệ thống & Tên Menu (System Branding)
const DEFAULT_BRANDING = {
  logoUrl: '',
  orgNameLine1: 'CÔNG AN THÀNH PHỐ HỒ CHÍ MINH',
  orgNameLine2: 'PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ',
  menuLabelPersonnel: 'Cán bộ',
  menuLabelRelatives: 'Thân nhân',
  menuLabelTrips: 'Chuyến đi',
};

const getInitialBranding = () => {
  try {
    const local = localStorage.getItem('system_branding_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.menuLabelPersonnel === 'Bảng dữ liệu chính') {
        parsed.menuLabelPersonnel = 'Cán bộ';
      }
      return { ...DEFAULT_BRANDING, ...parsed };
    }
  } catch (e) {}
  return { ...DEFAULT_BRANDING };
};

const systemBranding = ref(getInitialBranding());

const loadSystemBranding = async () => {
  try {
    const saved = await getAppSettings('system_branding_config', null);
    if (saved && typeof saved === 'object') {
      if (saved.menuLabelPersonnel === 'Bảng dữ liệu chính') {
        saved.menuLabelPersonnel = 'Cán bộ';
      }
      systemBranding.value = { ...DEFAULT_BRANDING, ...saved };
      try { localStorage.setItem('system_branding_config', JSON.stringify(systemBranding.value)); } catch (e) {}
    }
  } catch (e) {
    console.warn('Error loading system branding in sidebar:', e);
  }
};

const onSystemBrandingUpdated = (e) => {
  if (e && e.detail) {
    systemBranding.value = { ...DEFAULT_BRANDING, ...e.detail };
  } else {
    loadSystemBranding();
  }
};

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
    path: '/relatives',
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
  loadSystemBranding();
  loadSidebarBg();
  loadSidebarData();
  window.addEventListener('sidebar-bg-updated', loadSidebarBg);
  window.addEventListener('custom-dashboards-updated', loadSidebarData);
  window.addEventListener('system-branding-updated', onSystemBrandingUpdated);
});

onUnmounted(() => {
  window.removeEventListener('sidebar-bg-updated', loadSidebarBg);
  window.removeEventListener('custom-dashboards-updated', loadSidebarData);
  window.removeEventListener('system-branding-updated', onSystemBrandingUpdated);
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
