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
        @click="addTrip"
        style="font-size: 0.8rem;"
      />
    </div>

    <div v-if="trips.length === 0" style="text-align: center; padding: 2rem; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; color: #6b7280; font-size: 0.85rem;">
      Chưa có chuyến đi nước ngoài nào được ghi nhận. Nhấp <b>"Thêm Chuyến đi"</b> để bổ sung.
    </div>

    <div v-for="(trip, idx) in trips" :key="idx" style="margin-bottom: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff;">
      <!-- Header of trip card -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1rem; background: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
        <span style="font-size: 0.85rem; font-weight: 700; color: #1f2937;">
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

      <!-- Content of trip card -->
      <div style="padding: 1rem;" class="form-grid">
        <div class="field-item col-3">
          <label class="field-label">Số Quyết định</label>
          <InputText v-model="trip.decisionNumber" placeholder="Số QĐ" size="small" />
        </div>
        <div class="field-item col-3">
          <label class="field-label">Ngày Quyết định</label>
          <AppDatePicker
            v-model="trip.decisionDate"
            placeholder="DD/MM/YYYY"
          />
        </div>
        <div class="field-item col-6">
          <label class="field-label">Cơ quan ban hành Quyết định</label>
          <InputText v-model="trip.decisionIssuer" placeholder="Bộ/Ban/Ngành..." size="small" />
        </div>

        <div class="field-item col-3">
          <label class="field-label">Ngày xuất cảnh (Ngày đi)</label>
          <AppDatePicker
            v-model="trip.departureDate"
            placeholder="DD/MM/YYYY"
          />
        </div>
        <div class="field-item col-3">
          <label class="field-label">Ngày nhập cảnh (Ngày về)</label>
          <AppDatePicker
            v-model="trip.arrivalDate"
            placeholder="DD/MM/YYYY"
          />
        </div>
        <div class="field-item col-3">
          <label class="field-label">Quốc gia / Nước đến</label>
          <InputText v-model="trip.countryName" placeholder="Mỹ, Nhật, Pháp..." size="small" />
        </div>
        <div class="field-item col-3">
          <label class="field-label">Số lần đi</label>
          <InputText v-model="trip.tripCount" placeholder="1" size="small" />
        </div>

        <div class="field-item col-4">
          <label class="field-label">Mục đích chuyến đi</label>
          <InputText v-model="trip.purpose" placeholder="Công tác, Học tập, Việc riêng..." size="small" />
        </div>
        <div class="field-item col-4">
          <label class="field-label">Nguồn kinh phí</label>
          <InputText v-model="trip.fundingName" placeholder="Ngân sách, Tự túc, Tài trợ..." size="small" />
        </div>
        <div class="field-item col-4">
          <label class="field-label">Tổ chức tài trợ (nếu có)</label>
          <InputText v-model="trip.sponsorUnit" placeholder="Tên cơ quan/tổ chức" size="small" />
        </div>

        <div class="field-item col-6">
          <label class="field-label">Thời gian đào tạo (nếu đi học tập)</label>
          <InputText v-model="trip.trainingTime" placeholder="VD: 6 tháng, 1 năm..." size="small" />
        </div>
        <div class="field-item col-6">
          <label class="field-label">Nơi đào tạo / Cơ sở đào tạo</label>
          <InputText v-model="trip.trainingPlace" placeholder="Tên trường, viện nghiên cứu..." size="small" />
        </div>

        <div class="field-item col-6" style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
          <input type="checkbox" id="report" v-model="trip.report" />
          <label for="report" class="field-label" style="margin: 0; cursor: pointer;">Đã nộp Báo cáo kết quả sau chuyến đi</label>
        </div>
        <div class="field-item col-6" style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
          <input type="checkbox" id="nopHC" v-model="trip.nopHC" />
          <label for="nopHC" class="field-label" style="margin: 0; cursor: pointer;">Đã nộp lại Hộ chiếu công vụ</label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import AppDatePicker from '@/components/common/AppDatePicker.vue';

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
});

const trips = computed(() => {
  if (!props.form.trips) props.form.trips = [];
  return props.form.trips;
});

const addTrip = () => {
  trips.value.push({
    id: 'temp_' + Date.now(),
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
    report: false,
    nopHC: false,
  });
};

const removeTrip = (index) => {
  trips.value.splice(index, 1);
};
</script>
