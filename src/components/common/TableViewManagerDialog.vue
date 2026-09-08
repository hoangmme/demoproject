<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="mode === 'edit' ? `✏️ Chỉnh sửa Chế độ xem: ${form.label || ''}` : `➕ Thêm Chế độ xem (View) Mới - ${tableTitle || 'Bảng dữ liệu'}`"
    :style="{ width: '560px', maxWidth: '95vw' }"
    :closable="true"
    @hide="onClose"
  >
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
      <div style="font-size: 0.78rem; color: #64748b; line-height: 1.45;">
        Cấu hình Chế độ xem (View) theo chuẩn Lark Base. Bộ lọc điều kiện dùng chung động cơ với Thống kê và Tìm kiếm nâng cao:
      </div>

      <!-- Tên Chế độ xem -->
      <div>
        <label style="font-size: 0.78rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
          Tên Chế độ xem (View): <span style="color: #ef4444;">*</span>
        </label>
        <InputText
          v-model="form.label"
          placeholder="VD: Đang ở nước ngoài, Đã về đúng hạn, Đi trên 2 lần..."
          style="width: 100%; font-size: 0.84rem; height: 36px;"
          autofocus
        />
      </div>

      <!-- Màu sắc huy hiệu số lượng -->
      <div>
        <label style="font-size: 0.78rem; font-weight: 700; color: #334155; display: block; margin-bottom: 6px;">
          Màu sắc huy hiệu (Badge):
        </label>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <label
            v-for="c in colorOptions"
            :key="c.value"
            style="display: flex; align-items: center; gap: 5px; font-size: 0.76rem; cursor: pointer; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff;"
            :style="{ borderColor: form.color === c.value ? c.border : '#e2e8f0', background: form.color === c.value ? c.bg : '#fff' }"
          >
            <input type="radio" v-model="form.color" :value="c.value" style="cursor: pointer; margin: 0;" />
            <span :style="{ color: c.text, fontWeight: '700' }">{{ c.label }}</span>
          </label>
        </div>
      </div>

      <!-- Khung Bộ lọc điều kiện (Query Builder chuẩn Thống kê / Tìm kiếm nâng cao) -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <label style="font-size: 0.8rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px;">
            <i class="pi pi-filter" style="color: #0284c7; font-size: 0.82rem;"></i>
            <span>Bộ lọc điều kiện của View:</span>
          </label>

          <!-- Nối điều kiện: VÀ / HOẶC -->
          <div v-if="form.conditions.length > 1" style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem;">
            <span style="color: #64748b;">Nối bằng:</span>
            <div style="display: inline-flex; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
              <button
                type="button"
                :style="{ background: form.logicOp === 'AND' ? '#0284c7' : '#fff', color: form.logicOp === 'AND' ? '#fff' : '#475569' }"
                style="border: none; padding: 2px 8px; font-size: 0.72rem; font-weight: 700; cursor: pointer;"
                @click="form.logicOp = 'AND'"
              >
                VÀ (AND)
              </button>
              <button
                type="button"
                :style="{ background: form.logicOp === 'OR' ? '#0284c7' : '#fff', color: form.logicOp === 'OR' ? '#fff' : '#475569' }"
                style="border: none; padding: 2px 8px; font-size: 0.72rem; font-weight: 700; cursor: pointer;"
                @click="form.logicOp = 'OR'"
              >
                HOẶC (OR)
              </button>
            </div>
          </div>
        </div>

        <!-- Danh sách điều kiện -->
        <div v-if="form.conditions.length === 0" style="padding: 12px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; color: #64748b; font-size: 0.76rem;">
          Chưa đặt điều kiện nào. Chế độ xem này sẽ hiển thị <strong>toàn bộ kết quả</strong> của bảng.
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 8px;">
          <div
            v-for="(cond, cIdx) in form.conditions"
            :key="cond.id || cIdx"
            style="display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px;"
          >
            <!-- Prefix: Khi / VÀ / HOẶC -->
            <span style="font-size: 0.72rem; font-weight: 700; color: #0284c7; min-width: 38px; text-align: center;">
              {{ cIdx === 0 ? 'Khi' : (form.logicOp === 'AND' ? 'VÀ' : 'HOẶC') }}
            </span>

            <!-- Chọn Cột -->
            <select
              v-model="cond.field"
              class="builder-select"
              style="flex: 1; min-width: 140px; height: 32px; font-size: 0.78rem; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff;"
              @change="onConditionFieldChange(cond)"
            >
              <option value="">-- Chọn cột --</option>
              <option
                v-for="col in availableColumns"
                :key="col.id"
                :value="col.id"
              >
                {{ (col.isVirtual ? '✨ ' : '') }}{{ col.label || col.id }}
              </option>
            </select>

            <!-- Chọn Toán tử -->
            <select
              v-model="cond.operator"
              class="builder-select"
              style="width: 130px; height: 32px; font-size: 0.78rem; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff;"
            >
              <option value="equals">là / bằng (=)</option>
              <option value="contains">chứa từ khóa</option>
              <option value="not_contains">không chứa</option>
              <option value="not_equals">khác (≠)</option>
              <option value="has_value">có dữ liệu</option>
              <option value="empty">để trống (rỗng)</option>
              <option value="before">trước ngày</option>
              <option value="after">sau ngày</option>
              <option value="gte">lớn hơn/bằng (&ge;)</option>
              <option value="lte">nhỏ hơn/bằng (&le;)</option>
              <option value="count_gte">số lần xuất cảnh &ge;</option>
              <option value="count_lte">số lần xuất cảnh &le;</option>
            </select>

            <!-- Nhập Giá trị (nếu toán tử cần giá trị) -->
            <div v-if="cond.operator !== 'has_value' && cond.operator !== 'empty'" style="flex: 1; min-width: 130px; display: flex; flex-direction: column; gap: 4px;">
              <!-- Dropdown gợi ý nếu cột có options -->
              <div style="display: flex; align-items: center; gap: 4px; width: 100%;">
                <input
                  v-model="cond.value"
                  :list="'opts_' + cond.field"
                  :placeholder="cond.operator === 'contains' || cond.operator === 'not_contains' ? 'Nhập từ khóa hoặc chọn gợi ý...' : 'Nhập giá trị...'"
                  style="flex: 1; height: 32px; font-size: 0.78rem; padding: 2px 8px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff;"
                />
                <datalist :id="'opts_' + cond.field">
                  <option v-for="(opt, oIdx) in getFieldOptions(cond.field)" :key="oIdx" :value="opt" />
                </datalist>
                <select
                  v-if="getFieldOptions(cond.field).length > 0"
                  @change="(e) => { if (e.target.value) { cond.value = cond.value ? `${cond.value}, ${e.target.value}` : e.target.value; e.target.value = ''; } }"
                  style="width: 28px; height: 32px; padding: 0 4px; font-size: 0.78rem; text-align: center; cursor: pointer; color: #0284c7; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; flex-shrink: 0;"
                  title="Chọn thêm từ danh sách gợi ý để điền vào ô nhập"
                >
                  <option value="" disabled selected>▾</option>
                  <option v-for="(opt, oIdx) in getFieldOptions(cond.field)" :key="oIdx" :value="opt">
                    + {{ opt }}
                  </option>
                </select>
              </div>
              <div
                v-if="getFieldOptions(cond.field).length > 0 && getFieldOptions(cond.field).length <= 6"
                style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center;"
              >
                <span style="font-size: 0.66rem; color: #64748b;">Gợi ý:</span>
                <button
                  v-for="(opt, oIdx) in getFieldOptions(cond.field)"
                  :key="oIdx"
                  type="button"
                  @click="cond.value = opt"
                  style="font-size: 0.68rem; padding: 1px 6px; border-radius: 4px; border: 1px solid #bae6fd; background: #f0f9ff; color: #0284c7; cursor: pointer; transition: all 0.15s;"
                  :style="cond.value === opt ? 'background: #0284c7; color: #fff; font-weight: 600; border-color: #0284c7;' : ''"
                  :title="`Bấm để chọn nhanh '${opt}'`"
                >
                  {{ opt }}
                </button>
              </div>
            </div>

            <!-- Nút xóa dòng điều kiện -->
            <button
              type="button"
              @click="removeCondition(cIdx)"
              title="Xóa điều kiện này"
              style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; font-size: 0.8rem;"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>

        <!-- Nút Thêm Điều Kiện -->
        <div style="margin-top: 8px;">
          <button
            type="button"
            @click="addCondition"
            style="background: #eff6ff; border: 1px dashed #93c5fd; color: #0284c7; font-size: 0.75rem; font-weight: 600; padding: 6px 12px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;"
          >
            <i class="pi pi-plus" style="font-size: 0.7rem;"></i>
            <span>Thêm điều kiện lọc</span>
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div>
          <Button
            v-if="mode === 'edit' && canDelete"
            label="Xóa View"
            icon="pi pi-trash"
            severity="danger"
            text
            size="small"
            @click="handleDelete"
            style="font-size: 0.78rem;"
          />
        </div>
        <div style="display: flex; gap: 8px;">
          <Button label="Hủy" severity="secondary" text size="small" @click="visible = false" />
          <Button
            :label="mode === 'edit' ? 'Lưu thay đổi' : 'Tạo Chế độ xem'"
            icon="pi pi-check"
            severity="primary"
            size="small"
            :disabled="!form.label.trim()"
            @click="handleSave"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'create', // 'create' | 'edit'
  },
  viewData: {
    type: Object,
    default: null,
  },
  canDelete: {
    type: Boolean,
    default: true,
  },
  columns: {
    type: Array,
    default: () => [],
  },
  tableTitle: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'save', 'delete']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const colorOptions = [
  { value: 'blue', label: 'Xanh dương', text: '#0284c7', bg: '#eff6ff', border: '#bfdbfe' },
  { value: 'green', label: 'Xanh lá', text: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { value: 'purple', label: 'Tím', text: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
  { value: 'amber', label: 'Vàng cam', text: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { value: 'red', label: 'Đỏ', text: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { value: 'cyan', label: 'Xanh ngọc', text: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { value: 'slate', label: 'Ghi xám', text: '#475569', bg: '#f8fafc', border: '#cbd5e1' },
];

const form = ref({
  id: '',
  label: '',
  color: 'blue',
  logicOp: 'AND',
  conditions: [],
});

const availableColumns = computed(() => {
  return (props.columns || []).filter((c) => c && c.id && c.id !== 'stt');
});

const getFieldOptions = (fieldId) => {
  if (!fieldId) return [];
  const col = availableColumns.value.find((c) => c.id === fieldId);
  if (!col) return [];
  if (col.id === 'presenceStatus' || col.id === '_presenceStatus') {
    return ['Trong nước', 'Đang ở nước ngoài', 'Quá hạn chưa về', 'Đã về nước'];
  }
  if (col.id === 'isRelative') {
    return ['Cán bộ', 'Thân nhân'];
  }
  if (col.options) {
    if (typeof col.options === 'string') {
      return col.options.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(col.options)) return col.options;
  }
  return [];
};

const onConditionFieldChange = (cond) => {
  if (cond.field === 'presenceStatus' || cond.field === '_presenceStatus') {
    cond.operator = 'contains';
    cond.value = 'nước ngoài';
  } else if (cond.field === '_tripCount' || cond.field === 'dieu_kien_dem') {
    cond.operator = 'count_gte';
    cond.value = '2';
  }
};

const addCondition = () => {
  form.value.conditions.push({
    id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    field: availableColumns.value[0]?.id || '',
    operator: 'equals',
    value: '',
  });
};

const removeCondition = (idx) => {
  form.value.conditions.splice(idx, 1);
};

const resetForm = () => {
  if (props.mode === 'edit' && props.viewData) {
    const d = props.viewData;
    let conds = [];
    if (Array.isArray(d.conditions) && d.conditions.length > 0) {
      conds = JSON.parse(JSON.stringify(d.conditions));
    } else if (Array.isArray(d.criteria) && d.criteria.length > 0) {
      conds = JSON.parse(JSON.stringify(d.criteria));
    } else if (d.field) {
      conds = [{ id: 'c_init', field: d.field, operator: d.operator || 'equals', value: d.value || '' }];
    }
    form.value = {
      id: d.id || ('view_' + Date.now()),
      label: d.label || '',
      color: d.color || 'blue',
      logicOp: d.logicOp || d.logicOperator || 'AND',
      conditions: conds,
    };
  } else {
    form.value = {
      id: 'view_' + Date.now(),
      label: '',
      color: 'blue',
      logicOp: 'AND',
      conditions: [],
    };
  }
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) resetForm();
  }
);

watch(
  () => props.viewData,
  () => {
    if (props.modelValue) resetForm();
  },
  { deep: true }
);

const handleSave = () => {
  if (!form.value.label.trim()) return;
  const activeConditions = form.value.conditions.filter((c) => c && c.field);
  emit('save', {
    id: form.value.id || ('view_' + Date.now()),
    label: form.value.label.trim(),
    color: form.value.color || 'blue',
    logicOp: form.value.logicOp || 'AND',
    conditions: activeConditions,
  });
  visible.value = false;
};

const handleDelete = () => {
  if (confirm(`Bạn có chắc muốn xóa Chế độ xem "${form.value.label}"?`)) {
    emit('delete', form.value.id);
    visible.value = false;
  }
};

const onClose = () => {
  // reset on close
};
</script>

<style scoped>
.builder-select {
  outline: none;
  transition: border-color 0.15s ease;
}
.builder-select:focus {
  border-color: #0284c7;
}
</style>
