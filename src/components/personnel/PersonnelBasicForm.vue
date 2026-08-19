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

    <!-- Dynamic Fields for Khối A -->
    <template v-for="col in basicColumns" :key="col.id">
      <!-- Department Select -->
      <div v-if="col.id === 'departmentId' || col.id === 'departmentName'" class="field-item" :class="getColClass(col.width)">
        <label class="field-label" :title="col.label">
          <span v-if="colIndexMap[col.id]" class="col-num-badge">{{ colIndexMap[col.id] }}</span>
          <span class="label-text">{{ col.label }}</span>
        </label>
        <select
          v-model="form.departmentId"
          class="custom-col-select w-full"
          style="height: 33px; font-size: 0.82rem;"
        >
          <option value="">-- Chọn phòng ban --</option>
          <option v-for="dept in departments" :key="dept.id" :value="dept.id">
            {{ dept.name }}
          </option>
        </select>
      </div>

      <!-- General Dynamic Fields -->
      <div v-else class="field-item" :class="getColClass(col.width)">
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
import Select from 'primevue/select';
import DynamicField from '@/components/common/DynamicField.vue';
import { computeColumnIndexMap } from '@/utils/formatters';

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

const colIndexMap = computed(() => {
  return computeColumnIndexMap(props.mapping);
});

const basicColumns = computed(() => {
  const ignore = new Set(['stt', 'code']);
  const firstGroup = (props.mapping || [])[0];
  if (firstGroup && Array.isArray(firstGroup.columns)) {
    return firstGroup.columns.filter((c) => !ignore.has(c.id));
  }
  return [];
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
