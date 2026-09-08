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
        <select v-model="form.format" class="dialog-select" @change="onFormatChange">
          <option value="text">Văn bản (Text) - Mặc định</option>
          <option value="number">Số (Number)</option>
          <option value="date">Ngày tháng (Date)</option>
          <option value="dropdown">Danh mục lựa chọn (Dropdown / Single Select)</option>
          <option value="checkbox">Hộp kiểm đơn (Checkbox)</option>
          <option value="checkbox_file_loop">Hộp kiểm kèm Tệp đính kèm</option>
          <option value="file">Tệp đính kèm (File / Ảnh / PDF)</option>
          <option value="lookup">🔗 Tham chiếu tự động (Lookup - Lấy dữ liệu từ bảng liên kết)</option>
          <option value="formula">⚡ Công thức Nâng cao (Formula - Lark Base / Teable)</option>
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

      <!-- CẤU HÌNH THAM CHIẾU TỰ ĐỘNG (LOOKUP ĐA BẢNG - LARK BASE STYLE) -->
      <div v-if="form.format === 'lookup'" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div style="font-size: 0.76rem; font-weight: 700; color: #1d4ed8; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <i class="pi pi-link"></i>
            <span>Cấu hình Tham chiếu Tự động (Lookup)</span>
          </div>
          <span style="font-size: 0.65rem; background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Lark Base</span>
        </div>

        <!-- 1. Look up data in this field: Chọn bảng đích & cột lấy dữ liệu -->
        <div>
          <label style="font-size: 0.72rem; font-weight: 700; color: #1e3a8a; display: block; margin-bottom: 3px;">
            1. Lấy dữ liệu từ bảng (Look up data in this field): <span style="color: #ef4444;">*</span>
          </label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <select v-model="form.lookupTarget" class="dialog-select" @change="form.lookupField = ''">
              <option value="personnel">Bảng Cán bộ</option>
              <option value="relatives">Bảng Thân nhân</option>
              <option value="trips">Bảng Chuyến đi</option>
            </select>
            <select v-model="form.lookupField" class="dialog-select">
              <option value="">-- Chọn cột cần hiển thị --</option>
              <option v-for="c in targetLookupCols" :key="c.id" :value="c.id">
                {{ c.label }} ({{ c.id }})
              </option>
            </select>
          </div>
        </div>

        <!-- 2. Reference data if: Điều kiện tham chiếu đa tầng -->
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label style="font-size: 0.72rem; font-weight: 700; color: #1e293b; margin: 0;">
              2. Tham chiếu dữ liệu khi (Reference data if):
            </label>
            <!-- Logic Operator (AND / OR) -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 0.68rem; color: #64748b;">Khớp:</span>
              <select
                v-model="form.lookupLogicOp"
                class="dialog-select"
                style="width: 85px; height: 26px; font-size: 0.7rem; padding: 0 6px; font-weight: 700; color: #0369a1; background: #f0f9ff;"
              >
                <option value="AND">AND (Tất cả)</option>
                <option value="OR">OR (Bất kỳ)</option>
              </select>
            </div>
          </div>

          <!-- Danh sách điều kiện -->
          <div v-if="form.lookupConditions && form.lookupConditions.length > 0" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
            <div
              v-for="(cond, cIdx) in form.lookupConditions"
              :key="cIdx"
              style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;"
            >
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 0.68rem; font-weight: 700; color: #475569;">
                  Điều kiện {{ cIdx + 1 }}:
                </span>
                <button
                  type="button"
                  @click="removeLookupCondition(cIdx)"
                  style="border: none; background: transparent; color: #ef4444; cursor: pointer; font-size: 0.75rem; padding: 0 4px;"
                  title="Xóa điều kiện này"
                >
                  <i class="pi pi-times"></i>
                </button>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <!-- Cột bảng đích -->
                <select v-model="cond.targetField" class="dialog-select" style="font-size: 0.74rem;">
                  <option value="">-- Chọn cột ở Bảng đích --</option>
                  <option v-for="c in targetLookupCols" :key="c.id" :value="c.id">
                    {{ c.label }} ({{ c.id }})
                  </option>
                </select>

                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 6px; align-items: center;">
                  <!-- Toán tử so sánh -->
                  <select v-model="cond.operator" class="dialog-select" style="font-size: 0.72rem;">
                    <option v-for="op in lookupOperators" :key="op.value" :value="op.value">
                      {{ op.label }}
                    </option>
                  </select>

                  <!-- Cột bảng hiện tại -->
                  <select
                    v-if="cond.operator !== 'is_empty' && cond.operator !== 'is_not_empty'"
                    v-model="cond.sourceField"
                    class="dialog-select"
                    style="font-size: 0.74rem;"
                  >
                    <option value="">-- Chọn cột ở Bảng này --</option>
                    <option v-for="c in currentTableCols" :key="c.id" :value="c.id">
                      {{ c.label }} ({{ c.id }})
                    </option>
                  </select>
                  <span v-else style="font-size: 0.7rem; color: #94a3b8; font-style: italic; text-align: center;">
                    (Không cần cột so khớp)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else style="font-size: 0.7rem; color: #64748b; font-style: italic; margin-bottom: 8px;">
            Chưa có điều kiện nào. Dữ liệu sẽ tự động dùng Khóa liên kết mặc định của bảng.
          </div>

          <button
            type="button"
            @click="addLookupCondition"
            style="width: 100%; border: 1px dashed #3b82f6; background: #f0fdf4; color: #1d4ed8; padding: 6px 10px; border-radius: 4px; font-size: 0.72rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600;"
          >
            <i class="pi pi-plus" style="font-size: 0.7rem;"></i>
            <span>+ Thêm điều kiện (Add Condition)</span>
          </button>
        </div>

        <!-- 3. Hiển thị dữ liệu & Định dạng -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <label style="font-size: 0.7rem; color: #1e3a8a; font-weight: 700; display: block; margin-bottom: 3px;">
              Hiển thị dữ liệu (Display data as):
            </label>
            <select v-model="form.lookupDisplay" class="dialog-select">
              <option value="value">Giá trị (Bản ghi đầu tiên)</option>
              <option value="join">Gộp tất cả (, )</option>
              <option value="count">Đếm số lượng</option>
              <option value="array">Nhiều dòng</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.7rem; color: #1e3a8a; font-weight: 700; display: block; margin-bottom: 3px;">
              Định dạng (Field format):
            </label>
            <select v-model="form.lookupFormat" class="dialog-select">
              <option value="default">Mặc định</option>
            </select>
          </div>
        </div>
      </div>

      <!-- CẤU HÌNH CÔNG THỨC (FORMULA) -->
      <div v-if="form.format === 'formula'" style="background: #fdf4ff; border: 1px solid #f0abfc; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size: 0.76rem; font-weight: 700; color: #86198f; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <i class="pi pi-bolt"></i>
            <span>⚡ Cấu hình Công thức Nâng cao (Lark Base & Teable Formula)</span>
          </div>
          <span style="font-size: 0.65rem; background: #fae8ff; color: #86198f; padding: 1px 6px; border-radius: 4px; font-weight: 600;">Teable & Lark Engine</span>
        </div>
        <div>
          <label style="font-size: 0.72rem; font-weight: 700; color: #701a75; display: block; margin-bottom: 3px;">
            Loại công thức:
          </label>
          <select v-model="form.formulaType" class="dialog-select">
            <option value="custom_expression">⚡ Biểu thức Công thức Tự do Nâng cao (Lark Base / Teable)</option>
            <option value="presence_status">Trạng thái Hiện diện (Trong nước / Nước ngoài)</option>
            <option value="overdue_status">Quá hạn chưa về (So sánh Ngày về với Deadline/Hôm nay)</option>
            <option value="date_delta">So sánh 2 cột ngày (Sớm / Muộn / Đúng lịch)</option>
            <option value="conditional_check">Kiểm tra điều kiện (Cảnh báo khi thiếu dữ liệu)</option>
            <option value="depart_before_decision">Đi khi chưa có cấp thẩm quyền quyết định</option>
            <option value="trips_count_in_year">Số lần xuất cảnh trong năm</option>
          </select>
        </div>

        <!-- Trình soạn thảo Biểu thức Tự do -->
        <div v-if="form.formulaType === 'custom_expression'" style="margin-top: 4px;">
          <label style="font-size: 0.7rem; color: #701a75; font-weight: 700; display: block; margin-bottom: 3px;">
            Biểu thức tính toán (Formula Expression):
          </label>
          <textarea
            v-model="form.formulaExpression"
            class="dialog-input"
            style="width: 100%; height: 75px; font-family: monospace; font-size: 0.74rem; padding: 6px; line-height: 1.4; resize: vertical; background: #ffffff;"
            placeholder='VD: IF(DATEDIF({ngay_xuat_canh}, TODAY(), "D") > 30, "⚠️ Quá hạn", "Bình thường")'
          ></textarea>

          <!-- Tab chọn Chèn Cột hoặc Chèn Hàm -->
          <div style="display: flex; gap: 4px; margin-top: 6px;">
            <button
              type="button"
              :class="['btn-formula-tab', formulaTab === 'fields' ? 'active' : '']"
              @click="formulaTab = 'fields'"
            >
              <i class="pi pi-list" style="font-size: 0.65rem;"></i> Chèn Cột ({...})
            </button>
            <button
              type="button"
              :class="['btn-formula-tab', formulaTab === 'functions' ? 'active' : '']"
              @click="formulaTab = 'functions'"
            >
              <i class="pi pi-code" style="font-size: 0.65rem;"></i> Chèn Hàm (fn)
            </button>
          </div>

          <!-- Panel Danh sách Cột -->
          <div v-if="formulaTab === 'fields'" style="max-height: 110px; overflow-y: auto; background: #ffffff; border: 1px solid #f0abfc; border-radius: 4px; padding: 6px; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px;">
            <span
              v-for="c in currentTableCols"
              :key="c.id"
              class="formula-pill-field"
              @click="insertIntoFormula('{' + c.id + '}')"
              :title="'Mã cột: ' + c.id + '\nBấm để chèn vào công thức'"
            >
              + {{ c.label || c.id }}
            </span>
          </div>

          <!-- Panel Danh sách Hàm -->
          <div v-if="formulaTab === 'functions'" style="max-height: 130px; overflow-y: auto; background: #ffffff; border: 1px solid #f0abfc; border-radius: 4px; padding: 6px; margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
            <div
              v-for="fn in formulaFunctionsCatalog"
              :key="fn.name"
              class="formula-fn-item"
              @click="insertIntoFormula(fn.name + '()')"
              :title="fn.desc + '\nVí dụ: ' + fn.example"
            >
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #701a75; font-size: 0.72rem;">{{ fn.name }}</strong>
                <span style="font-size: 0.62rem; color: #94a3b8;">{{ fn.category }}</span>
              </div>
              <div style="font-size: 0.64rem; color: #64748b; font-family: monospace;">{{ fn.syntax }}</div>
            </div>
          </div>

          <!-- Live Preview -->
          <div style="margin-top: 6px; background: #fae8ff; border: 1px solid #f0abfc; border-radius: 4px; padding: 5px 8px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.68rem; color: #701a75; font-weight: 600;">Xem trước (Dòng 1):</span>
            <span style="font-size: 0.72rem; font-weight: 700; color: #86198f; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {{ formulaPreviewResult }}
            </span>
          </div>
        </div>
      </div>

      <!-- 3. Độ rộng trong Form Chi tiết (%) -->
      <div style="padding-top: 4px; border-top: 1px solid #f1f5f9;">
        <label style="font-size: 0.75rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
          Độ rộng trong Form Chi tiết (%):
        </label>
        <select v-model="form.width" class="dialog-select">
          <option v-for="opt in formWidthOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- 5. Bắt buộc nhập liệu (Required) -->
      <div style="padding-top: 4px;">
        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Quy tắc nhập liệu khi lưu:
          </label>
          <button
            type="button"
            class="btn-required-toggle"
            :class="{ 'is-required': form.required }"
            @click="form.required = !form.required"
            title="Bắt buộc phải có dữ liệu khi lưu"
          >
            <i :class="form.required ? 'pi pi-check-square' : 'pi pi-stop'" style="font-size: 0.95rem;"></i>
            <span>★ Bắt buộc</span>
          </button>
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

import { generateSlug, formWidthOptions, lookupOperators, evaluateCustomFormula, formulaFunctionsCatalog } from '@/utils/formatters';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  tableSource: {
    type: String,
    default: 'personnel', // 'personnel' | 'relatives' | 'trips'
  },
  targetIndex: {
    type: Number,
    default: -1,
  },
});

const emit = defineEmits(['update:visible', 'save']);

const personnelStore = usePersonnelStore();
const isSaving = ref(false);
const formulaTab = ref('fields');

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
  width: '50',
  required: false,
  lookupTarget: 'personnel',
  lookupLinkCol: '',
  lookupField: '',
  lookupConditions: [],
  lookupLogicOp: 'AND',
  lookupDisplay: 'value',
  lookupFormat: 'default',
  formulaType: 'custom_expression',
  formulaExpression: '',
});

const onFormatChange = () => {
  if (form.value.format === 'formula' && !form.value.formulaType) {
    form.value.formulaType = 'custom_expression';
  }
};

watch(
  () => props.visible,
  (val) => {
    if (val) {
      form.value = {
        label: '',
        id: '',
        format: 'text',
        options: '',
        width: '50',
        required: false,
        lookupTarget: 'personnel',
        lookupLinkCol: '',
        lookupField: '',
        lookupConditions: [],
        lookupLogicOp: 'AND',
        lookupDisplay: 'value',
        lookupFormat: 'default',
        formulaType: 'custom_expression',
        formulaExpression: '',
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

const availableRelativeCols = computed(() => {
  const list = [];
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') {
        list.push({ id: c.id, label: c.label || c.id });
      }
    });
  });
  return list;
});

const availableTripCols = computed(() => {
  const list = [];
  (personnelStore.importMappingTrips || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') {
        list.push({ id: c.id, label: c.label || c.id });
      }
    });
  });
  return list;
});

const currentTableCols = computed(() => {
  if (props.tableSource === 'relatives') return availableRelativeCols.value;
  if (props.tableSource === 'trips') return availableTripCols.value;
  return availablePersonnelCols.value;
});

const targetLookupCols = computed(() => {
  if (form.value.lookupTarget === 'relatives') return availableRelativeCols.value;
  if (form.value.lookupTarget === 'trips') return availableTripCols.value;
  return availablePersonnelCols.value;
});

const addLookupCondition = () => {
  const defaultTarget = targetLookupCols.value?.[0]?.id || '';
  const defaultSource = currentTableCols.value?.[0]?.id || '';
  if (!Array.isArray(form.value.lookupConditions)) {
    form.value.lookupConditions = [];
  }
  form.value.lookupConditions.push({
    targetField: defaultTarget,
    operator: 'is',
    sourceField: defaultSource,
  });
};

const removeLookupCondition = (index) => {
  if (Array.isArray(form.value.lookupConditions)) {
    form.value.lookupConditions.splice(index, 1);
  }
};

const sampleRow = computed(() => {
  if (props.tableSource === 'trips') return personnelStore.tripsList?.[0] || {};
  if (props.tableSource === 'relatives') return personnelStore.relativesList?.[0] || {};
  return personnelStore.personnelList?.[0] || {};
});

const formulaPreviewResult = computed(() => {
  if (!form.value.formulaExpression) return '(chưa có)';
  try {
    const res = evaluateCustomFormula(sampleRow.value, form.value.formulaExpression, currentTableCols.value);
    if (!res) return '(trống)';
    const val = (res && typeof res === 'object' && 'label' in res) ? res.label : res;
    if (val === null || val === undefined || val === '') return '(trống)';
    return String(val);
  } catch (e) {
    return 'Lỗi: ' + e.message;
  }
});

const insertIntoFormula = (text) => {
  if (!form.value.formulaExpression) {
    form.value.formulaExpression = text;
  } else {
    form.value.formulaExpression += ' ' + text;
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
    alert('Vui lòng chọn cột dữ liệu cần lấy từ bảng đích!');
    return;
  }

  isSaving.value = true;
  try {
    const colPayload = {
      id: form.value.id.trim(),
      label: form.value.label.trim(),
      format: form.value.format || 'text',
      width: String(form.value.width || '50'),
      required: Boolean(form.value.required),
      options: form.value.options ? form.value.options.trim() : '',
      ...(form.value.format === 'lookup' ? {
        lookupTarget: form.value.lookupTarget || 'personnel',
        lookupLinkCol: form.value.lookupLinkCol || '',
        lookupField: form.value.lookupField,
        lookupConditions: form.value.lookupConditions || [],
        lookupLogicOp: form.value.lookupLogicOp || 'AND',
        lookupDisplay: form.value.lookupDisplay || 'value',
        lookupFormat: form.value.lookupFormat || 'default',
      } : {}),
      ...(form.value.format === 'formula' ? {
        formulaType: form.value.formulaType || 'custom_expression',
        formulaExpression: form.value.formulaExpression || '',
      } : {}),
      targetIndex: props.targetIndex,
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

.btn-required-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-required-toggle:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}

.btn-required-toggle.is-required {
  border-color: #dc2626;
  background: #fef2f2;
  color: #dc2626;
}

.btn-formula-tab {
  flex: 1;
  padding: 4px 8px;
  font-size: 0.7rem;
  border: 1px solid #e9d5ff;
  background: #ffffff;
  color: #7e22ce;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.15s ease;
}
.btn-formula-tab:hover {
  background: #fdf4ff;
  border-color: #c084fc;
}
.btn-formula-tab.active {
  background: #86198f;
  border-color: #86198f;
  color: #ffffff;
  font-weight: 600;
}

.formula-pill-field {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  background: #fdf4ff;
  border: 1px solid #e879f9;
  border-radius: 12px;
  font-size: 0.68rem;
  color: #86198f;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.formula-pill-field:hover {
  background: #f0abfc;
  color: #701a75;
}

.formula-fn-item {
  padding: 5px 8px;
  border: 1px solid #f5d0fe;
  background: #fdf4ff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.formula-fn-item:hover {
  background: #fae8ff;
  border-color: #d946ef;
}
</style>
