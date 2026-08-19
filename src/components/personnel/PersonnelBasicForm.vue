<template>
  <div class="form-grid">
    <div class="field-item col-4">
      <label class="field-label">Mã Cán bộ</label>
      <InputText v-model="form.code" placeholder="Tự động sinh (CB-00001...)" size="small" />
    </div>

    <div class="field-item col-4">
      <label class="field-label">Họ và tên <span style="color: red;">*</span></label>
      <InputText v-model="form.name" placeholder="Nhập đầy đủ họ và tên" size="small" />
    </div>

    <div class="field-item col-4">
      <label class="field-label">Tên gọi khác</label>
      <InputText v-model="form.otherName" placeholder="Tên gọi khác (nếu có)" size="small" />
    </div>

    <div class="field-item col-3">
      <label class="field-label">Năm sinh / Ngày sinh</label>
      <AppDatePicker
        v-model="form.birthYear"
        placeholder="DD/MM/YYYY hoặc YYYY"
      />
    </div>

    <div class="field-item col-3">
      <label class="field-label">Dân tộc</label>
      <InputText v-model="form.ethnicity" placeholder="Kinh, Tày, Nùng..." size="small" />
    </div>

    <div class="field-item col-3">
      <label class="field-label">Tôn giáo</label>
      <InputText v-model="form.religion" placeholder="Không, Phật giáo..." size="small" />
    </div>

    <div class="field-item col-3">
      <label class="field-label">Số CCCD / Định danh</label>
      <InputText v-model="form.cccd" placeholder="Số CCCD 12 số" size="small" />
    </div>

    <div class="field-item col-6">
      <label class="field-label">Phòng ban / Đơn vị công tác</label>
      <Select
        v-model="form.departmentId"
        :options="departments"
        optionLabel="name"
        optionValue="id"
        placeholder="Chọn phòng ban"
        size="small"
        appendTo="body"
        class="w-full"
      />
    </div>

    <div class="field-item col-6">
      <label class="field-label">Chức vụ</label>
      <InputText v-model="form.position" placeholder="Chức vụ hiện tại" size="small" />
    </div>

    <div class="field-item col-6">
      <label class="field-label">Quê quán</label>
      <InputText v-model="form.hometown" placeholder="Xã/Phường, Huyện/Quận, Tỉnh/Thành phố" size="small" />
    </div>

    <div class="field-item col-6">
      <label class="field-label">Nơi ĐKHK thường trú</label>
      <InputText v-model="form.thuongTru" placeholder="Địa chỉ thường trú" size="small" />
    </div>

    <div class="field-item col-6">
      <label class="field-label">Nơi ở hiện nay</label>
      <InputText v-model="form.tamTru" placeholder="Địa chỉ nơi ở hiện nay" size="small" />
    </div>

    <div class="field-item col-3">
      <label class="field-label">Hộ chiếu cá nhân</label>
      <InputText v-model="form.passportPersonal" placeholder="Số HC cá nhân" size="small" />
    </div>

    <div class="field-item col-3">
      <label class="field-label">Hộ chiếu công vụ</label>
      <InputText v-model="form.passportOfficial" placeholder="Số HC công vụ" size="small" />
    </div>

    <div class="field-item col-12">
      <label class="field-label">Kết quả thẩm tra, xác minh TCCT</label>
      <Textarea v-model="form.tcctResult" rows="2" placeholder="Nội dung kết quả thẩm tra trước khi đi nước ngoài..." size="small" />
    </div>

    <!-- Custom columns with type-specific components -->
    <template v-if="customColumns.length > 0">
      <div class="col-12" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e5e7eb;">
        <span style="font-size: 0.8rem; font-weight: 700; color: #4b5563;">Trường bổ sung tùy chỉnh:</span>
      </div>
      <div
        v-for="col in customColumns"
        :key="col.id"
        class="field-item"
        :class="getWidthClass(col.width)"
      >
        <label class="field-label">{{ col.label }}</label>
        
        <!-- File Format -->
        <template v-if="col.format === 'file'">
          <PersonnelAttachments v-model="form.custom_data[col.id]" :label="col.label" />
        </template>
        
        <!-- Date Format -->
        <template v-else-if="col.format === 'date'">
          <AppDatePicker
            v-model="form.custom_data[col.id]"
            placeholder="DD/MM/YYYY"
          />
        </template>

        <!-- Number Format -->
        <template v-else-if="col.format === 'number'">
          <InputNumber v-model="form.custom_data[col.id]" size="small" class="w-full" />
        </template>

        <!-- Default Text Format -->
        <template v-else>
          <InputText v-model="form.custom_data[col.id]" size="small" class="w-full" />
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import PersonnelAttachments from './PersonnelAttachments.vue';
import AppDatePicker from '@/components/common/AppDatePicker.vue';

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

const getWidthClass = (width) => {
  const w = String(width || '50').replace('%', '');
  if (w === '25') return 'col-3';
  if (w === '33') return 'col-4';
  if (w === '50') return 'col-6';
  if (w === '75') return 'col-9';
  if (w === '100') return 'col-12';
  return 'col-6';
};

const customColumns = computed(() => {
  const list = [];
  (props.mapping || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id.startsWith('custom_')) {
        list.push(c);
      }
    });
  });
  return list;
});
</script>
