<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="dialogHeader"
    :baseZIndex="15000"
    :style="{ width: '85vw', maxWidth: '1100px', zIndex: 15000 }"
    :breakpoints="{ '960px': '95vw', '640px': '100vw' }"
  >
    <!-- Contents Area: 100% Dynamic Flat Form -->
    <div style="max-height: 70vh; overflow-y: auto; padding: 6px 12px 16px 6px;">
      <div class="form-grid">
        <template v-for="col in allTableColumns" :key="col.id">
          <div class="field-item" :style="getColItemStyle(col.width)">
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
            v-if="isEdit && authStore.isAdmin"
            label="Xóa hồ sơ"
            icon="pi pi-trash"
            severity="danger"
            text
            size="small"
            @click="handleDelete"
          />
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span v-if="autoSaveStatus === 'saving'" style="font-size: 0.75rem; color: #0284c7; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-right: 4px;">
            <i class="pi pi-spin pi-spinner"></i> Đang lưu...
          </span>
          <span v-else-if="autoSaveStatus === 'saved'" style="font-size: 0.75rem; color: #16a34a; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-right: 4px;">
            <i class="pi pi-check-circle"></i> Đã lưu thành công
          </span>

          <Button
            v-if="isEdit"
            label="Xuất Hồ sơ PDF"
            icon="pi pi-file-pdf"
            severity="secondary"
            outlined
            size="small"
            @click="isDocxExportOpen = true"
          />
          <Button label="Đóng" severity="secondary" text size="small" @click="visible = false" />
          <Button
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
import { getColItemStyle } from '@/utils/formatters';

const isDocxExportOpen = ref(false);

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  personData: {
    type: Object,
    default: null,
  },
  columns: {
    type: Array,
    default: () => [],
  },
  initialTab: {
    type: Number,
    default: 0,
  },
  targetRelativeCode: {
    type: String,
    default: '',
  },
  targetType: {
    type: String,
    default: 'auto',
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

const isEdit = computed(() => Boolean(form.value.id || form.value.uniqueKey));

const effectiveTargetType = computed(() => {
  if (props.targetType && props.targetType !== 'auto') {
    if (props.targetType === 'relatives') return 'relative';
    if (props.targetType === 'trips') return 'trip';
    return props.targetType;
  }
  const data = props.personData || form.value || {};
  if (
    data._recordType === 'relative' ||
    data.rawRelative ||
    Boolean(data.relationshipName || data.cccdthannhan || data.relativeName || data.birthYearTN)
  ) {
    return 'relative';
  }
  if (
    data._recordType === 'trip' ||
    data.rawTrip ||
    Boolean(data.departureDate || data.ngay_xuat_canh || data.destination)
  ) {
    return 'trip';
  }
  return 'personnel';
});

const allTableColumns = computed(() => {
  if (props.columns && Array.isArray(props.columns) && props.columns.length > 0) {
    return props.columns.filter((c) => !c.isVirtual && c.id !== 'stt');
  }
  let mappingSource = personnelStore.importMappingPersonnel || [];
  if (effectiveTargetType.value === 'relative') {
    mappingSource = personnelStore.importMappingRelative || [];
  } else if (effectiveTargetType.value === 'trip') {
    mappingSource = personnelStore.importMappingTrips || [];
  }

  const list = [];
  (mappingSource || []).forEach((grp) => {
    (grp.columns || []).forEach((col) => {
      if (col && col.id && col.id !== 'stt' && !col.isVirtual) {
        list.push(col);
      }
    });
  });
  return list;
});

const dialogHeader = computed(() => {
  if (effectiveTargetType.value === 'relative') {
    const nameVal = form.value.relativeName || form.value.name || form.value.ho_va_ten || '';
    return isEdit.value ? `Chi tiết Thân nhân: ${nameVal || 'Hồ sơ'}` : `Thêm thân nhân mới`;
  }
  if (effectiveTargetType.value === 'trip') {
    const tripDest = form.value.countryName || form.value.quoc_gia_xuat_canh || form.value.destination || '';
    const nameVal = form.value.personnelName || form.value.relativeName || form.value.name || '';
    return isEdit.value ? `Chi tiết Chuyến đi: ${tripDest || 'Chuyến đi'} (${nameVal})` : `Thêm chuyến đi mới`;
  }
  const pNameField = personnelStore.getPersonnelNameField ? personnelStore.getPersonnelNameField() : 'name';
  const nameVal = form.value[pNameField] || form.value.name || form.value.ho_va_ten || '';
  return isEdit.value ? `Chi tiết Cán bộ: ${nameVal || 'Hồ sơ'}` : `Thêm cán bộ mới`;
});

const safeClone = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  try {
    return JSON.parse(
      JSON.stringify(obj, (key, value) => {
        if (key === 'rawPerson' || key === 'rawRelative' || key === 'rawTrip' || key === 'parentPerson') {
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
    delete parsedVal.custom_data;
    delete cd.custom_data;
    delete parsedVal.rawPerson;
    delete parsedVal.rawRelative;
    delete parsedVal.rawTrip;
    delete parsedVal.uniqueKey;

    form.value = {
      ...cd,
      ...parsedVal,
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
      initFormData(pData || props.personData);
    } else {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveStatus.value = '';
    }
  },
  { immediate: true, deep: true }
);

const executeSave = async (payload) => {
  if (effectiveTargetType.value === 'relative') {
    return await personnelStore.saveRelative(payload);
  } else if (effectiveTargetType.value === 'trip') {
    return await personnelStore.saveTrip(payload);
  } else {
    return await personnelStore.savePerson(payload);
  }
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
    const saved = await executeSave(payload);
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
  if (effectiveTargetType.value === 'relative') {
    const nameVal = form.value.relativeName || form.value.name || 'thân nhân này';
    if (!confirm(`Bạn có chắc chắn muốn xóa thân nhân "${nameVal}" không?`)) return;
    try {
      await personnelStore.deleteRelative(form.value);
      emit('deleted', form.value);
      visible.value = false;
    } catch (e) {
      alert('Lỗi xóa thân nhân: ' + (e.message || e));
    }
    return;
  }
  if (effectiveTargetType.value === 'trip') {
    const cName = form.value.countryName || form.value.quoc_gia_xuat_canh || 'chuyến đi này';
    if (!confirm(`Bạn có chắc chắn muốn xóa chuyến đi "${cName}" không?`)) return;
    try {
      await personnelStore.deleteTrip(form.value);
      emit('deleted', form.value);
      visible.value = false;
    } catch (e) {
      alert('Lỗi xóa chuyến đi: ' + (e.message || e));
    }
    return;
  }
  const pNameField = personnelStore.getPersonnelNameField ? personnelStore.getPersonnelNameField() : 'name';
  const nameVal = form.value[pNameField] || form.value.name || 'hồ sơ này';
  if (!confirm(`Bạn có chắc chắn muốn xóa hồ sơ cán bộ "${nameVal}" không?`)) return;
  try {
    await personnelStore.deletePerson(form.value);
    emit('deleted', form.value);
    visible.value = false;
  } catch (e) {
    alert('Lỗi xóa hồ sơ: ' + (e.message || e));
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
</style>
