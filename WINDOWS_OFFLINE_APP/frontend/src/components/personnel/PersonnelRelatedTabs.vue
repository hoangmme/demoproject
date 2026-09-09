<template>
  <div class="personnel-related-tabs-container">
    <!-- Tab Navigation Bar -->
    <div class="related-tabs-nav" v-if="availableTabs.length > 1">
      <button
        v-for="t in availableTabs"
        :key="t.id"
        type="button"
        class="tab-nav-btn"
        :class="{ active: currentTab === t.id }"
        @click="currentTab = t.id"
      >
        <i :class="t.icon"></i>
        <span>{{ t.label }}</span>
        <span v-if="t.count !== undefined" class="tab-counter-badge" :class="{ 'has-items': t.count > 0 }">
          {{ t.count }}
        </span>
      </button>
    </div>

    <!-- Tab Contents Area -->
    <div class="related-tabs-content">
      <!-- TAB 1: THÂN NHÂN LIÊN KẾT (Dành cho hồ sơ Cán bộ) -->
      <div v-if="currentTab === 'relatives'" class="tab-pane">
        <div class="pane-toolbar">
          <div class="pane-title-area">
            <span class="pane-title">Danh sách Thân nhân ({{ relatedRelatives.length }})</span>
            <span class="pane-subtitle">Các thân nhân có quan hệ gia đình gắn với cán bộ này</span>
          </div>
          <Button
            label="Thêm Thân nhân"
            icon="pi pi-plus"
            size="small"
            severity="success"
            @click="openAddRelative"
            class="pane-add-btn"
          />
        </div>

        <!-- Bảng danh sách thân nhân động 100% theo cột người dùng cấu hình -->
        <div v-if="relatedRelatives.length > 0" class="mini-table-wrapper">
          <table class="custom-mini-table">
            <thead>
              <tr>
                <th style="width: 45px;" class="col-center">STT</th>
                <th
                  v-for="col in relativeColumns"
                  :key="col.id"
                  :style="{ width: col.tableWidth ? col.tableWidth + 'px' : (col.width || '150px'), minWidth: '100px' }"
                >
                  {{ col.label }}
                </th>
                <th style="width: 110px;" class="col-center">Chuyến đi</th>
                <th style="width: 80px;" class="col-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(rel, idx) in relatedRelatives" :key="rel.id || rel.code || idx">
                <td class="col-center idx-cell">{{ idx + 1 }}</td>
                <td v-for="col in relativeColumns" :key="col.id">
                  {{ getRecordCellValue(rel, col) }}
                </td>
                <td class="col-center">
                  <span class="trip-count-pill" :class="{ 'has-trips': getRelativeTripCount(rel) > 0 }">
                    <i class="pi pi-send"></i>
                    {{ getRelativeTripCount(rel) }} chuyến
                  </span>
                </td>
                <td class="col-center">
                  <div class="table-actions">
                    <button
                      type="button"
                      class="btn-action-icon edit"
                      title="Chỉnh sửa thân nhân"
                      @click="openEditRelative(rel)"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button
                      type="button"
                      class="btn-action-icon delete"
                      title="Xóa thân nhân này"
                      @click="deleteRelative(rel)"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-state-box">
          <i class="pi pi-users empty-icon"></i>
          <p class="empty-text">Chưa có thông tin thân nhân nào được liên kết với cán bộ này.</p>
          <Button
            label="Thêm Thân nhân đầu tiên"
            icon="pi pi-plus"
            size="small"
            severity="info"
            outlined
            @click="openAddRelative"
          />
        </div>
      </div>

      <!-- TAB 2: CÁN BỘ CHỦ QUẢN (Dành cho hồ sơ Thân nhân) -->
      <div v-else-if="currentTab === 'parent'" class="tab-pane">
        <div class="pane-toolbar">
          <div class="pane-title-area">
            <span class="pane-title">Hồ sơ Cán bộ liên quan</span>
            <span class="pane-subtitle">Thông tin cán bộ chủ quản mà thân nhân này trực thuộc</span>
          </div>
        </div>

        <div v-if="parentPerson" class="parent-profile-card">
          <div class="parent-avatar-box">
            <i class="pi pi-user parent-avatar-icon"></i>
          </div>
          <div class="parent-details">
            <h4 class="parent-name">{{ parentPerson[personnelNameField] || parentPerson.name || parentPerson.fullName || 'Cán bộ' }}</h4>
            <div class="parent-meta-grid">
              <div v-for="col in keyPersonnelCols" :key="col.id" class="meta-item">
                <span class="meta-label">{{ col.label }}:</span>
                <span class="meta-val">{{ getRecordCellValue(parentPerson, col) }}</span>
              </div>
            </div>
            <div class="parent-card-actions">
              <Button
                label="Xem chi tiết hồ sơ Cán bộ này"
                icon="pi pi-external-link"
                size="small"
                severity="info"
                outlined
                @click="$emit('switchRecord', parentPerson)"
              />
            </div>
          </div>
        </div>

        <div v-else class="empty-state-box">
          <i class="pi pi-info-circle empty-icon"></i>
          <p class="empty-text">Chưa liên kết được hồ sơ cán bộ chủ quản. Vui lòng kiểm tra lại trường liên kết ({{ relParentKey }}).</p>
        </div>
      </div>

      <!-- TAB 3: CHUYẾN ĐI NƯỚC NGOÀI (Cho cả Cán bộ và Thân nhân) -->
      <div v-else-if="currentTab === 'trips'" class="tab-pane">
        <div class="pane-toolbar">
          <div class="pane-title-area">
            <span class="pane-title">Lịch sử Chuyến đi Nước ngoài ({{ displayTrips.length }})</span>
            <span class="pane-subtitle">
              {{ recordSource === 'personnel' ? 'Bao gồm chuyến đi của Cán bộ và chuyến đi của Thân nhân' : 'Toàn bộ chuyến đi của thân nhân này' }}
            </span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <!-- Phân loại chuyến đi khi xem Cán bộ -->
            <div v-if="recordSource === 'personnel' && relatedRelatives.length > 0" class="trip-filter-pills">
              <button
                type="button"
                class="filter-pill"
                :class="{ active: tripFilterType === 'all' }"
                @click="tripFilterType = 'all'"
              >
                Tất cả ({{ relatedTrips.length }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ active: tripFilterType === 'personnel' }"
                @click="tripFilterType = 'personnel'"
              >
                Cán bộ ({{ countPersonnelTrips }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ active: tripFilterType === 'relative' }"
                @click="tripFilterType = 'relative'"
              >
                Thân nhân ({{ countRelativeTrips }})
              </button>
            </div>

            <Button
              label="Thêm Chuyến đi"
              icon="pi pi-plus"
              size="small"
              severity="success"
              @click="openAddTrip"
              class="pane-add-btn"
            />
          </div>
        </div>

        <!-- Bảng danh sách chuyến đi động 100% theo cột người dùng cấu hình -->
        <div v-if="displayTrips.length > 0" class="mini-table-wrapper">
          <table class="custom-mini-table">
            <thead>
              <tr>
                <th style="width: 45px;" class="col-center">STT</th>
                <th v-if="recordSource === 'personnel'" style="width: 150px;">Người xuất cảnh</th>
                <th
                  v-for="col in tripColumns"
                  :key="col.id"
                  :style="{ width: col.tableWidth ? col.tableWidth + 'px' : (col.width || '150px'), minWidth: '100px' }"
                >
                  {{ col.label }}
                </th>
                <th style="width: 80px;" class="col-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(t, idx) in displayTrips" :key="t.uniqueKey || t.id || idx">
                <td class="col-center idx-cell">{{ idx + 1 }}</td>
                <td v-if="recordSource === 'personnel'">
                  <span v-if="t._isPersonnelTrip" class="person-type-tag person">
                    <i class="pi pi-user"></i> Cán bộ
                  </span>
                  <span v-else class="person-type-tag relative">
                    <i class="pi pi-heart"></i>
                    {{ t._relativeInfo?.relativeName || t.relativeName || 'Thân nhân' }}
                  </span>
                </td>
                <td v-for="col in tripColumns" :key="col.id">
                  {{ getRecordCellValue(t, col) }}
                </td>
                <td class="col-center">
                  <div class="table-actions">
                    <button
                      type="button"
                      class="btn-action-icon edit"
                      title="Chỉnh sửa chuyến đi"
                      @click="openEditTrip(t)"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button
                      type="button"
                      class="btn-action-icon delete"
                      title="Xóa chuyến đi này"
                      @click="deleteTrip(t)"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-state-box">
          <i class="pi pi-send empty-icon"></i>
          <p class="empty-text">Chưa có chuyến đi nước ngoài nào trong danh sách này.</p>
          <Button
            label="Thêm Chuyến đi mới"
            icon="pi pi-plus"
            size="small"
            severity="info"
            outlined
            @click="openAddTrip"
          />
        </div>
      </div>
    </div>

    <!-- SUB-DIALOG: THÊM / SỬA THÂN NHÂN (100% DYNAMIC THEO CỘT BẢNG) -->
    <Dialog
      v-model:visible="isRelativeFormOpen"
      modal
      :header="editingRelative?.id ? 'Chỉnh sửa Thân nhân' : 'Thêm Thân nhân mới'"
      :style="{ width: '80vw', maxWidth: '850px' }"
      :baseZIndex="20000"
    >
      <div style="max-height: 65vh; overflow-y: auto; padding: 4px 8px;">
        <div class="form-grid">
          <template v-for="col in relativeColumns" :key="col.id">
            <div class="field-item" :style="getColItemStyle(col.formWidth || col.width)">
              <label class="field-label" :title="col.label">
                <span class="label-text">{{ col.label }}</span>
                <span v-if="col.required" style="color: red; margin-left: 2px;">*</span>
              </label>
              <DynamicField
                v-model="relForm[col.id]"
                :col="col"
              />
            </div>
          </template>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isRelativeFormOpen = false" />
        <Button label="Lưu Thân nhân" icon="pi pi-check" severity="success" size="small" :loading="isSavingSub" @click="saveRelativeForm" />
      </template>
    </Dialog>

    <!-- SUB-DIALOG: THÊM / SỬA CHUYẾN ĐI (100% DYNAMIC THEO CỘT BẢNG) -->
    <Dialog
      v-model:visible="isTripFormOpen"
      modal
      :header="editingTrip?.id ? 'Chỉnh sửa Chuyến đi' : 'Thêm Chuyến đi mới'"
      :style="{ width: '80vw', maxWidth: '850px' }"
      :baseZIndex="20000"
    >
      <div style="max-height: 65vh; overflow-y: auto; padding: 4px 8px;">
        <!-- Chọn người thực hiện khi thêm chuyến từ Cán bộ -->
        <div v-if="recordSource === 'personnel'" style="margin-bottom: 12px; background: #f8fafc; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px;">
          <label style="font-size: 0.78rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Người thực hiện chuyến đi <span style="color: red;">*</span>
          </label>
          <select v-model="tripTargetPersonType" class="sub-select-person" style="width: 100%; height: 34px; font-size: 0.82rem; border: 1px solid #cbd5e1; border-radius: 4px; padding: 0 8px; background: #fff;">
            <option value="personnel">👤 Chính Cán bộ này ({{ currentRecord[personnelNameField] || currentRecord.name || 'Cán bộ' }})</option>
            <option
              v-for="r in relatedRelatives"
              :key="r.id || r[relKeyField] || r.cccdthannhan"
              :value="'rel_' + (r.id || r[relKeyField] || r.cccdthannhan)"
            >
              👥 Thân nhân: {{ r[relativeNameField] || r.relativeName || r.name }} ({{ r.relationshipName || 'Thân nhân' }})
            </option>
          </select>
        </div>

        <div class="form-grid">
          <template v-for="col in tripColumns" :key="col.id">
            <div class="field-item" :style="getColItemStyle(col.formWidth || col.width)">
              <label class="field-label" :title="col.label">
                <span class="label-text">{{ col.label }}</span>
                <span v-if="col.required" style="color: red; margin-left: 2px;">*</span>
              </label>
              <DynamicField
                v-model="tripForm[col.id]"
                :col="col"
              />
            </div>
          </template>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isTripFormOpen = false" />
        <Button label="Lưu Chuyến đi" icon="pi pi-check" severity="success" size="small" :loading="isSavingSub" @click="saveTripForm" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import DynamicField from '@/components/common/DynamicField.vue';
import { usePersonnelStore } from '@/stores/personnel';
import { formatDate, evaluateFormula, getColItemStyle } from '@/utils/formatters';

const props = defineProps({
  currentRecord: {
    type: Object,
    required: true,
  },
  recordSource: {
    type: String,
    default: 'personnel', // 'personnel' | 'relatives' | 'trips' | 'blank'
  },
  modelValue: {
    type: String,
    default: 'info',
  },
});

const emit = defineEmits(['update:modelValue', 'refresh', 'switchRecord']);
const personnelStore = usePersonnelStore();

const currentTab = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const tripFilterType = ref('all');
const isSavingSub = ref(false);

// Sub Dialog States
const isRelativeFormOpen = ref(false);
const editingRelative = ref(null);
const relForm = ref({});

const isTripFormOpen = ref(false);
const editingTrip = ref(null);
const tripTargetPersonType = ref('personnel');
const tripForm = ref({});

// Trường khóa động (Zero-Hardcode)
const pKeyField = computed(() => personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent');
const relParentKey = computed(() => personnelStore.getRelativeParentKeyField ? personnelStore.getRelativeParentKeyField() : 'cccdparent');
const relKeyField = computed(() => personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : 'cccdthannhan');
const tripKeyField = computed(() => personnelStore.getTripKeyField ? personnelStore.getTripKeyField() : 'cccdchuyendi');
const personnelNameField = computed(() => personnelStore.getPersonnelNameField ? personnelStore.getPersonnelNameField() : 'name');
const relativeNameField = computed(() => {
  const rCols = (personnelStore.importMappingRelative || []).flatMap((g) => g.columns || []);
  const nCol = rCols.find((c) => c.id === 'relativeName' || c.id === 'name' || c.label?.toLowerCase().includes('họ và tên') || c.label?.toLowerCase().includes('họ tên'));
  return nCol ? nCol.id : 'relativeName';
});

// Helper kiểm tra cột hiển thị hợp lệ
const isColVisible = (c) => {
  if (!c || c.isVirtual || c.id === 'stt') return false;
  if (c.showInDetail === false || c.showInDetail === 'false' || c.showInDetail === 0 || c.showInDetail === '0') return false;
  return true;
};

// Cột Thân nhân hoàn toàn ĐỘNG theo importMappingRelative
const relativeColumns = computed(() => {
  const cols = [];
  const seen = new Set();
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c && c.id && isColVisible(c) && !seen.has(c.id)) {
        seen.add(c.id);
        cols.push(c);
      }
    });
  });
  return cols;
});

// Cột Chuyến đi hoàn toàn ĐỘNG theo importMappingTrips
const tripColumns = computed(() => {
  const cols = [];
  const seen = new Set();
  (personnelStore.importMappingTrips || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c && c.id && isColVisible(c) && !seen.has(c.id)) {
        seen.add(c.id);
        cols.push(c);
      }
    });
  });
  return cols;
});

// Cột Cán bộ
const personnelColumns = computed(() => {
  const cols = [];
  const seen = new Set();
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c && c.id && isColVisible(c) && !seen.has(c.id)) {
        seen.add(c.id);
        cols.push(c);
      }
    });
  });
  return cols;
});

const keyPersonnelCols = computed(() => personnelColumns.value.slice(0, 6));

// Trích xuất giá trị ô hiển thị động đa hình
const getRecordCellValue = (item, col) => {
  if (!item || !col) return '-';
  const val = item[col.id] !== undefined ? item[col.id] : (item.custom_data?.[col.id]);
  if (col.format === 'formula') {
    const res = evaluateFormula(item, col);
    return res?.label || res?.shortLabel || res || '-';
  }
  if (col.format === 'date') {
    return formatDate(val) || '-';
  }
  if (val === null || val === undefined || val === '') return '-';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

// Danh sách thân nhân của Cán bộ này (khớp liên kết động)
const relatedRelatives = computed(() => {
  if (props.recordSource !== 'personnel') return [];
  const pId = String(props.currentRecord.id || props.currentRecord.code || '').trim();
  const pVal = String(props.currentRecord[pKeyField.value] || props.currentRecord.cccd || props.currentRecord.cccdparent || '').trim().toLowerCase();

  const rels = [];
  const seen = new Set();

  const directRels = Array.isArray(props.currentRecord.relatives) ? props.currentRecord.relatives : [];
  directRels.forEach((r, idx) => {
    const key = r.id || r.code || r.uniqueKey || `rel_direct_${idx}`;
    if (!seen.has(key)) {
      seen.add(key);
      rels.push(r);
    }
  });

  (personnelStore.relativesList || []).forEach((r, idx) => {
    const rKey = r.id || r.code || r.uniqueKey || `rel_${idx}`;
    if (seen.has(rKey)) return;

    const matchId = pId && r.personnelId && (String(r.personnelId).trim() === pId);
    const rParentVal = String(r[relParentKey.value] || r.cccdparent || '').trim().toLowerCase();
    const matchVal = pVal && rParentVal && (rParentVal === pVal);
    if (matchId || matchVal) {
      seen.add(rKey);
      rels.push(r);
    }
  });

  return rels;
});

// Cán bộ chủ quản (khi xem Thân nhân)
const parentPerson = computed(() => {
  if (props.recordSource !== 'relatives') return null;
  const pId = props.currentRecord.personnelId;
  const pVal = props.currentRecord[relParentKey.value] || props.currentRecord.cccdparent || props.currentRecord.parentCccd;

  return (personnelStore.personnelList || []).find((p) => {
    if (pId && (String(p.id).trim() === String(pId).trim() || String(p.code).trim() === String(pId).trim())) return true;
    if (pVal) {
      const c = String(p[pKeyField.value] || p.cccd || p.cccdparent || '').trim().toLowerCase();
      if (c && c === String(pVal).trim().toLowerCase()) return true;
    }
    return false;
  }) || props.currentRecord.rawPerson || null;
});

// Toàn bộ chuyến đi liên quan (khớp liên kết động)
const relatedTrips = computed(() => {
  if (props.recordSource === 'personnel') {
    const pId = String(props.currentRecord.id || props.currentRecord.code || '').trim();
    const pVal = String(props.currentRecord[pKeyField.value] || props.currentRecord.cccd || props.currentRecord.cccdparent || '').trim().toLowerCase();

    const relKeySet = new Set(
      relatedRelatives.value.map((r) => String(r[relKeyField.value] || r.cccdthannhan || r.cccd || '').trim().toLowerCase()).filter(Boolean)
    );
    const relIdSet = new Set(
      relatedRelatives.value.map((r) => String(r.id || '').trim()).filter(Boolean)
    );

    const trips = [];
    const seen = new Set();

    (personnelStore.tripsList || []).forEach((t, idx) => {
      const uKey = t.uniqueKey || t.id || `trip_${idx}`;
      if (seen.has(uKey)) return;

      const tVal = String(t[tripKeyField.value] || t.cccdchuyendi || t.cccd || '').trim().toLowerCase();
      const matchPersonId = pId && t.personnelId && String(t.personnelId).trim() === pId;
      const matchPersonVal = pVal && tVal && tVal === pVal && !t.isRelative;

      const matchRelId = t.relativeId && relIdSet.has(String(t.relativeId).trim());
      const matchRelVal = tVal && relKeySet.has(tVal);

      if (matchPersonId || matchPersonVal || matchRelId || matchRelVal) {
        seen.add(uKey);
        const isPers = !t.isRelative && (matchPersonId || matchPersonVal);
        trips.push({
          ...t,
          _isPersonnelTrip: isPers,
          _relativeInfo: isPers ? null : (relatedRelatives.value.find((r) => (r.id && r.id === t.relativeId) || (tVal && String(r[relKeyField.value] || r.cccdthannhan || r.cccd).trim().toLowerCase() === tVal)) || null),
        });
      }
    });

    return trips;
  }

  if (props.recordSource === 'relatives') {
    const relId = String(props.currentRecord.id || props.currentRecord.code || '').trim();
    const relVal = String(props.currentRecord[relKeyField.value] || props.currentRecord.cccdthannhan || props.currentRecord.cccd || '').trim().toLowerCase();

    const trips = [];
    const seen = new Set();

    (personnelStore.tripsList || []).forEach((t, idx) => {
      const uKey = t.uniqueKey || t.id || `trip_${idx}`;
      if (seen.has(uKey)) return;

      const tVal = String(t[tripKeyField.value] || t.cccdchuyendi || t.cccd || '').trim().toLowerCase();
      const matchId = relId && t.relativeId && String(t.relativeId).trim() === relId;
      const matchVal = relVal && tVal && tVal === relVal;

      if (matchId || matchVal) {
        seen.add(uKey);
        trips.push(t);
      }
    });

    return trips;
  }

  return [];
});

const countPersonnelTrips = computed(() => relatedTrips.value.filter((t) => t._isPersonnelTrip).length);
const countRelativeTrips = computed(() => relatedTrips.value.filter((t) => !t._isPersonnelTrip).length);

const displayTrips = computed(() => {
  if (props.recordSource !== 'personnel') return relatedTrips.value;
  if (tripFilterType.value === 'personnel') return relatedTrips.value.filter((t) => t._isPersonnelTrip);
  if (tripFilterType.value === 'relative') return relatedTrips.value.filter((t) => !t._isPersonnelTrip);
  return relatedTrips.value;
});

// Danh sách các tab hiển thị
const availableTabs = computed(() => {
  const tabs = [
    {
      id: 'info',
      label: props.recordSource === 'personnel' ? 'Thông tin Cán bộ' : (props.recordSource === 'relatives' ? 'Thông tin Thân nhân' : 'Thông tin chi tiết'),
      icon: 'pi pi-id-card',
    },
  ];

  if (props.recordSource === 'personnel') {
    tabs.push({
      id: 'relatives',
      label: 'Thân nhân liên kết',
      icon: 'pi pi-users',
      count: relatedRelatives.value.length,
    });
    tabs.push({
      id: 'trips',
      label: 'Chuyến đi nước ngoài',
      icon: 'pi pi-send',
      count: relatedTrips.value.length,
    });
  } else if (props.recordSource === 'relatives') {
    tabs.push({
      id: 'parent',
      label: 'Cán bộ chủ quản',
      icon: 'pi pi-user',
    });
    tabs.push({
      id: 'trips',
      label: 'Chuyến đi của thân nhân',
      icon: 'pi pi-send',
      count: relatedTrips.value.length,
    });
  }

  return tabs;
});

const getRelativeTripCount = (rel) => {
  const rId = String(rel.id || rel.code || '').trim();
  const rVal = String(rel[relKeyField.value] || rel.cccdthannhan || rel.cccd || '').trim().toLowerCase();
  return (personnelStore.tripsList || []).filter((t) => {
    if (rId && t.relativeId && String(t.relativeId).trim() === rId) return true;
    const tVal = String(t[tripKeyField.value] || t.cccdchuyendi || t.cccd || '').trim().toLowerCase();
    return rVal && tVal && rVal === tVal;
  }).length;
};

// CRUD Thân nhân động
const openAddRelative = () => {
  editingRelative.value = null;
  relForm.value = {};
  isRelativeFormOpen.value = true;
};

const openEditRelative = (rel) => {
  editingRelative.value = rel;
  relForm.value = { ...rel, ...(rel.custom_data || {}) };
  isRelativeFormOpen.value = true;
};

const saveRelativeForm = async () => {
  isSavingSub.value = true;
  try {
    const pVal = props.currentRecord[pKeyField.value] || props.currentRecord.cccdparent || props.currentRecord.cccd || '';
    let payload = {
      ...relForm.value,
      _recordType: 'relative',
      [relParentKey.value]: pVal,
      personnelId: props.currentRecord.id || props.currentRecord.code || '',
    };
    if (editingRelative.value?.id) payload.id = editingRelative.value.id;

    await personnelStore.saveRecord(payload);
    await personnelStore.fetchPersonnel();
    isRelativeFormOpen.value = false;
    emit('refresh');
  } catch (e) {
    alert('Lỗi lưu thân nhân: ' + (e.message || e));
  } finally {
    isSavingSub.value = false;
  }
};

const deleteRelative = async (rel) => {
  const nameVal = rel[relativeNameField.value] || rel.relativeName || rel.name || 'thân nhân này';
  if (!confirm(`Bạn có chắc muốn xóa thân nhân: "${nameVal}" không?`)) return;
  try {
    await personnelStore.deleteRelative(rel);
    await personnelStore.fetchPersonnel();
    emit('refresh');
  } catch (e) {
    alert('Lỗi xóa thân nhân: ' + (e.message || e));
  }
};

// CRUD Chuyến đi động
const openAddTrip = () => {
  editingTrip.value = null;
  tripForm.value = {};
  tripTargetPersonType.value = 'personnel';
  isTripFormOpen.value = true;
};

const openEditTrip = (t) => {
  editingTrip.value = t;
  tripForm.value = { ...t, ...(t.custom_data || {}) };
  if (t._isPersonnelTrip || !t.isRelative) {
    tripTargetPersonType.value = 'personnel';
  } else {
    const tVal = String(t[tripKeyField.value] || t.cccdchuyendi || '').trim();
    const matched = relatedRelatives.value.find((r) => (t.relativeId && r.id === t.relativeId) || (tVal && String(r[relKeyField.value] || r.cccdthannhan).trim() === tVal));
    tripTargetPersonType.value = matched ? 'rel_' + (matched.id || matched[relKeyField.value] || matched.cccdthannhan) : 'personnel';
  }
  isTripFormOpen.value = true;
};

const saveTripForm = async () => {
  isSavingSub.value = true;
  try {
    let payload = {
      ...tripForm.value,
      _recordType: 'trip',
    };
    if (editingTrip.value?.id) payload.id = editingTrip.value.id;
    if (editingTrip.value?.uniqueKey) payload.uniqueKey = editingTrip.value.uniqueKey;

    if (props.recordSource === 'personnel') {
      if (tripTargetPersonType.value === 'personnel') {
        payload.isRelative = false;
        payload.personnelId = props.currentRecord.id;
        payload[tripKeyField.value] = props.currentRecord[pKeyField.value] || props.currentRecord.cccd || props.currentRecord.cccdparent || '';
        delete payload.relativeId;
      } else if (tripTargetPersonType.value.startsWith('rel_')) {
        const targetRelId = tripTargetPersonType.value.replace('rel_', '');
        const targetRel = relatedRelatives.value.find((r) => String(r.id) === targetRelId || String(r[relKeyField.value] || r.cccdthannhan) === targetRelId);
        payload.isRelative = true;
        payload.personnelId = props.currentRecord.id;
        payload.relativeId = targetRel?.id || targetRelId;
        payload.relativeName = targetRel?.[relativeNameField.value] || targetRel?.relativeName || targetRel?.name || '';
        payload[tripKeyField.value] = targetRel?.[relKeyField.value] || targetRel?.cccdthannhan || targetRel?.cccd || '';
      }
    } else if (props.recordSource === 'relatives') {
      payload.isRelative = true;
      payload.relativeId = props.currentRecord.id;
      payload.personnelId = props.currentRecord.personnelId;
      payload[tripKeyField.value] = props.currentRecord[relKeyField.value] || props.currentRecord.cccdthannhan || props.currentRecord.cccd || '';
    }

    await personnelStore.saveRecord(payload);
    await personnelStore.fetchPersonnel();
    isTripFormOpen.value = false;
    emit('refresh');
  } catch (e) {
    alert('Lỗi lưu chuyến đi: ' + (e.message || e));
  } finally {
    isSavingSub.value = false;
  }
};

const deleteTrip = async (trip) => {
  const dest = trip.countryName || trip.destination || trip.quoc_gia_xuat_canh || trip.id || '';
  if (!confirm(`Bạn có chắc muốn xóa chuyến đi: "${dest}" không?`)) return;
  try {
    await personnelStore.deleteTrip(trip);
    await personnelStore.fetchPersonnel();
    emit('refresh');
  } catch (e) {
    alert('Lỗi xóa chuyến đi: ' + (e.message || e));
  }
};
</script>

<style scoped>
.personnel-related-tabs-container { width: 100%; }
.related-tabs-nav { display: flex; align-items: center; gap: 6px; border-bottom: 2px solid #e2e8f0; padding: 0 4px; margin-bottom: 12px; }
.tab-nav-btn { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: transparent; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: 0.84rem; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.15s ease; border-radius: 6px 6px 0 0; }
.tab-nav-btn:hover { color: #0284c7; background: #f8fafc; }
.tab-nav-btn.active { color: #0284c7; border-bottom-color: #0284c7; background: #f0f9ff; font-weight: 700; }
.tab-counter-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 6px; border-radius: 10px; font-size: 0.7rem; font-weight: 700; background: #e2e8f0; color: #475569; }
.tab-counter-badge.has-items { background: #dbeafe; color: #1d4ed8; }
.pane-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 8px 4px 12px 4px; gap: 12px; flex-wrap: wrap; }
.pane-title-area { display: flex; flex-direction: column; gap: 2px; }
.pane-title { font-size: 0.95rem; font-weight: 700; color: #1e293b; }
.pane-subtitle { font-size: 0.74rem; color: #64748b; }
.trip-filter-pills { display: inline-flex; background: #f1f5f9; padding: 2px; border-radius: 8px; gap: 2px; }
.filter-pill { border: none; background: transparent; padding: 4px 10px; font-size: 0.75rem; font-weight: 600; color: #64748b; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; }
.filter-pill.active { background: #ffffff; color: #0284c7; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
.mini-table-wrapper { width: 100%; overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; max-height: 480px; }
.custom-mini-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left; }
.custom-mini-table th { background: #f8fafc; color: #475569; font-weight: 700; padding: 9px 12px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; position: sticky; top: 0; z-index: 1; }
.custom-mini-table td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
.custom-mini-table tr:hover td { background: #f8fafc; }
.col-center { text-align: center; }
.idx-cell { font-weight: 600; color: #94a3b8; }
.table-actions { display: flex; gap: 4px; justify-content: center; }
.btn-action-icon { width: 26px; height: 26px; border-radius: 4px; border: 1px solid transparent; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.76rem; transition: all 0.15s ease; }
.btn-action-icon.edit { color: #0284c7; }
.btn-action-icon.edit:hover { background: #e0f2fe; border-color: #bae6fd; }
.btn-action-icon.delete { color: #ef4444; }
.btn-action-icon.delete:hover { background: #fee2e2; border-color: #fecaca; }
.trip-count-pill { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: 600; background: #f1f5f9; color: #64748b; }
.trip-count-pill.has-trips { background: #dcfce7; color: #15803d; }
.person-type-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; font-weight: 600; padding: 2px 7px; border-radius: 10px; }
.person-type-tag.person { background: #e0f2fe; color: #0369a1; }
.person-type-tag.relative { background: #f3e8ff; color: #7e22ce; }
.empty-state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 36px 16px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; gap: 10px; }
.empty-icon { font-size: 2rem; color: #94a3b8; }
.empty-text { font-size: 0.82rem; color: #64748b; margin: 0; }
.parent-profile-card { display: flex; gap: 16px; padding: 16px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; align-items: flex-start; }
.parent-avatar-box { width: 48px; height: 48px; border-radius: 50%; background: #0284c7; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
.parent-details { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.parent-name { font-size: 1.05rem; font-weight: 700; color: #0369a1; margin: 0; }
.parent-meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; }
.meta-item { display: flex; flex-direction: column; gap: 2px; }
.meta-label { font-size: 0.7rem; color: #64748b; font-weight: 600; }
.meta-val { font-size: 0.82rem; color: #1e293b; font-weight: 600; }
.parent-card-actions { margin-top: 8px; }
.field-label { display: flex; align-items: center; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 2px; }
.label-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
