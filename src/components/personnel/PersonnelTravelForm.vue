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

    <div
      v-for="(trip, idx) in trips"
      :key="idx"
      :style="{
        marginBottom: '1.25rem',
        border: isRelative ? '1.5px solid #bbf7d0' : '1.5px solid #bae6fd',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#ffffff',
        boxShadow: isRelative ? '0 1px 3px rgba(22, 101, 52, 0.05)' : '0 1px 3px rgba(2, 132, 199, 0.06)'
      }"
    >
      <!-- Header of trip card -->
      <div
        :style="{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 1rem',
          background: isRelative ? '#f0fdf4' : '#e0f2fe',
          borderBottom: isRelative ? '1px solid #bbf7d0' : '1px solid #bae6fd'
        }"
      >
        <span
          :style="{
            fontSize: '0.85rem',
            fontWeight: '700',
            color: isRelative ? '#15803d' : '#0369a1',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }"
        >
          <i class="pi pi-send" :style="{ fontSize: '0.8rem', color: isRelative ? '#16a34a' : '#0284c7' }"></i>
          <span>Chuyến {{ idx + 1 }}: {{ trip.countryName || 'Chưa đặt quốc gia' }} {{ trip.departureDate ? `(${trip.departureDate})` : '' }}</span>
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
  isRelative: {
    type: Boolean,
    default: false,
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
  if (personnelStore.importMappingTrips && personnelStore.importMappingTrips.length > 0) {
    return computeColumnIndexMap(personnelStore.importMappingTrips);
  }
  return computeColumnIndexMap(personnelStore.importMappingPersonnel);
});

const tripColumns = computed(() => {
  const ignore = new Set(['stt', 'cccdchuyendi', 'cccdparent', 'cccdthannhan']);

  if (personnelStore.importMappingTrips && personnelStore.importMappingTrips.length > 0) {
    const cols = [];
    personnelStore.importMappingTrips.forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id && !ignore.has(c.id) && !cols.some((x) => x.id === c.id)) {
          cols.push(c);
        }
      });
    });
    if (cols.length > 0) return cols;
  }
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
  const isRelative = !!props.form.relationshipName || !!props.form.relativeName;
  const pKey = props.form.cccd || props.form.cccdparent || props.form.id || '';
  const rKey = props.form.cccdthannhan || props.form.cccd || '';

  trips.value.push({
    id: 'trip_' + Date.now(),
    cccdchuyendi: 'cd_' + Date.now(),
    cccdparent: isRelative ? (props.form.cccdparent || '') : pKey,
    cccdthannhan: isRelative ? rKey : '',
    decisionNumber: '',
    decisionDate: '',
    departureDate: '',
    arrivalDate: '',
    countryName: '',
    purpose: '',
    fundingName: 'Ngân sách nhà nước',
    passportNumber: '',
  });
};

const removeTrip = (index) => {
  trips.value.splice(index, 1);
};
</script>
