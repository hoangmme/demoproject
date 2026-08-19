<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <span style="font-size: 0.85rem; font-weight: 600; color: #374151;">
        Danh sách thân nhân có yếu tố nước ngoài ({{ relatives.length }} người)
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
      Chưa có thân nhân có yếu tố nước ngoài nào được ghi nhận. Nhấp <b>"+ Thêm Thân nhân"</b> để bổ sung.
    </div>

    <div v-for="(rel, idx) in relatives" :key="idx" style="margin-bottom: 1.25rem; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
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
                <label class="field-label">
                  <span v-if="colIndexMap[col.id]" class="col-num-badge">{{ colIndexMap[col.id] }}</span>
                  {{ col.label }}
                </label>
                <DynamicField
                  v-model="rel[col.id]"
                  :col="col"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Fallback standard fields if mapping is empty -->
        <template v-else>
          <div class="form-grid">
            <div class="field-item col-3">
              <label class="field-label">Mối quan hệ</label>
              <InputText v-model="rel.relationshipName" placeholder="Bố, Mẹ, Vợ, Chồng, Con..." size="small" />
            </div>
            <div class="field-item col-5">
              <label class="field-label">Họ và tên thân nhân</label>
              <InputText v-model="rel.relativeName" placeholder="Họ và tên" size="small" />
            </div>
            <div class="field-item col-2">
              <label class="field-label">Năm sinh</label>
              <InputText v-model="rel.birthYear" placeholder="Năm sinh" size="small" />
            </div>
            <div class="field-item col-2">
              <label class="field-label">Số CCCD</label>
              <InputText v-model="rel.cccd" placeholder="CCCD" size="small" />
            </div>
            <div class="field-item col-6">
              <label class="field-label">Nơi cư trú hiện nay</label>
              <InputText v-model="rel.currentAddress" placeholder="Địa chỉ cư trú" size="small" />
            </div>
            <div class="field-item col-6">
              <label class="field-label">Nghề nghiệp / Nơi làm việc</label>
              <InputText v-model="rel.occupation" placeholder="Nghề nghiệp" size="small" />
            </div>
            <div class="field-item col-4">
              <label class="field-label">Quốc gia</label>
              <InputText v-model="rel.countryName" placeholder="Mỹ, Úc, Đức..." size="small" />
            </div>
            <div class="field-item col-4">
              <label class="field-label">Thời gian ở nước ngoài</label>
              <InputText v-model="rel.timeAbroad" placeholder="VD: 2018 - 2022" size="small" />
            </div>
            <div class="field-item col-4">
              <label class="field-label">Cơ quan / Tổ chức ở NN</label>
              <InputText v-model="rel.unitAbroad" placeholder="Tên cơ quan/trường học" size="small" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
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
  const ignore = new Set(['stt', 'parentPersonnelName', 'parentPosition', 'parentDepartment', 'parentPersonnelCccd']);
  return (cols || []).filter((c) => !ignore.has(c.id));
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
  relatives.value.push({
    code: newCode,
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
  });
};

const removeRelative = (index) => {
  relatives.value.splice(index, 1);
};
</script>
