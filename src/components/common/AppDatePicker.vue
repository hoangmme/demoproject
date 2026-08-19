<template>
  <div class="custom-date-picker">
    <InputText
      v-model="displayValue"
      :placeholder="placeholder || 'DD/MM/YYYY hoặc YYYY'"
      size="small"
      class="w-full date-input"
    />
    <Button
      type="button"
      icon="pi pi-calendar"
      severity="secondary"
      outlined
      size="small"
      @click="triggerPicker"
      tabindex="-1"
      class="date-button"
    />
    <input
      type="date"
      ref="hiddenInput"
      @change="onDateChange"
      style="position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const props = defineProps({
  modelValue: {
    type: [String, Number, Date],
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);
const hiddenInput = ref(null);

const displayValue = computed({
  get: () => {
    if (!props.modelValue) return '';
    return String(props.modelValue);
  },
  set: (val) => {
    emit('update:modelValue', val);
  },
});

const triggerPicker = () => {
  if (hiddenInput.value) {
    if (typeof hiddenInput.value.showPicker === 'function') {
      try {
        hiddenInput.value.showPicker();
      } catch (err) {
        hiddenInput.value.focus();
        hiddenInput.value.click();
      }
    } else {
      hiddenInput.value.focus();
      hiddenInput.value.click();
    }
  }
};

const onDateChange = (e) => {
  const val = e.target.value; // YYYY-MM-DD
  if (val) {
    emit('update:modelValue', val);
  }
};
</script>

<style scoped>
.custom-date-picker {
  display: flex;
  align-items: stretch;
  width: 100%;
  position: relative;
}

.date-input {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  font-size: 0.82rem !important;
  flex: 1;
}

.date-button {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  border-left: none !important;
  padding: 0 10px !important;
  color: #4b5563 !important;
  background-color: #f9fafb !important;
}

.date-button:hover {
  background-color: #f3f4f6 !important;
  color: #111827 !important;
}
</style>
