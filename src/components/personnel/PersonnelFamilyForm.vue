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
        @click="addRelative"
        style="font-size: 0.8rem;"
      />
    </div>

    <div v-if="relatives.length === 0" style="text-align: center; padding: 2rem; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; color: #6b7280; font-size: 0.85rem;">
      Chưa có thân nhân có yếu tố nước ngoài nào được ghi nhận. Nhấp <b>"+ Thêm Thân nhân"</b> để bổ sung.
    </div>

    <div v-for="(rel, idx) in relatives" :key="idx" style="margin-bottom: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff;">
      <!-- Header of relative card -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1rem; background: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
        <span style="font-size: 0.85rem; font-weight: 700; color: #1f2937;">
          Thân nhân {{ idx + 1 }}: {{ rel.relationshipName ? `[${rel.relationshipName}] ` : '' }}{{ rel.relativeName || 'Chưa đặt tên' }} {{ rel.countryName ? `(${rel.countryName})` : '' }}
        </span>
        <Button
          label="Xóa người này"
          icon="pi pi-trash"
          size="small"
          text
          severity="danger"
          @click="removeRelative(idx)"
          style="padding: 2px 8px; font-size: 0.75rem;"
        />
      </div>

      <!-- Content of relative card -->
      <div style="padding: 1rem;" class="form-grid">
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
          <label class="field-label">Số CCCD / ĐD</label>
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
          <label class="field-label">Quốc gia (yếu tố NN)</label>
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

        <div class="field-item col-4">
          <label class="field-label">Nguồn kinh phí</label>
          <InputText v-model="rel.fundingName" placeholder="Tự túc, Học bổng..." size="small" />
        </div>
        <div class="field-item col-4">
          <label class="field-label">Kết hôn với người NN</label>
          <InputText v-model="rel.marriedToForeigner" placeholder="Có / Không / Chi tiết" size="small" />
        </div>
        <div class="field-item col-4">
          <label class="field-label">Làm việc cho tổ chức FDI / NN</label>
          <InputText v-model="rel.workInForeignCompany" placeholder="Có / Không / Chi tiết" size="small" />
        </div>

        <div class="field-item col-12">
          <PersonnelAttachments v-model="rel.files" label="Tệp đính kèm hồ sơ thân nhân" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import PersonnelAttachments from './PersonnelAttachments.vue';

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
});

const relatives = computed({
  get: () => {
    if (!props.form.relatives) props.form.relatives = [];
    return props.form.relatives;
  },
  set: (val) => {
    props.form.relatives = val;
  },
});

const addRelative = () => {
  relatives.value.push({
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
    files: [],
  });
};

const removeRelative = (index) => {
  relatives.value.splice(index, 1);
};
</script>
