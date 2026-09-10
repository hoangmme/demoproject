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

    <!-- Banner tóm tắt chuyến đi liên kết Cán bộ / Thân nhân -->
    <div v-if="recordSource === 'trips' && activeTab === 'info' && (tripLinkedOfficer || tripLinkedRelative)" class="trip-linked-summary-banner">
      <div class="trip-summary-content">
        <span v-if="tripLinkedOfficer" class="trip-summary-pill officer-pill">
          <i class="pi pi-user"></i>
          <span>Cán bộ: <strong>{{ tripLinkedOfficer.name || tripLinkedOfficer.fullName || tripLinkedOfficer.code }}</strong></span>
          <span v-if="tripLinkedOfficer.positionName || tripLinkedOfficer.position" class="sub-text">({{ tripLinkedOfficer.positionName || tripLinkedOfficer.position }})</span>
          <span v-if="tripLinkedOfficer.departmentName" class="sub-text">- {{ tripLinkedOfficer.departmentName }}</span>
        </span>
        <span v-if="tripLinkedRelative" class="trip-summary-pill relative-pill">
          <i class="pi pi-users"></i>
          <span>Người đi: Thân nhân <strong>{{ tripLinkedRelative.relativeName || tripLinkedRelative.name }}</strong> <span v-if="tripLinkedRelative.relationshipName">({{ tripLinkedRelative.relationshipName }})</span></span>
        </span>
        <span v-else class="trip-summary-pill personal-pill">
          <i class="pi pi-check-circle"></i>
          <span>Người đi: Chính Cán bộ</span>
        </span>
      </div>
    </div>

    <!-- Contents Area: 100% Dynamic Flat Form -->
    <div v-show="activeTab === 'info'" style="max-height: 70vh; overflow-y: auto; padding: 6px 12px 16px 6px;">
      <div class="form-grid">
        <template v-for="col in allTableColumns" :key="col.id">
          <div class="field-item" :style="getColItemStyle(col.formWidth || col.width)">
            <label class="field-label" :title="col.label">
              <span class="label-text">{{ col.label }}</span>
              <span v-if="col.required" style="color: red; margin-left: 2px;">*</span>
            </label>
            <DynamicField
              v-model="form[col.id]"
              :col="col"
            />
          </div>
        </template>
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
import { getColItemStyle } from '@/utils/formatters';
import { getUnifiedTableColumns } from '@/utils/tableRegistry';

const isDocxExportOpen = ref(false);
const isDynamicDataEntryOpen = ref(false);
const activeTab = ref('info');

const recordSource = computed(() => {
  if (props.tableId && ['personnel', 'relatives', 'trips'].includes(props.tableId)) {
    return props.tableId;
  }
  if (form.value._recordType === 'relative' || form.value.isRelative || form.value.relationshipName || form.value.relativeName || form.value.cccdthannhan) return 'relatives';
  if (form.value._recordType === 'trip' || form.value.departureDate || form.value.ngay_xuat_canh || form.value.cccdchuyendi) return 'trips';
  if (form.value._recordType === 'personnel' || (form.value.code && String(form.value.code).startsWith('CB-')) || form.value.positionName || form.value.departmentName) return 'personnel';
  if (form.value._tableId) return form.value._tableId;
  if (props.tableId) return props.tableId;
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
  // 1. Dynamic table registry columns for this record source
  const srcCols = getUnifiedTableColumns(recordSource.value, { personnelStore });
  if (srcCols && Array.isArray(srcCols) && srcCols.length > 0) {
    const valid = srcCols.filter(isColumnVisibleInDetail);
    if (valid.length > 0) return valid;
    const nonVirtual = srcCols.filter((c) => !c.isVirtual && c.id !== 'stt');
    if (nonVirtual.length > 0) return nonVirtual;
  }

  // 2. Props columns if passed and valid
  if (props.columns && Array.isArray(props.columns) && props.columns.length > 0) {
    const valid = props.columns.filter(isColumnVisibleInDetail);
    if (valid.length > 0) return valid;
    const nonVirtual = props.columns.filter((c) => !c.isVirtual && c.id !== 'stt');
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

const dialogHeader = computed(() => {
  if (recordSource.value === 'trips' || form.value._recordType === 'trip') {
    const dest = form.value.countryName || form.value.quoc_gia_xuat_canh || form.value.country || '';
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

// Dynamic linkage resolution for Trips banner
const tripLinkedOfficer = computed(() => {
  if (recordSource.value !== 'trips') return null;
  if (form.value.rawPerson) return form.value.rawPerson;
  const pId = form.value.personnelId;
  const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccd';
  const tKeyField = personnelStore.getTripKeyField ? personnelStore.getTripKeyField() : 'cccdchuyendi';
  const tVal = String(form.value[tKeyField] || form.value.cccdchuyendi || form.value.cccd || '').trim().toLowerCase();
  return (personnelStore.personnelList || []).find((p) => {
    if (pId && (String(p.id).trim() === String(pId).trim() || String(p.code).trim() === String(pId).trim())) return true;
    if (tVal && pKeyField) {
      const c = String(p[pKeyField] || p.cccd || '').trim().toLowerCase();
      if (c && c === tVal) return true;
    }
    return false;
  }) || null;
});

const tripLinkedRelative = computed(() => {
  if (recordSource.value !== 'trips') return null;
  if (form.value.rawRelative) return form.value.rawRelative;
  const rId = form.value.relativeId;
  const rKeyField = personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : 'cccdthannhan';
  const tKeyField = personnelStore.getTripKeyField ? personnelStore.getTripKeyField() : 'cccdchuyendi';
  const tVal = String(form.value[tKeyField] || form.value.cccdchuyendi || form.value.cccd || '').trim().toLowerCase();
  return (personnelStore.relativesList || []).find((r) => {
    if (rId && (String(r.id).trim() === String(rId).trim() || String(r.code).trim() === String(rId).trim())) return true;
    if (tVal && rKeyField) {
      const c = String(r[rKeyField] || r.cccdthannhan || r.cccd || '').trim().toLowerCase();
      if (c && c === tVal) return true;
    }
    return false;
  }) || null;
});

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
    const parsedVal = safeClone(val);
    const STANDARD_CORE_TABLES = ['personnel', 'relatives', 'trips'];
    if (props.tableId && !STANDARD_CORE_TABLES.includes(props.tableId) && !parsedVal._tableId) {
      parsedVal._tableId = props.tableId;
    }
    delete parsedVal.custom_data;
    delete cd.custom_data;

    form.value = {
      ...cd,
      ...parsedVal,
      uniqueKey: val.uniqueKey || parsedVal.uniqueKey || val.id || val._primaryKey,
      _primaryKey: val._primaryKey || parsedVal._primaryKey || val.id,
      _recordType: val._recordType || parsedVal._recordType,
      _tableId: parsedVal._tableId || val._tableId,
      rawPerson: val.rawPerson,
      rawRelative: val.rawRelative,
      rawTrip: val.rawTrip,
      custom_data: { ...cd, ...parsedVal },
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

const triggerAutoSave = () => {
  if (!isEdit.value || isSavingInternal || saving.value) return;

  if (autoSaveTimer) clearTimeout(autoSaveTimer);

  autoSaveTimer = setTimeout(async () => {
    if (isSavingInternal || saving.value) return;
    isSavingInternal = true;
    autoSaveStatus.value = 'saving';
    try {
      const payload = {
        ...form.value,
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
    const payload = {
      ...form.value,
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

const handleSwitchRecord = (newPerson) => {
  if (newPerson) {
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

.trip-linked-summary-banner {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 8px 14px;
  margin: 4px 6px 12px 6px;
}

.trip-summary-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.trip-summary-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  padding: 3px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.trip-summary-pill.officer-pill {
  background: #ffffff;
  color: #0369a1;
  border: 1px solid #7dd3fc;
  box-shadow: 0 1px 2px rgba(3, 105, 161, 0.08);
}

.trip-summary-pill.relative-pill {
  background: #faf5ff;
  color: #7e22ce;
  border: 1px solid #d8b4fe;
}

.trip-summary-pill.personal-pill {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.trip-summary-pill .sub-text {
  font-size: 0.74rem;
  color: #64748b;
  margin-left: 2px;
}
</style>
