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
        <!-- Empty state when search matches nothing -->
        <div v-if="groupedDisplayOptions.length === 0" class="column-empty-state">
          <i class="pi pi-search" style="font-size: 1.1rem; color: #94a3b8; margin-bottom: 4px;"></i>
          <span>Không tìm thấy cột phù hợp</span>
        </div>

        <!-- Groups -->
        <div
          v-for="group in groupedDisplayOptions"
          :key="group.key"
          class="column-group-card"
          :class="{
            'is-identifier-group': group.isIdentifier,
            'is-collapsed': isGroupCollapsed(group.key),
          }"
        >
          <!-- Group Header -->
          <div
            class="column-group-header"
            :class="{ 'header-identifier': group.isIdentifier }"
            @click="toggleGroupCollapse(group.key)"
          >
            <div class="group-header-left">
              <button
                type="button"
                class="btn-group-toggle"
                :title="isGroupCollapsed(group.key) ? 'Mở rộng nhóm' : 'Thu gọn nhóm'"
                @click.stop="toggleGroupCollapse(group.key)"
              >
                <i
                  class="pi"
                  :class="isGroupCollapsed(group.key) ? 'pi-chevron-right' : 'pi-chevron-down'"
                ></i>
              </button>
              <span v-if="group.isIdentifier" class="group-header-pin">📌</span>
              <i v-else class="pi pi-folder group-header-folder"></i>
              <span class="group-header-title" :title="group.title">
                {{ group.title }}
              </span>
              <span class="group-header-count" :class="{ 'all-selected': group.allSelected }">
                ({{ group.selectedCount }}/{{ group.totalCount }})
              </span>
            </div>

            <!-- Group Quick Actions -->
            <div class="group-header-actions" @click.stop>
              <button
                v-if="!group.allSelected"
                type="button"
                class="btn-group-action"
                @click="toggleGroupSelection(group, true)"
                title="Hiện tất cả cột trong nhóm này"
              >
                Chọn hết
              </button>
              <button
                v-if="!group.noneSelected && !group.isIdentifier"
                type="button"
                class="btn-group-action btn-group-action-muted"
                @click="toggleGroupSelection(group, false)"
                title="Ẩn tất cả cột trong nhóm này"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          <!-- Group Items List -->
          <div v-show="!isGroupCollapsed(group.key)" class="column-group-body">
            <div
              v-for="(col, colIdx) in group.columns"
              :key="col.id"
              class="column-selector-item"
              :class="{
                'item-checked': modelValue.includes(col.id),
                'item-identifier': col.isSystemIdentifier || col.id === '_recordIdentifier',
              }"
            >
              <label class="item-label-group">
                <input
                  type="checkbox"
                  :value="col.id"
                  :checked="modelValue.includes(col.id)"
                  @change="toggleCol(col.id)"
                  style="accent-color: #2e7d32; width: 15px; height: 15px; cursor: pointer; flex-shrink: 0;"
                />
                <span
                  v-if="col.isSystemIdentifier || col.id === '_recordIdentifier'"
                  style="font-size: 0.75rem; color: #d97706; flex-shrink: 0;"
                  title="Cột định danh mặc định (Không thể xóa, có thể ẩn/hiện)"
                >
                  🔒
                </span>
                <span
                  style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 4px; background: #f1f5f9; color: #475569; flex-shrink: 0;"
                  :title="'Định dạng: ' + (col.format || 'text')"
                >
                  <i :class="getFormatIcon(col.format)" style="font-size: 0.65rem;"></i>
                </span>
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
                  v-if="(!col.isVirtual || col.id === '_parentPersonnelName') && col.id !== '_primaryKey' && col.id !== 'stt' && col.id !== 'code' && col.id !== '_recordIdentifier'"
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
                  :disabled="colIdx === 0"
                  @click.stop="moveColUp(col, group)"
                  title="Dời cột lên trước (sang trái trên bảng)"
                >
                  <i class="pi pi-chevron-up"></i>
                </button>
                <button
                  type="button"
                  class="btn-reorder"
                  :disabled="colIdx === group.columns.length - 1"
                  @click.stop="moveColDown(col, group)"
                  title="Dời cột xuống sau (sang phải trên bảng)"
                >
                  <i class="pi pi-chevron-down"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { getFormatIcon } from '@/utils/formatters';

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
    // Keep customOrder intact if user only toggles visibility
  }
);

const baseDisplayOptions = computed(() => {
  let opts = [...props.options];
  if (customOrder.value.length > 0) {
    const map = new Map(opts.map((o) => [o.id, o]));
    const ordered = customOrder.value.map((id) => map.get(id)).filter(Boolean);
    const orderedIds = new Set(customOrder.value);
    opts.forEach((o) => {
      if (!orderedIds.has(o.id)) ordered.push(o);
    });
    return ordered;
  }
  return opts;
});

const displayOptions = computed(() => {
  const opts = baseDisplayOptions.value;
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    return opts.filter((o) => (o.label || o.id || '').toLowerCase().includes(q));
  }
  return opts;
});

const collapsedGroups = ref(new Set());

const toggleGroupCollapse = (groupKey) => {
  const s = new Set(collapsedGroups.value);
  if (s.has(groupKey)) {
    s.delete(groupKey);
  } else {
    s.add(groupKey);
  }
  collapsedGroups.value = s;
};

const isGroupCollapsed = (groupKey) => {
  if (searchQuery.value && searchQuery.value.trim()) return false;
  return collapsedGroups.value.has(groupKey);
};

const groupedDisplayOptions = computed(() => {
  const filtered = displayOptions.value;
  const groupsMap = new Map();

  // 1. Pinned Identifier Group
  const identifierCol = filtered.find((c) => c.id === '_recordIdentifier' || c.isSystemIdentifier);
  if (identifierCol) {
    groupsMap.set('__system_identifier__', {
      key: '__system_identifier__',
      title: '📌 Cột Định danh (Cố định)',
      isIdentifier: true,
      columns: [identifierCol],
    });
  }

  // 2. Data groups in the exact order they appear in filtered
  filtered.forEach((c) => {
    if (c.id === '_recordIdentifier' || c.isSystemIdentifier) return;
    const gTitle = c.groupTitle || 'Thông tin chung';
    if (!groupsMap.has(gTitle)) {
      groupsMap.set(gTitle, {
        key: gTitle,
        title: gTitle,
        isIdentifier: false,
        columns: [],
      });
    }
    groupsMap.get(gTitle).columns.push(c);
  });

  const activeSet = new Set(props.modelValue);
  return Array.from(groupsMap.values()).map((g) => {
    const total = g.columns.length;
    const selected = g.columns.filter((c) => activeSet.has(c.id)).length;
    return {
      ...g,
      totalCount: total,
      selectedCount: selected,
      allSelected: total > 0 && selected === total,
      noneSelected: selected === 0,
    };
  });
});

const moveColUp = (col, group) => {
  const groupCols = group.columns;
  const colIdx = groupCols.findIndex((c) => c.id === col.id);
  if (colIdx <= 0) return;
  const prevCol = groupCols[colIdx - 1];

  const fullList = [...baseDisplayOptions.value.map((o) => o.id)];
  const posA = fullList.indexOf(col.id);
  const posB = fullList.indexOf(prevCol.id);
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

const moveColDown = (col, group) => {
  const groupCols = group.columns;
  const colIdx = groupCols.findIndex((c) => c.id === col.id);
  if (colIdx < 0 || colIdx >= groupCols.length - 1) return;
  const nextCol = groupCols[colIdx + 1];

  const fullList = [...baseDisplayOptions.value.map((o) => o.id)];
  const posA = fullList.indexOf(col.id);
  const posB = fullList.indexOf(nextCol.id);
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

const toggleGroupSelection = (group, selectAllBool) => {
  const groupColIds = group.columns.map((c) => c.id);
  const activeSet = new Set(props.modelValue);
  if (selectAllBool) {
    groupColIds.forEach((id) => activeSet.add(id));
  } else {
    groupColIds.forEach((id) => activeSet.delete(id));
    if (activeSet.size === 0) {
      const fallback = props.options.find((c) => c.id === '_recordIdentifier')?.id || props.options[0]?.id;
      if (fallback) activeSet.add(fallback);
    }
  }
  const fullList = baseDisplayOptions.value.map((o) => o.id);
  const result = fullList.filter((id) => activeSet.has(id));
  emit('update:modelValue', result);
  emit('change', result);
};

const selectAll = () => {
  const list = baseDisplayOptions.value.map((o) => o.id);
  emit('update:modelValue', list);
  emit('change', list);
};

const deselectAll = () => {
  const fallback = props.options.find((c) => c.id === '_recordIdentifier')?.id || props.options[0]?.id;
  emit('update:modelValue', fallback ? [fallback] : []);
  emit('change', fallback ? [fallback] : []);
};

const resetOrder = () => {
  customOrder.value = [];
  const list = props.options.map((o) => o.id).filter((id) => props.modelValue.includes(id));
  emit('update:modelValue', list);
  emit('change', list);
};

const toggleCol = (id) => {
  const activeSet = new Set(props.modelValue);
  if (activeSet.has(id)) {
    if (activeSet.size <= 1) {
      alert('Bảng phải có ít nhất 1 cột hiển thị!');
      return;
    }
    activeSet.delete(id);
  } else {
    activeSet.add(id);
  }
  const result = baseDisplayOptions.value.map((o) => o.id).filter((item) => activeSet.has(item));
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
  width: 320px;
  max-height: min(540px, calc(100vh - 160px));
  display: flex;
  flex-direction: column;
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
  flex: 1;
  min-height: 120px;
  max-height: 400px;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.column-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 12px;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
}

.column-group-card {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  overflow: hidden;
  transition: all 0.15s ease;
}

.column-group-card.is-identifier-group {
  border-color: #fde68a;
  background: #fffdf5;
  box-shadow: 0 1px 3px rgba(217, 119, 6, 0.08);
}

.column-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  user-select: none;
  transition: background 0.12s ease;
}

.column-group-header:hover {
  background: #f1f5f9;
}

.column-group-header.header-identifier {
  background: #fef3c7;
  border-bottom-color: #fde68a;
}

.column-group-header.header-identifier:hover {
  background: #fde68a;
}

.group-header-left {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  flex: 1;
}

.btn-group-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  font-size: 0.65rem;
}

.group-header-pin {
  font-size: 0.75rem;
  line-height: 1;
}

.group-header-folder {
  font-size: 0.7rem;
  color: #0284c7;
}

.group-header-title {
  font-size: 0.74rem;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-header-count {
  font-size: 0.68rem;
  font-weight: 600;
  color: #64748b;
  background: #e2e8f0;
  padding: 1px 5px;
  border-radius: 999px;
  white-space: nowrap;
}

.group-header-count.all-selected {
  background: #dcfce7;
  color: #15803d;
}

.group-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 6px;
}

.btn-group-action {
  border: 1px solid #bae6fd;
  background: #f0f9ff;
  color: #0284c7;
  font-size: 0.65rem;
  font-weight: 600;
  border-radius: 4px;
  padding: 1px 5px;
  cursor: pointer;
  transition: all 0.12s ease;
  line-height: 1.3;
}

.btn-group-action:hover {
  background: #e0f2fe;
  border-color: #38bdf8;
}

.btn-group-action-muted {
  border-color: #e2e8f0;
  background: #ffffff;
  color: #64748b;
}

.btn-group-action-muted:hover {
  background: #f1f5f9;
  color: #334155;
  border-color: #cbd5e1;
}

.column-group-body {
  padding: 3px 4px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.item-identifier {
  background: #fffbeb;
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
