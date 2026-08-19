<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <span style="font-size: 0.85rem; font-weight: 600; color: #374151;">
        Danh sách thân nhân liên quan ({{ relatives.length }} người)
      </span>
      <Button
        label="Thêm Thân nhân"
        icon="pi pi-plus"
        size="small"
        severity="success"
        @click="addRelative"
        style="font-size: 0.8rem;"
      />
    </div>

    <div v-if="relatives.length === 0" style="text-align: center; padding: 2rem; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; color: #6b7280; font-size: 0.85rem;">
      Chưa có thân nhân liên quan nào được ghi nhận. Nhấp <b>"+ Thêm Thân nhân"</b> để bổ sung.
    </div>

    <div
      v-for="(rel, idx) in relatives"
      :key="rel.id || idx"
      :id="`relative-card-${rel.code || ('TN-' + String(idx + 1).padStart(5, '0'))}`"
      class="relative-card-box"
      style="margin-bottom: 1.25rem; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
    >
      <!-- Header of relative card -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge-code" style="background: #0284c7; color: #ffffff;">
            {{ rel.code || ('TN-' + String(idx + 1).padStart(5, '0')) }}
          </span>
          <span style="font-size: 0.85rem; font-weight: 700; color: #1e293b;">
            {{ rel.relationshipName ? `[${rel.relationshipName}] ` : '' }}{{ rel.relativeName || 'Chưa đặt tên' }} {{ rel.countryName ? `(${rel.countryName})` : '' }}
          </span>
        </div>
        <Button
          label="Xóa thân nhân này"
          icon="pi pi-trash"
          size="small"
          text
          severity="danger"
          @click="removeRelative(idx)"
          style="padding: 2px 8px; font-size: 0.75rem;"
        />
      </div>

      <!-- Dynamic Content of relative card based on importMappingRelative -->
      <div style="padding: 1rem;">
        <template v-if="relativeGroups.length > 0">
          <div v-for="(group, gIdx) in relativeGroups" :key="gIdx" style="margin-bottom: 1rem;">
            <div v-if="relativeGroups.length > 1" style="font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 8px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
              {{ group.group }}
            </div>
            <div class="form-grid">
              <div
                v-for="col in filterRelativeColumns(group.columns)"
                :key="col.id"
                :class="'field-item ' + getColClass(col.width)"
              >
                <label class="field-label" :title="col.label">
                  <span v-if="colIndexMap[col.id]" class="col-num-badge">{{ colIndexMap[col.id] }}</span>
                  <span class="label-text">{{ col.label }}</span>
                </label>
                <DynamicField
                  :modelValue="getRelativeFieldValue(rel, col.id)"
                  @update:modelValue="(val) => setRelativeFieldValue(rel, col.id, val)"
                  :col="col"
                />
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, nextTick } from 'vue';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import DynamicField from '@/components/common/DynamicField.vue';
import { computeColumnIndexMap } from '@/utils/formatters';

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  targetRelativeCode: {
    type: String,
    default: '',
  },
});

const personnelStore = usePersonnelStore();

const relatives = computed({
  get: () => {
    if (!props.form.relatives) props.form.relatives = [];
    return props.form.relatives;
  },
  set: (val) => {
    props.form.relatives = val;
  },
});

const relativeGroups = computed(() => {
  return personnelStore.importMappingRelative || [];
});

const colIndexMap = computed(() => {
  return computeColumnIndexMap(personnelStore.importMappingRelative);
});

const filterRelativeColumns = (cols) => {
  const ignore = new Set(['stt', 'code', 'cccd_can_bo', 'parentPersonnelName', 'parentPosition', 'parentDepartment', 'parentPersonnelCccd', 'parentCccd', 'cccdparent']);
  return (cols || []).filter((c) => !ignore.has(c.id));
};

const getRelativeFieldValue = (rel, colId) => {
  if (rel[colId] !== undefined && rel[colId] !== null && rel[colId] !== '') return rel[colId];
  if (rel.custom_data && rel.custom_data[colId] !== undefined && rel.custom_data[colId] !== null) return rel.custom_data[colId];
  return '';
};

const setRelativeFieldValue = (rel, colId, val) => {
  rel[colId] = val;
  if (!rel.custom_data) rel.custom_data = {};
  rel.custom_data[colId] = val;
};

const getColClass = (w) => {
  const cleanW = String(w || '25').replace('%', '');
  if (cleanW === '100') return 'col-12';
  if (cleanW === '75') return 'col-9';
  if (cleanW === '50') return 'col-6';
  if (cleanW === '33') return 'col-4';
  return 'col-3';
};

const addRelative = () => {
  const nextIdx = relatives.value.length + 1;
  const newCode = 'TN-' + String(nextIdx).padStart(5, '0');
  const parentCccd = props.form.cccdparent || props.form.cccd || '';
  relatives.value.push({
    code: newCode,
    personnelId: props.form.id || '',
    personnelName: props.form.name || '',
    cccd_can_bo: parentCccd,
    relationshipName: '',
    relativeName: '',
    birthYear: '',
    cccd: '',
    currentAddress: '',
    occupation: '',
    countryName: '',
    timeAbroad: '',
    unitAbroad: '',
    fundingName: '',
    marriedToForeigner: '',
    workInForeignCompany: '',
    custom_data: {
      cccd_can_bo: parentCccd,
    },
  });
};

const removeRelative = (index) => {
  relatives.value.splice(index, 1);
};

// Auto scroll to target relative card and highlight it
watch(
  () => props.targetRelativeCode,
  (code) => {
    if (code) {
      nextTick(() => {
        setTimeout(() => {
          const el = document.getElementById(`relative-card-${code}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight-relative-card');
            setTimeout(() => {
              el.classList.remove('highlight-relative-card');
            }, 3000);
          }
        }, 150);
      });
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.relative-card-box {
  transition: all 0.3s ease;
}

.highlight-relative-card {
  border: 2px solid #0284c7 !important;
  box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.25) !important;
  background: #f0f9ff !important;
}
</style>
