<template>
  <aside class="app-sidebar">
    <div class="app-sidebar-header" style="padding: 1.15rem 0.5rem; text-align: center;">
      <img
        src="/bo-cong-an-logo.png"
        alt="Bộ Công An"
        style="width: 85px; height: 85px; object-fit: contain; margin-bottom: 8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));"
      />
      <div style="font-size: 0.76rem; font-weight: 800; color: #ffffff; text-transform: uppercase; line-height: 1.3; white-space: nowrap;">
        CÔNG AN THÀNH PHỐ HỒ CHÍ MINH
      </div>
      <div style="font-size: 0.76rem; font-weight: 800; color: #ffffff; margin-top: 4px; line-height: 1.3; white-space: nowrap;">
        PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ
      </div>
      <div style="font-size: 0.71rem; font-weight: 800; color: #fde047; margin: 8px 0 0 0; line-height: 1.35; text-transform: uppercase; padding: 0;">
        <div style="white-space: nowrap;">DỮ LIỆU QUẢN LÝ CÁN BỘ, ĐẢNG VIÊN</div>
        <div style="margin-top: 2px; white-space: nowrap;">VÀ THÂN NHÂN CÓ YẾU TỐ NƯỚC NGOÀI</div>
      </div>
    </div>

    <nav class="app-sidebar-nav">
      <router-link to="/dashboard" class="app-nav-item">
        <i class="pi pi-chart-pie"></i>
        <span>Thống kê</span>
      </router-link>

      <router-link to="/personnel" class="app-nav-item">
        <i class="pi pi-users"></i>
        <span>Hồ sơ Cán bộ</span>
      </router-link>

      <div class="app-nav-heading">Chuyên đề</div>

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

      <router-link to="/advanced-search" class="app-nav-item" title="Tra cứu & Tìm kiếm nâng cao">
        <i class="pi pi-search-plus"></i>
        <span>Tìm kiếm nâng cao</span>
      </router-link>

      <!-- KHỐI NHẬP LIỆU (DANH SÁCH MENU TRỰC TIẾP TRÊN SIDEBAR) -->
      <div class="app-nav-heading">Nhập liệu</div>

      <a class="app-nav-item" href="javascript:void(0)" @click="handleInputClick('new_personnel')" title="Thêm Cán bộ mới">
        <i class="pi pi-user-plus" style="color: #60a5fa;"></i>
        <span>Thêm Cán bộ</span>
      </a>

      <a class="app-nav-item" href="javascript:void(0)" @click="openQuickRelativeDialog" title="Thêm Thân nhân mới">
        <i class="pi pi-users" style="color: #c084fc;"></i>
        <span>Thêm Thân nhân</span>
      </a>

      <a class="app-nav-item" href="javascript:void(0)" @click="openQuickTripDialog" title="Thêm Chuyến đi nước ngoài">
        <i class="pi pi-send" style="color: #4ade80;"></i>
        <span>Thêm Chuyến đi</span>
      </a>

      <div class="app-nav-heading">Báo cáo Phụ lục</div>

      <router-link
        v-for="pl in dynamicAppendices"
        :key="pl.id"
        :to="getAppendixRoute(pl)"
        class="app-nav-item"
        :title="pl.title"
      >
        <i :class="pl.icon ? `pi ${pl.icon}` : getAppendixIcon(pl.source)"></i>
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
import { ref, onMounted, watch } from 'vue';
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

const DEFAULT_APPENDICES = [
  {
    id: 'pl1',
    code: 'PL1',
    title: 'Phụ lục 1: Danh sách Cán bộ đi nước ngoài',
    description: 'Thống kê chi tiết các lượt cán bộ xuất cảnh, nhập cảnh và công tác/học tập tại nước ngoài',
    source: 'trips',
    columns: ['code', 'name', 'departmentName', 'chuc_vu', 'decisionNumber', 'countryName', 'departureDate', 'arrivalDate', 'purpose', 'fundingName'],
  },
  {
    id: 'pl2',
    code: 'PL2',
    title: 'Phụ lục 2: Cán bộ có thân nhân ở nước ngoài',
    description: 'Thống kê chi tiết danh sách thân nhân của cán bộ, đảng viên đang sinh sống, học tập, làm việc tại nước ngoài',
    source: 'relatives',
    columns: ['parentName', 'relationshipName', 'relativeName', 'birthYear', 'countryName', 'timeAbroad', 'unitAbroad', 'occupation'],
  },
  {
    id: 'pl3',
    code: 'PL3',
    title: 'Phụ lục 3: Cán bộ có vấn đề chính trị & Kỷ luật',
    description: 'Thống kê cán bộ có lưu ý chính trị, kết luận thẩm tra tiêu chuẩn chính trị hoặc xử lý kỷ luật',
    source: 'personnel',
    columns: ['code', 'name', 'departmentName', 'chuc_vu', 'decisionNumber', 'issues', 'discipline', 'politicalVerificationResult'],
  },
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
      localStorage.setItem('custom_dashboards_config', JSON.stringify(savedDash));
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
  return pl.title || (pl.code ? `[${pl.code}] Phụ lục` : 'Phụ lục');
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
</script>

<style scoped>
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
