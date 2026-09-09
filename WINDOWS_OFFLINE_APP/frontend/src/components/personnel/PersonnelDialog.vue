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
          label="+ Thêm dữ liệu"
          severity="success"
          size="small"
          @click="isDynamicDataEntryOpen = true"
          title="Nhập liệu mới cho bất kỳ bảng nào trong hệ thống (đồng bộ menu)"
          style="font-size: 0.78rem; font-weight: 700; padding: 4px 10px; height: 32px;"
        />
      </div>
    </template>

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
            label="+ Thêm dữ liệu"
            icon="pi pi-plus"
            severity="info"
            outlined
            size="small"
            @click="isDynamicDataEntryOpen = true"
            title="Nhập liệu mới cho bất kỳ bảng nào (đồng bộ menu)"
          />

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
import { getColItemStyle } from '@/utils/formatters';

const isDocxExportOpen = ref(false);
const isDynamicDataEntryOpen = ref(false);

const recordSource = computed(() => {
  if (form.value._recordType === 'trip') return 'trips';
  if (form.value._recordType === 'relative') return 'relatives';
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

const allTableColumns = computed(() => {
  if (props.columns && Array.isArray(props.columns) && props.columns.length > 0) {
    return props.columns.filter((c) => !c.isVirtual && c.id !== 'stt' && c.showInDetail !== false);
  }
  const allGroups = [
    ...(personnelStore.importMappingPersonnel || []),
    ...(personnelStore.importMappingRelative || []),
    ...(personnelStore.importMappingTrips || []),
  ];
  const list = [];
  const seen = new Set();
  allGroups.forEach((grp) => {
    (grp.columns || []).forEach((col) => {
      if (col && col.id && col.id !== 'stt' && !col.isVirtual && col.showInDetail !== false && !seen.has(col.id)) {
        seen.add(col.id);
        list.push(col);
      }
    });
  });
  return list;
});

const dialogHeader = computed(() => {
  if (form.value._recordType === 'trip') {
    const dest = form.value.countryName || form.value.quoc_gia_xuat_canh || form.value.country || '';
    return isEdit.value ? (dest ? `Chi tiết Chuyến đi: ${dest}` : `Chi tiết Chuyến đi`) : `Thêm mới Chuyến đi`;
  }
  const pNameField = personnelStore.getPersonnelNameField ? personnelStore.getPersonnelNameField() : 'name';
  const nameVal = form.value[pNameField] || form.value.name || (form.value._recordType === 'relative' ? (form.value.relativeName || form.value.name) : '') || form.value.title || form.value.id || '';
  return isEdit.value ? `Chi tiết: ${nameVal || 'Kết quả'}` : `Thêm mới kết quả`;
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
    delete parsedVal.custom_data;
    delete cd.custom_data;
    delete parsedVal.rawPerson;
    delete parsedVal.rawRelative;
    delete parsedVal.rawTrip;
    delete parsedVal.uniqueKey;
    delete parsedVal._fallbackPerson;
    delete parsedVal._fallbackRelative;

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
