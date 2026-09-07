<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    :header="'➕ Thêm Cột Dữ Liệu Mới (' + tableSourceName + ')'"
    :style="{ width: '540px' }"
    :closable="!isSaving"
  >
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 6px 0;">
      <!-- 1. Tên cột & Mã Field -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Tên hiển thị cột <span style="color: #ef4444;">*</span>
          </label>
          <input
            v-model="form.label"
            placeholder="VD: Số quyết định, Ngày cấp..."
            class="dialog-input"
            autofocus
            @input="onLabelInput"
          />
        </div>
        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Mã định danh (Field ID) <span style="color: #ef4444;">*</span>
          </label>
          <input
            v-model="form.id"
            placeholder="so_quyet_dinh"
            class="dialog-input"
            style="font-family: monospace;"
          />
        </div>
      </div>

      <!-- 2. Kiểu dữ liệu (Format) -->
      <div>
        <label style="font-size: 0.78rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
          Kiểu dữ liệu:
        </label>
        <select v-model="form.format" class="dialog-select">
          <option value="text">Văn bản (Text) - Mặc định</option>
          <option value="number">Số (Number)</option>
          <option value="date">Ngày tháng (Date)</option>
          <option value="dropdown">Danh mục lựa chọn (Dropdown / Single Select)</option>
          <option value="checkbox">Hộp kiểm đơn (Checkbox)</option>
          <option value="checkbox_file_loop">Hộp kiểm kèm Tệp đính kèm</option>
          <option value="file">Tệp đính kèm (File / Ảnh / PDF)</option>
          <option value="lookup">🔗 Tham chiếu tự động (Lookup từ Cán bộ qua CCCD)</option>
          <option value="formula">⚡ Công thức tính toán (Formula)</option>
          <option value="rollup">📊 Tính toán tổng hợp (Rollup)</option>
        </select>
      </div>

      <!-- Tùy chọn nếu là Dropdown -->
      <div v-if="form.format === 'dropdown' || form.format === 'checkbox_file_loop'" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
        <label style="font-size: 0.74rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
          Danh sách tùy chọn (cách nhau bởi dấu phẩy):
        </label>
        <input
          v-model="form.options"
          placeholder="VD: Lựa chọn 1, Lựa chọn 2, Lựa chọn 3"
          class="dialog-input"
        />
        <div style="font-size: 0.68rem; color: #64748b; margin-top: 4px;">
          Người dùng sẽ chọn giá trị từ danh sách này khi nhập liệu hoặc inline-edit trên bảng.
        </div>
      </div>

      <!-- CẤU HÌNH THAM CHIẾU TỰ ĐỘNG (LOOKUP - LIÊN KẾT QUA CCCD) -->
      <div v-if="form.format === 'lookup'" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size: 0.76rem; font-weight: 700; color: #1d4ed8; display: flex; align-items: center; gap: 6px;">
          <i class="pi pi-link"></i>
          <span>Cấu hình Tham chiếu (Lookup) liên kết qua CCCD Cán bộ</span>
        </div>
        <div style="font-size: 0.72rem; color: #3b82f6; line-height: 1.35;">
          Tự động lấy dữ liệu từ hồ sơ Cán bộ liên quan để hiển thị trên bảng này mà không cần nhập trùng lặp.
        </div>
        <div>
          <label style="font-size: 0.72rem; font-weight: 700; color: #1e3a8a; display: block; margin-bottom: 3px;">
            Chọn trường dữ liệu cần lấy từ Cán bộ: <span style="color: #ef4444;">*</span>
          </label>
          <select v-model="form.lookupField" class="dialog-select">
            <option value="">-- Chọn cột cần hiển thị từ Cán bộ --</option>
            <option value="name">Họ và tên Cán bộ (name)</option>
            <option value="cccd">Số CCCD Cán bộ (cccd)</option>
            <option value="positionName">Chức vụ Cán bộ (positionName)</option>
            <option value="departmentName">Đơn vị / Phòng ban Cán bộ (departmentName)</option>
            <option value="birthYear">Năm sinh (birthYear)</option>
            <option value="gender">Giới tính (gender)</option>
            <option value="phone">Số điện thoại (phone)</option>
            <option value="hometown">Quê quán (hometown)</option>
            <option v-for="c in availablePersonnelCols" :key="c.id" :value="c.id">
              {{ c.label }} ({{ c.id }})
            </option>
          </select>
        </div>
      </div>

      <!-- CẤU HÌNH CÔNG THỨC (FORMULA) -->
      <div v-if="form.format === 'formula'" style="background: #fdf4ff; border: 1px solid #f0abfc; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size: 0.76rem; font-weight: 700; color: #86198f; display: flex; align-items: center; gap: 6px;">
          <i class="pi pi-bolt"></i>
          <span>Cấu hình Công thức Tính toán (Formula)</span>
        </div>
        <div>
          <label style="font-size: 0.72rem; font-weight: 700; color: #701a75; display: block; margin-bottom: 3px;">
            Loại công thức:
          </label>
          <select v-model="form.formulaType" class="dialog-select">
            <option value="presence_status">Trạng thái Hiện diện (Trong nước / Nước ngoài)</option>
            <option value="overdue_status">Quá hạn chưa về (So sánh Ngày về với Deadline/Hôm nay)</option>
            <option value="date_delta">So sánh 2 cột ngày (Sớm / Muộn / Đúng lịch)</option>
            <option value="conditional_check">Kiểm tra điều kiện (Cảnh báo khi thiếu dữ liệu)</option>
          </select>
        </div>
      </div>

      <!-- 3. Độ rộng cột: Bảng (px) & Form chi tiết (%) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 4px; border-top: 1px solid #f1f5f9;">
        <div>
          <label style="font-size: 0.75rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            Độ rộng trên Bảng (px):
          </label>
          <div style="display: flex; align-items: center; gap: 6px;">
            <input
              v-model.number="form.tableWidth"
              type="number"
              min="80"
              max="600"
              step="10"
              class="dialog-input"
              style="text-align: center;"
            />
            <span style="font-size: 0.72rem; color: #64748b;">px</span>
          </div>
        </div>
        <div>
          <label style="font-size: 0.75rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            Độ rộng trong Form Chi tiết (%):
          </label>
          <select v-model="form.width" class="dialog-select">
            <option value="25">Rộng: 25% (1/4 dòng)</option>
            <option value="33">Rộng: 33% (1/3 dòng)</option>
            <option value="50">Rộng: 50% (1/2 dòng)</option>
            <option value="75">Rộng: 75% (3/4 dòng)</option>
            <option value="100">Rộng: 100% (Đầy đủ hàng)</option>
          </select>
        </div>
      </div>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span style="font-size: 0.72rem; color: #64748b;">
          💡 Cột mới sẽ tự động hiển thị trên bảng ngay sau khi tạo.
        </span>
        <div style="display: flex; gap: 8px;">
          <Button label="Hủy" severity="secondary" text size="small" @click="dialogVisible = false" :disabled="isSaving" />
          <Button label="Tạo Cột Mới" icon="pi pi-check" severity="success" size="small" @click="handleSave" :loading="isSaving" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import { generateSlug } from '@/utils/formatters';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  tableSource: {
    type: String,
    default: 'personnel', // 'personnel' | 'relatives' | 'trips'
  },
});

const emit = defineEmits(['update:visible', 'save']);

const personnelStore = usePersonnelStore();
const isSaving = ref(false);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

const tableSourceName = computed(() => {
  if (props.tableSource === 'relatives') return 'Bảng Thân nhân';
  if (props.tableSource === 'trips') return 'Bảng Chuyến đi';
  return 'Bảng Cán bộ';
});

const form = ref({
  label: '',
  id: '',
  format: 'text',
  options: '',
  tableWidth: 160,
  width: '50',
  lookupTarget: 'personnel',
  lookupField: '',
  formulaType: 'presence_status',
});

watch(
  () => props.visible,
  (val) => {
    if (val) {
      form.value = {
        label: '',
        id: '',
        format: 'text',
        options: '',
        tableWidth: 160,
        width: '50',
        lookupTarget: 'personnel',
        lookupField: '',
        formulaType: 'presence_status',
      };
    }
  }
);

const availablePersonnelCols = computed(() => {
  const list = [];
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt' && c.id !== 'code') {
        list.push({ id: c.id, label: c.label || c.id });
      }
    });
  });
  return list;
});

const onLabelInput = () => {
  if (form.value.label) {
    form.value.id = generateSlug(form.value.label);
  }
};

const handleSave = async () => {
  if (!form.value.label?.trim()) {
    alert('Vui lòng nhập Tên cột!');
    return;
  }
  if (!form.value.id?.trim()) {
    alert('Vui lòng nhập Mã định danh cột (Field ID)!');
    return;
  }
  if (form.value.format === 'lookup' && !form.value.lookupField) {
    alert('Vui lòng chọn trường dữ liệu cần lấy từ Cán bộ!');
    return;
  }

  isSaving.value = true;
  try {
    const colPayload = {
      id: form.value.id.trim(),
      label: form.value.label.trim(),
      format: form.value.format || 'text',
      tableWidth: Number(form.value.tableWidth) || 160,
      width: String(form.value.width || '50'),
      options: form.value.options ? form.value.options.trim() : '',
      ...(form.value.format === 'lookup' ? {
        lookupTarget: 'personnel',
        lookupField: form.value.lookupField,
      } : {}),
      ...(form.value.format === 'formula' ? {
        formulaType: form.value.formulaType || 'presence_status',
      } : {}),
    };

    emit('save', colPayload);
    dialogVisible.value = false;
  } catch (e) {
    alert('Lỗi: ' + (e.message || e));
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.dialog-input {
  width: 100%;
  height: 32px;
  font-size: 0.8rem;
  padding: 4px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  background: #ffffff;
  box-sizing: border-box;
}

.dialog-input:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 1px #0284c7;
}

.dialog-select {
  width: 100%;
  height: 32px;
  font-size: 0.8rem;
  padding: 4px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  background: #ffffff;
  box-sizing: border-box;
}

.dialog-select:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 1px #0284c7;
}
</style>
