<template>
  <div class="form-grid">
    <div class="field-item col-6">
      <label class="field-label">Vấn đề chính trị hiện nay</label>
      <InputText v-model="flags.politicalIssue" placeholder="Chi tiết vấn đề (nếu có)" size="small" />
    </div>

    <div class="field-item col-6">
      <label class="field-label">Đang trong thời gian thanh tra / điều tra</label>
      <InputText v-model="flags.investigating" placeholder="Chi tiết (nếu có)" size="small" />
    </div>

    <div class="field-item col-6">
      <label class="field-label">Hình thức kỷ luật Đảng</label>
      <InputText v-model="flags.partyDiscipline" placeholder="Khiển trách, Cảnh cáo, Khai trừ..." size="small" />
    </div>

    <div class="field-item col-6">
      <label class="field-label">Hình thức kỷ luật Chính quyền</label>
      <InputText v-model="flags.govDiscipline" placeholder="Khiển trách, Cảnh cáo, Cách chức..." size="small" />
    </div>

    <div class="field-item col-6">
      <label class="field-label">Đi nước ngoài khi chưa được cấp phép</label>
      <InputText v-model="flags.noPermission" placeholder="Chi tiết thời gian, vi phạm" size="small" />
    </div>

    <div class="field-item col-6">
      <label class="field-label">Vi phạm pháp luật nước ngoài / trong nước</label>
      <InputText v-model="flags.lawViolation" placeholder="Chi tiết xử lý vi phạm" size="small" />
    </div>

    <div class="field-item col-6">
      <label class="field-label">Ở lại nước ngoài quá thời hạn</label>
      <InputText v-model="flags.overstay" placeholder="Chi tiết thời gian quá hạn" size="small" />
    </div>

    <div class="field-item col-6">
      <label class="field-label">Thuộc diện quản lý đặc biệt</label>
      <InputText v-model="flags.managed" placeholder="Nội dung diện quản lý" size="small" />
    </div>

    <div class="field-item col-4">
      <label class="field-label">Nhận quà biếu > 50 triệu VNĐ</label>
      <InputText v-model="flags.gift" placeholder="Chi tiết" size="small" />
    </div>

    <div class="field-item col-4">
      <label class="field-label">Cho người nước ngoài thuê nhà</label>
      <InputText v-model="flags.rent" placeholder="Chi tiết" size="small" />
    </div>

    <div class="field-item col-4">
      <label class="field-label">Làm việc cho doanh nghiệp FDI</label>
      <InputText v-model="flags.fdi" placeholder="Chi tiết" size="small" />
    </div>

    <div class="field-item col-12">
      <label class="field-label">Vấn đề khác đáng lưu ý</label>
      <Textarea v-model="flags.otherIssue" rows="2" placeholder="Ghi chú các vấn đề lưu ý khác..." size="small" />
    </div>

    <div class="field-item col-12">
      <PersonnelAttachments v-model="form.files" label="Tệp đính kèm Hồ sơ Cá nhân (Đơn giải trình, Kết luận...)" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import PersonnelAttachments from './PersonnelAttachments.vue';

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
});

const flags = computed({
  get: () => {
    if (!props.form.flags) props.form.flags = {};
    return props.form.flags;
  },
  set: (val) => {
    props.form.flags = val;
  },
});
</script>
