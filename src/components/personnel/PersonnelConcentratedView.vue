<template>
  <div class="concentrated-hub-container">
    <!-- 1. Header Nhận Diện Động (Tự động lấy thông tin từ Nhóm 1 của Bảng Đứng Đầu - Zero Hardcode) -->
    <div class="hub-identity-header">
      <div class="identity-main-info">
        <div class="identity-title-row">
          <span class="identity-code-badge" v-if="masterCode">
            {{ masterCode }}
          </span>
          <h2 class="identity-name">
            {{ masterDisplayName }}
          </h2>
          <span class="identity-source-tag">
            Hồ sơ gốc
          </span>
        </div>

        <!-- Các trường thông tin tóm tắt thuộc Nhóm 1 của Bảng Đứng Đầu -->
        <div v-if="group1MetaSummary.length > 0" class="identity-meta-pills">
          <span
            v-for="(meta, mIdx) in group1MetaSummary"
            :key="meta.id || mIdx"
            class="meta-pill"
          >
            <span class="meta-label">{{ meta.label }}:</span>
            <strong class="meta-val">{{ meta.value }}</strong>
          </span>
        </div>
      </div>

      <!-- Nút tác vụ nhanh trên Header -->
      <div class="identity-header-actions">
        <Button
          label="Xuất Hồ sơ PDF"
          icon="pi pi-file-pdf"
          severity="secondary"
          outlined
          size="small"
          @click="$emit('export-pdf')"
          style="font-size: 0.78rem; font-weight: 600;"
        />
        <Button
          label="Lưu Hồ sơ"
          icon="pi pi-check"
          severity="success"
          size="small"
          :loading="saving"
          @click="$emit('save-master')"
          style="font-size: 0.78rem; font-weight: 700;"
        />
      </div>
    </div>

    <!-- 2. Thanh Nhảy Mục Dính (Sticky Anchor Nav) sinh ra tự động từ Nhóm cột và Bảng liên kết -->
    <div class="hub-sticky-nav">
      <div class="nav-scroll-track">
        <!-- Nút nhảy đến các Nhóm của Bảng Đứng Đầu -->
        <button
          v-for="(grp, gIdx) in formGroups"
          :key="grp.title || gIdx"
          type="button"
          class="nav-anchor-btn"
          :class="{ active: activeSectionId === 'sec-group-' + gIdx }"
          @click="scrollToSection('sec-group-' + gIdx)"
        >
          <i class="pi pi-folder"></i>
          <span>{{ gIdx + 1 }}. {{ grp.title }}</span>
          <span class="nav-count-badge">{{ (grp.columns || []).length }}</span>
        </button>

        <!-- Nút nhảy đến các Bảng Con được liên kết -->
        <button
          v-for="subTable in linkedSubTablesList"
          :key="subTable.id"
          type="button"
          class="nav-anchor-btn subtable-btn"
          :class="{ active: activeSectionId === 'sec-subtable-' + subTable.id }"
          @click="scrollToSection('sec-subtable-' + subTable.id)"
        >
          <i :class="['pi', subTable.icon || 'pi-table']"></i>
          <span>{{ subTable.title }}</span>
          <span class="nav-count-badge subtable">
            {{ getSubTableRows(subTable.id).length }}
          </span>
        </button>
      </div>
    </div>

    <!-- 3. Nội Dung Tập Trung: Dòng Chảy Toàn Bộ Hồ Sơ (Single-Page Concentrated Flow) -->
    <div class="hub-content-body">
      <!-- 3.1. CÁC NHÓM CỘT CỦA BẢNG ĐỨNG ĐẦU -->
      <section
        v-for="(grp, gIdx) in formGroups"
        :key="grp.title || gIdx"
        :id="'sec-group-' + gIdx"
        class="hub-section master-group-section"
      >
        <div class="section-header">
          <div class="section-title-wrap">
            <i class="pi pi-folder-open section-icon"></i>
            <h3 class="section-title">{{ gIdx + 1 }}. {{ grp.title }}</h3>
            <span class="section-subtitle">({{ (grp.columns || []).length }} trường thông tin)</span>
          </div>
        </div>

        <div class="form-grid">
          <template v-for="col in grp.columns" :key="col.id">
            <div class="field-item" :style="getColItemStyle(col.formWidth || col.width)">
              <label class="field-label" :title="col.label">
                <span class="label-text">{{ col.label }}</span>
                <span v-if="col.required" class="required-star">*</span>
              </label>
              <DynamicField
                v-model="form[col.id]"
                :col="col"
              />
            </div>
          </template>
        </div>
      </section>

      <!-- 3.2. CÁC BẢNG CON LIÊN KẾT (Dạng Accordion: Nhóm 1 làm Tiêu đề tóm tắt) -->
      <section
        v-for="subTable in linkedSubTablesList"
        :key="subTable.id"
        :id="'sec-subtable-' + subTable.id"
        class="hub-section subtable-section"
      >
        <!-- Tiêu đề Phân Mục Bảng Con -->
        <div class="section-header">
          <div class="section-title-wrap">
            <i :class="['pi', subTable.icon || 'pi-table']" class="section-icon subtable-color"></i>
            <h3 class="section-title">{{ subTable.title }}</h3>
            <span class="section-count-tag">
              {{ getSubTableRows(subTable.id).length }} bản ghi
            </span>
          </div>

          <div class="section-actions">
            <Button
              :label="'Thêm ' + subTable.title"
              icon="pi pi-plus"
              size="small"
              severity="success"
              outlined
              @click="startAddNewSubRecord(subTable.id)"
              style="font-size: 0.75rem; font-weight: 600; padding: 3px 8px; height: 28px;"
            />
          </div>
        </div>

        <!-- Form thêm mới bản ghi con (nếu đang ở trạng thái thêm) -->
        <div v-if="addingSubTableId === subTable.id" class="new-subrecord-card">
          <div class="new-card-header">
            <strong>
              <i class="pi pi-plus-circle"></i> Thêm mới {{ subTable.title }}
            </strong>
            <button type="button" class="btn-cancel-mini" @click="addingSubTableId = null">
              <i class="pi pi-times"></i> Hủy
            </button>
          </div>

          <!-- Bộ chọn người đi nếu thêm Chuyến đi dưới Cán bộ -->
          <div v-if="subTable.id === 'trips'" class="traveler-selector-row">
            <label class="field-label" style="font-weight: 700; color: #1e293b;">
              Người đi: <span style="color: red;">*</span>
            </label>
            <select v-model="newTripTravelerType" class="sub-select" style="font-weight: 600;">
              <option value="personnel">
                👤 Cán bộ này ({{ masterDisplayName }})
              </option>
              <option
                v-for="rel in linkedRelativesList"
                :key="rel.id || rel.uniqueKey"
                :value="'rel_' + (rel.id || rel.uniqueKey)"
              >
                👥 Thân nhân: {{ getRelativeDisplayName(rel) }} ({{ rel.relationshipName || 'Thân nhân' }})
              </option>
            </select>
          </div>

          <div class="form-grid" style="margin-top: 8px;">
            <template v-for="col in getSubTableEditableCols(subTable.id)" :key="col.id">
              <div class="field-item" :style="getColItemStyle(col.formWidth || col.width)">
                <label class="field-label">
                  <span class="label-text">{{ col.label }}</span>
                  <span v-if="col.required" class="required-star">*</span>
                </label>
                <DynamicField
                  v-model="newSubRecordForm[col.id]"
                  :col="col"
                />
              </div>
            </template>
          </div>

          <div class="new-card-footer">
            <Button
              label="Hủy"
              severity="secondary"
              text
              size="small"
              @click="addingSubTableId = null"
            />
            <Button
              :label="'Lưu ' + subTable.title"
              icon="pi pi-check"
              severity="success"
              size="small"
              :loading="isSavingSub"
              @click="handleSaveNewSubRecord(subTable.id)"
            />
          </div>
        </div>

        <!-- Trạng thái trống (0 bản ghi) -->
        <div v-if="getSubTableRows(subTable.id).length === 0 && addingSubTableId !== subTable.id" class="empty-subtable-box">
          <i :class="['pi', subTable.icon || 'pi-inbox']"></i>
          <span>Chưa có bản ghi {{ subTable.title }} nào liên kết với hồ sơ này.</span>
          <Button
            :label="'Thêm ' + subTable.title + ' đầu tiên'"
            icon="pi pi-plus"
            size="small"
            severity="info"
            text
            @click="startAddNewSubRecord(subTable.id)"
            style="font-size: 0.75rem;"
          />
        </div>

        <!-- DANH SÁCH ACCORDION CỦA BẢNG CON -->
        <div v-else class="accordion-list">
          <div
            v-for="(row, rIdx) in getSubTableRows(subTable.id)"
            :key="row.id || row.uniqueKey || rIdx"
            class="accordion-card"
            :class="{ 'is-expanded': isRowExpanded(subTable.id, row, rIdx) }"
          >
            <!-- THANH TIÊU ĐỀ ACCORDION: Lấy toàn bộ các cột ở Nhóm 1 của Bảng con -->
            <div
              class="accordion-header"
              @click="toggleRowExpand(subTable.id, row, rIdx)"
            >
              <div class="acc-header-left">
                <!-- Icon mở rộng / thu gọn -->
                <i
                  class="pi acc-toggle-icon"
                  :class="isRowExpanded(subTable.id, row, rIdx) ? 'pi-chevron-down' : 'pi-chevron-right'"
                ></i>

                <span class="acc-index-badge">#{{ rIdx + 1 }}</span>

                <!-- Render tóm tắt Nhóm 1 của Bảng Con -->
                <div class="acc-group1-summary">
                  <span
                    v-for="(cell, cIdx) in getRowGroup1Cells(subTable.id, row)"
                    :key="cIdx"
                    class="acc-cell-item"
                  >
                    <span class="cell-lbl">{{ cell.label }}:</span>
                    <strong class="cell-val">{{ cell.value }}</strong>
                  </span>
                </div>
              </div>

              <div class="acc-header-right">
                <!-- Tag Liên kết Động (Dynamic Foreign Key Tag) -->
                <span
                  v-if="getRowDynamicTag(subTable.id, row)"
                  class="dynamic-rel-tag"
                  :class="getRowDynamicTag(subTable.id, row).type"
                >
                  {{ getRowDynamicTag(subTable.id, row).text }}
                </span>

                <!-- Badge số chuyến đi của thân nhân nếu đây là bảng Thân nhân -->
                <span
                  v-if="subTable.id === 'relatives' && getTripsForRelative(row).length > 0"
                  class="rel-trips-count-badge"
                  title="Số chuyến đi nước ngoài của thân nhân này"
                >
                  <i class="pi pi-send"></i>
                  {{ getTripsForRelative(row).length }} chuyến đi
                </span>

                <button
                  type="button"
                  class="btn-expand-trigger"
                  :title="isRowExpanded(subTable.id, row, rIdx) ? 'Thu gọn' : 'Bấm xem/sửa chi tiết'"
                >
                  {{ isRowExpanded(subTable.id, row, rIdx) ? 'Thu gọn ▲' : 'Chi tiết ▼' }}
                </button>
              </div>
            </div>

            <!-- NỘI DUNG MỞ RỘNG (ACCORDION BODY): Chỉnh sửa các nhóm cột còn lại -->
            <div v-if="isRowExpanded(subTable.id, row, rIdx)" class="accordion-body">
              <div class="body-inner-container">
                <!-- Dynamic Form Fields của bản ghi con này -->
                <div class="form-grid">
                  <template v-for="col in getSubTableEditableCols(subTable.id)" :key="col.id">
                    <div class="field-item" :style="getColItemStyle(col.formWidth || col.width)">
                      <label class="field-label">
                        <span class="label-text">{{ col.label }}</span>
                        <span v-if="col.required" class="required-star">*</span>
                      </label>
                      <DynamicField
                        v-model="activeEditRowForms[getRowUniqueKey(subTable.id, row, rIdx)][col.id]"
                        :col="col"
                      />
                    </div>
                  </template>
                </div>

                <!-- Footer thao tác lưu / xóa của dòng này -->
                <div class="row-edit-actions-bar">
                  <Button
                    label="Xóa bản ghi này"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    size="small"
                    @click="handleDeleteSubRecord(subTable.id, row)"
                    style="font-size: 0.75rem;"
                  />

                  <div style="display: flex; gap: 8px; align-items: center;">
                    <span v-if="subSaveStatus[getRowUniqueKey(subTable.id, row, rIdx)] === 'saved'" style="font-size: 0.72rem; color: #16a34a; font-weight: 700;">
                      <i class="pi pi-check"></i> Đã lưu!
                    </span>
                    <Button
                      label="Lưu bản ghi"
                      icon="pi pi-check"
                      severity="success"
                      size="small"
                      :loading="subSaveStatus[getRowUniqueKey(subTable.id, row, rIdx)] === 'saving'"
                      @click="handleSaveSubRecord(subTable.id, row, rIdx)"
                      style="font-size: 0.75rem; font-weight: 700;"
                    />
                  </div>
                </div>

                <!-- 3.3. ĐẶC BIỆT: LỒNG CÁC CHUYẾN ĐI CỦA THÂN NHÂN NÀY (Hierarchical Nested Sub-Trips) -->
                <div v-if="subTable.id === 'relatives'" class="nested-relative-trips-box">
                  <div class="nested-box-header">
                    <span class="nested-box-title">
                      <i class="pi pi-send"></i> Chuyến đi của thân nhân này:
                      <strong>{{ getRelativeDisplayName(row) }}</strong>
                      ({{ getTripsForRelative(row).length }} chuyến)
                    </span>
                    <button
                      type="button"
                      class="btn-add-rel-trip"
                      @click="openAddTripForSpecificRelative(row)"
                    >
                      <i class="pi pi-plus"></i> Thêm chuyến đi cho thân nhân này
                    </button>
                  </div>

                  <div v-if="getTripsForRelative(row).length === 0" class="nested-trips-empty">
                    <span>Thân nhân này chưa có chuyến đi nước ngoài nào.</span>
                  </div>

                  <div v-else class="nested-trips-grid">
                    <div
                      v-for="(t, tIdx) in getTripsForRelative(row)"
                      :key="t.id || t.uniqueKey || tIdx"
                      class="nested-trip-pill"
                    >
                      <div class="nested-trip-info">
                        <span class="trip-country">
                          🌍 {{ t.quoc_gia_xuat_canh || t.countryName || 'Chưa rõ nước' }}
                        </span>
                        <span class="trip-date" v-if="t.departureDate || t.ngay_xuat_canh">
                          ({{ formatDate(t.departureDate || t.ngay_xuat_canh) }})
                        </span>
                        <span class="trip-purpose" v-if="t.purpose || t.muc_dich">
                          - {{ t.purpose || t.muc_dich }}
                        </span>
                      </div>
                      <div class="nested-trip-actions">
                        <button
                          type="button"
                          class="btn-mini-delete"
                          @click.stop="handleDeleteSubRecord('trips', t)"
                          title="Xóa chuyến đi này"
                        >
                          <i class="pi pi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import Button from 'primevue/button';
import DynamicField from '@/components/common/DynamicField.vue';
import { usePersonnelStore } from '@/stores/personnel';
import { formatDate, getColItemStyle } from '@/utils/formatters';
import { getUnifiedTableDefinitions, getTableKeyColId } from '@/utils/tableRegistry';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  formGroups: {
    type: Array,
    default: () => [],
  },
  recordSource: {
    type: String,
    default: 'personnel',
  },
  initialSection: {
    type: String,
    default: 'info',
  },
  initialRecordId: {
    type: [String, Number],
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'save-master', 'export-pdf', 'refresh']);
const personnelStore = usePersonnelStore();

// Form chính (Bảng Đứng Đầu)
const form = computed({
  get: () => props.modelValue || {},
  set: (val) => emit('update:modelValue', val),
});

// Trạng thái Anchor Nav & Accordions
const activeSectionId = ref('sec-group-0');
const expandedRows = ref({}); // key: string => boolean
const activeEditRowForms = ref({});
const subSaveStatus = ref({});

// Trạng thái thêm mới bản ghi con
const addingSubTableId = ref(null);
const newSubRecordForm = ref({});
const isSavingSub = ref(false);
const newTripTravelerType = ref('personnel');

// 1. TÍNH TOÁN THÔNG TIN NHẬN DIỆN TỪ NHÓM 1 CỦA BẢNG ĐỨNG ĐẦU (ZERO HARDCODE)
const masterGroup1Cols = computed(() => {
  if (props.formGroups && props.formGroups.length > 0) {
    return (props.formGroups[0].columns || []).filter((c) => c && c.id && c.id !== 'stt');
  }
  return [];
});

const masterDisplayName = computed(() => {
  const f = form.value;
  if (!f) return 'Hồ sơ';
  // Lấy cột đầu tiên có giá trị trong Nhóm 1
  for (const col of masterGroup1Cols.value) {
    const val = f[col.id];
    if (val && typeof val === 'string' && val.trim().length > 1 && isNaN(val)) {
      return val.trim();
    }
  }
  return f.name || f.fullName || f.ho_ten || f.title || 'Hồ sơ';
});

const masterCode = computed(() => {
  const f = form.value;
  return f.code || f.so_cccd || f.cccd || f.id || '';
});

const group1MetaSummary = computed(() => {
  const f = form.value;
  const res = [];
  const cols = masterGroup1Cols.value;
  cols.forEach((c) => {
    const v = f[c.id];
    if (v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== masterDisplayName.value) {
      res.push({
        id: c.id,
        label: c.label || c.id,
        value: typeof v === 'object' ? JSON.stringify(v) : String(v).trim(),
      });
    }
  });
  return res.slice(0, 5); // Tối đa 5 trường tóm tắt tinh gọn
});

// 2. DANH SÁCH BẢNG CON LIÊN KẾT
const resolvedDashboards = computed(() => {
  try {
    const local = localStorage.getItem('custom_dashboards_config');
    if (local) return JSON.parse(local);
  } catch (e) {}
  return [];
});

const linkedSubTablesList = computed(() => {
  const allTables = getUnifiedTableDefinitions({
    personnelStore,
    customDashboards: resolvedDashboards.value,
  });

  const curId = props.recordSource || 'personnel';
  const curCfg = (resolvedDashboards.value || []).find((d) => d.id === curId);
  const linkedTableIds = Array.isArray(curCfg?.linkedTables)
    ? curCfg.linkedTables.map((lt) => (typeof lt === 'string' ? lt : lt.tableId))
    : (curId === 'personnel' ? ['relatives', 'trips'] : []);

  return allTables.filter((t) => t.id !== curId && linkedTableIds.includes(t.id));
});

// 3. TRUY VẤN DỮ LIỆU CỦA TỪNG BẢNG CON THEO HỒ SƠ CHÍNH (DYNAMIC KEY FIELDS)
const linkedRelativesList = computed(() => {
  const allRels = personnelStore.relativesList || [];
  const pKeyField = personnelStore.getPersonnelKeyField();
  const pKey = String(form.value[pKeyField] || form.value.cccd || form.value.so_cccd || form.value.id || '').trim().toLowerCase();
  const pId = String(form.value.id || '').trim();

  const res = [];
  const seen = new Set();
  const parentKeyField = personnelStore.getRelativeParentKeyField();

  allRels.forEach((r, idx) => {
    const uKey = r.id || r.uniqueKey || `rel_${idx}`;
    if (seen.has(uKey)) return;
    const parentVal = String(r[parentKeyField] || r.cccdparent || r.parentCccd || '').trim().toLowerCase();
    const matchId = Boolean(pId && r.personnelId && String(r.personnelId).trim() === pId);
    const matchKey = Boolean(pKey && parentVal && parentVal === pKey);

    if (matchId || matchKey) {
      seen.add(uKey);
      res.push(r);
    }
  });

  // Kèm các thân nhân cục bộ (nếu có)
  (form.value.relatives || []).forEach((r, idx) => {
    const uKey = r.id || r.uniqueKey || `loc_rel_${idx}`;
    if (!seen.has(uKey)) {
      seen.add(uKey);
      res.push(r);
    }
  });

  return res;
});

const linkedTripsList = computed(() => {
  const allTrips = personnelStore.tripsList || [];
  const pKeyField = personnelStore.getPersonnelKeyField();
  const pKey = String(form.value[pKeyField] || form.value.cccd || form.value.so_cccd || form.value.id || '').trim().toLowerCase();
  const pId = String(form.value.id || '').trim();

  // Tạo tập hợp Khóa định danh và ID của các thân nhân thuộc cán bộ này
  const rKeyField = personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : 'cccdthannhan';
  const relKeys = new Set(linkedRelativesList.value.map((r) => String(r[rKeyField] || r.cccdthannhan || r.cccd || '').trim().toLowerCase()).filter(Boolean));
  const relIds = new Set(linkedRelativesList.value.map((r) => String(r.id || '').trim()).filter(Boolean));

  const tripKeyField = personnelStore.getTripKeyField();
  const res = [];
  const seen = new Set();

  allTrips.forEach((t, idx) => {
    const uKey = t.uniqueKey || t.id || `trip_${idx}`;
    if (seen.has(uKey)) return;
    const tVal = String(t[tripKeyField] || t.cccdchuyendi || t.cccd || '').trim().toLowerCase();
    const matchOfficer = (pId && t.personnelId && String(t.personnelId).trim() === pId) || (pKey && tVal && tVal === pKey);
    const matchRel = (t.relativeId && relIds.has(String(t.relativeId).trim())) || (tVal && relKeys.has(tVal));

    if (matchOfficer || matchRel) {
      seen.add(uKey);
      res.push(t);
    }
  });

  // Kèm các chuyến đi cục bộ (nếu có)
  (form.value.trips || []).forEach((t, idx) => {
    const uKey = t.uniqueKey || t.id || `loc_trip_${idx}`;
    if (!seen.has(uKey)) {
      seen.add(uKey);
      res.push(t);
    }
  });

  return res;
});

function getSubTableRows(tableId) {
  if (tableId === 'relatives') return linkedRelativesList.value;
  if (tableId === 'trips') return linkedTripsList.value;

  const allTables = getUnifiedTableDefinitions({ personnelStore, customDashboards: resolvedDashboards.value });
  const target = allTables.find((t) => t.id === tableId);
  return target?.getRows ? target.getRows(personnelStore) : [];
}

// 4. TIÊU ĐỀ ACCORDION: LẤY CÁC CỘT Ở NHÓM 1 CỦA BẢNG CON (ZERO HARDCODE)
function getRowGroup1Cells(tableId, row) {
  let mapping = [];
  if (tableId === 'relatives') mapping = personnelStore.importMappingRelative || [];
  else if (tableId === 'trips') mapping = personnelStore.importMappingTrips || [];
  else {
    try {
      const raw = localStorage.getItem('custom_table_groups_' + tableId);
      if (raw) mapping = JSON.parse(raw);
    } catch (e) {}
  }

  const grp1Cols = (mapping.length > 0 && mapping[0].columns)
    ? mapping[0].columns.filter((c) => c && c.id && c.id !== 'stt').slice(0, 4)
    : [];

  if (grp1Cols.length === 0) {
    return [{ label: 'Tên', value: row.name || row.title || row.id || 'Bản ghi' }];
  }

  return grp1Cols.map((col) => {
    const rawVal = row[col.id] !== undefined ? row[col.id] : (row.custom_data?.[col.id] ?? '');
    let displayVal = rawVal;
    if (col.format === 'date' && rawVal) displayVal = formatDate(rawVal);
    return {
      label: col.label || col.id,
      value: String(displayVal || '').trim() || '—',
    };
  });
}

function getSubTableEditableCols(tableId) {
  let mapping = [];
  if (tableId === 'relatives') mapping = personnelStore.importMappingRelative || [];
  else if (tableId === 'trips') mapping = personnelStore.importMappingTrips || [];
  else {
    try {
      const raw = localStorage.getItem('custom_table_groups_' + tableId);
      if (raw) mapping = JSON.parse(raw);
    } catch (e) {}
  }
  return mapping.flatMap((g) => g.columns || []).filter((c) => c && c.id && c.id !== 'stt' && !c.isVirtual);
}

// 5. TAG LIÊN KẾT ĐỘNG DỰA TRÊN CỘT KHÓA (Zero Hardcode Tagging)
function getRowDynamicTag(tableId, row) {
  if (tableId === 'trips') {
    const tVal = String(row.cccdchuyendi || row.cccd || '').trim().toLowerCase();
    const relMatch = linkedRelativesList.value.find((r) => {
      if (row.relativeId && String(r.id).trim() === String(row.relativeId).trim()) return true;
      const rKey = String(r.cccdthannhan || r.cccd || '').trim().toLowerCase();
      return rKey && tVal && rKey === tVal;
    });

    if (relMatch) {
      const rName = relMatch.relativeName || relMatch.name || 'Thân nhân';
      return { type: 'is-relative', text: `👥 Thân nhân: ${rName}` };
    }
    return { type: 'is-officer', text: '👤 Cán bộ' };
  }
  return null;
}

function getRelativeDisplayName(rel) {
  return rel.relativeName || rel.name || rel.fullName || 'Thân nhân';
}

function getTripsForRelative(rel) {
  const rKey = String(rel.cccdthannhan || rel.cccd || '').trim().toLowerCase();
  const rId = String(rel.id || '').trim();

  return linkedTripsList.value.filter((t) => {
    if (rId && t.relativeId && String(t.relativeId).trim() === rId) return true;
    const tVal = String(t.cccdchuyendi || t.cccd || '').trim().toLowerCase();
    return Boolean(rKey && tVal && rKey === tVal);
  });
}

// 6. ACCORDION EXPAND / COLLAPSE & INLINE EDITING
function getRowUniqueKey(tableId, row, idx) {
  return `${tableId}_${row.id || row.uniqueKey || idx}`;
}

function isRowExpanded(tableId, row, idx) {
  const key = getRowUniqueKey(tableId, row, idx);
  return Boolean(expandedRows.value[key]);
}

function toggleRowExpand(tableId, row, idx) {
  const key = getRowUniqueKey(tableId, row, idx);
  expandedRows.value[key] = !expandedRows.value[key];

  if (expandedRows.value[key] && !activeEditRowForms.value[key]) {
    activeEditRowForms.value[key] = { ...row };
  }
}

async function handleSaveSubRecord(tableId, row, idx) {
  const key = getRowUniqueKey(tableId, row, idx);
  const updatedData = activeEditRowForms.value[key] || row;
  subSaveStatus.value[key] = 'saving';

  try {
    if (tableId === 'relatives') {
      await personnelStore.saveRelative(updatedData);
    } else if (tableId === 'trips') {
      await personnelStore.saveTrip(updatedData);
    }
    subSaveStatus.value[key] = 'saved';
    setTimeout(() => { subSaveStatus.value[key] = null; }, 2500);
    emit('refresh');
  } catch (e) {
    console.error('Save sub record error:', e);
    alert('Lỗi khi lưu bản ghi: ' + (e.message || e));
    subSaveStatus.value[key] = null;
  }
}

async function handleDeleteSubRecord(tableId, row) {
  if (!confirm('Bạn có chắc muốn xóa bản ghi này?')) return;
  try {
    if (tableId === 'relatives') {
      await personnelStore.deleteRelative(row);
    } else if (tableId === 'trips') {
      await personnelStore.deleteTrip(row);
    }
    emit('refresh');
  } catch (e) {
    console.error('Delete sub record error:', e);
    alert('Lỗi khi xóa: ' + (e.message || e));
  }
}

// 7. THÊM MỚI BẢN GHI CON
function startAddNewSubRecord(tableId) {
  addingSubTableId.value = tableId;
  newSubRecordForm.value = {};
  newTripTravelerType.value = 'personnel';
}

function openAddTripForSpecificRelative(rel) {
  addingSubTableId.value = 'trips';
  newTripTravelerType.value = 'rel_' + (rel.id || rel.uniqueKey);
  const tripKeyField = personnelStore.getTripKeyField();
  const rKeyField = personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : 'cccdthannhan';
  newSubRecordForm.value = {
    relativeId: rel.id || '',
    [tripKeyField]: rel[rKeyField] || rel.cccdthannhan || rel.cccd || '',
    relativeName: getRelativeDisplayName(rel),
    isRelative: true,
  };
  scrollToSection('sec-subtable-trips');
}

async function handleSaveNewSubRecord(tableId) {
  isSavingSub.value = true;
  try {
    const pKeyField = personnelStore.getPersonnelKeyField();
    const pKey = String(form.value[pKeyField] || form.value.cccd || form.value.so_cccd || form.value.id || '').trim();
    const pId = String(form.value.id || '').trim();

    if (tableId === 'relatives') {
      const parentKeyField = personnelStore.getRelativeParentKeyField();
      const payload = {
        ...newSubRecordForm.value,
        personnelId: pId,
        [parentKeyField]: pKey,
      };
      await personnelStore.saveRelative(payload);
    } else if (tableId === 'trips') {
      const tripKeyField = personnelStore.getTripKeyField();
      let payload = {
        ...newSubRecordForm.value,
        personnelId: pId,
      };
      if (newTripTravelerType.value.startsWith('rel_')) {
        const relId = newTripTravelerType.value.replace('rel_', '');
        const rel = linkedRelativesList.value.find((r) => String(r.id || r.uniqueKey) === relId);
        const rKeyField = personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : 'cccdthannhan';
        payload.isRelative = true;
        payload.relativeId = relId;
        payload[tripKeyField] = rel?.[rKeyField] || rel?.cccdthannhan || rel?.cccd || '';
        payload.relativeName = rel ? getRelativeDisplayName(rel) : '';
      } else {
        payload.isRelative = false;
        payload[tripKeyField] = pKey;
      }
      await personnelStore.saveTrip(payload);
    }

    addingSubTableId.value = null;
    newSubRecordForm.value = {};
    emit('refresh');
  } catch (e) {
    console.error('Save new sub record error:', e);
    alert('Lỗi lưu: ' + (e.message || e));
  } finally {
    isSavingSub.value = false;
  }
}

// 8. ĐIỀU HƯỚNG CUỘN (SMOOTH SCROLL)
function scrollToSection(secId) {
  activeSectionId.value = secId;
  nextTick(() => {
    const el = document.getElementById(secId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

// 9. XỬ LÝ FOCUS KHI MỞ DIALOG (INITIAL FOCUS & AUTO-EXPAND)
onMounted(() => {
  nextTick(() => {
    if (props.initialSection && props.initialSection !== 'info') {
      const targetSecId = 'sec-subtable-' + props.initialSection;
      scrollToSection(targetSecId);

      if (props.initialRecordId) {
        // Tự động bung Accordion của đúng bản ghi đang click
        const rows = getSubTableRows(props.initialSection);
        const fIdx = rows.findIndex((r) => String(r.id) === String(props.initialRecordId) || String(r.uniqueKey) === String(props.initialRecordId));
        if (fIdx !== -1) {
          const row = rows[fIdx];
          const key = getRowUniqueKey(props.initialSection, row, fIdx);
          expandedRows.value[key] = true;
          activeEditRowForms.value[key] = { ...row };
        }
      }
    }
  });
});
</script>

<style scoped>
.concentrated-hub-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: #f8fafc;
  min-height: 100%;
}

/* 1. Header Nhận Diện Động */
.hub-identity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.identity-main-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.identity-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.identity-code-badge {
  padding: 2px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #ffffff;
  background: #0284c7;
  border-radius: 4px;
}

.identity-name {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
}

.identity-source-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: #15803d;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 2px 8px;
  border-radius: 999px;
}

.identity-meta-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-pill {
  font-size: 0.75rem;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.meta-label {
  color: #64748b;
  margin-right: 4px;
}

.identity-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 2. Sticky Anchor Nav */
.hub-sticky-nav {
  position: sticky;
  top: 0;
  z-index: 99;
  background: #ffffff;
  border-bottom: 1px solid #cbd5e1;
  padding: 0 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}

.nav-scroll-track {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  white-space: nowrap;
  padding: 6px 0;
}

.nav-anchor-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-anchor-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.nav-anchor-btn.active {
  background: #e0f2fe;
  color: #0284c7;
  font-weight: 700;
}

.nav-anchor-btn.subtable-btn {
  color: #0d9488;
}

.nav-anchor-btn.subtable-btn.active {
  background: #ccfbf1;
  color: #0f766e;
}

.nav-count-badge {
  font-size: 0.68rem;
  padding: 1px 6px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
}

.nav-count-badge.subtable {
  background: #99f6e4;
  color: #115e59;
  font-weight: 700;
}

/* 3. Nội dung tập trung */
.hub-content-body {
  padding: 16px 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hub-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  scroll-margin-top: 50px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  font-size: 1rem;
  color: #0284c7;
}

.section-icon.subtable-color {
  color: #0d9488;
}

.section-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.section-subtitle {
  font-size: 0.74rem;
  color: #64748b;
}

.section-count-tag {
  font-size: 0.72rem;
  font-weight: 700;
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
  padding: 2px 8px;
  border-radius: 999px;
}

.form-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.field-item {
  box-sizing: border-box;
}

.field-label {
  display: block;
  font-size: 0.76rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
}

.required-star {
  color: #ef4444;
  margin-left: 2px;
  font-weight: 700;
}

/* Accordion List */
.accordion-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.accordion-card {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #ffffff;
  overflow: hidden;
  transition: all 0.2s ease;
}

.accordion-card:hover {
  border-color: #cbd5e1;
}

.accordion-card.is-expanded {
  border-color: #93c5fd;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fafc;
  cursor: pointer;
  user-select: none;
  gap: 12px;
}

.accordion-card.is-expanded .accordion-header {
  background: #f0f9ff;
  border-bottom: 1px solid #e0f2fe;
}

.acc-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.acc-toggle-icon {
  font-size: 0.75rem;
  color: #64748b;
}

.acc-index-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #0284c7;
  background: #e0f2fe;
  padding: 1px 6px;
  border-radius: 4px;
}

.acc-group1-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
}

.acc-cell-item {
  font-size: 0.78rem;
  color: #334155;
}

.cell-lbl {
  color: #64748b;
  margin-right: 3px;
}

.cell-val {
  color: #0f172a;
}

.acc-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.dynamic-rel-tag {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.dynamic-rel-tag.is-relative {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}

.dynamic-rel-tag.is-officer {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.rel-trips-count-badge {
  font-size: 0.7rem;
  font-weight: 700;
  background: #ccfbf1;
  color: #0f766e;
  border: 1px solid #99f6e4;
  padding: 2px 8px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-expand-trigger {
  font-size: 0.72rem;
  font-weight: 600;
  color: #0284c7;
  background: transparent;
  border: none;
  cursor: pointer;
}

.accordion-body {
  padding: 14px 16px;
  background: #ffffff;
}

.row-edit-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
}

/* Lồng Chuyến đi của Thân nhân */
.nested-relative-trips-box {
  margin-top: 16px;
  padding: 12px 14px;
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
  border-radius: 6px;
}

.nested-box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.nested-box-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #0f766e;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-add-rel-trip {
  font-size: 0.72rem;
  font-weight: 700;
  color: #0f766e;
  background: #ffffff;
  border: 1px solid #99f6e4;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-add-rel-trip:hover {
  background: #ccfbf1;
}

.nested-trips-empty {
  font-size: 0.72rem;
  color: #64748b;
  font-style: italic;
}

.nested-trips-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nested-trip-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid #99f6e4;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.nested-trip-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.trip-country {
  font-weight: 700;
  color: #1e293b;
}

.trip-date {
  color: #64748b;
}

.trip-purpose {
  color: #475569;
}

.btn-mini-delete {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 2px;
}

/* Thêm mới Sub-record */
.new-subrecord-card {
  border: 1.5px dashed #22c55e;
  border-radius: 6px;
  background: #f0fdf4;
  padding: 14px;
  margin-bottom: 12px;
}

.new-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #15803d;
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.btn-cancel-mini {
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.75rem;
  cursor: pointer;
}

.new-card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.traveler-selector-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid #bbf7d0;
}

.empty-subtable-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 0.78rem;
  gap: 6px;
}
</style>
