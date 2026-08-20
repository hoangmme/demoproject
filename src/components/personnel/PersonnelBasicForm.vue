<template>
  <div style="display: flex; flex-direction: column; gap: 1.25rem;">
    <div
      v-for="(group, gIdx) in dynamicGroups"
      :key="gIdx"
      style="background: #ffffff;"
    >
      <div v-if="dynamicGroups.length > 1 && group.group" style="font-size: 0.82rem; font-weight: 700; color: #475569; margin-bottom: 0.6rem; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
        <i class="pi pi-folder" style="color: #0284c7; font-size: 0.85rem;"></i>
        <span>{{ group.group }}</span>
      </div>

      <div class="form-grid">
        <!-- Dynamic Fields in this group -->
        <template v-for="col in group.columns" :key="col.id">
          <div class="field-item" :class="getColClass(col.width)">
            <label class="field-label" :title="col.label">
              <span v-if="colIndexMap[col.id]" class="col-num-badge">{{ colIndexMap[col.id] }}</span>
              <span class="label-text">{{ col.label }}</span>
              <span v-if="col.id === 'name' || col.id === 'cccd' || col.id === 'so_cccd' || col.id === 'cccdparent'" style="color: red; margin-left: 2px;">*</span>
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
  const mapping = effectiveMapping.value;
  if (Array.isArray(mapping) && mapping.length > 0) {
    return mapping.map((g) => ({
      group: g.group || '',
      isMultiple: g.isMultiple,
      columns: (g.columns || []).filter((c) => !ignore.has(c.id)),
    })).filter((g) => g.columns.length > 0);
  }
  return [
    {
      group: 'Thông tin chung',
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
