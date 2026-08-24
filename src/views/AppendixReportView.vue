<template>
  <div class="app-content">
    <div class="app-card">
      <!-- Header Phụ lục & Nút thao tác -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 12px;">
        <div>
          <!-- Tab chuyển nhanh giữa các Phụ lục -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;">
            <button
              v-for="pl in allAppendices"
              :key="pl.id"
              type="button"
              class="pl-nav-pill"
              :class="{ 'pl-pill-active': currentAppendixId === pl.id }"
              @click="switchAppendix(pl.id)"
            >
              <i :class="getAppendixIcon(pl.source)"></i>
              <span>{{ pl.code || pl.title }}</span>
            </button>
          </div>

          <h3 style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0;">
            {{ currentAppendix.title }} ({{ filteredRows.length }} bản ghi)
          </h3>
          <p v-if="currentAppendix.description" style="font-size: 0.76rem; color: #64748b; margin: 4px 0 0 0;">
            {{ currentAppendix.description }}
          </p>
        </div>

        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <!-- Nút Nhập liệu Dropdown -->
          <div class="input-dropdown-wrapper" style="position: relative;">
            <Button
              label="Nhập liệu"
              icon="pi pi-plus-circle"
              severity="primary"
              size="small"
              @click="isInputMenuOpen = !isInputMenuOpen"
              style="font-size: 0.8rem; font-weight: 700;"
            />

            <div v-if="isInputMenuOpen" class="input-dropdown-menu" @click="isInputMenuOpen = false">
              <div class="input-menu-item" @click="handleInputNavigate('new_personnel')">
                <i class="pi pi-user-plus" style="color: #2563eb; font-size: 1.1rem;"></i>
                <div>
                  <div style="font-weight: 700; color: #1e293b; font-size: 0.82rem;">Thêm Cán bộ mới</div>
                  <div style="font-size: 0.7rem; color: #64748b;">Mở form tạo mới hồ sơ Cán bộ</div>
                </div>
              </div>

              <div class="input-menu-item" @click="handleInputNavigate('new_relative')">
                <i class="pi pi-users" style="color: #7c3aed; font-size: 1.1rem;"></i>
                <div>
                  <div style="font-weight: 700; color: #1e293b; font-size: 0.82rem;">Thêm Thân nhân mới</div>
                  <div style="font-size: 0.7rem; color: #64748b;">Kê khai thêm thân nhân ở nước ngoài</div>
                </div>
              </div>

              <div class="input-menu-item" @click="openQuickTripDialog">
                <i class="pi pi-send" style="color: #16a34a; font-size: 1.1rem;"></i>
                <div>
                  <div style="font-weight: 700; color: #1e293b; font-size: 0.82rem;">Thêm Chuyến đi nước ngoài</div>
                  <div style="font-size: 0.7rem; color: #64748b;">Chọn Cán bộ hoặc Thân nhân để nhập chuyến</div>
                </div>
              </div>
            </div>
          </div>

          <span class="p-input-icon-left" style="position: relative;">
            <i class="pi pi-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.8rem;"></i>
            <InputText
              v-model="searchQuery"
              placeholder="Tìm kiếm trong phụ lục..."
              size="small"
              style="padding-left: 28px; font-size: 0.78rem; width: 220px;"
            />
          </span>

          <Button
            label="Xuất Excel Phụ lục"
            icon="pi pi-file-excel"
            severity="success"
            size="small"
            @click="handleExport"
            style="font-size: 0.8rem;"
          />

          <Button
            v-if="authStore.isAdmin"
            label="Cấu hình Cột PL"
            icon="pi pi-cog"
            severity="secondary"
            outlined
            size="small"
            @click="goToAppendixSettings"
            style="font-size: 0.8rem;"
          />
        </div>
      </div>

      <!-- Bảng dữ liệu Phụ lục động -->
      <DataTable
        :value="filteredRows"
        paginator
        :rows="15"
        :rowsPerPageOptions="[10, 15, 25, 50, 100]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
        currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi"
        responsiveLayout="scroll"
        stripedRows
        class="p-datatable-sm"
        tableStyle="min-width: 60rem"
      >
        <!-- Cột STT cố định đầu -->
        <Column field="stt" header="STT" headerStyle="width: 3.5rem; text-align: center;" bodyStyle="text-align: center; color: #64748b; font-weight: 600;" />

        <!-- Render động các cột được tích chọn trong cấu hình -->
        <Column
          v-for="col in activeDisplayColumns"
          :key="col.id"
          :field="col.id"
          :header="col.label"
          sortable
        >
          <template #body="{ data }">
            <!-- Mã CB/TN -->
            <span v-if="col.id === 'code' || col.id === 'personCode'" class="code-badge">
              {{ data[col.id] || data.code || '-' }}
            </span>

            <!-- Họ tên cán bộ -->
            <span v-else-if="col.id === 'name' || col.id === 'personName'" style="font-weight: 700; color: #1e293b;">
              {{ data[col.id] || data.name || '-' }}
            </span>

            <!-- Cán bộ liên quan (ở Thân nhân) -->
            <div v-else-if="col.id === 'parentName'">
              <strong style="color: #1e293b;">{{ data.parentName || '-' }}</strong>
              <div v-if="data.parentDepartment" style="font-size: 0.72rem; color: #64748b;">{{ data.parentDepartment }}</div>
            </div>

            <!-- Quan hệ -->
            <span v-else-if="col.id === 'relationshipName'" class="badge-pill badge-purple">
              {{ data.relationshipName || '-' }}
            </span>

            <!-- Quốc gia -->
            <span v-else-if="col.id === 'countryName' || col.id === 'country'" class="badge-pill badge-blue">
              {{ data[col.id] || data.countryName || '-' }}
            </span>

            <!-- Số quyết định -->
            <span v-else-if="col.id === 'decisionNumber'" :class="data.decisionNumber && data.decisionNumber !== '-' ? 'code-badge' : 'badge-pill badge-red'">
              {{ data.decisionNumber || 'Chưa có' }}
            </span>

            <!-- Công thức / Trạng thái hiện diện -->
            <span
              v-else-if="col.format === 'formula'"
              :class="getFormulaPresenceStatus(data, col).isAbroad ? 'badge-pill badge-red' : 'badge-pill badge-green'"
            >
              {{ getFormulaPresenceStatus(data, col).label }}
            </span>

            <!-- Giá trị mặc định -->
            <span v-else>{{ formatCellDisplay(data, col) }}</span>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialog chọn đối tượng để Thêm Chuyến đi Nước ngoài -->
    <Dialog
      v-model:visible="isQuickTripSelectOpen"
      modal
      header="Thêm Chuyến đi Nước ngoài"
      :style="{ width: '540px' }"
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
          
          <select v-if="quickTripType === 'personnel'" v-model="selectedQuickTargetKey" class="filter-select" style="width: 100%; font-size: 0.82rem; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <option value="">-- Chọn Cán bộ từ danh sách --</option>
            <option v-for="p in personnelStore.personnelList" :key="p.id" :value="p.cccd || p.cccdparent || p.id">
              {{ p.name }} - {{ p.positionName || p.position || 'Cán bộ' }} (CCCD: {{ p.cccd || p.cccdparent || '-' }})
            </option>
          </select>

          <select v-else v-model="selectedQuickTargetKey" class="filter-select" style="width: 100%; font-size: 0.82rem; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
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
          :disabled="!selectedQuickTargetKey"
          @click="confirmQuickTripNavigate"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import { usePersonnelStore } from '@/stores/personnel';
import { useAuthStore } from '@/stores/auth';
import { formatDate, formatExcelDate, computePresenceStatus } from '@/utils/formatters';
import { exportToExcel } from '@/utils/excel';
import { getAppSettings } from '@/api/settings';

const route = useRoute();
const router = useRouter();
const personnelStore = usePersonnelStore();
const authStore = useAuthStore();

const props = defineProps({
  defaultId: {
    type: String,
    default: '',
  },
});

const DEFAULT_APPENDICES_CONFIG = [
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

const allAppendices = ref([...DEFAULT_APPENDICES_CONFIG]);
const currentAppendixId = ref('pl1');
const searchQuery = ref('');

const loadAppendicesConfig = async () => {
  try {
    const saved = await getAppSettings('custom_appendices_config', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      allAppendices.value = saved;
    } else {
      const local = localStorage.getItem('custom_appendices_config');
      if (local) {
        allAppendices.value = JSON.parse(local);
      }
    }
  } catch (e) {
    console.error('Error loading appendices config:', e);
  }
};

const resolveCurrentId = () => {
  if (route.params.id) {
    currentAppendixId.value = String(route.params.id).toLowerCase();
  } else if (props.defaultId) {
    currentAppendixId.value = props.defaultId;
  } else if (route.path.includes('pl1')) {
    currentAppendixId.value = 'pl1';
  } else if (route.path.includes('pl2')) {
    currentAppendixId.value = 'pl2';
  } else if (route.path.includes('pl3')) {
    currentAppendixId.value = 'pl3';
  }
};

onMounted(async () => {
  await loadAppendicesConfig();
  resolveCurrentId();
  if (personnelStore.personnelList.length === 0) {
    await personnelStore.init();
  }
});

watch(
  () => [route.params.id, route.path],
  () => {
    resolveCurrentId();
  }
);

const currentAppendix = computed(() => {
  const found = allAppendices.value.find((x) => x.id === currentAppendixId.value);
  return found || allAppendices.value[0] || DEFAULT_APPENDICES_CONFIG[0];
});

const getAppendixIcon = (source) => {
  if (source === 'trips') return 'pi pi-globe';
  if (source === 'relatives') return 'pi pi-heart';
  return 'pi pi-user';
};

const switchAppendix = (id) => {
  currentAppendixId.value = id;
  if (id === 'pl1') router.push('/pl1');
  else if (id === 'pl2') router.push('/pl2');
  else if (id === 'pl3') router.push('/pl3');
  else router.push(`/appendix/${id}`);
};

const goToAppendixSettings = () => {
  router.push('/settings-import?tab=appendices');
};

// All available columns mapped from Personnel & Relative imports
const allColsMap = computed(() => {
  const map = {};
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id) map[c.id] = c;
    });
  });
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id) map[c.id] = c;
    });
  });
  return map;
});

// Active display columns for current appendix
const activeDisplayColumns = computed(() => {
  const selectedColIds = currentAppendix.value.columns || [];
  return selectedColIds
    .filter((id) => id !== 'stt')
    .map((id) => {
      if (id === 'code') return { id: 'code', label: 'Mã CB' };
      if (id === 'name') return { id: 'name', label: 'Họ và tên' };
      if (id === 'parentName') return { id: 'parentName', label: 'Cán bộ liên quan' };
      if (id === 'parentDepartment') return { id: 'parentDepartment', label: 'Đơn vị Cán bộ' };
      if (id === 'departmentName') return { id: 'departmentName', label: 'Đơn vị / Phòng ban' };
      if (id === 'position' || id === 'chuc_vu') return { id: 'position', label: 'Chức vụ' };
      if (id === 'decisionNumber') return { id: 'decisionNumber', label: 'Số Quyết định' };
      if (id === 'countryName') return { id: 'countryName', label: 'Quốc gia' };
      if (id === 'departureDate') return { id: 'departureDate', label: 'Ngày đi' };
      if (id === 'arrivalDate') return { id: 'arrivalDate', label: 'Ngày về' };
      if (id === 'purpose') return { id: 'purpose', label: 'Mục đích' };
      if (id === 'fundingName' || id === 'funding') return { id: 'fundingName', label: 'Nguồn kinh phí' };

      const cfg = allColsMap.value[id];
      if (cfg && cfg.label) return { ...cfg, id: cfg.id, label: cfg.label };
      return { id, label: id };
    });
});

const getRowVal = (row, colId) => {
  if (!row || !colId) return '';
  let val = row[colId];
  if (val === undefined || val === null || val === '') {
    if (row.custom_data) {
      try {
        const cd = typeof row.custom_data === 'string' ? JSON.parse(row.custom_data) : row.custom_data;
        if (cd) val = cd[colId];
      } catch (e) {}
    }
  }
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val
        .map((x) => (typeof x === 'object' && x ? (x.name || x.label || x.col1 || x.value || JSON.stringify(x)) : x))
        .filter(Boolean)
        .join(', ');
    }
    return val.name || val.label || val.value || JSON.stringify(val);
  }
  return String(val).trim();
};

const getFormulaPresenceStatus = (record, colDef) => {
  return computePresenceStatus(record, {
    departureCol: colDef.formulaDepartureCol,
    arrivalCol: colDef.formulaArrivalCol,
    countryCol: colDef.formulaCountryCol,
    labelDomestic: colDef.formulaLabelDomestic,
    labelAbroad: colDef.formulaLabelAbroad,
  });
};

const formatCellDisplay = (data, col) => {
  const val = getRowVal(data, col.id);
  if (!val || val === '-') return '-';
  const cLower = String(col.id).toLowerCase();
  if (
    cLower.includes('date') ||
    cLower.includes('ngay') ||
    cLower.includes('birth') ||
    cLower.includes('departure') ||
    cLower.includes('arrival') ||
    /^\d{4}-\d{2}-\d{2}/.test(String(val))
  ) {
    return formatDate(val) || val;
  }
  return val;
};

// Compute Rows according to Source (trips / relatives / personnel)
const rawRows = computed(() => {
  const src = currentAppendix.value.source || 'trips';
  const pList = personnelStore.personnelList || [];
  const rList = personnelStore.relativesList || [];
  const rows = [];
  let stt = 1;

  if (src === 'trips') {
    pList.forEach((p) => {
      (p.trips || []).forEach((t) => {
        const row = {
          stt: stt++,
          ...p,
          ...t,
          code: p.code || p.id,
          name: p.name,
          personCode: p.code || p.id,
          personName: p.name,
          departmentName: personnelStore.getDepartmentName(p.departmentId),
          position: p.position || p.chuc_vu || '-',
          decisionNumber: t.decisionNumber || t.decision || '-',
          countryName: t.countryName || t.country || '-',
          departureDate: formatDate(t.departureDate) || '-',
          arrivalDate: formatDate(t.arrivalDate) || '-',
          purpose: t.purpose || '-',
          fundingName: t.fundingName || t.funding || p.funding2 || '-',
        };
        rows.push(row);
      });
    });
  } else if (src === 'relatives') {
    if (rList.length > 0) {
      rList.forEach((r) => {
        const pObj = pList.find((p) => String(p.cccdparent || p.cccd || '').trim() === String(r.cccd_can_bo || '').trim());
        const row = {
          stt: stt++,
          ...r,
          parentName: r.parentName || r.parentPersonnelName || pObj?.name || '-',
          parentDepartment: pObj ? personnelStore.getDepartmentName(pObj.departmentId) : '-',
          relationshipName: r.relationshipName || r.relationship || '-',
          relativeName: r.relativeName || r.name || '-',
          birthYear: formatDate(r.birthYear) || r.birthYear || '-',
          countryName: r.countryName || r.country || '-',
          timeAbroad: r.timeAbroad || '-',
          unitAbroad: r.unitAbroad || '-',
          occupation: r.occupation || r.job || '-',
        };
        rows.push(row);
      });
    } else {
      pList.forEach((p) => {
        (p.relatives || []).forEach((r) => {
          const row = {
            stt: stt++,
            ...r,
            parentName: p.name,
            parentDepartment: personnelStore.getDepartmentName(p.departmentId),
            relationshipName: r.relationshipName || '-',
            relativeName: r.relativeName || r.name || '-',
            birthYear: formatDate(r.birthYear) || r.birthYear || '-',
            countryName: r.countryName || r.country || '-',
            timeAbroad: r.timeAbroad || '-',
            unitAbroad: r.unitAbroad || '-',
            occupation: r.occupation || r.job || '-',
          };
          rows.push(row);
        });
      });
    }
  } else {
    // personnel
    pList.forEach((p) => {
      const row = {
        stt: stt++,
        ...p,
        code: p.code || p.id,
        name: p.name,
        departmentName: personnelStore.getDepartmentName(p.departmentId),
        position: p.position || p.chuc_vu || '-',
        decisionNumber: p.decisionNumber || p.decision || '-',
        issues: p.issues || '-',
        discipline: p.discipline || '-',
        politicalVerificationResult: p.politicalVerificationResult || p.tcctResult || '-',
      };
      rows.push(row);
    });
  }

  return rows;
});

const filteredRows = computed(() => {
  if (!searchQuery.value.trim()) return rawRows.value;
  const q = searchQuery.value.toLowerCase().trim();
  return rawRows.value.filter((row) => {
    return Object.values(row).some((val) => {
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(q);
    });
  });
});

const handleExport = () => {
  const exportCols = activeDisplayColumns.value;
  const dataToExport = filteredRows.value.map((row, idx) => {
    const obj = { 'STT': idx + 1 };
    exportCols.forEach((col) => {
      obj[col.label] = formatCellDisplay(row, col);
    });
    return obj;
  });

  const rawTitle = currentAppendix.value.title || 'Bao_cao_Phu_luc';
  const cleanFileName = rawTitle.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
  exportToExcel(dataToExport, cleanFileName, currentAppendix.value.code || 'Phụ lục');
};

const isInputMenuOpen = ref(false);
const isQuickTripSelectOpen = ref(false);
const quickTripType = ref('personnel');
const selectedQuickTargetKey = ref('');

const handleInputNavigate = (action) => {
  isInputMenuOpen.value = false;
  router.push({ path: '/personnel', query: { action } });
};

const openQuickTripDialog = () => {
  isInputMenuOpen.value = false;
  quickTripType.value = 'personnel';
  selectedQuickTargetKey.value = personnelStore.personnelList.length > 0 ? (personnelStore.personnelList[0].cccd || personnelStore.personnelList[0].id) : '';
  isQuickTripSelectOpen.value = true;
};

const confirmQuickTripNavigate = () => {
  if (!selectedQuickTargetKey.value) return;
  isQuickTripSelectOpen.value = false;
  
  if (quickTripType.value === 'personnel') {
    router.push({
      path: '/personnel',
      query: { action: 'new_trip', targetCccd: selectedQuickTargetKey.value },
    });
  } else {
    // Relative
    const foundRel = personnelStore.relativesList.find((r) => r.code === selectedQuickTargetKey.value || r.id === selectedQuickTargetKey.value);
    const parentCccd = foundRel?.parentPersonnelCccd || foundRel?.cccdparent || (foundRel?.parentPersonnelId ? personnelStore.personnelList.find(p => p.id === foundRel.parentPersonnelId)?.cccd : '') || '';
    router.push({
      path: '/personnel',
      query: {
        action: 'new_trip',
        targetCccd: parentCccd || selectedQuickTargetKey.value,
        targetRelativeCode: foundRel?.code || selectedQuickTargetKey.value,
      },
    });
  }
};
</script>

<style scoped>
.pl-nav-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.76rem;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.18s ease;
}

.pl-nav-pill:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.pl-pill-active {
  background: #0284c7 !important;
  color: #ffffff !important;
  border-color: #0284c7 !important;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
}

.input-dropdown-wrapper {
  position: relative;
}

.input-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 1000;
  width: 250px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.input-menu-item:hover {
  background: #f8fafc;
}
</style>
