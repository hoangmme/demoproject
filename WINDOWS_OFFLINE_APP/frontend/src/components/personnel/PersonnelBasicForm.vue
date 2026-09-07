<template>
  <div style="display: flex; flex-direction: column; gap: 1.25rem;">
    <div
      v-for="(group, gIdx) in dynamicGroups"
      :key="gIdx"
      style="background: #ffffff;"
    >
      <div v-if="!props.group && gIdx > 0 && group.group" style="font-size: 0.85rem; font-weight: 700; color: #1f2937; margin-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; display: flex; align-items: center; gap: 6px;">
        <i class="pi pi-folder" style="color: #0284c7; font-size: 0.95rem;"></i>
        <span>{{ group.group }}</span>
      </div>

      <div class="form-grid">
        <!-- Dynamic Fields in this group -->
        <template v-for="col in group.columns" :key="col.id">
          <div class="field-item" :class="getColClass(col.width)">
            <label class="field-label" :title="col.label">
              <span v-if="colIndexMap[col.id]" class="col-num-badge">{{ colIndexMap[col.id] }}</span>
              <span class="label-text">{{ col.label }}</span>
              <span v-if="col.id === personnelStore.getPersonnelNameField() || col.id === personnelStore.getPersonnelKeyField()" style="color: red; margin-left: 2px;">*</span>
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
  group: {
    type: Object,
    default: null,
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

const dynamicGroups = computed(() => {
  const ignore = new Set(['stt', 'code']);
  const isVisibleCol = (c) => !ignore.has(c.id) && !c.hidden && c.format !== 'formula';

  if (props.group) {
    return [
      {
        idx: 0,
        group: props.group.group || '',
        isMultiple: props.group.isMultiple,
        columns: (props.group.columns || []).filter(isVisibleCol),
      },
    ];
  }
  const mapping = effectiveMapping.value;
  if (Array.isArray(mapping) && mapping.length > 0) {
    return mapping
      .map((g, idx) => ({
        idx,
        group: g.group || '',
        isMultiple: g.isMultiple,
        columns: (g.columns || []).filter(isVisibleCol),
      }))
      .filter((g) => g.idx !== 1 && g.idx !== 2 && g.columns.length > 0);
  }
  return [
    {
      group: 'Thông tin cơ bản',
      columns: [
        { id: 'name', label: 'Họ và tên', width: '33', format: 'text' },
        { id: 'otherName', label: 'Tên gọi khác', width: '33', format: 'text' },
        { id: 'birthYear', label: 'Năm sinh', width: '25', format: 'date' },
        { id: 'departmentId', label: 'Đơn vị / Phòng ban', width: '33', format: 'dropdown' },
        { id: 'position', label: 'Chức vụ', width: '33', format: 'text' },
        { id: 'cccd', label: 'Số CCCD', width: '33', format: 'text' },
      ],
    },
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
