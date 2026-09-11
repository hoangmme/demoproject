<template>
  <Dialog
    v-model:visible="visible"
    modal
    :baseZIndex="15000"
    :style="{ width: '85vw', maxWidth: '1100px', zIndex: 15000 }"
    :breakpoints="{ '960px': '95vw', '640px': '100vw' }"
  >
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding-right: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="p-dialog-title" style="font-size: 1.05rem; font-weight: 700; color: #0f172a;">
            {{ dialogHeader }}
          </span>
        </div>
        <Button
          icon="pi pi-plus"
          label="Thêm dữ liệu"
          severity="success"
          size="small"
          @click="isDynamicDataEntryOpen = true"
          title="Nhập liệu mới cho bất kỳ bảng nào trong hệ thống (đồng bộ menu)"
          style="font-size: 0.78rem; font-weight: 700; padding: 4px 10px; height: 32px;"
        />
      </div>
    </template>

    <!-- Tab navigation & Linked Relatives / Trips / Custom Tables Content -->
    <PersonnelRelatedTabs
      v-if="isEdit"
      v-model="activeTab"
      :currentRecord="form"
      :recordSource="recordSource"
      :tableId="recordSource"
      :initialRecordId="initialRecordId"
      @refresh="handleTabRefresh"
      @switchRecord="handleSwitchRecord"
    />

    <!-- Thẻ Nhận diện Người đi & Điều hướng Chuyển Tab Nhanh (Traveler Identity Card) -->
    <div v-if="recordSource === 'trips' && activeTab === 'info' && (tripLinkedOfficer || tripLinkedRelative)" class="trip-traveler-card">
      <div class="traveler-card-main">
        <div class="traveler-badge" :class="isRelativeTrip ? 'is-relative' : 'is-officer'">
          <i :class="isRelativeTrip ? 'pi pi-users' : 'pi pi-user'"></i>
          <span>{{ isRelativeTrip ? 'CHUYẾN ĐI CỦA THÂN NHÂN' : 'CHUYẾN ĐI CỦA CÁN BỘ' }}</span>
        </div>
        <div class="traveler-info-body">
          <div class="traveler-name-row">
            <span class="label">Người đi:</span>
            <strong class="name-highlight">
              {{ isRelativeTrip ? (tripLinkedRelative?.relativeName || tripLinkedRelative?.name || 'Thân nhân') : (tripLinkedOfficer?.name || 'Cán bộ') }}
            </strong>
            <span v-if="isRelativeTrip && (tripLinkedRelative?.relationshipName || form.relationshipName)" class="relation-badge">
              ({{ tripLinkedRelative?.relationshipName || form.relationshipName }})
            </span>
          </div>
          <div v-if="tripLinkedOfficer" class="traveler-officer-row">
            <span class="label">{{ isRelativeTrip ? 'Cán bộ bảo lãnh:' : 'Đơn vị / Chức vụ:' }}</span>
            <span class="officer-detail">
              <strong v-if="isRelativeTrip">{{ tripLinkedOfficer.name }}</strong>
              <span v-if="tripLinkedOfficer.positionName || tripLinkedOfficer.position"> - {{ tripLinkedOfficer.positionName || tripLinkedOfficer.position }}</span>
              <span v-if="tripLinkedOfficer.departmentName"> ({{ tripLinkedOfficer.departmentName }})</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Nút chuyển nhanh sang hồ sơ Cán bộ hoặc Thân nhân liên quan -->
      <div class="traveler-quick-nav">
        <button
          v-if="tripLinkedOfficer"
          type="button"
          class="quick-nav-btn officer"
          @click="handleSwitchRecord(tripLinkedOfficer)"
          title="Bấm để mở toàn bộ hồ sơ Cán bộ (Bao gồm danh sách chuyến đi & thân nhân)"
        >
          <i class="pi pi-user"></i>
          <span>Hồ sơ Cán bộ</span>
        </button>
        <button
          v-if="isRelativeTrip || tripLinkedRelative"
          type="button"
          class="quick-nav-btn relative"
          @click="handleSwitchRecord(tripLinkedRelative)"
          title="Bấm để mở hồ sơ Thân nhân"
        >
          <i class="pi pi-users"></i>
          <span>Hồ sơ Thân nhân</span>
        </button>
      </div>

      <!-- Danh sách chuyển đổi các chuyến đi của người này (nếu có > 1 chuyến) -->
      <div v-if="travelerTrips.length > 1" class="traveler-trips-switcher">
        <span class="switcher-label">
          <i class="pi pi-list"></i> Các chuyến đi của {{ isRelativeTrip ? 'thân nhân' : 'cán bộ' }} ({{ travelerTrips.length }} chuyến):
        </span>
        <div class="trips-pills">
          <button
            v-for="(t, idx) in travelerTrips"
            :key="t.id || t.uniqueKey || idx"
            type="button"
            class="trip-pill-btn"
            :class="{ active: isCurrentTrip(t) }"
            @click="initFormData(t)"
            :title="'Bấm để xem chi tiết ' + getTripDisplayLabel(t, idx)"
          >
            <i class="pi pi-send"></i>
            {{ getTripDisplayLabel(t, idx) }}
          </button>
        </div>
      </div>
    </div>
    <div v-else-if="recordSource === 'trips' && activeTab === 'info'" class="trip-unlinked-card">
      <div class="unlinked-icon">
        <i class="pi pi-info-circle"></i>
      </div>
      <div class="unlinked-text">
        <strong>Chuyến đi độc lập / Chưa liên kết:</strong>
        <span> Cột CCCD chuyến đi đang để trống hoặc chưa khớp với bất kỳ Cán bộ / Thân nhân nào trong hệ thống.</span>
      </div>
    </div>

    <!-- Contents Area: 100% Dynamic Grouped Form -->
    <div v-show="activeTab === 'info'" class="dialog-grouped-container">
      <div
        v-for="(grp, gIdx) in formGroups"
        :key="grp.title || gIdx"
        class="form-group-section"
      >
        <div class="form-group-header">
          <i class="pi pi-folder-open form-group-icon"></i>
          <span class="form-group-title">{{ grp.title }}</span>
          <span class="form-group-count">({{ grp.columns.length }} trường)</span>
        </div>
        <div class="form-grid">
          <template v-for="col in grp.columns" :key="col.id">
            <div class="field-item" :style="getColItemStyle(col.formWidth || col.width)">
              <label class="field-label" :title="col.label">
                <span class="label-text">{{ col.label }}</span>
                <span v-if="col.required" style="color: #ef4444; font-weight: 800; margin-left: 2px;">*</span>
              </label>
              <DynamicField
                v-model="form[col.id]"
                :col="col"
              />
            </div>
          </template>
        </div>
      </div>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
        <div>
          <Button
            v-if="isEdit && authStore.isAdmin && activeTab === 'info'"
            label="Xóa hồ sơ"
            icon="pi pi-trash"
            severity="danger"
            text
            size="small"
            @click="handleDelete"
          />
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span v-if="activeTab === 'info' && autoSaveStatus === 'saving'" style="font-size: 0.75rem; color: #0284c7; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-right: 4px;">
            <i class="pi pi-spin pi-spinner"></i> Đang lưu...
          </span>
          <span v-else-if="activeTab === 'info' && autoSaveStatus === 'saved'" style="font-size: 0.75rem; color: #16a34a; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-right: 4px;">
            <i class="pi pi-check-circle"></i> Đã lưu thành công
          </span>

          <Button
            v-if="isEdit && activeTab === 'info'"
            label="Xuất Hồ sơ PDF"
            icon="pi pi-file-pdf"
            severity="secondary"
            outlined
            size="small"
            @click="isDocxExportOpen = true"
          />
          <Button label="Đóng" severity="secondary" text size="small" @click="visible = false" />
          <Button
            v-if="activeTab === 'info'"
            label="Lưu hồ sơ"
            icon="pi pi-check"
            severity="success"
            size="small"
            :loading="saving"
            @click="handleSave"
          />
        </div>
      </div>
    </template>
  </Dialog>

  <!-- Advanced DOCX Export Dialog for current Person / Record -->
  <AdvancedDocxExportDialog
    v-model="isDocxExportOpen"
    :targetPerson="form"
    :tableId="recordSource"
    :columns="allTableColumns"
    :groups="formGroups"
  />

  <!-- Dialog Nhập liệu mới đồng bộ như ở menu -->
  <TableDataEntryDialog
    v-model="isDynamicDataEntryOpen"
    :activeSource="recordSource"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import { useAuthStore } from '@/stores/auth';
import DynamicField from '@/components/common/DynamicField.vue';
import AdvancedDocxExportDialog from '@/components/common/AdvancedDocxExportDialog.vue';
import TableDataEntryDialog from '@/components/common/TableDataEntryDialog.vue';
import PersonnelRelatedTabs from '@/components/personnel/PersonnelRelatedTabs.vue';
import { getColItemStyle, formatDate } from '@/utils/formatters';
import { getUnifiedTableColumns, getUnifiedTableDefinitions } from '@/utils/tableRegistry';

const isDocxExportOpen = ref(false);
const isDynamicDataEntryOpen = ref(false);
const activeTab = ref('info');
const switchedSource = ref(null);

const recordSource = computed(() => {
  if (switchedSource.value) return switchedSource.value;
  if (props.tableId && ['personnel', 'relatives', 'trips'].includes(props.tableId)) {
    return props.tableId;
  }
  if (props.tableId && props.tableId !== 'default') {
    return props.tableId;
  }
  if (form.value._tableId) return form.value._tableId;
  if (form.value._recordType === 'trip' || form.value.rawTrip || form.value.departureDate || form.value.ngay_xuat_canh || form.value.cccdchuyendi) return 'trips';
  if (form.value._recordType === 'relative' || form.value.rawRelative || form.value.relationshipName || form.value.relativeName || form.value.cccdthannhan || form.value.isRelative) return 'relatives';
  if (form.value._recordType === 'personnel' || (form.value.code && String(form.value.code).startsWith('CB-')) || form.value.positionName || form.value.departmentName) return 'personnel';
  if (form.value._recordType === 'blank') return 'blank';
  return 'personnel';
});

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  personData: {
    type: Object,
    default: null,
  },
  tableId: {
    type: String,
    default: '',
  },
  columns: {
    type: Array,
    default: () => [],
  },
  initialTab: {
    type: [String, Number],
    default: 'info',
  },
  initialRecordId: {
    type: [String, Number],
    default: null,
  },
  targetRelativeCode: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'saved', 'deleted']);
const personnelStore = usePersonnelStore();
const authStore = useAuthStore();

const saving = ref(false);
const autoSaveStatus = ref('');
let autoSaveTimer = null;
let initialJsonSnapshot = '';
let isSavingInternal = false;

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const form = ref({});

const isEdit = computed(() => Boolean(
  props.personData && (
    form.value.id ||
    form.value.uniqueKey ||
    form.value._primaryKey ||
    form.value.code ||
    form.value.cccd ||
    form.value.cccdthannhan ||
    form.value.cccdchuyendi ||
    Object.keys(form.value).length > 1
  )
));

const isColumnVisibleInDetail = (c) => {
  if (!c || c.isVirtual || c.id === 'stt') return false;
  if (c.showInDetail === false || c.showInDetail === 'false' || c.showInDetail === 0 || c.showInDetail === '0') return false;
  return true;
};

const allTableColumns = computed(() => {
  // 1. Props columns if passed and valid (highest priority - contains latest UI edits & options)
  if (props.columns && Array.isArray(props.columns) && props.columns.length > 0) {
    const valid = props.columns.filter(isColumnVisibleInDetail);
    if (valid.length > 0) return valid;
    const nonVirtual = props.columns.filter((c) => !c.isVirtual && c.id !== 'stt');
    if (nonVirtual.length > 0) return nonVirtual;
  }

  // 2. Dynamic table registry columns for this record source
  let customDashboards = [];
  try {
    const local = localStorage.getItem('custom_dashboards_config');
    if (local) customDashboards = JSON.parse(local);
  } catch (e) {}

  const srcCols = getUnifiedTableColumns(recordSource.value, {
    personnelStore,
    customDashboards,
  });
  if (srcCols && Array.isArray(srcCols) && srcCols.length > 0) {
    const valid = srcCols.filter(isColumnVisibleInDetail);
    if (valid.length > 0) return valid;
    const nonVirtual = srcCols.filter((c) => !c.isVirtual && c.id !== 'stt');
    if (nonVirtual.length > 0) return nonVirtual;
  }

  // 3. Fallback to specific group in store mapping
  let mappingGroups = [];
  if (recordSource.value === 'relatives') {
    mappingGroups = personnelStore.importMappingRelative || [];
  } else if (recordSource.value === 'trips') {
    mappingGroups = personnelStore.importMappingTrips || [];
  } else if (recordSource.value === 'personnel') {
    mappingGroups = personnelStore.importMappingPersonnel || [];
  } else {
    mappingGroups = [
      ...(personnelStore.importMappingPersonnel || []),
      ...(personnelStore.importMappingRelative || []),
      ...(personnelStore.importMappingTrips || []),
    ];
  }

  const list = [];
  const seen = new Set();
  mappingGroups.forEach((grp) => {
    (grp.columns || []).forEach((col) => {
      if (col && isColumnVisibleInDetail(col) && !seen.has(col.id)) {
        seen.add(col.id);
        list.push(col);
      }
    });
  });
  if (list.length > 0) return list;

  // Final fallback: all columns
  mappingGroups.forEach((grp) => {
    (grp.columns || []).forEach((col) => {
      if (col && col.id && col.id !== 'stt' && !col.isVirtual && !seen.has(col.id)) {
        seen.add(col.id);
        list.push(col);
      }
    });
  });
  return list;
});

const formGroups = computed(() => {
  const src = recordSource.value;
  let rawGroups = [];
  if (src === 'trips') {
    rawGroups = personnelStore.importMappingTrips || [];
  } else if (src === 'relatives') {
    rawGroups = personnelStore.importMappingRelative || [];
  } else if (src === 'personnel') {
    rawGroups = personnelStore.importMappingPersonnel || [];
  } else {
    let customDashboards = [];
    try {
      const local = localStorage.getItem('custom_dashboards_config');
      if (local) customDashboards = JSON.parse(local);
    } catch (e) {}
    const cDash = customDashboards.find((d) => d.id === src);
    if (cDash?.groups && cDash.groups.length > 0) rawGroups = cDash.groups;
    else if (cDash?.customColumns) rawGroups = [{ title: 'Thông tin chung', columns: cDash.customColumns }];
  }

  // Fallback sang localStorage nếu store chỉ có <= 1 nhóm
  if ((!rawGroups || rawGroups.length <= 1) && (src === 'personnel' || src === 'relatives' || src === 'trips')) {
    const keys = src === 'personnel'
      ? ['mapping_config_personnel', 'app_settings_mapping_config_personnel', 'import_mapping_personnel', 'importMappingPersonnel']
      : src === 'relatives'
        ? ['mapping_config_relative', 'app_settings_mapping_config_relative', 'import_mapping_relative', 'importMappingRelative']
        : ['mapping_config_trips', 'app_settings_mapping_config_trips', 'import_mapping_trips', 'importMappingTrips'];
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          let parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.groups)) {
            parsed = parsed.groups;
          }
          if (Array.isArray(parsed) && parsed.length > (rawGroups?.length || 0)) {
            rawGroups = parsed;
            break;
          }
        }
      } catch (e) {}
    }
  }

  const cols = allTableColumns.value;
  const colMap = new Map();
  cols.forEach((c) => {
    if (c && c.id && c.id !== 'stt' && !c.hidden) {
      colMap.set(c.id, c);
    }
  });

  if (!rawGroups || rawGroups.length === 0) {
    return [{ title: 'Thông tin chung', columns: Array.from(colMap.values()) }];
  }

  const result = [];
  const placedColIds = new Set();

  rawGroups.forEach((grp, idx) => {
    const grpCols = [];
    (grp.columns || []).forEach((c) => {
      if (!c || !c.id || c.id === 'stt' || c.hidden) return;
      if (colMap.has(c.id)) {
        grpCols.push({ ...colMap.get(c.id), ...c });
        placedColIds.add(c.id);
      } else if (isColumnVisibleInDetail(c)) {
        grpCols.push(c);
        placedColIds.add(c.id);
      }
    });
    if (grpCols.length > 0) {
      result.push({
        title: grp.title || `Nhóm ${idx + 1}`,
        columns: grpCols,
      });
    }
  });

  // Collect any remaining columns
  const remaining = [];
  colMap.forEach((c, id) => {
    if (!placedColIds.has(id) && isColumnVisibleInDetail(c)) {
      remaining.push(c);
    }
  });
  if (remaining.length > 0) {
    if (result.length > 0) {
      result[0].columns.push(...remaining);
    } else {
      result.push({ title: 'Thông tin chung', columns: remaining });
    }
  }

  return result.length > 0 ? result : [{ title: 'Thông tin chung', columns: Array.from(colMap.values()) }];
});

const dialogHeader = computed(() => {
  if (recordSource.value === 'trips' || form.value._recordType === 'trip') {
    let dest = '';
    if (form.value.quoc_gia_xuat_canh !== undefined) {
      dest = form.value.quoc_gia_xuat_canh;
    } else if (form.value.countryName !== undefined) {
      dest = form.value.countryName;
    } else if (form.value.country !== undefined) {
      dest = form.value.country;
    }
    dest = String(dest || '').trim();
    return isEdit.value ? (dest ? `Chi tiết Chuyến đi: ${dest}` : `Chi tiết Chuyến đi`) : `Thêm mới Chuyến đi`;
  }
  if (recordSource.value === 'relatives' || form.value._recordType === 'relative') {
    const rName = form.value.relativeName || form.value.name || form.value.fullName || form.value.ho_ten || '';
    return isEdit.value ? (rName ? `Chi tiết Thân nhân: ${rName}` : `Chi tiết Thân nhân`) : `Thêm mới Thân nhân`;
  }
  const pNameField = personnelStore.getPersonnelNameField ? personnelStore.getPersonnelNameField() : 'name';
  const nameVal = form.value[pNameField] || form.value.name || form.value.fullName || form.value.title || form.value.id || '';
  return isEdit.value ? `Chi tiết: ${nameVal || 'Cán bộ'}` : `Thêm mới cán bộ`;
});

// Dynamic linkage resolution for Trips banner (Zero Fallback / Pure Key Matching)
const tripLinkedRelative = computed(() => {
  if (recordSource.value !== 'trips') return null;
  const tKeyField = personnelStore.getTripKeyField ? personnelStore.getTripKeyField() : '';
  const tVal = tKeyField && form.value[tKeyField] ? String(form.value[tKeyField]).trim().toLowerCase() : '';

  // ZERO FALLBACK: If trip linking key is empty, it does NOT link to anyone!
  if (!tVal) return null;

  const allRelatives = personnelStore.relativesList || [];
  const rKeyField = personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : '';

  // Direct Key match with Relative Key (e.g. cccdthannhan)
  if (rKeyField) {
    const r = allRelatives.find((rel) => {
      const c = rel[rKeyField] ? String(rel[rKeyField]).trim().toLowerCase() : '';
      return c && c === tVal;
    });
    if (r) return r;
  }
  return null;
});

const tripLinkedOfficer = computed(() => {
  if (recordSource.value !== 'trips') return null;
  const tKeyField = personnelStore.getTripKeyField ? personnelStore.getTripKeyField() : '';
  const tVal = tKeyField && form.value[tKeyField] ? String(form.value[tKeyField]).trim().toLowerCase() : '';

  // ZERO FALLBACK: If trip linking key is empty, it does NOT link to anyone!
  if (!tVal) return null;

  const allPersonnel = personnelStore.personnelList || [];
  const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : '';

  // 1. Direct Key match with Personnel Key (e.g. cccd)
  if (pKeyField) {
    const p = allPersonnel.find((pers) => {
      const c = pers[pKeyField] ? String(pers[pKeyField]).trim().toLowerCase() : '';
      return c && c === tVal;
    });
    if (p) return p;
  }

  // 2. Via linked relative (only if trip was matched to a relative, find that relative's parent officer)
  const rel = tripLinkedRelative.value;
  if (rel) {
    const relParentKey = personnelStore.getRelativeParentKeyField ? personnelStore.getRelativeParentKeyField() : '';
    const parentVal = relParentKey && rel[relParentKey] ? String(rel[relParentKey]).trim().toLowerCase() : '';
    if (parentVal && pKeyField) {
      const p = allPersonnel.find((pers) => {
        const c = pers[pKeyField] ? String(pers[pKeyField]).trim().toLowerCase() : '';
        return c && c === parentVal;
      });
      if (p) return p;
    }
  }
  return null;
});

const isRelativeTrip = computed(() => {
  if (recordSource.value !== 'trips') return false;
  return Boolean(tripLinkedRelative.value);
});

const travelerTrips = computed(() => {
  if (recordSource.value !== 'trips') return [];
  const officer = tripLinkedOfficer.value;
  const rel = tripLinkedRelative.value;
  if (!officer && !rel) return [];

  const allTrips = personnelStore.tripsList || [];
  const tripKeyField = personnelStore.getTripKeyField ? personnelStore.getTripKeyField() : '';
  const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : '';
  const relKeyField = personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : '';

  if (isRelativeTrip.value && rel) {
    const relKeyVal = relKeyField && rel[relKeyField] ? String(rel[relKeyField]).trim().toLowerCase() : '';
    if (!relKeyVal) return [];
    return allTrips.filter((t) => {
      const tVal = tripKeyField && t[tripKeyField] ? String(t[tripKeyField]).trim().toLowerCase() : '';
      return tVal && tVal === relKeyVal;
    });
  } else if (officer) {
    const officerKeyVal = pKeyField && officer[pKeyField] ? String(officer[pKeyField]).trim().toLowerCase() : '';
    if (!officerKeyVal) return [];
    return allTrips.filter((t) => {
      const tVal = tripKeyField && t[tripKeyField] ? String(t[tripKeyField]).trim().toLowerCase() : '';
      return tVal && tVal === officerKeyVal;
    });
  }
  return [];
});

const getTripDisplayLabel = (t, index) => {
  const dest = t.quoc_gia_xuat_canh || t.countryName || t.country || t.quoc_gia || t.quoc_gia_den || 'Chuyến đi';
  const d = t.departureDate || t.ngay_xuat_canh;
  const formattedD = d ? formatDate(d) : '';
  return `Chuyến ${index + 1}: ${dest}${formattedD ? ` (${formattedD})` : ''}`;
};

const isCurrentTrip = (t) => {
  if (!t) return false;
  if (form.value.id && t.id && String(form.value.id) === String(t.id)) return true;
  if (form.value.uniqueKey && t.uniqueKey && form.value.uniqueKey === t.uniqueKey) return true;
  return false;
};

const safeClone = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  try {
    return JSON.parse(
      JSON.stringify(obj, (key, value) => {
        if (key === 'rawPerson' || key === 'rawRelative' || key === 'rawTrip' || key === 'parentPerson' || key === '_fallbackPerson' || key === '_fallbackRelative') {
          return undefined;
        }
        return value;
      })
    );
  } catch (e) {
    return { ...obj };
  }
};

const initFormData = (val) => {
  if (val) {
    let cd = val.custom_data || {};
    if (typeof cd === 'string') {
      try {
        cd = JSON.parse(cd);
      } catch (e) {
        cd = {};
      }
    }
    let unnestDepth = 0;
    while (cd.custom_data && unnestDepth < 10) {
      unnestDepth++;
      let nested = cd.custom_data;
      delete cd.custom_data;
      if (typeof nested === 'string') {
        try { nested = JSON.parse(nested); } catch (e) { nested = null; }
      }
      if (nested && typeof nested === 'object') {
        cd = { ...nested, ...cd };
      }
    }
    const parsedVal = safeClone(val);
    const STANDARD_CORE_TABLES = ['personnel', 'relatives', 'trips'];
    if (props.tableId && !STANDARD_CORE_TABLES.includes(props.tableId) && !parsedVal._tableId) {
      parsedVal._tableId = props.tableId;
    }
    delete parsedVal.custom_data;
    delete cd.custom_data;

    // Direct values in parsedVal override cd
    const merged = { ...cd, ...parsedVal };

    // If country was explicitly cleared on parsedVal, ensure all aliases are cleared
    const countryAliases = ['quoc_gia_xuat_canh', 'countryName', 'country', 'quoc_gia', 'quoc_gia_den'];
    if (parsedVal.quoc_gia_xuat_canh !== undefined && !String(parsedVal.quoc_gia_xuat_canh || '').trim()) {
      for (const alias of countryAliases) {
        merged[alias] = '';
      }
    } else if (parsedVal.countryName !== undefined && !String(parsedVal.countryName || '').trim()) {
      for (const alias of countryAliases) {
        merged[alias] = '';
      }
    }

    form.value = {
      ...merged,
      uniqueKey: val.uniqueKey || parsedVal.uniqueKey || val.id || val._primaryKey,
      _primaryKey: val._primaryKey || parsedVal._primaryKey || val.id,
      _recordType: val._recordType || parsedVal._recordType,
      _tableId: parsedVal._tableId || val._tableId,
      rawPerson: val.rawPerson,
      rawRelative: val.rawRelative,
      rawTrip: val.rawTrip,
      custom_data: { ...merged },
    };
  } else {
    form.value = {
      custom_data: {},
    };
  }
  initialJsonSnapshot = JSON.stringify(form.value);
};

watch(
  () => [props.modelValue, props.personData],
  ([isOpen, pData]) => {
    if (isOpen) {
      switchedSource.value = null;
      activeTab.value = props.initialTab || 'info';
      initFormData(pData || props.personData);
    } else {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveStatus.value = '';
    }
  },
  { immediate: true, deep: true }
);

const executeSave = async (payload) => {
  return await personnelStore.saveRecord(payload);
};

const buildSavePayload = () => {
  const curSrc = recordSource.value;
  const payload = {
    ...form.value,
    _tableId: curSrc,
    _recordType: curSrc === 'trips' ? 'trip' : (curSrc === 'relatives' ? 'relative' : (curSrc === 'personnel' ? 'personnel' : form.value._recordType)),
    custom_data: { ...(form.value.custom_data || {}), ...form.value },
  };
  delete payload.rawPerson;
  delete payload.rawRelative;
  delete payload.rawTrip;
  if (payload.custom_data) {
    delete payload.custom_data.rawPerson;
    delete payload.custom_data.rawRelative;
    delete payload.custom_data.rawTrip;
    delete payload.custom_data.custom_data;
  }

  // Country alias synchronization: If user cleared country, propagate empty string to all aliases
  const countryAliases = ['quoc_gia_xuat_canh', 'countryName', 'country', 'quoc_gia', 'quoc_gia_den'];
  if (form.value.quoc_gia_xuat_canh !== undefined && !String(form.value.quoc_gia_xuat_canh || '').trim()) {
    for (const alias of countryAliases) {
      payload[alias] = '';
      if (payload.custom_data) delete payload.custom_data[alias];
    }
  } else if (form.value.countryName !== undefined && !String(form.value.countryName || '').trim()) {
    for (const alias of countryAliases) {
      payload[alias] = '';
      if (payload.custom_data) delete payload.custom_data[alias];
    }
  }

  return payload;
};

const triggerAutoSave = () => {
  if (!isEdit.value || isSavingInternal || saving.value) return;

  if (autoSaveTimer) clearTimeout(autoSaveTimer);

  autoSaveTimer = setTimeout(async () => {
    if (isSavingInternal || saving.value) return;
    isSavingInternal = true;
    autoSaveStatus.value = 'saving';
    try {
      const payload = buildSavePayload();
      const saved = await executeSave(payload);
      initialJsonSnapshot = JSON.stringify(form.value);
      autoSaveStatus.value = 'saved';
      emit('saved', saved);
      setTimeout(() => {
        if (autoSaveStatus.value === 'saved') autoSaveStatus.value = '';
      }, 2500);
    } catch (e) {
      autoSaveStatus.value = '';
    } finally {
      isSavingInternal = false;
    }
  }, 2000);
};

watch(
  () => form.value,
  () => {
    if (!visible.value || !isEdit.value) return;
    const currentJson = JSON.stringify(form.value);
    if (!initialJsonSnapshot) {
      initialJsonSnapshot = currentJson;
      return;
    }
    if (currentJson !== initialJsonSnapshot) {
      triggerAutoSave();
    }
  },
  { deep: true }
);

const handleSave = async () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  if (isSavingInternal || saving.value) {
    await new Promise((r) => setTimeout(r, 400));
  }
  saving.value = true;
  isSavingInternal = true;
  autoSaveStatus.value = 'saving';
  try {
    const payload = buildSavePayload();
    const saved = await executeSave(payload);
    if (!saved) {
      throw new Error('Hệ thống không thể lưu bản ghi. Vui lòng kiểm tra lại thông tin nhập!');
    }
    initialJsonSnapshot = JSON.stringify(form.value);
    autoSaveStatus.value = 'saved';
    emit('saved', saved);
    setTimeout(() => {
      if (autoSaveStatus.value === 'saved') autoSaveStatus.value = '';
    }, 2500);
    visible.value = false;
  } catch (e) {
    autoSaveStatus.value = '';
    alert('Lỗi lưu dữ liệu: ' + (e.message || e));
  } finally {
    saving.value = false;
    isSavingInternal = false;
  }
};

const handleDelete = async () => {
  const pNameField = personnelStore.getPersonnelNameField ? personnelStore.getPersonnelNameField() : 'name';
  const nameVal = form.value[pNameField] || form.value.name || form.value.relativeName || form.value.title || form.value.id || 'kết quả này';
  if (!confirm(`Bạn có chắc chắn muốn xóa "${nameVal}" không?`)) return;
  try {
    await personnelStore.deleteRecord(form.value);
    emit('deleted', form.value);
    visible.value = false;
  } catch (e) {
    alert('Lỗi xóa: ' + (e.message || e));
  }
};

const handleTabRefresh = async () => {
  await personnelStore.fetchPersonnel();
  emit('saved', form.value);
};

const handleSwitchRecord = (newPerson, targetTableId = null) => {
  if (newPerson) {
    if (targetTableId) {
      switchedSource.value = targetTableId;
    } else if (newPerson._tableId) {
      switchedSource.value = newPerson._tableId;
    } else {
      const allTables = getUnifiedTableDefinitions({ personnelStore });
      const matchedTable = allTables.find((t) => {
        if (t.id === newPerson._recordType || t.source === newPerson._recordType) return true;
        const cols = t.getColumns ? t.getColumns(personnelStore) : [];
        const keyCol = cols.find((c) => c.isKey);
        return keyCol && newPerson[keyCol.id] !== undefined && String(newPerson[keyCol.id]).trim() !== '';
      });
      if (matchedTable) {
        switchedSource.value = matchedTable.id;
      } else if (newPerson._recordType === 'personnel' || (newPerson.code && String(newPerson.code).startsWith('CB-')) || (newPerson.departmentName && !newPerson.isRelative)) {
        switchedSource.value = 'personnel';
      } else if (newPerson._recordType === 'relative' || newPerson.relationshipName || newPerson.relativeName || newPerson.cccdthannhan) {
        switchedSource.value = 'relatives';
      } else if (newPerson._recordType === 'trip' || newPerson.departureDate || newPerson.ngay_xuat_canh || newPerson.cccdchuyendi) {
        switchedSource.value = 'trips';
      } else {
        switchedSource.value = 'personnel';
      }
    }
    initFormData(newPerson);
    activeTab.value = 'info';
  }
};
</script>

<style scoped>
.field-label {
  display: flex;
  align-items: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 2px;
}

.label-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trip-unlinked-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 8px 14px;
  margin: 4px 6px 12px 6px;
  font-size: 0.8rem;
  color: #64748b;
}

.trip-unlinked-card .unlinked-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 1.1rem;
}

.trip-unlinked-card .unlinked-text strong {
  color: #475569;
}

.trip-traveler-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%);
  border: 1px solid #bae6fd;
  border-radius: 10px;
  padding: 10px 14px;
  margin: 4px 6px 12px 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.traveler-card-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 280px;
}

.traveler-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  flex-shrink: 0;
}

.traveler-badge.is-officer {
  background: #0284c7;
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(2, 132, 199, 0.25);
}

.traveler-badge.is-relative {
  background: #9333ea;
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(147, 51, 234, 0.25);
}

.traveler-info-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.traveler-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}

.traveler-name-row .label {
  color: #64748b;
  font-size: 0.76rem;
}

.traveler-name-row .name-highlight {
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 800;
}

.traveler-name-row .relation-badge {
  color: #7e22ce;
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.traveler-officer-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  color: #475569;
}

.traveler-officer-row .label {
  color: #94a3b8;
}

.traveler-officer-row .officer-detail {
  color: #334155;
}

.traveler-quick-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #ffffff;
}

.quick-nav-btn.officer {
  color: #0369a1;
  border-color: #bae6fd;
}
.quick-nav-btn.officer:hover {
  background: #e0f2fe;
  border-color: #0284c7;
}

.quick-nav-btn.relative {
  color: #7e22ce;
  border-color: #e9d5ff;
}
.quick-nav-btn.relative:hover {
  background: #f3e8ff;
  border-color: #9333ea;
}

.traveler-trips-switcher {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed #cbd5e1;
  flex-wrap: wrap;
}

.switcher-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trips-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.trip-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}

.trip-pill-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.trip-pill-btn.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 1px 3px rgba(2, 132, 199, 0.35);
  font-weight: 700;
}

.dialog-grouped-container {
  max-height: 70vh;
  overflow-y: auto;
  padding: 8px 12px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px 14px 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.form-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 2px solid #e0e7ff;
}

.form-group-icon {
  color: #6366f1;
  font-size: 1rem;
}

.form-group-title {
  font-size: 0.92rem;
  font-weight: 800;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.form-group-count {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 7px;
  border-radius: 9999px;
}
</style>
