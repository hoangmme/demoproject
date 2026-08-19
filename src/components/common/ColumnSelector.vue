<template>
  <div class="column-selector-container" ref="containerRef">
    <button
      type="button"
      class="column-selector-btn"
      @click="isOpen = !isOpen"
    >
      <i class="pi pi-sliders-h" style="font-size: 0.8rem; color: #2e7d32;"></i>
      <span style="font-size: 0.8rem; font-weight: 600; color: #374151;">
        {{ selectedLabel }}
      </span>
      <i class="pi pi-chevron-down" style="font-size: 0.65rem; color: #6b7280;"></i>
    </button>

    <div v-if="isOpen" class="column-selector-dropdown">
      <div class="column-selector-header">
        <span style="font-size: 0.78rem; font-weight: 700; color: #1e293b;">
          Tùy chọn cột hiển thị
        </span>
        <span style="font-size: 0.72rem; color: #64748b; font-weight: 600;">
          {{ modelValue.length }}/{{ options.length }}
        </span>
      </div>

      <div class="column-selector-list">
        <label
          v-for="col in options"
          :key="col.id"
          class="column-selector-item"
        >
          <input
            type="checkbox"
            :value="col.id"
            :checked="modelValue.includes(col.id)"
            @change="toggleCol(col.id)"
            style="accent-color: #2e7d32; width: 15px; height: 15px; cursor: pointer; flex-shrink: 0;"
          />
          <span style="font-size: 0.8rem; color: #334155; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ col.label || col.id }}
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: 'Cột hiển thị',
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);
const containerRef = ref(null);

const selectedLabel = computed(() => {
  const count = props.modelValue ? props.modelValue.length : 0;
  return `${count} cột được chọn`;
});

const toggleCol = (id) => {
  const list = [...props.modelValue];
  const idx = list.indexOf(id);
  if (idx > -1) {
    if (list.length > 1) {
      list.splice(idx, 1);
    }
  } else {
    list.push(id);
  }
  emit('update:modelValue', list);
  emit('change', list);
};

const handleClickOutside = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.column-selector-container {
  position: relative;
  display: inline-block;
}

.column-selector-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.45rem 0.75rem;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
  height: 33px;
}

.column-selector-btn:hover {
  border-color: #2e7d32;
  background: #f9fafb;
}

.column-selector-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  width: 250px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12), 0 4px 6px rgba(0, 0, 0, 0.05);
  z-index: 9999;
  overflow: hidden;
}

.column-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.column-selector-list {
  max-height: 260px;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.column-selector-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;
}

.column-selector-item:hover {
  background: #f1f5f9;
}
</style>
