<template>
  <div style="display: flex; flex-direction: column; gap: 1rem;">
    <div style="font-size: 0.85rem; color: #4b5563; padding: 0.5rem 0.75rem; background: #f9fafb; border-radius: 8px; border-left: 4px solid #f59e0b;">
      Tick chọn các mục có phát sinh vấn đề và nhập nội dung chi tiết tương ứng (nếu có):
    </div>

    <!-- Dynamic Content based on Khối C (Group 2) -->
    <div class="form-grid">
      <div
        v-for="col in notesColumns"
        :key="col.id"
        :class="'field-item ' + getColClass(col.width)"
      >
        <label class="field-label" :title="col.label">
          <span v-if="colIndexMap[col.id]" class="col-num-badge">{{ colIndexMap[col.id] }}</span>
          <span class="label-text">{{ col.label }}</span>
        </label>
        <DynamicField
          v-model="formModel[col.id]"
          :col="col"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePersonnelStore } from '@/stores/personnel';
import DynamicField from '@/components/common/DynamicField.vue';
import { computeColumnIndexMap } from '@/utils/formatters';

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
});

const personnelStore = usePersonnelStore();

const formModel = computed(() => {
  if (!props.form.flags) props.form.flags = {};
  return new Proxy(props.form, {
    get(target, prop) {
      if (target.flags && target.flags[prop] !== undefined && target.flags[prop] !== '') {
        return target.flags[prop];
      }
      if (target.custom_data && target.custom_data[prop] !== undefined && target.custom_data[prop] !== '') {
        return target.custom_data[prop];
      }
      return target[prop] || '';
    },
    set(target, prop, val) {
      target[prop] = val;
      if (!target.flags) target.flags = {};
      target.flags[prop] = val;
      if (!target.custom_data) target.custom_data = {};
      target.custom_data[prop] = val;
      return true;
    },
  });
});

const colIndexMap = computed(() => {
  return computeColumnIndexMap(personnelStore.importMappingPersonnel);
});

const notesColumns = computed(() => {
  const ignore = new Set(['stt']);
  const thirdGroup = (personnelStore.importMappingPersonnel || [])[2];
  if (thirdGroup && Array.isArray(thirdGroup.columns)) {
    return thirdGroup.columns.filter((c) => !ignore.has(c.id));
  }
  return [];
});

const getColClass = (w) => {
  const cleanW = String(w || '25').replace('%', '');
  if (cleanW === '100') return 'col-12';
  if (cleanW === '75') return 'col-9';
  if (cleanW === '50') return 'col-6';
  if (cleanW === '33') return 'col-4';
  return 'col-3';
};
</script>
