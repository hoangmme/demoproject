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
      </div>

      <!-- Cấu hình độ rộng hiển thị cột (Lark Base Column Width Engine) -->
      <div class="col-width-control">
        <div class="col-width-header">
          <div class="col-width-title">
            <i class="pi pi-arrows-h" style="font-size: 0.75rem; color: #0284c7;"></i>
            <span>Độ rộng cột:</span>
          </div>
          <button
            v-if="hasCustomDraggedWidths && widthMode === 'auto'"
            type="button"
            class="btn-reset-dragged"
            @click="$emit('reset-dragged-widths')"
            title="Xóa bỏ độ rộng từng cột đã kéo tay bằng chuột và quay về kích thước tự động mặc định"
          >
            <i class="pi pi-refresh" style="font-size: 0.65rem;"></i>
            <span>Đặt lại kéo tay</span>
          </button>
        </div>

        <div class="col-width-body">
          <!-- Chế độ Tự động (Auto) -->
          <button
            type="button"
            class="btn-width-mode"
            :class="{ active: widthMode === 'auto' }"
            @click="selectWidthMode('auto')"
            title="Ưu tiên 2: Tự động co giãn theo nội dung, hoặc hiển thị theo kích thước bạn tự kéo chuột (Tầng 1)"
          >
            <i class="pi pi-table" style="font-size: 0.7rem;"></i>
            <span>Auto</span>
          </button>

          <!-- Chế độ Nhập px (Cố định toàn bộ cột - Ưu tiên cao nhất) -->
          <div
            class="width-px-input-wrap"
            :class="{ active: widthMode === 'fixed' }"
            @click="selectWidthMode('fixed')"
          >
            <span class="width-px-label">Cố định:</span>
            <input
              ref="widthInputRef"
              type="number"
              v-model.number="localWidthPx"
              min="60"
              max="800"
              step="10"
              class="width-number-input"
              title="Nhập px áp dụng đồng bộ cho toàn bộ cột (Ưu tiên cao nhất)"
              @input="onPxInput"
              @focus="selectWidthMode('fixed')"
            />
            <span class="width-px-unit">px</span>
          </div>
        </div>

        <!-- Chú thích nguyên lý ưu tiên -->
        <div class="col-width-hint">
          <span v-if="widthMode === 'fixed'">
            ⭐ <strong>Cố định {{ localWidthPx }}px</strong>: Áp dụng đồng bộ cho toàn bộ cột (Ưu tiên cao nhất).
          </span>
          <span v-else>
            💡 <strong>Auto</strong>: Tự co giãn hoặc nhận kích thước tự kéo chuột trên header (Tầng 1).
          </span>
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
              @change="toggleCol(col.id)"
              style="accent-color: #2e7d32; width: 15px; height: 15px; cursor: pointer; flex-shrink: 0;"
            />
            <span class="item-text" :title="col.label || col.id">
              {{ col.label || col.id }}
            </span>
          </label>

          <!-- Up/Down Reorder & Copy Actions -->
          <div class="item-reorder-actions">
            <!-- Nút Sao chép mã thẻ Word/PDF ({tag_id}) -->
            <button
              type="button"
              class="btn-col-action-trigger"
              @click.stop="copyColumnTag(col)"
              :title="copiedColId === col.id ? 'Đã chép vào Clipboard!' : `Sao chép mã thẻ Word/PDF: {${col.id}}`"
              :style="{ color: copiedColId === col.id ? '#16a34a' : '#64748b', borderColor: copiedColId === col.id ? '#86efac' : '#cbd5e1' }"
            >
              <i :class="copiedColId === col.id ? 'pi pi-check' : 'pi pi-copy'" style="font-size: 0.72rem;"></i>
            </button>

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

            <!-- Nút Nhân bản cột này -->
            <button
              v-if="(!col.isVirtual || col.id === '_parentPersonnelName') && col.id !== '_primaryKey' && col.id !== 'stt' && col.id !== 'code'"
              type="button"
              class="btn-col-action-trigger"
              @click.stop="$emit('duplicate-column', col)"
              title="Nhân bản cột này (tạo bản sao)"
            >
              <i class="pi pi-clone" style="font-size: 0.72rem; color: #10b981;"></i>
            </button>
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

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
  widthMode: {
    type: String,
    default: 'auto', // 'auto' | 'fixed'
  },
  widthPx: {
    type: Number,
    default: 160,
  },
  hasCustomDraggedWidths: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'update:modelValue',
  'change',
  'open-col-menu',
  'duplicate-column',
  'update:widthMode',
  'update:widthPx',
  'change-width-setting',
  'reset-dragged-widths',
]);

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

const localWidthPx = ref(props.widthPx || 160);
const widthInputRef = ref(null);

watch(
  () => props.widthPx,
  (newVal) => {
    if (newVal && newVal !== localWidthPx.value) {
      localWidthPx.value = newVal;
    }
  }
);

const selectWidthMode = (mode) => {
  emit('update:widthMode', mode);
  emit('change-width-setting', { mode, px: localWidthPx.value });
  if (mode === 'fixed') {
    nextTick(() => {
      widthInputRef.value?.focus();
    });
  }
};

const onPxInput = () => {
  let val = Number(localWidthPx.value);
  if (!val || val < 40) val = 60;
  emit('update:widthPx', val);
  if (props.widthMode === 'fixed') {
    emit('change-width-setting', { mode: 'fixed', px: val });
  }
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

const canonicalPrimaryId = computed(() => {
  const primaryOption = (props.options || []).find((o) => o.isPrimaryField)
    || (props.options || []).find((o) => o.id === '_parentPersonnelName' || o.id === 'name' || o.id === 'relativeName')
    || (props.options || []).find((o) => !o.isVirtual && o.id !== 'stt' && o.id !== 'code' && o.id !== '_primaryKey')
    || props.options?.[0];
  return primaryOption?.id || null;
});

const copiedColId = ref('');
const copyColumnTag = (col) => {
  if (!col || !col.id) return;
  const tag = `{${col.id}}`;
  try {
    navigator.clipboard.writeText(tag);
    copiedColId.value = col.id;
    setTimeout(() => {
      if (copiedColId.value === col.id) copiedColId.value = '';
    }, 2000);
  } catch (e) {
    console.error('Failed to copy column tag:', e);
  }
};

watch(
  () => props.modelValue,
  () => {
    customOrder.value = [];
  }
);

const baseDisplayOptions = computed(() => {
  let opts = [...props.options];
  if (customOrder.value.length === 0) {
    const activeSet = new Set(props.modelValue);
    const orderedActive = props.modelValue
      .map((id) => opts.find((o) => id === o.id))
      .filter(Boolean);
    const remaining = opts.filter((o) => !activeSet.has(o.id));
    return [...orderedActive, ...remaining];
  } else {
    const map = new Map(opts.map((o) => [o.id, o]));
    const ordered = customOrder.value.map((id) => map.get(id)).filter(Boolean);
    const orderedIds = new Set(customOrder.value);
    opts.forEach((o) => {
      if (!orderedIds.has(o.id)) ordered.push(o);
    });
    return ordered;
  }
});

const displayOptions = computed(() => {
  const opts = baseDisplayOptions.value;
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    return opts.filter((o) => (o.label || o.id || '').toLowerCase().includes(q));
  }
  return opts;
});

const moveUp = (idx) => {
  if (idx <= 0) return;
  const currentList = displayOptions.value;
  const targetItem = currentList[idx];
  const prevItem = currentList[idx - 1];
  if (!targetItem || !prevItem) return;

  const fullList = [...baseDisplayOptions.value.map((o) => o.id)];
  const posA = fullList.indexOf(targetItem.id);
  const posB = fullList.indexOf(prevItem.id);
  if (posA !== -1 && posB !== -1) {
    const temp = fullList[posA];
    fullList[posA] = fullList[posB];
    fullList[posB] = temp;
    customOrder.value = fullList;

    const activeSet = new Set(props.modelValue);
    const newModelValue = fullList.filter((id) => activeSet.has(id));
    emit('update:modelValue', newModelValue);
    emit('change', newModelValue);
  }
};

const moveDown = (idx) => {
  const currentList = displayOptions.value;
  if (idx < 0 || idx >= currentList.length - 1) return;
  const targetItem = currentList[idx];
  const nextItem = currentList[idx + 1];
  if (!targetItem || !nextItem) return;

  const fullList = [...baseDisplayOptions.value.map((o) => o.id)];
  const posA = fullList.indexOf(targetItem.id);
  const posB = fullList.indexOf(nextItem.id);
  if (posA !== -1 && posB !== -1) {
    const temp = fullList[posA];
    fullList[posA] = fullList[posB];
    fullList[posB] = temp;
    customOrder.value = fullList;

    const activeSet = new Set(props.modelValue);
    const newModelValue = fullList.filter((id) => activeSet.has(id));
    emit('update:modelValue', newModelValue);
    emit('change', newModelValue);
  }
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

.col-width-control {
  padding: 8px 10px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.col-width-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.col-width-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-reset-dragged {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: transparent;
  border: 1px dashed #cbd5e1;
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 0.62rem;
  color: #0284c7;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-reset-dragged:hover {
  background: #f0f9ff;
  border-color: #0284c7;
}

.col-width-body {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-width-mode {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 3px 8px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.12s ease;
  height: 28px;
}

.btn-width-mode:hover {
  color: #0f172a;
  border-color: #94a3b8;
}

.btn-width-mode.active {
  background: #e0f2fe;
  color: #0284c7;
  border-color: #38bdf8;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(2, 132, 199, 0.1);
}

.width-px-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 2px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.12s ease;
  height: 28px;
}

.width-px-input-wrap:hover {
  border-color: #94a3b8;
}

.width-px-input-wrap.active {
  background: #e0f2fe;
  color: #0284c7;
  border-color: #38bdf8;
  box-shadow: 0 1px 2px rgba(2, 132, 199, 0.1);
}

.width-px-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #475569;
}

.width-px-input-wrap.active .width-px-label {
  color: #0284c7;
  font-weight: 700;
}

.width-number-input {
  width: 52px;
  height: 22px;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #ffffff;
  color: #0f172a;
  outline: none;
  padding: 0 2px;
}

.width-number-input:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 1px #0284c7;
}

.width-px-unit {
  font-size: 0.68rem;
  color: #64748b;
  font-weight: 600;
}

.col-width-hint {
  font-size: 0.65rem;
  color: #64748b;
  line-height: 1.35;
  background: #ffffff;
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid #f1f5f9;
}
</style>
