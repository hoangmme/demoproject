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
        <div style="display: flex; flex-wrap: wrap; gap: 8px 16px; padding: 4px 0; align-items: flex-start;">
          <div
            v-for="opt in parsedOptions"
            :key="opt"
            style="display: inline-flex; flex-direction: column; gap: 4px; max-width: 100%;"
          >
            <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; user-select: none;">
              <input
                type="checkbox"
                :checked="isConditionalOptActive(opt)"
                @change="toggleConditionalOpt(opt)"
                style="accent-color: #2e7d32; flex-shrink: 0;"
              />
              <span style="white-space: nowrap;">{{ opt }}</span>
            </label>
            <div v-if="isConditionalOptActive(opt)" style="margin-top: 2px;">
              <InputText
                v-model="conditionalDetails[opt]"
                :placeholder="'Chi tiết: ' + opt + '...'"
                size="small"
                style="font-size: 0.78rem; height: 28px; width: 160px; min-width: 140px;"
                @input="syncConditionalModel"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Trường hợp 2: Không có options -> Hộp kiểm đơn + ô nhập nội dung inline -->
      <template v-else>
        <div style="display: flex; flex-wrap: wrap; gap: 8px 12px; padding: 4px 0; align-items: center;">
          <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; user-select: none;">
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
              style="font-size: 0.78rem; height: 28px; width: 100%;"
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
        class="custom-col-select w-full"
        style="height: 33px; font-size: 0.82rem;"
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
</style>
