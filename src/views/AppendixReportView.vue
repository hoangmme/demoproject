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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
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
</style>
