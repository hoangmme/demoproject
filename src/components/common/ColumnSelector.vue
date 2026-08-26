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
          {{ modelValue.length }}/{{ displayOptions.length }}
        </span>
      </div>

      <!-- Quick Actions Toolbar -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 10px; background: #fafafa; border-bottom: 1px solid #f1f5f9; font-size: 0.72rem;">
        <button type="button" class="btn-text-link" @click="selectAll">Chọn tất cả</button>
        <span style="color: #cbd5e1;">|</span>
        <button type="button" class="btn-text-link" @click="deselectAll">Bỏ chọn</button>
        <span style="color: #cbd5e1;">|</span>
        <button type="button" class="btn-text-link" @click="resetOrder">Thứ tự chuẩn</button>
      </div>

      <div class="column-selector-list">
        <div
          v-for="(col, idx) in displayOptions"
          :key="col.id"
          class="column-selector-item"
          :class="{ 'item-checked': modelValue.includes(col.id) }"
        >
          <label class="item-label-group">
            <input
              type="checkbox"
              :value="col.id"
              :checked="modelValue.includes(col.id)"
              @change="toggleCol(col.id)"
              style="accent-color: #2e7d32; width: 15px; height: 15px; cursor: pointer; flex-shrink: 0;"
            />
            <span class="item-text" :title="col.label || col.id">
              <span v-if="getColIndex(col)" style="color: #64748b; font-weight: 600; margin-right: 4px; font-size: 0.75rem;">
                Cột {{ getColIndex(col) }}:
              </span>
              {{ col.label || col.id }}
            </span>
          </label>

          <!-- Up/Down Reorder Actions -->
          <div class="item-reorder-actions">
            <button
              type="button"
              class="btn-reorder"
              :disabled="idx === 0"
              @click.stop="moveUp(idx)"
              title="Dời cột lên trước (sang trái trên bảng)"
            >
              <i class="pi pi-chevron-up"></i>
            </button>
            <button
              type="button"
              class="btn-reorder"
              :disabled="idx === displayOptions.length - 1"
              @click.stop="moveDown(idx)"
              title="Dời cột xuống sau (sang phải trên bảng)"
            >
              <i class="pi pi-chevron-down"></i>
            </button>
          </div>
        </div>
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
const customOrder = ref([]);

const selectedLabel = computed(() => {
  const count = props.modelValue ? props.modelValue.length : 0;
  return `${count} cột được chọn`;
});

const getColIndex = (col) => {
  if (col.colIndex !== undefined && col.colIndex !== null) return col.colIndex;
  const originalIdx = props.options.findIndex((o) => o.id === col.id);
  return originalIdx !== -1 ? originalIdx + 1 : '';
};

const displayOptions = computed(() => {
  const opts = [...props.options];
  if (customOrder.value.length === 0) {
    const activeSet = new Set(props.modelValue);
    const orderedActive = props.modelValue
      .map((id) => opts.find((o) => o.id === id))
      .filter(Boolean);
    const remaining = opts.filter((o) => !activeSet.has(o.id));
    return [...orderedActive, ...remaining];
  }

  const map = new Map(opts.map((o) => [o.id, o]));
  const ordered = customOrder.value.map((id) => map.get(id)).filter(Boolean);
  const orderedIds = new Set(customOrder.value);
  opts.forEach((o) => {
    if (!orderedIds.has(o.id)) ordered.push(o);
  });
  return ordered;
});

const moveUp = (idx) => {
  if (idx <= 0) return;
  const list = displayOptions.value.map((o) => o.id);
  const temp = list[idx];
  list[idx] = list[idx - 1];
  list[idx - 1] = temp;
  customOrder.value = list;

  const activeSet = new Set(props.modelValue);
  const newModelValue = list.filter((id) => activeSet.has(id));
  emit('update:modelValue', newModelValue);
  emit('change', newModelValue);
};

const moveDown = (idx) => {
  if (idx >= displayOptions.value.length - 1) return;
  const list = displayOptions.value.map((o) => o.id);
  const temp = list[idx];
  list[idx] = list[idx + 1];
  list[idx + 1] = temp;
  customOrder.value = list;

  const activeSet = new Set(props.modelValue);
  const newModelValue = list.filter((id) => activeSet.has(id));
  emit('update:modelValue', newModelValue);
  emit('change', newModelValue);
};

const selectAll = () => {
  const list = displayOptions.value.map((o) => o.id);
  emit('update:modelValue', list);
  emit('change', list);
};

const deselectAll = () => {
  emit('update:modelValue', []);
  emit('change', []);
};

const resetOrder = () => {
  customOrder.value = [];
  const list = props.options.map((o) => o.id).filter((id) => props.modelValue.includes(id));
  emit('update:modelValue', list);
  emit('change', list);
};

const toggleCol = (id) => {
  const currentList = [...displayOptions.value.map((o) => o.id)];
  const activeSet = new Set(props.modelValue);
  if (activeSet.has(id)) {
    activeSet.delete(id);
  } else {
    activeSet.add(id);
  }
  const result = currentList.filter((item) => activeSet.has(item));
  emit('update:modelValue', result);
  emit('change', result);
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
  width: 290px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
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

.btn-text-link {
  background: transparent;
  border: none;
  color: #0284c7;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0 2px;
}

.btn-text-link:hover {
  text-decoration: underline;
  color: #0369a1;
}

.column-selector-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.column-selector-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s ease;
  user-select: none;
}

.column-selector-item:hover {
  background: #f1f5f9;
}

.item-checked {
  background: #f8fafc;
}

.item-label-group {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.item-text {
  font-size: 0.8rem;
  color: #334155;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-reorder-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0.6;
  transition: opacity 0.15s ease;
}

.column-selector-item:hover .item-reorder-actions {
  opacity: 1;
}

.btn-reorder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #ffffff;
  color: #475569;
  font-size: 0.62rem;
  cursor: pointer;
  transition: all 0.1s ease;
  padding: 0;
}

.btn-reorder:hover:not(:disabled) {
  background: #e0f2fe;
  color: #0284c7;
  border-color: #7dd3fc;
}

.btn-reorder:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
