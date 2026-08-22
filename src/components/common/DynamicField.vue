<template>
  <div class="dynamic-field-wrapper">
    <!-- 1. Text -->
    <template v-if="col.format === 'text' || !col.format">
      <InputText
        v-model="model"
        :placeholder="col.placeholder || ('Nhập ' + (col.label || ''))"
        size="small"
        class="w-full"
      />
    </template>

    <!-- 2. Number -->
    <template v-else-if="col.format === 'number'">
      <InputNumber
        v-model="model"
        :placeholder="col.placeholder || 'Nhập số'"
        size="small"
        class="w-full"
      />
    </template>

    <!-- 3. Date -->
    <template v-else-if="col.format === 'date'">
      <AppDatePicker
        v-model="model"
        :placeholder="col.placeholder || 'DD/MM/YYYY'"
      />
    </template>

    <!-- 4. Text Loop (List dữ liệu lặp) -->
    <template v-else-if="col.format === 'text_loop'">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div v-for="(item, idx) in loopItems" :key="idx" style="display: flex; gap: 6px; align-items: center;">
          <InputText
            v-model="loopItems[idx]"
            size="small"
            style="flex: 1; font-size: 0.8rem;"
            :placeholder="'Dòng ' + (idx + 1)"
            @input="updateLoopModel"
          />
          <Button
            icon="pi pi-times"
            severity="danger"
            text
            size="small"
            @click="removeLoopItem(idx)"
            style="padding: 2px 6px;"
          />
        </div>
        <Button
          label="Thêm dòng"
          icon="pi pi-plus"
          size="small"
          text
          @click="addLoopItem"
          style="font-size: 0.75rem; align-self: flex-start; padding: 2px 6px;"
        />
      </div>
    </template>

    <!-- 4b. Table Loop (Bảng lặp nhiều cột tùy biến tiêu đề) -->
    <template v-else-if="col.format === 'table_2col' || col.format === 'table_loop'">
      <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; background: #fafafa; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; min-width: 320px;">
          <thead>
            <tr style="background: #f1f5f9; color: #475569; font-weight: 700; text-align: left;">
              <th style="padding: 6px 8px; width: 35px; text-align: center; border-radius: 4px 0 0 4px;">STT</th>
              <th v-for="(h, hIdx) in tableHeaders" :key="hIdx" style="padding: 6px 8px;">
                {{ h }}
              </th>
              <th style="padding: 6px 8px; width: 32px; text-align: center; border-radius: 0 4px 4px 0;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rIdx) in tableRows" :key="rIdx" style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px; text-align: center; color: #64748b; font-weight: 600;">{{ rIdx + 1 }}</td>
              <td v-for="(h, hIdx) in tableHeaders" :key="hIdx" style="padding: 4px;">
                <InputText
                  v-model="row['col' + hIdx]"
                  size="small"
                  :placeholder="'Nhập ' + h"
                  style="width: 100%; font-size: 0.78rem; padding: 4px 6px;"
                  @input="updateTableModel"
                />
              </td>
              <td style="padding: 4px; text-align: center;">
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  size="small"
                  @click="removeTableRow(rIdx)"
                  style="padding: 2px 4px; font-size: 0.75rem;"
                />
              </td>
            </tr>
            <tr v-if="tableRows.length === 0">
              <td :colspan="tableHeaders.length + 2" style="text-align: center; padding: 8px; color: #94a3b8; font-style: italic;">
                Chưa có dữ liệu bảng. Nhấp "+ Thêm hàng" để nhập.
              </td>
            </tr>
          </tbody>
        </table>
        <Button
          label="Thêm hàng"
          icon="pi pi-plus"
          size="small"
          text
          severity="success"
          @click="addTableRow"
          style="font-size: 0.75rem; align-self: flex-start; padding: 2px 6px; margin-top: 2px;"
        />
      </div>
    </template>

    <!-- 5. Checkbox (Nhiều lựa chọn) -->
    <template v-else-if="col.format === 'checkbox'">
      <div style="display: flex; flex-wrap: wrap; gap: 6px 12px; padding: 4px 0; align-items: center;">
        <label
          v-for="opt in parsedOptions"
          :key="opt"
          style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; user-select: none;"
        >
          <input
            type="checkbox"
            :value="opt"
            :checked="isCheckboxChecked(opt)"
            @change="toggleCheckbox(opt)"
            style="accent-color: #2e7d32; flex-shrink: 0;"
          />
          <span style="white-space: nowrap;">{{ opt }}</span>
        </label>
        <span v-if="parsedOptions.length === 0" style="font-size: 0.75rem; color: #9ca3af; font-style: italic;">
          (Chưa cấu hình tùy chọn trong Cài đặt cột)
        </span>
      </div>
    </template>

    <!-- 6. Checkbox + Nhập Text (Hộp kiểm có điều kiện) -->
    <template v-else-if="col.format === 'checkbox_text'">
      <!-- Trường hợp 1: Có cấu hình danh sách options -->
      <template v-if="parsedOptions.length > 0">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Horizontal Checkbox Row -->
          <div style="display: flex; flex-wrap: wrap; gap: 6px 16px; padding: 2px 0; align-items: center;">
            <label
              v-for="opt in parsedOptions"
              :key="opt"
              style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; user-select: none;"
            >
              <input
                type="checkbox"
                :checked="isConditionalOptActive(opt)"
                @change="toggleConditionalOpt(opt)"
                style="accent-color: #2e7d32; flex-shrink: 0;"
              />
              <span style="white-space: nowrap;">{{ opt }}</span>
            </label>
          </div>

          <!-- Detail input container underneath -->
          <div
            v-if="activeConditionalOptions.length > 0"
            style="display: flex; flex-direction: column; gap: 6px; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;"
          >
            <div
              v-for="opt in activeConditionalOptions"
              :key="opt"
              style="display: flex; align-items: center; gap: 8px;"
            >
              <span style="font-size: 0.78rem; font-weight: 600; color: #475569; min-width: 75px; white-space: nowrap;">
                {{ opt }}:
              </span>
              <InputText
                v-model="conditionalDetails[opt]"
                :placeholder="'Nhập chi tiết cho ' + opt + '...'"
                size="small"
                style="font-size: 0.8rem; height: 30px; flex: 1;"
                @input="syncConditionalModel"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Trường hợp 2: Không có options -> Hộp kiểm đơn + ô nhập nội dung inline -->
      <template v-else>
        <div style="display: flex; flex-wrap: wrap; gap: 8px 12px; padding: 4px 0; align-items: center;">
          <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; user-select: none;"
          >
            <input
              type="checkbox"
              v-model="singleConditionalChecked"
              @change="syncSingleConditional"
              style="accent-color: #2e7d32; flex-shrink: 0;"
            />
            <span style="white-space: nowrap;">Phát sinh nội dung / Vi phạm</span>
          </label>
          <div v-if="singleConditionalChecked" style="flex: 1; min-width: 160px;">
            <InputText
              v-model="singleConditionalText"
              placeholder="Nhập diễn giải chi tiết..."
              size="small"
              style="font-size: 0.78rem; height: 30px; width: 100%;"
              @input="syncSingleConditional"
            />
          </div>
        </div>
      </template>
    </template>

    <!-- 7. Dropdown -->
    <template v-else-if="col.format === 'dropdown'">
      <select
        v-model="model"
        class="custom-col-select"
      >
        <option value="">-- Chọn --</option>
        <option v-for="opt in parsedOptions" :key="opt" :value="opt">
          {{ opt }}
        </option>
      </select>
    </template>

    <!-- 8. File Attachments -->
    <template v-else-if="col.format === 'file'">
      <PersonnelAttachments
        v-model="model"
        :label="col.label || 'Tệp đính kèm'"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import AppDatePicker from './AppDatePicker.vue';
import PersonnelAttachments from '@/components/personnel/PersonnelAttachments.vue';

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object, Boolean],
    default: '',
  },
  col: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const parsedOptions = computed(() => {
  if (!props.col.options) return [];
  return String(props.col.options)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
});

// Text Loop
const loopItems = ref(['']);
watch(
  () => props.modelValue,
  (val) => {
    if (Array.isArray(val)) {
      loopItems.value = val.length > 0 ? [...val] : [''];
    } else if (typeof val === 'string' && val) {
      loopItems.value = [val];
    } else {
      loopItems.value = [''];
    }
  },
  { immediate: true }
);

const addLoopItem = () => {
  loopItems.value.push('');
};

const removeLoopItem = (idx) => {
  loopItems.value.splice(idx, 1);
  if (loopItems.value.length === 0) loopItems.value.push('');
  updateLoopModel();
};

const updateLoopModel = () => {
  const filtered = loopItems.value.filter((s) => s && s.trim().length > 0);
  emit('update:modelValue', filtered);
};

// Table Loop (Multi-Column Custom Headers)
const tableHeaders = computed(() => {
  if (props.col?.options) {
    const parts = String(props.col.options).split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts;
  }
  return ['Cột 1', 'Cột 2'];
});

const tableRows = ref([]);

const initTableRows = (val) => {
  const headers = tableHeaders.value;
  if (Array.isArray(val)) {
    tableRows.value = val.map((item) => {
      const row = {};
      if (typeof item === 'object' && item !== null) {
        headers.forEach((h, idx) => {
          row['col' + idx] = item['col' + idx] !== undefined ? item['col' + idx] : (item['col' + (idx + 1)] !== undefined ? item['col' + (idx + 1)] : (item[h] || ''));
        });
      } else {
        const parts = String(item).split(/[-:;,]/);
        headers.forEach((_, idx) => {
          row['col' + idx] = parts[idx]?.trim() || '';
        });
      }
      return row;
    });
  } else if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        initTableRows(parsed);
        return;
      }
    } catch (e) {}
    tableRows.value = val.split('\n').filter(Boolean).map((line) => {
      const parts = line.split(/[-:;,]/);
      const row = {};
      headers.forEach((_, idx) => {
        row['col' + idx] = parts[idx]?.trim() || '';
      });
      return row;
    });
  } else {
    tableRows.value = [];
  }
};

watch(
  () => [props.modelValue, props.col.format, props.col.options],
  ([val, fmt]) => {
    if (fmt === 'table_2col' || fmt === 'table_loop') {
      const currentJson = JSON.stringify(tableRows.value);
      const incomingJson = JSON.stringify(val);
      if (currentJson !== incomingJson) {
        initTableRows(val);
      }
    }
  },
  { immediate: true, deep: true }
);

const addTableRow = () => {
  const row = {};
  tableHeaders.value.forEach((_, idx) => {
    row['col' + idx] = '';
  });
  tableRows.value.push(row);
  emit('update:modelValue', [...tableRows.value]);
};

const removeTableRow = (idx) => {
  tableRows.value.splice(idx, 1);
  emit('update:modelValue', [...tableRows.value]);
};

const updateTableModel = () => {
  emit('update:modelValue', [...tableRows.value]);
};

// Checkbox (Multi-select)
const isCheckboxChecked = (opt) => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(opt);
  }
  if (typeof props.modelValue === 'string') {
    return props.modelValue.split(',').map((s) => s.trim()).includes(opt);
  }
  return false;
};

const toggleCheckbox = (opt) => {
  let list = Array.isArray(props.modelValue) ? [...props.modelValue] : (props.modelValue ? String(props.modelValue).split(',').map((s) => s.trim()) : []);
  if (list.includes(opt)) {
    list = list.filter((x) => x !== opt);
  } else {
    list.push(opt);
  }
  emit('update:modelValue', list);
};

// Checkbox + Text (Conditional)
const conditionalActiveOpts = ref([]);
const conditionalDetails = ref({});

const isConditionalOptActive = (opt) => {
  return conditionalActiveOpts.value.includes(opt);
};

const activeConditionalOptions = computed(() => {
  return parsedOptions.value.filter((opt) => isConditionalOptActive(opt));
});

const toggleConditionalOpt = (opt) => {
  if (conditionalActiveOpts.value.includes(opt)) {
    conditionalActiveOpts.value = conditionalActiveOpts.value.filter((x) => x !== opt);
    delete conditionalDetails.value[opt];
  } else {
    conditionalActiveOpts.value.push(opt);
    if (!conditionalDetails.value[opt]) conditionalDetails.value[opt] = '';
  }
  syncConditionalModel();
};

const syncConditionalModel = () => {
  const result = [];
  conditionalActiveOpts.value.forEach((opt) => {
    const detail = conditionalDetails.value[opt];
    result.push(detail ? `${opt}: ${detail}` : opt);
  });
  emit('update:modelValue', result.join('; '));
};

// Single Conditional (no options)
const singleConditionalChecked = ref(false);
const singleConditionalText = ref('');

const syncSingleConditional = () => {
  if (!singleConditionalChecked.value) {
    emit('update:modelValue', '');
  } else {
    emit('update:modelValue', singleConditionalText.value || 'Có');
  }
};
</script>

<style scoped>
.dynamic-field-wrapper {
  width: 100%;
}

.custom-col-select {
  width: 100% !important;
  height: 33px;
  padding: 0.25rem 0.6rem;
  font-size: 0.82rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #1e293b;
  box-sizing: border-box;
  outline: none;
  display: block;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.custom-col-select:focus {
  border-color: #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
}
</style>
