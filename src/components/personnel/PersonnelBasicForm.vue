<template>
  <div class="form-grid">
    <!-- Readonly Mã Cán bộ -->
    <div class="field-item col-3">
      <label class="field-label" title="Mã Cán bộ">
        <span class="badge-code" style="margin-right: 4px;">Mã CB</span>
      </label>
      <InputText
        :model-value="form.code || 'Tự động cấp phát'"
        disabled
        size="small"
        style="background: #f1f5f9; color: #334155; font-weight: 700; cursor: not-allowed;"
      />
    </div>

    <!-- 100% Dynamic Fields for Khối A based on Cấu hình Cột -->
    <template v-for="col in basicColumns" :key="col.id">
      <div class="field-item" :class="getColClass(col.width)">
        <label class="field-label" :title="col.label">
          <span v-if="colIndexMap[col.id]" class="col-num-badge">{{ colIndexMap[col.id] }}</span>
          <span class="label-text">{{ col.label }}</span>
          <span v-if="col.id === 'name'" style="color: red; margin-left: 2px;">*</span>
        </label>
        <DynamicField
          v-model="form[col.id]"
          :col="col"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import InputText from 'primevue/inputtext';
import DynamicField from '@/components/common/DynamicField.vue';
import { computeColumnIndexMap } from '@/utils/formatters';

import { usePersonnelStore } from '@/stores/personnel';

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  departments: {
    type: Array,
    default: () => [],
  },
  mapping: {
    type: Array,
    default: () => [],
  },
});

const personnelStore = usePersonnelStore();

const effectiveMapping = computed(() => {
  if (props.mapping && props.mapping.length > 0) return props.mapping;
  return personnelStore.importMappingPersonnel || [];
});

const colIndexMap = computed(() => {
  return computeColumnIndexMap(effectiveMapping.value);
});

const basicColumns = computed(() => {
  const ignore = new Set(['stt', 'code']);
  const firstGroup = effectiveMapping.value[0];
  if (firstGroup && Array.isArray(firstGroup.columns) && firstGroup.columns.length > 0) {
    return firstGroup.columns.filter((c) => !ignore.has(c.id));
  }
  return [
    { id: 'name', label: 'Họ và tên', width: '33', format: 'text' },
    { id: 'otherName', label: 'Tên gọi khác', width: '33', format: 'text' },
    { id: 'birthYear', label: 'Năm sinh', width: '25', format: 'date' },
    { id: 'departmentId', label: 'Đơn vị / Phòng ban', width: '33', format: 'dropdown' },
    { id: 'position', label: 'Chức vụ', width: '33', format: 'text' },
    { id: 'cccd', label: 'Số CCCD', width: '33', format: 'text' },
  ];
});

const getColClass = (width) => {
  const w = String(width || '25').replace('%', '');
  if (w === '100') return 'col-12';
  if (w === '75') return 'col-9';
  if (w === '50') return 'col-6';
  if (w === '33') return 'col-4';
  return 'col-3';
};
</script>
