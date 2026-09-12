<template>
  <div class="column-selector-container" :class="{ 'is-inline': inline }" ref="containerRef">
    <!-- Nút bấm kích hoạt mở dropdown khi không ở chế độ inline -->
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

    <!-- Dropdown / Popover chính -->
    <div v-if="isOpen || inline" class="column-selector-dropdown" :class="{ 'inline-dropdown': inline }">
      <!-- 1. Header tinh gọn, hiển thị phạm vi & nút Mở rộng toàn màn hình -->
      <div class="column-selector-header">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
          <i class="pi pi-sliders-h" style="font-size: 0.85rem; color: #7c3aed; flex-shrink: 0;"></i>
          <span class="header-main-title">Tùy chọn cột hiển thị</span>
          <span v-if="scopeName" class="header-scope-badge" :title="scopeName">
            🎯 {{ scopeName }}
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <span class="header-stat-pill">
            {{ modelValue.length }}/{{ options.length }} cột
          </span>
          <button
            type="button"
            class="btn-expand-modal"
            @click="isModalOpen = true"
            title="Mở rộng toàn màn hình để tùy chọn thoải mái không giới hạn chiều cao"
          >
            <i class="pi pi-window-maximize" style="font-size: 0.72rem;"></i>
          </button>
        </div>
      </div>

      <!-- 2. Quick Actions Toolbar & Compact Width Settings (Gọn gàng trong 1 thanh) -->
      <div class="column-quick-actions">
        <div class="quick-links-group">
          <button type="button" class="btn-text-link" @click="selectAll">Chọn tất cả</button>
          <span class="divider-dot">·</span>
          <button type="button" class="btn-text-link" @click="deselectAll">Bỏ chọn</button>
          <span class="divider-dot">·</span>
          <button type="button" class="btn-text-link" @click="resetOrder">Thứ tự chuẩn</button>
        </div>

        <!-- Thanh chỉnh độ rộng cột siêu gọn (Compact Width Mode Pill) -->
        <div class="width-compact-wrap">
          <span class="width-compact-label">Rộng:</span>
          <button
            type="button"
            class="btn-width-pill"
            :class="{ active: widthMode === 'auto' }"
            @click="selectWidthMode('auto')"
            title="Auto: Tự động co giãn hoặc nhận kích thước kéo chuột"
          >
            Auto
          </button>
          <div
            class="width-input-pill"
            :class="{ active: widthMode === 'fixed' }"
            @click="selectWidthMode('fixed')"
            title="Nhập số px cố định cho toàn bộ cột"
          >
            <span>Cố định</span>
            <input
              ref="widthInputRef"
              type="number"
              v-model.number="localWidthPx"
              min="60"
              max="800"
              step="10"
              class="width-compact-input"
              @input="onPxInput"
              @focus="selectWidthMode('fixed')"
            />
            <span class="px-label">px</span>
          </div>
          <button
            v-if="hasCustomDraggedWidths && widthMode === 'auto'"
            type="button"
            class="btn-reset-pill"
            @click="$emit('reset-dragged-widths')"
            title="Đặt lại độ rộng từng cột đã kéo tay"
          >
            <i class="pi pi-refresh" style="font-size: 0.65rem;"></i>
          </button>
        </div>
      </div>

      <!-- 3. Thanh Tìm kiếm Nhanh -->
      <div class="column-search-box">
        <i class="pi pi-search" style="font-size: 0.78rem; color: #94a3b8;"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm nhanh tên cột hoặc nhóm dữ liệu..."
          class="column-search-input"
        />
        <i
          v-if="searchQuery"
          class="pi pi-times"
          style="font-size: 0.7rem; color: #94a3b8; cursor: pointer;"
          @click="searchQuery = ''"
        ></i>
      </div>

      <!-- 4. Danh sách Cột Phân Nhóm (Tự động kéo dài không bị ép 400px) -->
      <div class="column-selector-list">
        <!-- Trạng thái trống khi tìm kiếm không khớp -->
        <div v-if="groupedDisplayOptions.length === 0" class="column-empty-state">
          <i class="pi pi-search" style="font-size: 1.4rem; color: #94a3b8; margin-bottom: 6px;"></i>
          <span>Không tìm thấy cột phù hợp với từ khóa</span>
        </div>

        <!-- Nhóm cột -->
        <div
          v-for="group in groupedDisplayOptions"
          :key="group.key"
          class="column-group-card"
          :class="{
            'is-identifier-group': group.isIdentifier,
            'is-collapsed': isGroupCollapsed(group.key),
          }"
        >
          <!-- Group Header (Sticky khi cuộn) -->
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
                {{ cleanGroupTitle(group.title) }}
              </span>
              <span class="group-header-count" :class="{ 'all-selected': group.allSelected }">
                {{ group.selectedCount }}/{{ group.totalCount }}
              </span>
            </div>

            <!-- Thao tác nhanh cấp nhóm -->
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

          <!-- Danh sách các cột bên trong nhóm -->
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
                  style="accent-color: #2e7d32; width: 16px; height: 16px; cursor: pointer; flex-shrink: 0;"
                />
                <span
                  v-if="col.isSystemIdentifier || col.id === '_recordIdentifier'"
                  style="font-size: 0.78rem; color: #d97706; flex-shrink: 0;"
                  title="Cột định danh mặc định (Không thể xóa, có thể ẩn/hiện)"
                >
                  🔒
                </span>
                <span
                  class="col-type-badge"
                  :title="'Định dạng: ' + (col.format || 'text')"
                >
                  <i :class="getFormatIcon(col.format)" style="font-size: 0.68rem;"></i>
                </span>
                <span class="item-text" :title="col.label || col.id">
                  {{ col.label || col.id }}
                </span>
              </label>

              <!-- Phím thao tác cột: Sao chép mã thẻ, Tùy chỉnh, Nhân bản, Dời thứ tự -->
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

                <!-- Nút Tùy chỉnh cột này -->
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

                <!-- Nút Dời cột lên trước / xuống sau -->
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

    <!-- 5. DIALOG TOÀN MÀN HÌNH TÙY CHỌN CỘT (Khi người dùng muốn không gian rộng rãi tối đa) -->
    <Dialog
      v-model:visible="isModalOpen"
      modal
      :header="false"
      :style="{ width: '880px', maxWidth: '96vw', height: '88vh', maxHeight: '94vh' }"
      :contentStyle="{ height: '100%', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }"
      class="column-modal-dialog"
    >
      <!-- Modal Header -->
      <div class="modal-custom-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="modal-icon-badge">
            <i class="pi pi-sliders-h" style="font-size: 1.1rem; color: #0284c7;"></i>
          </div>
          <div>
            <div style="font-size: 1.05rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px;">
              <span>Quản lý & Tùy chọn Cột hiển thị</span>
              <span v-if="scopeName" class="header-scope-badge" style="font-size: 0.78rem;">
                🎯 {{ scopeName }}
              </span>
            </div>
            <div style="font-size: 0.78rem; color: #64748b; margin-top: 1px;">
              Xem toàn bộ danh mục cột dữ liệu không giới hạn chiều cao, bật/tắt hiển thị và dời vị trí linh hoạt.
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="header-stat-pill" style="font-size: 0.8rem; padding: 4px 12px;">
            Đang hiển thị: {{ modelValue.length }} / {{ options.length }} cột
          </span>
          <button type="button" class="btn-modal-close" @click="isModalOpen = false" title="Đóng">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <!-- Modal Toolbar -->
      <div class="modal-toolbar-bar">
        <div class="column-search-box" style="flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff;">
          <i class="pi pi-search" style="font-size: 0.82rem; color: #94a3b8;"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm cột trong toàn bộ bảng..."
            class="column-search-input"
            style="font-size: 0.82rem;"
          />
          <i
            v-if="searchQuery"
            class="pi pi-times"
            style="font-size: 0.72rem; color: #94a3b8; cursor: pointer;"
            @click="searchQuery = ''"
          ></i>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; margin-left: 12px;">
          <button type="button" class="btn-text-link" style="font-size: 0.8rem;" @click="selectAll">Chọn tất cả</button>
          <span style="color: #cbd5e1;">·</span>
          <button type="button" class="btn-text-link" style="font-size: 0.8rem;" @click="deselectAll">Bỏ chọn</button>
          <span style="color: #cbd5e1;">·</span>
          <button type="button" class="btn-text-link" style="font-size: 0.8rem;" @click="resetOrder">Thứ tự chuẩn</button>
        </div>
      </div>

      <!-- Modal Body (Danh sách rộng rãi toàn màn hình) -->
      <div class="modal-columns-body">
        <div
          v-for="group in groupedDisplayOptions"
          :key="'modal_' + group.key"
          class="column-group-card"
          :class="{
            'is-identifier-group': group.isIdentifier,
            'is-collapsed': isGroupCollapsed(group.key),
          }"
          style="margin-bottom: 10px;"
        >
          <div
            class="column-group-header"
            :class="{ 'header-identifier': group.isIdentifier }"
            @click="toggleGroupCollapse(group.key)"
            style="padding: 8px 12px;"
          >
            <div class="group-header-left">
              <button
                type="button"
                class="btn-group-toggle"
                @click.stop="toggleGroupCollapse(group.key)"
              >
                <i
                  class="pi"
                  :class="isGroupCollapsed(group.key) ? 'pi-chevron-right' : 'pi-chevron-down'"
                ></i>
              </button>
              <span v-if="group.isIdentifier" class="group-header-pin">📌</span>
              <i v-else class="pi pi-folder group-header-folder" style="font-size: 0.85rem;"></i>
              <span class="group-header-title" style="font-size: 0.88rem;">
                {{ cleanGroupTitle(group.title) }}
              </span>
              <span class="group-header-count" :class="{ 'all-selected': group.allSelected }" style="font-size: 0.74rem;">
                {{ group.selectedCount }}/{{ group.totalCount }}
              </span>
            </div>

            <div class="group-header-actions" @click.stop>
              <button
                v-if="!group.allSelected"
                type="button"
                class="btn-group-action"
                style="padding: 2px 8px; font-size: 0.72rem;"
                @click="toggleGroupSelection(group, true)"
              >
                Chọn hết
              </button>
              <button
                v-if="!group.noneSelected && !group.isIdentifier"
                type="button"
                class="btn-group-action btn-group-action-muted"
                style="padding: 2px 8px; font-size: 0.72rem;"
                @click="toggleGroupSelection(group, false)"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          <div v-show="!isGroupCollapsed(group.key)" class="column-group-body" style="padding: 6px 8px;">
            <div
              v-for="(col, colIdx) in group.columns"
              :key="'m_' + col.id"
              class="column-selector-item"
              :class="{
                'item-checked': modelValue.includes(col.id),
                'item-identifier': col.isSystemIdentifier || col.id === '_recordIdentifier',
              }"
              style="padding: 6px 12px;"
            >
              <label class="item-label-group">
                <input
                  type="checkbox"
                  :value="col.id"
                  :checked="modelValue.includes(col.id)"
                  @change="toggleCol(col.id)"
                  style="accent-color: #2e7d32; width: 17px; height: 17px; cursor: pointer; flex-shrink: 0;"
                />
                <span
                  v-if="col.isSystemIdentifier || col.id === '_recordIdentifier'"
                  style="font-size: 0.85rem; color: #d97706; flex-shrink: 0;"
                >
                  🔒
                </span>
                <span
                  class="col-type-badge"
                  style="width: 22px; height: 22px;"
                  :title="'Định dạng: ' + (col.format || 'text')"
                >
                  <i :class="getFormatIcon(col.format)" style="font-size: 0.75rem;"></i>
                </span>
                <span class="item-text" style="font-size: 0.88rem;" :title="col.label || col.id">
                  {{ col.label || col.id }}
                </span>
              </label>

              <div class="item-reorder-actions">
                <button
                  type="button"
                  class="btn-col-action-trigger"
                  @click.stop="copyColumnTag(col)"
                  :title="`Sao chép mã thẻ Word/PDF: {${col.id}}`"
                >
                  <i :class="copiedColId === col.id ? 'pi pi-check' : 'pi pi-copy'" style="font-size: 0.75rem;"></i>
                </button>
                <button
                  v-if="(col.id === '_parentPersonnelName' || !col.isVirtual) && col.id !== '_primaryKey' && col.id !== 'stt'"
                  type="button"
                  class="btn-col-action-trigger"
                  @click.stop="$emit('open-col-menu', { event: $event, col })"
                  title="Tùy chỉnh cột"
                >
                  <i class="pi pi-cog" style="font-size: 0.75rem;"></i>
                </button>
                <button
                  v-if="(!col.isVirtual || col.id === '_parentPersonnelName') && col.id !== '_primaryKey' && col.id !== 'stt' && col.id !== 'code' && col.id !== '_recordIdentifier'"
                  type="button"
                  class="btn-col-action-trigger"
                  @click.stop="$emit('duplicate-column', col)"
                  title="Nhân bản"
                >
                  <i class="pi pi-clone" style="font-size: 0.75rem; color: #10b981;"></i>
                </button>
                <button
                  type="button"
                  class="btn-reorder"
                  :disabled="colIdx === 0"
                  @click.stop="moveColUp(col, group)"
                >
                  <i class="pi pi-chevron-up"></i>
                </button>
                <button
                  type="button"
                  class="btn-reorder"
                  :disabled="colIdx === group.columns.length - 1"
                  @click.stop="moveColDown(col, group)"
                >
                  <i class="pi pi-chevron-down"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import Dialog from 'primevue/dialog';
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
  scopeName: {
    type: String,
    default: '',
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
const isModalOpen = ref(false);
const searchQuery = ref('');
const containerRef = ref(null);
const customOrder = ref([]);
const showColIndex = ref(localStorage.getItem('app_show_col_index') !== 'false');

const cleanGroupTitle = (title) => {
  if (!title) return 'Thông tin chung';
  return String(title).replace(/^📌\s*/, '').trim();
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
      title: 'Cột Định danh (Cố định)',
      isIdentifier: true,
      columns: [identifierCol],
    });
  }

  // 2. Các nhóm nghiệp vụ chuẩn theo cấu hình bảng
  filtered.forEach((c) => {
    if (c.id === '_recordIdentifier' || c.isSystemIdentifier) return;
    const gTitle = cleanGroupTitle(c.groupTitle);
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
  width: 460px;
  max-width: 95vw;
  max-height: calc(100vh - 110px);
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
  max-height: calc(100vh - 110px);
  box-shadow: none;
  border: none;
  border-radius: 0;
  z-index: auto;
}

/* Header tinh gọn */
.column-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.header-main-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

.header-scope-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: #0284c7;
  background: #f0f9ff;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid #bae6fd;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-stat-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
}

.btn-expand-modal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 5px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-expand-modal:hover {
  background: #f1f5f9;
  color: #0284c7;
  border-color: #38bdf8;
}

/* Quick Actions Toolbar & Width Pill */
.column-quick-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  gap: 8px;
}

.quick-links-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-text-link {
  background: transparent;
  border: none;
  color: #0284c7;
  font-size: 0.73rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.btn-text-link:hover {
  text-decoration: underline;
  color: #0369a1;
}

.divider-dot {
  color: #cbd5e1;
  font-size: 0.8rem;
}

/* Compact Width Mode Toolbar */
.width-compact-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.width-compact-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: #64748b;
}

.btn-width-pill {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #475569;
  font-size: 0.68rem;
  font-weight: 600;
  border-radius: 4px;
  padding: 1px 6px;
  cursor: pointer;
  height: 22px;
  line-height: 20px;
  transition: all 0.1s ease;
}

.btn-width-pill.active {
  background: #e0f2fe;
  color: #0284c7;
  border-color: #38bdf8;
  font-weight: 700;
}

.width-input-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  border-radius: 4px;
  padding: 0 4px;
  height: 22px;
  font-size: 0.68rem;
  color: #475569;
  cursor: pointer;
}

.width-input-pill.active {
  background: #e0f2fe;
  color: #0284c7;
  border-color: #38bdf8;
  font-weight: 700;
}

.width-compact-input {
  width: 44px;
  height: 18px;
  border: 1px solid #cbd5e1;
  border-radius: 3px;
  background: #ffffff;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: center;
  outline: none;
  color: #0f172a;
}

.width-compact-input:focus {
  border-color: #0284c7;
}

.px-label {
  font-size: 0.62rem;
  color: #64748b;
}

.btn-reset-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px dashed #cbd5e1;
  background: transparent;
  color: #64748b;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
}

.btn-reset-pill:hover {
  border-color: #0284c7;
  color: #0284c7;
  background: #f0f9ff;
}

/* Search Box */
.column-search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
}

.column-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.76rem;
  color: #1e293b;
  background: transparent;
}

/* List container (không ép chiều cao cụt ngủn) */
.column-selector-list {
  flex: 1;
  min-height: 220px;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 12px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 500;
  text-align: center;
}

/* Nhóm cột dạng phẳng, thoáng đãng */
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
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
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
  gap: 6px;
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
  font-size: 0.82rem;
  line-height: 1;
}

.group-header-folder {
  font-size: 0.76rem;
  color: #0284c7;
}

.group-header-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-header-count {
  font-size: 0.68rem;
  font-weight: 700;
  color: #64748b;
  background: #e2e8f0;
  padding: 1px 6px;
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
  gap: 5px;
  flex-shrink: 0;
  margin-left: 8px;
}

.btn-group-action {
  border: 1px solid #bae6fd;
  background: #f0f9ff;
  color: #0284c7;
  font-size: 0.68rem;
  font-weight: 600;
  border-radius: 4px;
  padding: 2px 7px;
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
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Item dòng cột */
.column-selector-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
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

.item-identifier {
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
}

.item-label-group {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.col-type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
  flex-shrink: 0;
}

.item-text {
  font-size: 0.82rem;
  color: #1e293b;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.item-reorder-actions {
  display: flex;
  align-items: center;
  gap: 3px;
  opacity: 0.7;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.column-selector-item:hover .item-reorder-actions {
  opacity: 1;
}

.btn-col-action-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.12s ease;
  padding: 0;
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
  width: 22px;
  height: 22px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #ffffff;
  color: #475569;
  font-size: 0.65rem;
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

/* Modal Dialog Toàn Màn Hình */
.modal-custom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.modal-icon-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #e0f2fe;
  border: 1px solid #bae6fd;
}

.btn-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.12s ease;
}

.btn-modal-close:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #ef4444;
}

.modal-toolbar-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.modal-columns-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #ffffff;
}
</style>
