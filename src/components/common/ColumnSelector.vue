<template>
  <div class="column-selector-container" :class="{ 'is-inline': inline }" ref="containerRef">
    <button
      v-if="!inline"
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

    <div v-if="isOpen || inline" class="column-selector-dropdown" :class="{ 'inline-dropdown': inline }">
      <div class="column-selector-header">
        <span style="font-size: 0.78rem; font-weight: 700; color: #1e293b;">
          Tùy chọn cột hiển thị
        </span>
        <span style="font-size: 0.72rem; color: #64748b; font-weight: 600;">
          {{ modelValue.length }}/{{ options.length }} cột
        </span>
      </div>

      <!-- Quick Actions Toolbar -->
      <div class="column-quick-actions">
        <button type="button" class="btn-text-link" @click="selectAll">Chọn tất cả</button>
        <span style="color: #cbd5e1;">|</span>
        <button type="button" class="btn-text-link" @click="deselectAll">Bỏ chọn</button>
        <span style="color: #cbd5e1;">|</span>
        <button type="button" class="btn-text-link" @click="resetOrder">Thứ tự chuẩn</button>
        <span style="color: #cbd5e1;">|</span>
        <label style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #475569; cursor: pointer; user-select: none;">
          <input
            type="checkbox"
            v-model="showColIndex"
            @change="toggleShowColIndex"
            style="accent-color: #2e7d32; width: 13px; height: 13px; cursor: pointer;"
          />
          <span>Số cột</span>
        </label>
      </div>

      <!-- Giới hạn chiều cao hàng tối đa (Row Height Limit - Mặc định 1 hàng) -->
      <div class="row-height-control">
        <div class="row-height-title">
          <i class="pi pi-arrows-v" style="font-size: 0.75rem; color: #0284c7;"></i>
          <span>Chiều cao hàng:</span>
        </div>
        <div class="row-height-btns">
          <button
            type="button"
            class="btn-row-height"
            :class="{ active: rowHeightLimit === 1 }"
            @click="setRowHeightLimit(1)"
            title="1 hàng (Mặc định - Cắt ngắn ...)"
          >
            1 hàng
          </button>
          <button
            type="button"
            class="btn-row-height"
            :class="{ active: rowHeightLimit === 2 }"
            @click="setRowHeightLimit(2)"
            title="Tối đa 2 hàng"
          >
            2 hàng
          </button>
          <button
            type="button"
            class="btn-row-height"
            :class="{ active: rowHeightLimit === 3 }"
            @click="setRowHeightLimit(3)"
            title="Tối đa 3 hàng"
          >
            3 hàng
          </button>
          <button
            type="button"
            class="btn-row-height"
            :class="{ active: rowHeightLimit === 'auto' }"
            @click="setRowHeightLimit('auto')"
            title="Tự động (Không giới hạn)"
          >
            Tự động
          </button>
        </div>
      </div>

      <!-- Quick Search Bar -->
      <div class="column-search-box">
        <i class="pi pi-search" style="font-size: 0.72rem; color: #94a3b8;"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm kiếm cột..."
          class="column-search-input"
        />
        <i
          v-if="searchQuery"
          class="pi pi-times"
          style="font-size: 0.65rem; color: #94a3b8; cursor: pointer;"
          @click="searchQuery = ''"
        ></i>
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
              :disabled="idx === 0 || col.isPrimaryField"
              @change="toggleCol(col.id)"
              style="accent-color: #2e7d32; width: 15px; height: 15px; cursor: pointer; flex-shrink: 0;"
            />
            <span class="item-text" :title="col.label || col.id">
              <span v-if="idx === 0 || col.isPrimaryField" style="margin-right: 4px;" title="Cột chính (Cố định vị trí đầu tiên)">🔒</span>
              <span v-else-if="showColIndex && getColIndex(col)" style="color: #64748b; font-weight: 600; margin-right: 4px; font-size: 0.75rem;">
                Cột {{ getColIndex(col) }}:
              </span>
              {{ col.label || col.id }}
            </span>
          </label>

          <!-- Up/Down Reorder Actions -->
          <div class="item-reorder-actions">
            <!-- Nút Tùy chỉnh cột này (Mở menu Đổi tên, Kiểu dữ liệu, Độ rộng, Xóa...) -->
            <button
              v-if="(col.id === '_parentPersonnelName' || !col.isVirtual) && col.id !== '_primaryKey' && col.id !== 'stt'"
              type="button"
              class="btn-col-action-trigger"
              @click.stop="$emit('open-col-menu', { event: $event, col })"
              title="Tùy chỉnh cột này (Đổi tên, đổi kiểu, độ rộng, xóa cột...)"
            >
              <i class="pi pi-cog" style="font-size: 0.72rem; color: #64748b;"></i>
            </button>
            <button
              type="button"
              class="btn-reorder"
              :disabled="idx <= 1 || col.isPrimaryField"
              @click.stop="moveUp(idx)"
              :title="idx <= 1 ? 'Cột đầu tiên (Cột chính) được khóa cố định vị trí' : 'Dời cột lên trước (sang trái trên bảng)'"
            >
              <i class="pi pi-chevron-up"></i>
            </button>
            <button
              type="button"
              class="btn-reorder"
              :disabled="idx === 0 || idx === displayOptions.length - 1 || col.isPrimaryField"
              @click.stop="moveDown(idx)"
              :title="idx === 0 ? 'Cột đầu tiên (Cột chính) được khóa cố định vị trí' : 'Dời cột xuống sau (sang phải trên bảng)'"
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
  inline: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'change', 'open-col-menu']);

const isOpen = ref(false);
const searchQuery = ref('');
const containerRef = ref(null);
const customOrder = ref([]);
const showColIndex = ref(localStorage.getItem('app_show_col_index') !== 'false');

const toggleShowColIndex = () => {
  try {
    localStorage.setItem('app_show_col_index', String(showColIndex.value));
    window.dispatchEvent(new CustomEvent('table-show-col-index-changed', { detail: showColIndex.value }));
  } catch (e) {}
};

const getStoredRowHeight = () => {
  const stored = localStorage.getItem('app_table_row_clamp');
  if (stored === 'auto') return 'auto';
  const num = Number(stored);
  return num === 2 || num === 3 ? num : 1; // Mặc định là 1 hàng
};

const rowHeightLimit = ref(getStoredRowHeight());

const setRowHeightLimit = (val) => {
  rowHeightLimit.value = val;
  try {
    localStorage.setItem('app_table_row_clamp', String(val));
    window.dispatchEvent(new CustomEvent('table-row-height-changed', { detail: val }));
  } catch (e) {}
};

const selectedLabel = computed(() => {
  const count = props.modelValue ? props.modelValue.length : 0;
  return `${count} cột được chọn`;
});

const getColIndex = (col) => {
  if (col.isVirtual) return null;
  if (col.colIndex !== undefined && col.colIndex !== null) return col.colIndex;
  const baseList = (props.options || []).filter((o) => !o.isVirtual && o.id !== 'stt');
  const foundIdx = baseList.findIndex((o) => o.id === col.id);
  if (foundIdx !== -1) return foundIdx + 1;
  return null;
};

const displayOptions = computed(() => {
  let opts = [...props.options];
  if (customOrder.value.length === 0) {
    const activeSet = new Set(props.modelValue);
    const orderedActive = props.modelValue
      .map((id) => opts.find((o) => o.id === id))
      .filter(Boolean);
    const remaining = opts.filter((o) => !activeSet.has(o.id));
    opts = [...orderedActive, ...remaining];
  } else {
    const map = new Map(opts.map((o) => [o.id, o]));
    const ordered = customOrder.value.map((id) => map.get(id)).filter(Boolean);
    const orderedIds = new Set(customOrder.value);
    opts.forEach((o) => {
      if (!orderedIds.has(o.id)) ordered.push(o);
    });
    opts = ordered;
  }

  // Khóa cứng: Cột đầu tiên (Primary Field) BẮT BUỘC luôn ở vị trí index 0
  if (opts.length > 1) {
    const primaryIdx = opts.findIndex((o) => o.isPrimaryField || o.id === props.options[0]?.id);
    if (primaryIdx > 0) {
      const [primaryCol] = opts.splice(primaryIdx, 1);
      opts.unshift(primaryCol);
    }
  }

  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    return opts.filter((o) => (o.label || o.id || '').toLowerCase().includes(q));
  }

  return opts;
});

const moveUp = (idx) => {
  // Tuyệt đối không cho phép đổi chỗ với cột chính (idx <= 1)
  if (idx <= 1) return;
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
  // Tuyệt đối không cho phép di dời cột chính (idx === 0)
  if (idx === 0 || idx >= displayOptions.value.length - 1) return;
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
  // Luôn giữ lại cột chính (Primary Field)
  const primaryId = props.options[0]?.id;
  emit('update:modelValue', primaryId ? [primaryId] : []);
  emit('change', primaryId ? [primaryId] : []);
};

const resetOrder = () => {
  customOrder.value = [];
  const primaryId = props.options[0]?.id;
  const list = props.options.map((o) => o.id).filter((id) => props.modelValue.includes(id));
  if (primaryId && !list.includes(primaryId)) {
    list.unshift(primaryId);
  }
  emit('update:modelValue', list);
  emit('change', list);
};

const toggleCol = (id) => {
  const primaryId = props.options[0]?.id;
  // Cột chính là bất khả xâm phạm, không cho bỏ chọn
  if (id === primaryId) return;

  const currentList = [...displayOptions.value.map((o) => o.id)];
  const activeSet = new Set(props.modelValue);
  if (activeSet.has(id)) {
    activeSet.delete(id);
  } else {
    activeSet.add(id);
  }
  const result = currentList.filter((item) => activeSet.has(item));
  if (primaryId && !result.includes(primaryId)) {
    result.unshift(primaryId);
  }
  emit('update:modelValue', result);
  emit('change', result);
};

const handleClickOutside = (e) => {
  if (props.inline) return;
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

.column-selector-container.is-inline {
  width: 100%;
  display: block;
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

.column-selector-dropdown.inline-dropdown {
  position: static;
  width: 100%;
  box-shadow: none;
  border: none;
  border-radius: 0;
  z-index: auto;
}

.column-quick-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.72rem;
}

.column-search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
}

.column-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.75rem;
  color: #1e293b;
  background: transparent;
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

.btn-col-action-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.12s ease;
  padding: 0;
  margin-right: 3px;
}

.btn-col-action-trigger:hover {
  background: #f1f5f9;
  color: #0284c7;
  border-color: #38bdf8;
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

.row-height-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.row-height-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 4px;
}

.row-height-btns {
  display: flex;
  gap: 2px;
  background: #e2e8f0;
  padding: 2px;
  border-radius: 6px;
}

.btn-row-height {
  border: none;
  background: transparent;
  padding: 2px 6px;
  font-size: 0.68rem;
  font-weight: 600;
  color: #64748b;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-row-height:hover {
  color: #0f172a;
}

.btn-row-height.active {
  background: #ffffff;
  color: #0284c7;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
</style>
