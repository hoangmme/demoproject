<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <span style="font-size: 0.85rem; font-weight: 600; color: #374151;">
        Danh sách chuyến đi nước ngoài ({{ trips.length }} chuyến)
      </span>
      <Button
        label="Thêm Chuyến đi"
        icon="pi pi-plus"
        size="small"
        severity="success"
        @click="addTrip"
        style="font-size: 0.8rem;"
      />
    </div>

    <div v-if="trips.length === 0" style="text-align: center; padding: 2rem; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; color: #6b7280; font-size: 0.85rem;">
      Chưa có chuyến đi nước ngoài nào được ghi nhận. Nhấp <b>"Thêm Chuyến đi"</b> để bổ sung.
    </div>

    <div v-for="(trip, idx) in trips" :key="idx" style="margin-bottom: 1.25rem; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
      <!-- Header of trip card -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <span style="font-size: 0.85rem; font-weight: 700; color: #1e293b;">
          Chuyến {{ idx + 1 }}: {{ trip.countryName || 'Chưa đặt quốc gia' }} {{ trip.departureDate ? `(${trip.departureDate})` : '' }}
        </span>
        <Button
          label="Xóa chuyến này"
          icon="pi pi-trash"
          size="small"
          text
          severity="danger"
          @click="removeTrip(idx)"
          style="padding: 2px 8px; font-size: 0.75rem;"
        />
      </div>

      <!-- Dynamic Content based on Khối B (Group 1) -->
      <div style="padding: 1rem;" class="form-grid">
        <div
          v-for="col in tripColumns"
          :key="col.id"
          :class="'field-item ' + getColClass(col.width)"
        >
          <label class="field-label" :title="col.label">
            <span v-if="colIndexMap[col.id]" class="col-num-badge">{{ colIndexMap[col.id] }}</span>
            <span class="label-text">{{ col.label }}</span>
          </label>
          <DynamicField
            v-model="trip[col.id]"
            :col="col"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import DynamicField from '@/components/common/DynamicField.vue';
import { computeColumnIndexMap } from '@/utils/formatters';

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  group: {
    type: Object,
    default: null,
  },
});

const personnelStore = usePersonnelStore();

const trips = computed({
  get: () => {
    if (!props.form.trips) props.form.trips = [];
    return props.form.trips;
  },
  set: (val) => {
    props.form.trips = val;
  },
});

const colIndexMap = computed(() => {
  return computeColumnIndexMap(personnelStore.importMappingPersonnel);
});

const tripColumns = computed(() => {
  const ignore = new Set(['stt']);
  const targetGroup = props.group || (personnelStore.importMappingPersonnel || [])[1];
  if (targetGroup && Array.isArray(targetGroup.columns)) {
    return targetGroup.columns.filter((c) => !ignore.has(c.id));
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

const addTrip = () => {
  trips.value.push({
    decisionNumber: '',
    decisionDate: '',
    decisionIssuer: '',
    departureDate: '',
    arrivalDate: '',
    countryName: '',
    tripCount: '1',
    purpose: '',
    fundingName: '',
    sponsorUnit: '',
    trainingTime: '',
    trainingPlace: '',
  });
};

const removeTrip = (index) => {
  trips.value.splice(index, 1);
};
</script>
