<template>
  <div class="app-content">
    <!-- Breadcrumb & Top Bar -->
    <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
      <span>Tra cứu</span>
      <span>/</span>
      <span style="color: #0f172a; font-weight: 600;">Danh sách chuyến đi</span>
    </div>

    <!-- Header Section with Actions -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="badge-code-cd">CD-03</span>
        <div>
          <h1 style="font-size: 1.35rem; font-weight: 700; color: #0f172a; margin: 0; display: inline-flex; align-items: center; gap: 8px;">
            Danh sách chuyến đi
            <span style="font-size: 0.85rem; font-weight: 500; color: #64748b;">· {{ filteredList.length }} chuyến</span>
          </h1>
        </div>
      </div>

      <div style="display: flex; gap: 8px; align-items: center;">
        <!-- Column Picker -->
        <button
          type="button"
          class="btn-action-outline"
          @click="isColumnPickerOpen = true"
          title="Tùy chọn ẩn / hiện cột"
        >
          <i class="pi pi-table"></i>
          <span>Chọn cột hiển thị ({{ selectedColIds.length }}/{{ allColumns.length }})</span>
        </button>

        <!-- Export Excel -->
        <button
          type="button"
          class="btn-action-outline"
          @click="exportExcel"
          title="Xuất bảng dữ liệu ra tệp Excel"
        >
          <i class="pi pi-file-excel" style="color: #16a34a;"></i>
          <span>Xuất file</span>
        </button>

        <!-- Add Trip (Quick add) -->
        <Button
          label="Thêm chuyến đi"
          icon="pi pi-plus"
          size="small"
          severity="primary"
          @click="openAddTripDialog"
          style="font-size: 0.85rem; background: #1e3a8a; border-color: #1e3a8a;"
        />
      </div>
    </div>

    <!-- Quick Metric Pill Cards (Top Row) -->
    <div style="display: flex; gap: 12px; margin-bottom: 1.25rem; flex-wrap: wrap;">
      <!-- 1. Toàn bộ -->
      <div
        class="quick-stat-card"
        :class="{ 'stat-active': statusFilter === 'all' }"
        @click="statusFilter = 'all'"
      >
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="dot-indicator dot-blue"></span>
          <span class="stat-name">Toàn bộ</span>
        </div>
        <span class="stat-number num-blue">{{ tripStats.total }}</span>
      </div>

      <!-- 2. Đã về nước -->
      <div
        class="quick-stat-card"
        :class="{ 'stat-active': statusFilter === 'completed' }"
        @click="statusFilter = 'completed'"
      >
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="dot-indicator dot-green"></span>
          <span class="stat-name">Đã về nước</span>
        </div>
        <span class="stat-number num-green">{{ tripStats.completed }}</span>
      </div>

      <!-- 3. Đang ở nước ngoài -->
      <div
        class="quick-stat-card"
        :class="{ 'stat-active': statusFilter === 'abroad' }"
        @click="statusFilter = 'abroad'"
      >
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="dot-indicator dot-amber"></span>
          <span class="stat-name">Đang ở nước ngoài</span>
        </div>
        <span class="stat-number num-amber">{{ tripStats.abroad }}</span>
      </div>

      <!-- 4. Quá hạn chưa về -->
      <div
        class="quick-stat-card"
        :class="{ 'stat-active': statusFilter === 'overdue' }"
        @click="statusFilter = 'overdue'"
      >
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="dot-indicator dot-red"></span>
          <span class="stat-name">Quá hạn chưa về</span>
        </div>
        <span class="stat-number num-red">{{ tripStats.overdue }}</span>
      </div>
    </div>

    <!-- Filter Bar Container -->
    <div class="app-card" style="padding: 12px 16px; margin-bottom: 1rem;">
      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <!-- Search -->
        <div style="position: relative; flex: 1; min-width: 240px;">
          <i class="pi pi-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.85rem;"></i>
          <InputText
            v-model="searchQuery"
            placeholder="Tìm trong danh sách: họ tên, đơn vị, số quyết định, quốc gia..."
            style="width: 100%; padding-left: 30px; font-size: 0.82rem; height: 34px;"
          />
        </div>

        <!-- Year / Time Filter -->
        <div style="min-width: 150px;">
          <select v-model="timeFilterYear" class="filter-select">
            <option value="all">Khoảng thời gian: Tất cả</option>
            <option v-for="y in availableYears" :key="y" :value="y">Năm {{ y }}</option>
          </select>
        </div>

        <!-- Country Filter -->
        <div style="min-width: 140px;">
          <select v-model="selectedCountry" class="filter-select">
            <option value="">Quốc gia: Tất cả</option>
            <option v-for="c in availableCountries" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <!-- Department Filter -->
        <div style="min-width: 150px;">
          <select v-model="selectedDepartment" class="filter-select">
            <option value="">Đơn vị: Tất cả</option>
            <option v-for="d in availableDepartments" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>

        <!-- Funding Source Filter -->
        <div style="min-width: 140px;">
          <select v-model="selectedFunding" class="filter-select">
            <option value="">Kinh phí: Tất cả</option>
            <option v-for="f in availableFundings" :key="f" :value="f">{{ f }}</option>
          </select>
        </div>

        <!-- Reset button -->
        <Button
          v-if="hasActiveFilters"
          label="Xóa bộ lọc"
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          size="small"
          @click="resetFilters"
          style="font-size: 0.78rem; height: 34px; padding: 0 10px;"
        />
      </div>
    </div>

    <!-- Main Data Table Area -->
    <div class="app-card" style="padding: 0; overflow: hidden;">
      <div style="overflow-x: auto; max-height: calc(100vh - 360px); min-height: 380px;">
        <table class="trips-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  style="accent-color: #1e3a8a;"
                />
              </th>
              <th style="width: 45px; text-align: center;">STT</th>

              <th
                v-for="col in visibleColumns"
                :key="col.id"
                :style="getColumnHeaderStyle(col)"
                @click="sortBy(col.id)"
                class="sortable-header"
              >
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                  <span>{{ col.label }}</span>
                  <i
                    v-if="sortKey === col.id"
                    :class="sortOrder === 1 ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down'"
                    style="font-size: 0.75rem; color: #1e3a8a;"
                  ></i>
                </div>
              </th>

              <th style="width: 80px; text-align: center;">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginatedList.length === 0">
              <td :colspan="visibleColumns.length + 3" style="text-align: center; padding: 3rem; color: #94a3b8;">
                <i class="pi pi-inbox" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
                Không tìm thấy chuyến đi nào phù hợp với bộ lọc.
              </td>
            </tr>

            <tr
              v-for="(trip, idx) in paginatedList"
              :key="trip.uniqueKey || idx"
              :class="{ 'row-selected': selectedTripKeys.includes(trip.uniqueKey) }"
              @click="toggleSelectTrip(trip.uniqueKey)"
            >
              <!-- Checkbox -->
              <td style="text-align: center;" @click.stop>
                <input
                  type="checkbox"
                  :value="trip.uniqueKey"
                  v-model="selectedTripKeys"
                  style="accent-color: #1e3a8a;"
                />
              </td>

              <!-- STT -->
              <td style="text-align: center; color: #64748b; font-weight: 600;">
                {{ (currentPage - 1) * pageSize + idx + 1 }}
              </td>

              <!-- Dynamic Visible Columns -->
              <td
                v-for="col in visibleColumns"
                :key="col.id"
                :style="{ textAlign: col.align || 'left' }"
              >
                <!-- 1. Họ và tên (Cán bộ / Thân nhân) -->
                <template v-if="col.id === 'personnelName' || col.id === 'name'">
                  <div style="font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px;">
                    <span>{{ trip.personnelName || trip.name || 'Chưa rõ' }}</span>
                    <span v-if="trip.isRelative" class="badge-role-tn">Thân nhân</span>
                  </div>
                  <div v-if="trip.personnelCode" style="font-size: 0.72rem; color: #64748b;">
                    {{ trip.personnelCode }}
                  </div>
                </template>

                <!-- 2. Trạng thái Đi / Về (Status Badge) -->
                <template v-else-if="col.id === 'status' || col.id === 'tripStatus'">
                  <span :class="getStatusBadgeClass(trip)">
                    <span class="status-dot"></span>
                    {{ getStatusLabel(trip) }}
                  </span>
                </template>

                <!-- 3. Ngày nhập cảnh (Hiển thị ngày hoặc Badge Đang ở nước ngoài) -->
                <template v-else-if="col.id === 'arrivalDate'">
                  <span v-if="trip.arrivalDate" style="color: #0f172a; font-weight: 600;">
                    {{ formatDisplayDate(trip.arrivalDate) }}
                  </span>
                  <span v-else-if="trip.isOverdue" class="status-pill status-overdue">
                    Quá hạn {{ trip.overdueDays }} ngày
                  </span>
                  <span v-else class="status-pill status-abroad">
                    Đang ở nước ngoài
                  </span>
                </template>

                <!-- 4. Ngày xuất cảnh -->
                <template v-else-if="col.id === 'departureDate' || col.id === 'approvedDepartureDate'">
                  <span>{{ formatDisplayDate(trip[col.id] || trip.departureDate) }}</span>
                </template>

                <!-- 5. Số quyết định -->
                <template v-else-if="col.id === 'decisionNumber' || col.id === 'decision'">
                  <span v-if="trip.decisionNumber" class="code-badge-decision">
                    {{ trip.decisionNumber }}
                  </span>
                  <span v-else style="color: #94a3b8;">-</span>
                </template>

                <!-- 6. Quốc gia -->
                <template v-else-if="col.id === 'countryName' || col.id === 'country'">
                  <span style="font-weight: 600; color: #1e293b;">
                    {{ trip.countryName || trip.country || '-' }}
                  </span>
                </template>

                <!-- 7. Nguồn kinh phí -->
                <template v-else-if="col.id === 'fundingName' || col.id === 'funding'">
                  <span class="badge-funding">
                    {{ trip.fundingName || trip.funding || '-' }}
                  </span>
                </template>

                <!-- Default text -->
                <template v-else>
                  <span>{{ getCellValue(trip, col.id) }}</span>
                </template>
              </td>

              <!-- Action button -->
              <td style="text-align: center;" @click.stop>
                <Button
                  icon="pi pi-user-edit"
                  size="small"
                  text
                  rounded
                  severity="secondary"
                  @click="openPersonnelDetail(trip)"
                  v-tooltip.top="'Xem hồ sơ chi tiết'"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-top: 1px solid #e2e8f0; background: #fafafa; font-size: 0.8rem; color: #64748b;">
        <div>
          Hiển thị <b>{{ paginatedList.length }}</b> / <b>{{ filteredList.length }}</b> chuyến đi
          <span v-if="selectedTripKeys.length > 0" style="margin-left: 12px; color: #1e3a8a; font-weight: 600;">
            (Đã chọn {{ selectedTripKeys.length }} chuyến)
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <select v-model="pageSize" style="font-size: 0.78rem; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1;">
            <option :value="15">15 dòng / trang</option>
            <option :value="30">30 dòng / trang</option>
            <option :value="50">50 dòng / trang</option>
            <option :value="100">100 dòng / trang</option>
          </select>

          <Button
            icon="pi pi-angle-left"
            size="small"
            text
            :disabled="currentPage === 1"
            @click="currentPage--"
          />
          <span>Trang <b>{{ currentPage }}</b> / {{ totalPages || 1 }}</span>
          <Button
            icon="pi pi-angle-right"
            size="small"
            text
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          />
        </div>
      </div>
    </div>

    <!-- Modal Chọn cột hiển thị -->
    <Dialog
      v-model:visible="isColumnPickerOpen"
      modal
      header="Tùy chọn cột hiển thị trên bảng Chuyến đi"
      :style="{ width: '540px' }"
    >
      <div style="font-size: 0.82rem; color: #64748b; margin-bottom: 1rem;">
        Đánh dấu chọn các cột thông tin cần xuất hiện trên bảng dữ liệu:
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 360px; overflow-y: auto; padding: 4px;">
        <label
          v-for="col in allColumns"
          :key="col.id"
          style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; cursor: pointer; padding: 6px 8px; border-radius: 6px; border: 1px solid #f1f5f9; background: #fafafa;"
        >
          <input
            type="checkbox"
            :value="col.id"
            v-model="selectedColIds"
            style="accent-color: #1e3a8a;"
          />
          <span style="font-weight: 500; color: #1e293b;">{{ col.label }}</span>
        </label>
      </div>

      <template #footer>
        <Button label="Mặc định" severity="secondary" text size="small" @click="resetDefaultColumns" />
        <Button label="Đóng" severity="primary" size="small" @click="saveColumnSelection" />
      </template>
    </Dialog>

    <!-- Personnel Edit / Add Dialog -->
    <PersonnelDialog
      v-model="isPersonnelDialogOpen"
      :personData="activePersonData"
      @saved="handlePersonnelSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { usePersonnelStore } from '@/stores/personnel';
import PersonnelDialog from '@/components/personnel/PersonnelDialog.vue';
import { formatDate, parseDateObj } from '@/utils/formatters';
import * as XLSX from 'xlsx';

const personnelStore = usePersonnelStore();

// Filters
const searchQuery = ref('');
const statusFilter = ref('all'); // all, completed, abroad, overdue
const timeFilterYear = ref('all');
const selectedCountry = ref('');
const selectedDepartment = ref('');
const selectedFunding = ref('');

// Selection & Sorting & Pagination
const selectedTripKeys = ref([]);
const sortKey = ref('departureDate');
const sortOrder = ref(-1); // -1: desc, 1: asc
const currentPage = ref(1);
const pageSize = ref(30);

// Dialogs
const isColumnPickerOpen = ref(false);
const isPersonnelDialogOpen = ref(false);
const activePersonData = ref(null);

// Default columns definition
const DEFAULT_TRIP_COLUMNS = [
  { id: 'personnelName', label: 'Họ và tên', width: '180px' },
  { id: 'position', label: 'Chức vụ', width: '150px' },
  { id: 'departmentName', label: 'Đơn vị công tác', width: '180px' },
  { id: 'countryName', label: 'Quốc gia', width: '140px' },
  { id: 'departureDate', label: 'Ngày xuất cảnh', width: '120px' },
  { id: 'arrivalDate', label: 'Ngày nhập cảnh / Trạng thái', width: '160px' },
  { id: 'decisionNumber', label: 'Số quyết định', width: '130px' },
  { id: 'fundingName', label: 'Nguồn kinh phí', width: '140px' },
  { id: 'purpose', label: 'Mục đích chuyến đi', width: '160px' },
  { id: 'status', label: 'Tiến độ Đi - Về', width: '140px' },
];

const allColumns = ref([...DEFAULT_TRIP_COLUMNS]);
const selectedColIds = ref(DEFAULT_TRIP_COLUMNS.map((c) => c.id));

const visibleColumns = computed(() => {
  return allColumns.value.filter((c) => selectedColIds.value.includes(c.id));
});

// Build unified list of trips from both Personnel.trips and Relatives
const unifiedTripsList = computed(() => {
  const list = [];
  const pList = personnelStore.personnelList || [];
  const rList = personnelStore.relativesList || [];
  const now = new Date();

  // 1. Cán bộ trips
  pList.forEach((p) => {
    (p.trips || []).forEach((t, tIdx) => {
      const depDate = t.departureDate || t.approvedDepartureDate || '';
      const arrDate = t.arrivalDate || '';
      const appArrDate = t.approvedArrivalDate || '';
      const extDate = t.approvedExtensionDate || '';

      const depObj = parseDateObj(depDate);
      const arrObj = parseDateObj(arrDate);
      const appArrObj = parseDateObj(extDate || appArrDate);

      let isAbroad = false;
      let isOverdue = false;
      let overdueDays = 0;

      if (!arrDate || !arrObj) {
        isAbroad = true;
        if (appArrObj && now > appArrObj) {
          isOverdue = true;
          overdueDays = Math.max(1, Math.floor((now - appArrObj) / (1000 * 60 * 60 * 24)));
        }
      } else if (appArrObj && arrObj > appArrObj) {
        isOverdue = true;
        overdueDays = Math.max(1, Math.floor((arrObj - appArrObj) / (1000 * 60 * 60 * 24)));
      }

      list.push({
        uniqueKey: `cb_${p.id}_${t.id || tIdx}`,
        isRelative: false,
        personnelId: p.id,
        personnelCode: p.code || `CB-${String(p.id).slice(-5)}`,
        personnelName: p.name,
        position: p.position || '',
        departmentName: personnelStore.getDepartmentName(p.departmentId) || p.departmentName || '',
        countryName: t.countryName || t.country || '',
        departureDate: depDate,
        arrivalDate: arrDate,
        approvedDepartureDate: t.approvedDepartureDate || depDate,
        approvedArrivalDate: appArrDate,
        approvedExtensionDate: extDate,
        decisionNumber: t.decisionNumber || t.decision || '',
        fundingName: t.fundingName || t.funding || p.funding2 || p.funding || '',
        purpose: t.purpose || t.tripPurpose || t.content || '',
        isAbroad,
        isOverdue,
        overdueDays,
        rawTrip: t,
        rawPerson: p,
      });
    });
  });

  // 2. Thân nhân records with abroad info
  const processedRelatives = new Set();
  pList.forEach((p) => {
    (p.relatives || []).forEach((r, rIdx) => {
      const rKey = r.id || `${p.id}_${r.name || r.relativeName}`;
      if (!processedRelatives.has(rKey)) {
        processedRelatives.add(rKey);
        const cName = r.countryName || r.country || '';
        if (cName && cName !== '-' && cName !== 'Chưa rõ') {
          list.push({
            uniqueKey: `tn_${p.id}_${r.id || rIdx}`,
            isRelative: true,
            personnelId: p.id,
            personnelCode: p.code || '',
            personnelName: r.relativeName || r.name || 'Thân nhân',
            position: `TN của: ${p.name}`,
            departmentName: personnelStore.getDepartmentName(p.departmentId) || p.departmentName || '',
            countryName: cName,
            departureDate: r.departureDate || r.startDate || '',
            arrivalDate: r.arrivalDate || r.endDate || '',
            decisionNumber: r.decisionNumber || '-',
            fundingName: r.kinhphiTN || r.fundingName || r.funding || '',
            purpose: r.relationship ? `Quan hệ: ${r.relationship}` : 'Thân nhân ở nước ngoài',
            isAbroad: !r.arrivalDate,
            isOverdue: false,
            overdueDays: 0,
            rawRelative: r,
            rawPerson: p,
          });
        }
      }
    });
  });

  return list;
});

// Aggregated Quick Stats
const tripStats = computed(() => {
  const list = unifiedTripsList.value;
  let completed = 0;
  let abroad = 0;
  let overdue = 0;

  list.forEach((t) => {
    if (t.isOverdue) overdue++;
    else if (t.isAbroad) abroad++;
    else completed++;
  });

  return {
    total: list.length,
    completed,
    abroad,
    overdue,
  };
});

// Dropdown filter options
const availableYears = computed(() => {
  const set = new Set();
  unifiedTripsList.value.forEach((t) => {
    const d = parseDateObj(t.departureDate);
    if (d) set.add(d.getFullYear());
  });
  return Array.from(set).sort((a, b) => b - a);
});

const availableCountries = computed(() => {
  const set = new Set();
  unifiedTripsList.value.forEach((t) => {
    if (t.countryName && t.countryName !== '-') set.add(t.countryName);
  });
  return Array.from(set).sort();
});

const availableDepartments = computed(() => {
  const set = new Set();
  unifiedTripsList.value.forEach((t) => {
    if (t.departmentName) set.add(t.departmentName);
  });
  return Array.from(set).sort();
});

const availableFundings = computed(() => {
  const set = new Set();
  unifiedTripsList.value.forEach((t) => {
    if (t.fundingName && t.fundingName !== '-') set.add(t.fundingName);
  });
  return Array.from(set).sort();
});

// Filtered List
const filteredList = computed(() => {
  let list = [...unifiedTripsList.value];

  // 1. Status Filter
  if (statusFilter.value === 'completed') {
    list = list.filter((t) => !t.isAbroad && !t.isOverdue);
  } else if (statusFilter.value === 'abroad') {
    list = list.filter((t) => t.isAbroad && !t.isOverdue);
  } else if (statusFilter.value === 'overdue') {
    list = list.filter((t) => t.isOverdue);
  }

  // 2. Year Filter
  if (timeFilterYear.value !== 'all') {
    const targetY = Number(timeFilterYear.value);
    list = list.filter((t) => {
      const d = parseDateObj(t.departureDate);
      return d && d.getFullYear() === targetY;
    });
  }

  // 3. Country Filter
  if (selectedCountry.value) {
    list = list.filter((t) => t.countryName === selectedCountry.value);
  }

  // 4. Department Filter
  if (selectedDepartment.value) {
    list = list.filter((t) => t.departmentName === selectedDepartment.value);
  }

  // 5. Funding Filter
  if (selectedFunding.value) {
    list = list.filter((t) => t.fundingName === selectedFunding.value);
  }

  // 6. Search Query
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((t) => {
      return (
        String(t.personnelName || '').toLowerCase().includes(q) ||
        String(t.personnelCode || '').toLowerCase().includes(q) ||
        String(t.departmentName || '').toLowerCase().includes(q) ||
        String(t.countryName || '').toLowerCase().includes(q) ||
        String(t.decisionNumber || '').toLowerCase().includes(q) ||
        String(t.purpose || '').toLowerCase().includes(q) ||
        String(t.fundingName || '').toLowerCase().includes(q)
      );
    });
  }

  // 7. Sort
  list.sort((a, b) => {
    let valA = a[sortKey.value] || '';
    let valB = b[sortKey.value] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return -1 * sortOrder.value;
    if (valA > valB) return 1 * sortOrder.value;
    return 0;
  });

  return list;
});

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filteredList.value.length / pageSize.value) || 1;
});

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

// Helpers
const formatDisplayDate = (dStr) => {
  if (!dStr) return '-';
  return formatDate(dStr) || dStr;
};

const getCellValue = (trip, colId) => {
  return trip[colId] || '-';
};

const getStatusBadgeClass = (trip) => {
  if (trip.isOverdue) return 'status-pill status-overdue';
  if (trip.isAbroad) return 'status-pill status-abroad';
  return 'status-pill status-completed';
};

const getStatusLabel = (trip) => {
  if (trip.isOverdue) return `Quá hạn (${trip.overdueDays} ngày)`;
  if (trip.isAbroad) return 'Đang ở nước ngoài';
  return 'Đã về nước';
};

const getColumnHeaderStyle = (col) => {
  return {
    width: col.width || 'auto',
    textAlign: col.align || 'left',
  };
};

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value * -1;
  } else {
    sortKey.value = key;
    sortOrder.value = 1;
  }
};

const isAllSelected = computed(() => {
  return (
    paginatedList.value.length > 0 &&
    paginatedList.value.every((t) => selectedTripKeys.value.includes(t.uniqueKey))
  );
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    const pageKeys = new Set(paginatedList.value.map((t) => t.uniqueKey));
    selectedTripKeys.value = selectedTripKeys.value.filter((k) => !pageKeys.has(k));
  } else {
    paginatedList.value.forEach((t) => {
      if (!selectedTripKeys.value.includes(t.uniqueKey)) {
        selectedTripKeys.value.push(t.uniqueKey);
      }
    });
  }
};

const toggleSelectTrip = (key) => {
  const idx = selectedTripKeys.value.indexOf(key);
  if (idx !== -1) {
    selectedTripKeys.value.splice(idx, 1);
  } else {
    selectedTripKeys.value.push(key);
  }
};

const hasActiveFilters = computed(() => {
  return (
    statusFilter.value !== 'all' ||
    timeFilterYear.value !== 'all' ||
    selectedCountry.value !== '' ||
    selectedDepartment.value !== '' ||
    selectedFunding.value !== '' ||
    searchQuery.value.trim() !== ''
  );
});

const resetFilters = () => {
  statusFilter.value = 'all';
  timeFilterYear.value = 'all';
  selectedCountry.value = '';
  selectedDepartment.value = '';
  selectedFunding.value = '';
  searchQuery.value = '';
  currentPage.value = 1;
};

// Column Picker
const resetDefaultColumns = () => {
  selectedColIds.value = DEFAULT_TRIP_COLUMNS.map((c) => c.id);
};

const saveColumnSelection = () => {
  localStorage.setItem('trips_dashboard_columns', JSON.stringify(selectedColIds.value));
  isColumnPickerOpen.value = false;
};

// Actions
const openPersonnelDetail = (trip) => {
  if (trip.rawPerson) {
    activePersonData.value = JSON.parse(JSON.stringify(trip.rawPerson));
    isPersonnelDialogOpen.value = true;
  }
};

const openAddTripDialog = () => {
  activePersonData.value = {
    trips: [{ departureDate: '', countryName: '', decisionNumber: '', fundingName: '' }],
  };
  isPersonnelDialogOpen.value = true;
};

const handlePersonnelSaved = async () => {
  await personnelStore.fetchPersonnel();
  isPersonnelDialogOpen.value = false;
};

// Excel Export
const exportExcel = () => {
  const exportData = filteredList.value.map((t, idx) => {
    const row = {
      'STT': idx + 1,
      'Họ và tên': t.personnelName,
      'Đối tượng': t.isRelative ? 'Thân nhân' : 'Cán bộ',
      'Chức vụ': t.position,
      'Đơn vị công tác': t.departmentName,
      'Quốc gia': t.countryName,
      'Ngày xuất cảnh': formatDisplayDate(t.departureDate),
      'Ngày nhập cảnh': formatDisplayDate(t.arrivalDate),
      'Số quyết định': t.decisionNumber,
      'Nguồn kinh phí': t.fundingName,
      'Mục đích': t.purpose,
      'Trạng thái': getStatusLabel(t),
    };
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách Chuyến đi');
  XLSX.writeFile(wb, `Danh_sach_chuyen_di_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

onMounted(() => {
  const savedCols = localStorage.getItem('trips_dashboard_columns');
  if (savedCols) {
    try {
      selectedColIds.value = JSON.parse(savedCols);
    } catch (e) {}
  }
});
</script>

<style scoped>
.badge-code-cd {
  background: #1e3a8a;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 6px;
}

.btn-action-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-action-outline:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

/* Quick Stat Cards */
.quick-stat-card {
  flex: 1;
  min-width: 170px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}
.quick-stat-card:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}
.quick-stat-card.stat-active {
  border-color: #1e3a8a;
  background: #eff6ff;
  box-shadow: 0 1px 3px rgba(30, 58, 138, 0.12);
}

.dot-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot-blue { background: #2563eb; }
.dot-green { background: #16a34a; }
.dot-amber { background: #d97706; }
.dot-red { background: #dc2626; }

.stat-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
}
.stat-number {
  font-size: 1.15rem;
  font-weight: 700;
}
.num-blue { color: #1e3a8a; }
.num-green { color: #15803d; }
.num-amber { color: #b45309; }
.num-red { color: #b91c1c; }

/* Filter Selects */
.filter-select {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  font-size: 0.82rem;
  color: #334155;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
}
.filter-select:focus {
  border-color: #1e3a8a;
}

/* Trips Table */
.trips-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.trips-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}
.sortable-header {
  cursor: pointer;
  user-select: none;
}
.sortable-header:hover {
  background: #f1f5f9;
}
.trips-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}
.trips-table tr:hover {
  background: #f8fafc;
}
.trips-table tr.row-selected {
  background: #f0fdf4;
}

/* Status Pills */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-completed {
  background: #dcfce7;
  color: #15803d;
}
.status-completed .status-dot {
  background: #16a34a;
}
.status-abroad {
  background: #fef3c7;
  color: #b45309;
}
.status-abroad .status-dot {
  background: #d97706;
}
.status-overdue {
  background: #fee2e2;
  color: #b91c1c;
}
.status-overdue .status-dot {
  background: #dc2626;
}

.badge-role-tn {
  background: #f3e8ff;
  color: #7c3aed;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}
.code-badge-decision {
  background: #f1f5f9;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}
.badge-funding {
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
