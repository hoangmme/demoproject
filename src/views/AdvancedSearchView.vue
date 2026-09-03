<template>
  <div class="app-content advanced-search-layout">
    <!-- CỘT TRÁI: BỘ LỌC ĐÃ LƯU -->
    <aside class="saved-presets-sidebar">
      <div class="presets-header">
        <div>
          <h3 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
            <i class="pi pi-bookmark" style="color: #2563eb;"></i>
            Bộ lọc đã lưu
          </h3>
          <span style="font-size: 0.72rem; color: #64748b; font-weight: 600;">
            {{ savedPresets.length }} bộ lọc
          </span>
        </div>
        <button
          type="button"
          class="btn-new-preset"
          @click="createNewPreset"
          title="Tạo mới bộ lọc"
        >
          <i class="pi pi-plus"></i>
          <span>Mới</span>
        </button>
      </div>

      <div class="presets-list">
        <div
          v-for="(preset, pIdx) in savedPresets"
          :key="preset.id || pIdx"
          class="preset-item"
          :class="{ 'preset-active': activePresetId === preset.id }"
          @click="applyPreset(preset)"
        >
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
            <div style="font-size: 0.84rem; font-weight: 700; color: #1e293b; line-height: 1.35;">
              {{ preset.name }}
            </div>
            <button
              type="button"
              class="preset-delete-btn"
              @click.stop="deletePreset(preset, pIdx)"
              title="Xóa bộ lọc này"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>

          <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 0.72rem; color: #64748b; flex-wrap: wrap;">
            <span class="badge-scope" :class="preset.isShared ? 'scope-shared' : 'scope-private'">
              {{ preset.isShared ? 'Dùng chung' : 'Riêng của tôi' }}
            </span>
            <span>· {{ (preset.criteria || []).length }} điều kiện</span>
            <span v-if="preset.updatedAt">· {{ preset.updatedAt }}</span>
          </div>
        </div>

        <div v-if="savedPresets.length === 0" style="text-align: center; padding: 2rem 1rem; color: #94a3b8; font-size: 0.8rem;">
          Chưa có bộ lọc nào. Hãy nhập điều kiện và bấm <b>"Lưu bộ lọc"</b>.
        </div>
      </div>

      <div class="presets-footer-note">
        <i class="pi pi-info-circle" style="color: #0284c7; font-size: 0.9rem; flex-shrink: 0; margin-top: 2px;"></i>
        <span>Bộ lọc <b>Dùng chung</b> cho cả phòng thấy. Bộ lọc <b>Riêng của tôi</b> chỉ bạn thấy.</span>
      </div>
    </aside>

    <!-- KHU VỰC CHÍNH: QUERY BUILDER & KẾT QUẢ -->
    <main class="search-main-content">
      <!-- Breadcrumb & Title -->
      <div class="app-card" style="margin-bottom: 1rem; padding: 1.25rem;">
        <div style="font-size: 0.74rem; color: #64748b; margin-bottom: 4px; font-weight: 500;">
          Tra cứu / Tìm kiếm nâng cao
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 1rem;">
          <span class="badge-code">TK-06</span>
          <h1 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0;">
            Tìm kiếm nâng cao
          </h1>
        </div>

        <!-- Logic Connector Switch (VÀ / HOẶC) -->
        <div class="logic-connector-bar">
          <span style="font-size: 0.82rem; font-weight: 600; color: #334155;">Nối các điều kiện bằng:</span>
          <div class="logic-toggle-group">
            <button
              type="button"
              class="logic-btn"
              :class="{ 'logic-active': logicOperator === 'AND' }"
              @click="logicOperator = 'AND'"
            >
              VÀ
            </button>
            <button
              type="button"
              class="logic-btn"
              :class="{ 'logic-active': logicOperator === 'OR' }"
              @click="logicOperator = 'OR'"
            >
              HOẶC
            </button>
          </div>
          <span style="font-size: 0.78rem; color: #64748b; font-style: italic;">
            {{ logicOperator === 'AND' ? 'Bản ghi phải khớp tất cả điều kiện' : 'Bản ghi khớp ít nhất một điều kiện' }}
          </span>
        </div>

        <!-- Criteria List (Rows) -->
        <div class="criteria-list">
          <div
            v-for="(row, rIdx) in criteria"
            :key="rIdx"
            class="criteria-row"
          >
            <!-- Prefix: Khi / VÀ / HOẶC -->
            <div class="row-prefix">
              {{ rIdx === 0 ? 'Khi' : (logicOperator === 'AND' ? 'VÀ' : 'HOẶC') }}
            </div>

            <!-- Field Selector: FULL DYNAMIC COLUMNS FROM CONFIGURATION -->
            <div style="flex: 1; min-width: 200px;">
              <select v-model="row.field" class="builder-select" @change="onFieldChange(row)">
                <optgroup
                  v-for="group in allSearchableGroups"
                  :key="group.name"
                  :label="`── ${group.name} ──`"
                >
                  <option
                    v-for="(col, cIdx) in group.columns"
                    :key="col.id"
                    :value="col.id"
                  >
                    Cột {{ col.colIndex || (cIdx + 1) }}: {{ col.label }}
                  </option>
                </optgroup>
              </select>
            </div>

            <!-- Operator Selector -->
            <div style="width: 175px; flex-shrink: 0;">
              <select v-model="row.operator" class="builder-select">
                <option value="equals">là (khớp chính xác)</option>
                <option value="contains">chứa từ khóa</option>
                <option value="not_contains">không chứa</option>
                <option value="has_value">có dữ liệu (khác rỗng)</option>
                <option value="empty">để trống (chưa có)</option>
                <option value="before_date">trước ngày</option>
                <option value="after_date">sau ngày</option>
                <option value="gte">lớn hơn hoặc bằng (&ge;)</option>
                <option value="lte">nhỏ hơn hoặc bằng (&le;)</option>
              </select>
            </div>

            <!-- Value Input (Hidden if operator is empty / has_value) -->
            <div style="flex: 1; min-width: 180px;" v-if="row.operator !== 'empty' && row.operator !== 'has_value'">
              <!-- Dropdown for funding -->
              <select
                v-if="row.field === 'nguon_kinh_phi' || row.field === 'fundingName' || row.field === 'funding'"
                v-model="row.value"
                class="builder-select"
              >
                <option value="">-- Chọn kinh phí --</option>
                <option value="Ngân sách nhà nước">Ngân sách nhà nước</option>
                <option value="Tự túc">Tự túc</option>
                <option value="Tài trợ">Tài trợ</option>
                <option value="Khác">Khác</option>
              </select>

              <!-- Dropdown for presence status -->
              <select
                v-else-if="row.field === 'trang_thai_hien_dien' || row.field === 'presenceStatus'"
                v-model="row.value"
                class="builder-select"
              >
                <option value="Đang ở nước ngoài">Đang ở nước ngoài</option>
                <option value="Đã về nước">Đã về nước</option>
                <option value="Chưa khởi hành">Chưa khởi hành</option>
              </select>

              <!-- Date Input -->
              <input
                v-else-if="row.operator === 'before_date' || row.operator === 'after_date'"
                v-model="row.value"
                type="text"
                placeholder="DD/MM/YYYY"
                class="builder-input"
              />

              <!-- Number input -->
              <input
                v-else-if="row.field === 'trip_count_year' || row.operator === 'gte' || row.operator === 'lte'"
                v-model="row.value"
                type="number"
                placeholder="Nhập số..."
                class="builder-input"
              />

              <!-- General text input -->
              <input
                v-else
                v-model="row.value"
                type="text"
                placeholder="Nhập giá trị tìm kiếm..."
                class="builder-input"
              />
            </div>

            <!-- Remove Row Button -->
            <button
              type="button"
              class="btn-remove-row"
              @click="removeCriteriaRow(rIdx)"
              :disabled="criteria.length <= 1"
              title="Xóa điều kiện này"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>

        <!-- Action Bottom Bar -->
        <div class="builder-actions-bar">
          <button
            type="button"
            class="btn-builder-secondary"
            @click="addCriteriaRow"
          >
            <i class="pi pi-plus"></i>
            <span>Thêm điều kiện</span>
          </button>

          <div style="display: flex; align-items: center; gap: 8px; flex: 1; justify-content: flex-end; flex-wrap: wrap;">
            <!-- Ô đặt tên cho bộ lọc -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 0.76rem; font-weight: 700; color: #475569; white-space: nowrap;">
                🏷️ Tên bộ lọc:
              </span>
              <input
                v-model="presetSaveName"
                placeholder="Nhập tên bộ lọc (VD: Quá hạn quý III...)"
                class="builder-input"
                style="width: 230px; font-size: 0.78rem;"
              />
            </div>

            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 600; color: #334155; cursor: pointer;">
              <input
                type="checkbox"
                v-model="presetIsShared"
                style="accent-color: #2563eb; width: 15px; height: 15px;"
              />
              Dùng chung
            </label>

            <button
              type="button"
              class="btn-builder-secondary"
              @click="saveCurrentPreset"
              title="Lưu các điều kiện thành bộ lọc để tái sử dụng"
            >
              <i class="pi pi-save"></i>
              <span>Lưu bộ lọc này</span>
            </button>

            <button
              type="button"
              class="btn-builder-primary"
              @click="executeSearch"
            >
              <i class="pi pi-search"></i>
              <span>Tìm kiếm</span>
            </button>
          </div>
        </div>
      </div>

      <!-- KẾT QUẢ TÌM KIẾM -->
      <div class="app-card" style="padding: 1.25rem;">
        <!-- Header summary & Export button (Unified PDF/Word Export) -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
          <div style="font-size: 0.88rem; color: #0f172a;">
            Tìm được <b style="color: #2563eb; font-size: 1rem;">{{ searchResults.length }}</b> bản ghi
            <span style="color: #64748b; font-size: 0.8rem; margin-left: 6px;">
              · khớp {{ criteria.length }} điều kiện, nối bằng {{ logicOperator === 'AND' ? 'VÀ' : 'HOẶC' }}
            </span>
          </div>

          <div style="display: flex; gap: 8px;">
            <!-- Xuất PDF / Word chung của hệ thống -->
            <button
              type="button"
              class="btn-action-primary"
              @click="isExportDocxDialogOpen = true"
              :disabled="searchResults.length === 0"
              title="Xuất Hồ sơ (PDF / Word)"
            >
              <i class="pi pi-file-pdf"></i>
              <span>Xuất Hồ sơ (PDF / Word)</span>
            </button>
          </div>
        </div>

        <!-- Results Table -->
        <div class="table-container" style="overflow-x: auto;">
          <table class="advanced-table">
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">STT</th>
                <th style="min-width: 170px;">HỌ VÀ TÊN</th>
                <th style="min-width: 140px;">CHỨC VỤ</th>
                <th style="min-width: 150px;">ĐƠN VỊ</th>
                <th style="min-width: 130px;">QUỐC GIA</th>
                <th style="min-width: 110px;">XUẤT CẢNH</th>
                <th style="min-width: 220px; color: #b91c1c;">LÝ DO KHỚP ĐIỀU KIỆN</th>
                <th style="width: 100px; text-align: center;">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in searchResults" :key="item.uniqueKey || idx">
                <td style="text-align: center; color: #64748b; font-weight: 500;">
                  {{ idx + 1 }}
                </td>
                <td>
                  <strong style="color: #0f172a; font-weight: 600; display: block;">
                    {{ item.personnelName }}
                  </strong>
                  <span v-if="item.personnelCode" style="font-size: 0.7rem; color: #64748b;">
                    {{ item.personnelCode }}
                  </span>
                </td>
                <td style="color: #334155;">{{ item.position || '-' }}</td>
                <td style="color: #334155;">{{ item.departmentName || '-' }}</td>
                <td style="font-weight: 600; color: #1e293b;">{{ item.countryName || '-' }}</td>
                <td style="color: #334155;">{{ item.departureDate || '-' }}</td>
                <td>
                  <div class="match-reasons-wrapper">
                    <span
                      v-for="(reason, rk) in item.matchReasons"
                      :key="rk"
                      class="match-reason-pill"
                    >
                      <i class="pi pi-info-circle"></i>
                      {{ reason }}
                    </span>
                  </div>
                </td>
                <td style="text-align: center; white-space: nowrap;">
                  <button
                    type="button"
                    class="btn-table-action btn-table-info"
                    @click="openDetail(item)"
                    title="Xem chi tiết hồ sơ cán bộ"
                  >
                    <i class="pi pi-user-edit"></i>
                    <span>Chi tiết</span>
                  </button>
                </td>
              </tr>

              <tr v-if="searchResults.length === 0">
                <td colspan="8" style="text-align: center; padding: 2.5rem; color: #94a3b8; font-size: 0.85rem;">
                  <i class="pi pi-search" style="font-size: 1.5rem; display: block; margin-bottom: 8px; opacity: 0.5;"></i>
                  Không tìm thấy bản ghi nào khớp với điều kiện tìm kiếm. Hãy thử điều chỉnh lại bộ lọc!
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Personnel Dialog -->
    <PersonnelDialog
      v-model="isPersonnelDialogOpen"
      :personData="activePersonData"
      @saved="handlePersonnelSaved"
    />

    <!-- Advanced PDF / Word Export Dialog (Unified Across System) -->
    <AdvancedDocxExportDialog
      v-model="isExportDocxDialogOpen"
      :selectedPersonnel="selectedPersonnelForExport"
      :allPersonnel="selectedPersonnelForExport"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePersonnelStore } from '@/stores/personnel';
import { getAppSettings, saveAppSettings } from '@/api/settings';
import { parseDateObj, formatDate, computePresenceStatus, computeTripPresence } from '@/utils/formatters';
import PersonnelDialog from '@/components/personnel/PersonnelDialog.vue';
import AdvancedDocxExportDialog from '@/components/common/AdvancedDocxExportDialog.vue';

const personnelStore = usePersonnelStore();

// Logic Operator (AND / OR)
const logicOperator = ref('AND');

// Criteria Rows
const criteria = ref([
  { field: 'ngay_nhap_canh', operator: 'empty', value: '' },
  { field: 'ngay_xuat_canh', operator: 'before_date', value: '24/08/2026' },
  { field: 'muc_dich_xuat_canh', operator: 'contains', value: 'Công tác' },
]);

// Presets
const DEFAULT_PRESETS = [
  {
    id: 'preset_overdue',
    name: 'Quá hạn về nước',
    isShared: true,
    logic: 'AND',
    updatedAt: '20/8/2026',
    criteria: [
      { field: 'isOverdue', operator: 'equals', value: 'true' },
    ],
  },
  {
    id: 'preset_no_official_passport',
    name: 'Chưa nộp hộ chiếu công vụ',
    isShared: true,
    logic: 'AND',
    updatedAt: '18/8/2026',
    criteria: [
      { field: 'hcCongVu', operator: 'empty', value: '' },
      { field: 'muc_dich_xuat_canh', operator: 'contains', value: 'Công tác' },
    ],
  },
  {
    id: 'preset_china_2026',
    name: 'Đi Trung Quốc năm 2026',
    isShared: true,
    logic: 'AND',
    updatedAt: '15/8/2026',
    criteria: [
      { field: 'quoc_gia_xuat_canh', operator: 'contains', value: 'Trung Quốc' },
      { field: 'ngay_xuat_canh', operator: 'contains', value: '2026' },
    ],
  },
  {
    id: 'preset_has_relatives',
    name: 'Có thân nhân ở nước ngoài',
    isShared: true,
    logic: 'AND',
    updatedAt: '10/8/2026',
    criteria: [
      { field: 'hasRelatives', operator: 'equals', value: 'true' },
    ],
  },
  {
    id: 'preset_private_self_funded',
    name: 'Việc riêng, kinh phí tự túc',
    isShared: false,
    logic: 'AND',
    updatedAt: '05/8/2026',
    criteria: [
      { field: 'muc_dich_xuat_canh', operator: 'contains', value: 'Việc riêng' },
      { field: 'nguon_kinh_phi', operator: 'contains', value: 'Tự túc' },
    ],
  },
  {
    id: 'preset_frequent_flyer',
    name: 'Đi từ 3 lần trở lên trong năm',
    isShared: false,
    logic: 'AND',
    updatedAt: '01/8/2026',
    criteria: [
      { field: 'trip_count_year', operator: 'gte', value: '3' },
    ],
  },
];

const savedPresets = ref([...DEFAULT_PRESETS]);
const activePresetId = ref('preset_overdue');
const presetSaveName = ref('');
const presetIsShared = ref(true);

const isPersonnelDialogOpen = ref(false);
const isExportDocxDialogOpen = ref(false);
const activePersonData = ref(null);
const searchResults = ref([]);

// BUILD FULL DYNAMIC SEARCHABLE COLUMNS BASED ON COLUMN CONFIGURATION
const allSearchableGroups = computed(() => {
  const groups = [];

  // Group 1: Khối B - Chuyến đi (From importMappingTrips)
  const tripCols = [];
  const seenTrip = new Set();

  tripCols.push({ id: 'trang_thai_hien_dien', label: 'Trạng thái hiện diện (Trong nước / Nước ngoài)' });
  tripCols.push({ id: 'isOverdue', label: 'Trạng thái Quá hạn chưa về' });
  tripCols.push({ id: 'trip_count_year', label: 'Số lần xuất cảnh trong năm' });
  seenTrip.add('trang_thai_hien_dien');
  seenTrip.add('isOverdue');
  seenTrip.add('trip_count_year');

  (personnelStore.importMappingTrips || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt' && !seenTrip.has(c.id)) {
        seenTrip.add(c.id);
        tripCols.push({ id: c.id, label: c.label || c.id });
      }
    });
  });

  groups.push({
    name: '1. Thông tin Chuyến đi (Khối B)',
    columns: tripCols,
  });

  // Group 2: Khối A - Cán bộ (From importMappingPersonnel)
  const pCols = [];
  const seenP = new Set();
  pCols.push({ id: 'name', label: 'Họ và tên Cán bộ' });
  pCols.push({ id: 'code', label: 'Mã Cán bộ' });
  pCols.push({ id: 'cccd', label: 'Số CCCD Cán bộ' });
  pCols.push({ id: 'departmentName', label: 'Đơn vị công tác' });
  pCols.push({ id: 'position', label: 'Chức vụ' });
  pCols.push({ id: 'hasRelatives', label: 'Có thân nhân ở nước ngoài' });
  seenP.add('name');
  seenP.add('code');
  seenP.add('cccd');
  seenP.add('departmentName');
  seenP.add('position');
  seenP.add('hasRelatives');

  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt' && !seenP.has(c.id)) {
        seenP.add(c.id);
        pCols.push({ id: c.id, label: c.label || c.id });
      }
    });
  });

  groups.push({
    name: '2. Thông tin Cán bộ (Khối A)',
    columns: pCols,
  });

  // Group 3: Khối C - Thân nhân (From importMappingRelative)
  const relCols = [];
  const seenRel = new Set();
  relCols.push({ id: 'relativeName', label: 'Họ tên Thân nhân' });
  relCols.push({ id: 'relationshipName', label: 'Mối quan hệ thân nhân' });
  relCols.push({ id: 'relCountryName', label: 'Quốc gia thân nhân cư trú' });
  seenRel.add('relativeName');
  seenRel.add('relationshipName');
  seenRel.add('relCountryName');

  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt' && !seenRel.has(c.id)) {
        seenRel.add(c.id);
        relCols.push({ id: c.id, label: c.label || c.id });
      }
    });
  });

  groups.push({
    name: '3. Thông tin Thân nhân (Khối C)',
    columns: relCols,
  });

  return groups;
});

const resolvePersonFromSearchItem = (item) => {
  if (!item) return null;
  if (item.rawPerson && item.rawPerson.id) return item.rawPerson;
  if (item.personnelId) {
    const found = (personnelStore.personnelList || []).find((p) => p.id === item.personnelId);
    if (found) return found;
  }
  if (item.personnelCode) {
    const found = (personnelStore.personnelList || []).find((p) => p.code === item.personnelCode);
    if (found) return found;
  }
  const cccd = item.parentCccd || item.cccdparent || (!item.isRelative ? item.cccd : '');
  if (cccd) {
    const found = personnelStore.findPersonByCccd(cccd);
    if (found) return found;
  }
  if (item.id && !item.isRelative) {
    const found = (personnelStore.personnelList || []).find((p) => p.id === item.id);
    if (found) return found;
  }
  return null;
};

const selectedPersonnelForExport = computed(() => {
  const list = [];
  const seenIds = new Set();
  searchResults.value.forEach((item) => {
    const p = resolvePersonFromSearchItem(item);
    if (p && p.id && !seenIds.has(p.id)) {
      seenIds.add(p.id);
      list.push(p);
    }
  });
  return list;
});

const createNewPreset = () => {
  activePresetId.value = '';
  presetSaveName.value = 'Bộ lọc mới ' + (savedPresets.value.length + 1);
  presetIsShared.value = true;
  criteria.value = [
    { field: 'quoc_gia_xuat_canh', operator: 'contains', value: '' },
  ];
};

const addCriteriaRow = () => {
  criteria.value.push({
    field: 'quoc_gia_xuat_canh',
    operator: 'contains',
    value: '',
  });
};

const removeCriteriaRow = (idx) => {
  if (criteria.value.length > 1) {
    criteria.value.splice(idx, 1);
  }
};

const onFieldChange = (row) => {
  if (row.field === 'ngay_nhap_canh' || row.field === 'hcCongVu') {
    row.operator = 'empty';
    row.value = '';
  } else if (row.field === 'isOverdue' || row.field === 'hasRelatives') {
    row.operator = 'equals';
    row.value = 'true';
  } else if (row.field === 'trip_count_year') {
    row.operator = 'gte';
    row.value = '3';
  } else {
    row.operator = 'contains';
    row.value = '';
  }
};

// Build flat list of all records (personnel trips & profile)
const buildDataset = () => {
  const dataset = [];
  const pList = personnelStore.personnelList || [];
  const now = new Date();

  pList.forEach((p) => {
    let custom = {};
    if (p.custom_data) {
      try {
        custom = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
      } catch (e) {}
    }

    const pTrips = Array.isArray(p.trips || custom.trips) ? (p.trips || custom.trips) : [];
    const pRelatives = Array.isArray(p.relatives || custom.relatives) ? (p.relatives || custom.relatives) : [];

    const tripCount2026 = pTrips.filter((t) => {
      const d = parseDateObj(t.ngay_xuat_canh || t.departureDate || t.custom_data?.departureDate);
      return d && d.getFullYear() === now.getFullYear();
    }).length;

    let validTripsCount = 0;

    pTrips.forEach((t, tIdx) => {
      let tCustom = {};
      if (t.custom_data) {
        try {
          tCustom = typeof t.custom_data === 'string' ? JSON.parse(t.custom_data) : t.custom_data;
        } catch (e) {}
      }

      const depDate = t.ngay_xuat_canh || tCustom.ngay_xuat_canh || t.ngayDi || tCustom.ngayDi || t.departureDate || tCustom.departureDate || '';
      const arrDate = t.ngay_nhap_canh || tCustom.ngay_nhap_canh || t.ngayVe || tCustom.ngayVe || t.arrivalDate || tCustom.arrivalDate || '';
      const appArrDate = t.thoi_gian_duyet_ve || tCustom.thoi_gian_duyet_ve || t.thoiGianDuyetVe || t.approvedArrivalDate || tCustom.approvedArrivalDate || '';
      const extDate = t.thoi_gian_duyet_gia_han || tCustom.thoi_gian_duyet_gia_han || t.gia_han_den_ngay || tCustom.gia_han_den_ngay || t.approvedExtensionDate || tCustom.approvedExtensionDate || '';
      const decNum = t.so_quyet_dinh || tCustom.so_quyet_dinh || t.decisionNumber || tCustom.decisionNumber || t.decision || '';
      const cName = t.quoc_gia_xuat_canh || tCustom.quoc_gia_xuat_canh || t.countryName || tCustom.countryName || t.country || '';
      const fName = t.nguon_kinh_phi || tCustom.nguon_kinh_phi || t.fundingName || t.funding || t.kinh_phi || t.nguonKinhPhi || t.kinhPhi || tCustom.fundingName || tCustom.funding || '';
      const purp = t.muc_dich_xuat_canh || tCustom.muc_dich_xuat_canh || t.purpose || tCustom.purpose || '';

      // Skip empty/dummy placeholder trip objects
      if (!cName && !depDate && !arrDate && !decNum && !purp) {
        return;
      }
      validTripsCount++;

      const presence = computeTripPresence({
        departureDate: depDate,
        arrivalDate: arrDate,
        approvedArrivalDate: appArrDate,
        approvedExtensionDate: extDate,
        custom_data: tCustom,
      });

      dataset.push({
        ...p.custom_data,
        ...tCustom,
        ...t,
        uniqueKey: t.id || `trip_${p.id}_${tIdx}`,
        rawPerson: p,
        rawTrip: t,
        personnelId: p.id,
        personnelCode: p.code || '',
        personnelName: p.name || 'Cán bộ',
        position: p.positionName || p.position || '',
        departmentName: p.departmentName || (p.departmentId ? personnelStore.getDepartmentName(p.departmentId) : '') || '',
        countryName: cName || '-',
        quoc_gia_xuat_canh: cName,
        departureDate: depDate ? formatDate(depDate) : '-',
        ngay_xuat_canh: depDate ? formatDate(depDate) : '',
        arrivalDate: arrDate ? formatDate(arrDate) : '-',
        ngay_nhap_canh: arrDate ? formatDate(arrDate) : '',
        decisionNumber: decNum || '-',
        so_quyet_dinh: decNum,
        fundingName: fName || '-',
        nguon_kinh_phi: fName,
        purpose: purp || '-',
        muc_dich_xuat_canh: purp,
        trang_thai_hien_dien: presence.label,
        isOverdue: presence.isOverdue,
        overdueDays: presence.overdueDays,
        hasRelatives: pRelatives.length > 0,
        trip_count_year: tripCount2026,
        hcCaNhan: p.hcCaNhan || p.custom_data?.hcCaNhan || '',
        hcCongVu: p.hcCongVu || p.custom_data?.hcCongVu || '',
        kqThamTra: p.kqThamTra || p.custom_data?.kqThamTra || '',
        cccd: p.cccd || p.cccdparent || '',
      });
    });

    if (validTripsCount === 0) {
      // Personnel without trips
      dataset.push({
        ...p.custom_data,
        ...p,
        uniqueKey: `person_${p.id}`,
        rawPerson: p,
        personnelId: p.id,
        personnelCode: p.code || '',
        personnelName: p.name || 'Cán bộ',
        position: p.positionName || p.position || '',
        departmentName: p.departmentName || (p.departmentId ? personnelStore.getDepartmentName(p.departmentId) : '') || '',
        countryName: '-',
        departureDate: '-',
        arrivalDate: '-',
        decisionNumber: '-',
        fundingName: '-',
        purpose: '-',
        trang_thai_hien_dien: 'Trong nước',
        isOverdue: false,
        hasRelatives: pRelatives.length > 0,
        trip_count_year: 0,
        hcCaNhan: p.hcCaNhan || p.custom_data?.hcCaNhan || '',
        hcCongVu: p.hcCongVu || p.custom_data?.hcCongVu || '',
        kqThamTra: p.kqThamTra || p.custom_data?.kqThamTra || '',
        cccd: p.cccd || p.cccdparent || '',
      });
    }
  });

  return dataset;
};

// Check if a single item matches a single criterion
const getItemFieldValue = (item, f) => {
  if (!item || !f) return '';

  if (f === 'isOverdue') return item.isOverdue ? 'true' : 'false';
  if (f === 'hasRelatives') return item.hasRelatives ? 'true' : 'false';
  if (f === 'trip_count_year') return item.trip_count_year ?? 0;
  if (f === 'trang_thai_hien_dien') return item.trang_thai_hien_dien || '';

  // Direct check on item
  let raw = item[f];
  if (raw === undefined || raw === null || raw === '' || raw === '-') {
    raw = item.rawTrip?.[f];
  }
  if (raw === undefined || raw === null || raw === '' || raw === '-') {
    raw = item.rawPerson?.[f];
  }
  if (raw === undefined || raw === null || raw === '' || raw === '-') {
    raw = item.custom_data?.[f];
  }
  if (raw === undefined || raw === null || raw === '' || raw === '-') {
    if (item.rawTrip?.custom_data) {
      try {
        const cd = typeof item.rawTrip.custom_data === 'string' ? JSON.parse(item.rawTrip.custom_data) : item.rawTrip.custom_data;
        raw = cd?.[f];
      } catch (e) {}
    }
  }
  if (raw === undefined || raw === null || raw === '' || raw === '-') {
    if (item.rawPerson?.custom_data) {
      try {
        const cd = typeof item.rawPerson.custom_data === 'string' ? JSON.parse(item.rawPerson.custom_data) : item.rawPerson.custom_data;
        raw = cd?.[f];
      } catch (e) {}
    }
  }

  // Fallback aliases for known semantic fields
  if (raw === undefined || raw === null || raw === '' || raw === '-') {
    if (f === 'so_quyet_dinh' || f === 'so_qd_di' || f === 'decisionNumber' || f === 'soQuyetDinh') {
      raw = item.decisionNumber || item.rawTrip?.decisionNumber || item.so_quyet_dinh || item.rawTrip?.so_quyet_dinh;
    } else if (f === 'quoc_gia_xuat_canh' || f === 'countryName' || f === 'country') {
      raw = item.countryName || item.rawTrip?.countryName || item.rawTrip?.quoc_gia_xuat_canh || item.country;
    } else if (f === 'nguon_kinh_phi' || f === 'fundingName' || f === 'funding' || f === 'funding2') {
      raw = item.fundingName || item.rawTrip?.fundingName || item.rawTrip?.nguon_kinh_phi || item.funding || item.funding2;
    } else if (f === 'muc_dich_xuat_canh' || f === 'purpose') {
      raw = item.purpose || item.rawTrip?.purpose || item.rawTrip?.muc_dich_xuat_canh;
    } else if (f === 'ngay_xuat_canh' || f === 'departureDate') {
      raw = item.departureDate || item.rawTrip?.departureDate || item.rawTrip?.ngay_xuat_canh;
    } else if (f === 'ngay_nhap_canh' || f === 'arrivalDate') {
      raw = item.arrivalDate || item.rawTrip?.arrivalDate || item.rawTrip?.ngay_nhap_canh;
    } else if (f === 'ngay_ban_hanh' || f === 'decisionDate') {
      raw = item.decisionDate || item.rawTrip?.decisionDate || item.rawTrip?.ngay_ban_hanh;
    } else if (f === 'co_quan_ban_hanh' || f === 'decisionIssuer') {
      raw = item.decisionIssuer || item.rawTrip?.decisionIssuer || item.rawTrip?.co_quan_ban_hanh;
    } else if (f === 'cccd' || f === 'cccdparent') {
      raw = item.cccd || item.cccdparent || item.rawPerson?.cccd || item.rawPerson?.cccdparent;
    } else if (f === 'name' || f === 'personnelName') {
      raw = item.personnelName || item.name || item.rawPerson?.name;
    }
  }

  if (raw === undefined || raw === null || raw === '-') return '';
  if (typeof raw === 'object') {
    if (Array.isArray(raw)) return raw.map((x) => (typeof x === 'object' ? JSON.stringify(x) : x)).join(', ');
    return JSON.stringify(raw);
  }
  return String(raw).trim();
};

const testCondition = (item, crit) => {
  const f = crit.field;
  const op = crit.operator;
  const val = String(crit.value || '').trim().toLowerCase();

  const itemVal = getItemFieldValue(item, f);

  // Get field label for clear reason badge
  let fieldLabel = f;
  for (const g of allSearchableGroups.value) {
    const found = g.columns.find((c) => c.id === f);
    if (found) {
      fieldLabel = found.label;
      break;
    }
  }

  // Evaluate Operator
  if (op === 'empty') {
    const isEmp = !itemVal || itemVal === '-' || itemVal === 'Chưa rõ';
    return { matches: isEmp, reason: `${fieldLabel}: để trống` };
  }
  if (op === 'has_value') {
    const hasV = !!itemVal && itemVal !== '-' && itemVal !== 'Chưa rõ';
    return { matches: hasV, reason: `${fieldLabel}: ${itemVal}` };
  }
  if (op === 'equals') {
    const eq = String(itemVal).toLowerCase() === val;
    let reasonText = `${fieldLabel}: ${itemVal}`;
    if (f === 'hasRelatives') reasonText = 'Có thân nhân ở nước ngoài';
    if (f === 'isOverdue') reasonText = 'Quá hạn chưa về';
    return { matches: eq, reason: reasonText };
  }
  if (op === 'contains') {
    const cnt = String(itemVal).toLowerCase().includes(val);
    return { matches: cnt, reason: `${fieldLabel}: ${itemVal}` };
  }
  if (op === 'not_contains') {
    const ncnt = !String(itemVal).toLowerCase().includes(val);
    return { matches: ncnt, reason: `${fieldLabel} không chứa "${val}"` };
  }
  if (op === 'before_date') {
    const dItem = parseDateObj(itemVal);
    const dTarget = parseDateObj(val);
    const bef = dItem && dTarget ? dItem < dTarget : false;
    return { matches: bef, reason: `${itemVal} trước ${val}` };
  }
  if (op === 'after_date') {
    const dItem = parseDateObj(itemVal);
    const dTarget = parseDateObj(val);
    const aft = dItem && dTarget ? dItem > dTarget : false;
    return { matches: aft, reason: `${itemVal} sau ${val}` };
  }
  if (op === 'gte') {
    const g = Number(itemVal) >= Number(val);
    return { matches: g, reason: `${fieldLabel}: ${itemVal} (>= ${val})` };
  }
  if (op === 'lte') {
    const l = Number(itemVal) <= Number(val);
    return { matches: l, reason: `${fieldLabel}: ${itemVal} (<= ${val})` };
  }

  return { matches: true, reason: '' };
};

const executeSearch = () => {
  const dataset = buildDataset();
  const matched = [];

  dataset.forEach((item) => {
    const reasons = [];
    let isOverallMatch = logicOperator.value === 'AND';

    for (const crit of criteria.value) {
      const res = testCondition(item, crit);
      if (logicOperator.value === 'AND') {
        if (!res.matches) {
          isOverallMatch = false;
          break;
        } else if (res.reason) {
          reasons.push(res.reason);
        }
      } else {
        // OR
        if (res.matches) {
          isOverallMatch = true;
          if (res.reason) reasons.push(res.reason);
        }
      }
    }

    if (isOverallMatch) {
      matched.push({
        ...item,
        matchReasons: reasons.length > 0 ? reasons : ['Khớp điều kiện'],
      });
    }
  });

  searchResults.value = matched;
};

const applyPreset = (preset) => {
  activePresetId.value = preset.id;
  logicOperator.value = preset.logic || 'AND';
  criteria.value = JSON.parse(JSON.stringify(preset.criteria || []));
  presetSaveName.value = preset.name;
  presetIsShared.value = Boolean(preset.isShared);
  executeSearch();
};

const saveCurrentPreset = async () => {
  if (!presetSaveName.value.trim()) {
    alert('Vui lòng nhập tên cho bộ lọc cần lưu!');
    return;
  }

  const nameToSave = presetSaveName.value.trim();
  const newPreset = {
    id: activePresetId.value || ('preset_' + Date.now()),
    name: nameToSave,
    isShared: presetIsShared.value,
    logic: logicOperator.value,
    updatedAt: new Date().toLocaleDateString('vi-VN'),
    criteria: JSON.parse(JSON.stringify(criteria.value)),
  };

  const existingIdx = savedPresets.value.findIndex((p) => p.id === newPreset.id || p.name.toLowerCase() === nameToSave.toLowerCase());
  if (existingIdx !== -1) {
    savedPresets.value[existingIdx] = newPreset;
  } else {
    savedPresets.value.unshift(newPreset);
  }

  activePresetId.value = newPreset.id;

  // Persist
  localStorage.setItem('advanced_search_presets', JSON.stringify(savedPresets.value));
  try {
    await saveAppSettings('advanced_search_shared_presets', savedPresets.value.filter((p) => p.isShared));
  } catch (e) {}

  alert(`Đã lưu bộ lọc "${newPreset.name}" thành công!`);
};

const deletePreset = async (preset, idx) => {
  if (!confirm(`Bạn có chắc muốn xóa bộ lọc "${preset.name}"?`)) return;
  savedPresets.value.splice(idx, 1);
  localStorage.setItem('advanced_search_presets', JSON.stringify(savedPresets.value));
  try {
    await saveAppSettings('advanced_search_shared_presets', savedPresets.value.filter((p) => p.isShared));
  } catch (e) {}
};

const loadPresets = async () => {
  try {
    const shared = await getAppSettings('advanced_search_shared_presets', null);
    if (shared && Array.isArray(shared) && shared.length > 0) {
      savedPresets.value = shared;
    } else {
      const local = localStorage.getItem('advanced_search_presets');
      if (local) savedPresets.value = JSON.parse(local);
    }
  } catch (e) {}
};

const openDetail = (item) => {
  if (item.rawPerson) {
    activePersonData.value = JSON.parse(JSON.stringify(item.rawPerson));
    isPersonnelDialogOpen.value = true;
  }
};

const handlePersonnelSaved = async () => {
  await personnelStore.fetchPersonnel();
  executeSearch();
};

onMounted(async () => {
  await loadPresets();
  if (savedPresets.value.length > 0) {
    applyPreset(savedPresets.value[0]);
  } else {
    executeSearch();
  }
});
</script>

<style scoped>
.advanced-search-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  min-height: calc(100vh - 90px);
}

.saved-presets-sidebar {
  width: 270px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  position: sticky;
  top: 1rem;
}

.presets-header {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

.btn-new-preset {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 5px;
  color: #1d4ed8;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-new-preset:hover {
  background: #dbeafe;
}

.presets-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preset-item {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s ease;
}
.preset-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
.preset-item.preset-active {
  background: #eff6ff;
  border-color: #3b82f6;
}

.preset-delete-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s ease;
}
.preset-delete-btn:hover {
  color: #ef4444;
}

.badge-scope {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}
.scope-shared {
  background: #dbeafe;
  color: #1e40af;
}
.scope-private {
  background: #fef3c7;
  color: #92400e;
}

.presets-footer-note {
  padding: 10px 12px;
  border-top: 1px solid #f1f5f9;
  background: #fafafa;
  font-size: 0.72rem;
  color: #64748b;
  display: flex;
  gap: 6px;
  align-items: flex-start;
  line-height: 1.35;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.search-main-content {
  flex: 1;
  min-width: 0;
}

.badge-code {
  background: #1e40af;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.logic-connector-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.logic-toggle-group {
  display: inline-flex;
  background: #e2e8f0;
  padding: 2px;
  border-radius: 6px;
}

.logic-btn {
  border: none;
  background: transparent;
  padding: 4px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.logic-btn.logic-active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.criteria-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.criteria-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}

.row-prefix {
  width: 45px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-align: right;
  flex-shrink: 0;
}

.builder-select,
.builder-input {
  width: 100%;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #1e293b;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.82rem;
  outline: none;
  transition: border-color 0.15s ease;
}
.builder-select:focus,
.builder-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.btn-remove-row {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.btn-remove-row:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fecaca;
  color: #dc2626;
}
.btn-remove-row:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.builder-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
  flex-wrap: wrap;
}

.btn-builder-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-builder-secondary:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.btn-builder-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #1d4ed8;
  color: #ffffff;
  border: 1px solid #1d4ed8;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-builder-primary:hover {
  background: #1e40af;
  border-color: #1e40af;
}

.advanced-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.advanced-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  padding: 8px 10px;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
  white-space: normal !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  line-height: 1.35 !important;
}
.advanced-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.45;
}
.advanced-table tr:hover td {
  background: #f8fafc;
}

.match-reasons-wrapper {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.match-reason-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #ffedd5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
}

.btn-action-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #1d4ed8;
  color: #ffffff;
  border: 1px solid #1d4ed8;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-action-primary:hover:not(:disabled) {
  background: #1e40af;
}
.btn-action-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-table-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-table-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}
.btn-table-info:hover {
  background: #dbeafe;
}
</style>
