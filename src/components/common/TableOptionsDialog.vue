<template>
  <Dialog
    :visible="modelValue"
    @update:visible="$emit('update:modelValue', $event)"
    modal
    :header="false"
    :style="{ width: '92vw', maxWidth: '1100px', height: '90vh', maxHeight: '94vh' }"
    :contentStyle="{ height: '100%', maxHeight: '100%', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }"
    class="table-options-dialog"
  >
    <!-- Custom Dialog Header -->
    <div class="options-header">
      <div class="header-left">
        <div
          class="header-icon-badge"
          :style="{
            borderColor: (localColor || '#0284c7') + '50',
            background: (localColor || '#0284c7') + '1a',
            color: localColor || '#0284c7',
          }"
        >
          <i :class="['pi', localIcon || 'pi-table']"></i>
        </div>
        <div>
          <div class="header-title-row">
            <h2 class="header-title">Tùy chọn & Cấu hình Bảng: {{ localTitle || tableTitle || 'Dữ liệu' }}</h2>
            <span class="header-stat-pill">
              {{ localGroups.length }} nhóm · {{ totalColsCount }} cột
            </span>
          </div>
          <p class="header-subtitle">
            Cấu hình tên bảng, biểu tượng, màu sắc nhận diện và gom nhóm cột. Áp dụng đồng bộ toàn hệ thống.
          </p>
        </div>
      </div>
      <div class="header-actions">
        <button type="button" class="header-close-btn" @click="$emit('update:modelValue', false)" title="Đóng">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>

    <!-- Identity Bar: Tên Bảng, Biểu tượng & Màu sắc -->
    <div class="options-identity-bar">
      <!-- Live Preview & Icon Trigger -->
      <div class="identity-item">
        <label class="identity-label">Biểu tượng bảng:</label>
        <button
          type="button"
          class="identity-icon-btn"
          :style="{
            borderColor: (localColor || '#0284c7') + '60',
            background: (localColor || '#0284c7') + '18',
            color: localColor || '#0284c7',
          }"
          @click="showIconPicker = !showIconPicker"
          title="Bấm để chọn Biểu tượng (Icon)"
        >
          <i :class="['pi', localIcon || 'pi-table']"></i>
          <span class="icon-label-inline">{{ getIconLabel(localIcon) }}</span>
          <i :class="showIconPicker ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" style="font-size: 0.65rem; margin-left: 2px;"></i>
        </button>
      </div>

      <!-- Tên Bảng -->
      <div class="identity-item" style="flex: 1; min-width: 220px;">
        <label class="identity-label">Tên Bảng hiển thị:</label>
        <InputText
          v-model="localTitle"
          placeholder="Nhập tên bảng dữ liệu..."
          class="identity-title-input"
        />
      </div>

      <!-- Màu sắc nhận diện -->
      <div class="identity-item">
        <label class="identity-label">Màu sắc nhận diện:</label>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div class="color-swatches-inline">
            <button
              v-for="color in PRESET_COLORS.slice(0, 8)"
              :key="color.hex"
              type="button"
              class="color-dot-btn"
              :class="{ active: (localColor || '').toLowerCase() === color.hex.toLowerCase() }"
              :style="{ background: color.hex }"
              :title="color.name"
              @click="localColor = color.hex"
            >
              <i v-if="(localColor || '').toLowerCase() === color.hex.toLowerCase()" class="pi pi-check" style="color: #fff; font-size: 0.55rem; font-weight: 800;"></i>
            </button>
          </div>
          <input
            type="color"
            v-model="localColor"
            class="color-picker-input"
            title="Chọn mã màu tùy biến"
          />
        </div>
      </div>
    </div>

    <!-- Icon Picker Panel (Hiển thị khi showIconPicker = true) -->
    <div v-if="showIconPicker" class="icon-picker-panel">
      <div class="icon-picker-header">
        <div style="font-size: 0.78rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 6px;">
          <i class="pi pi-palette" :style="{ color: localColor }"></i>
          <span>Chọn Biểu tượng (Icon) cho bảng:</span>
        </div>
        <div style="position: relative; width: 220px;">
          <i class="pi pi-search" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 0.72rem; color: #94a3b8;"></i>
          <input
            v-model="iconSearchQuery"
            placeholder="Tìm kiếm icon..."
            style="width: 100%; height: 28px; font-size: 0.75rem; padding: 2px 8px 2px 26px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;"
          />
        </div>
      </div>
      <div class="icon-picker-grid">
        <button
          v-for="item in filteredIcons"
          :key="item.icon"
          type="button"
          class="icon-grid-btn"
          :class="{ active: localIcon === item.icon }"
          :style="localIcon === item.icon ? { borderColor: localColor, color: localColor, background: localColor + '18' } : {}"
          :title="item.label"
          @click="localIcon = item.icon; showIconPicker = false;"
        >
          <i :class="['pi', item.icon]" style="font-size: 1.15rem;"></i>
          <span class="icon-btn-label">{{ item.label }}</span>
        </button>
      </div>
    </div>

    <!-- Toolbar: Search & Add Group -->
    <div class="options-toolbar">
      <div class="toolbar-search">
        <i class="pi pi-search search-icon"></i>
        <input
          v-model="searchColQuery"
          type="text"
          placeholder="Tìm cột theo tên hoặc mã trường..."
          class="search-input"
        />
        <button v-if="searchColQuery" type="button" class="clear-search-btn" @click="searchColQuery = ''">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <div class="toolbar-btns">
        <Button
          icon="pi pi-plus-circle"
          label="Thêm nhóm mới"
          severity="success"
          size="small"
          @click="addNewGroup"
          style="font-size: 0.8rem; font-weight: 600;"
        />
      </div>
    </div>

    <!-- Main Content: Groups List -->
    <div class="options-body">
      <div v-if="localGroups.length === 0" class="empty-state">
        <i class="pi pi-folder-open" style="font-size: 2.5rem; color: #94a3b8; margin-bottom: 8px;"></i>
        <div style="font-size: 0.95rem; font-weight: 600; color: #475569;">Chưa có nhóm cột nào</div>
        <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">Bấm nút "+ Thêm nhóm mới" để bắt đầu tổ chức cột.</div>
      </div>

      <div
        v-for="(group, gIdx) in filteredGroups"
        :key="group._tempId || gIdx"
        class="group-card"
        :class="{ collapsed: group.collapsed }"
      >
        <!-- Group Header -->
        <div class="group-header">
          <div class="group-header-left">
            <button
              type="button"
              class="collapse-toggle-btn"
              @click="group.collapsed = !group.collapsed"
              :title="group.collapsed ? 'Mở rộng nhóm' : 'Thu gọn nhóm'"
            >
              <i :class="group.collapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-down'"></i>
            </button>
            <i class="pi pi-folder group-folder-icon"></i>
            <input
              v-model="group.title"
              type="text"
              class="group-title-input"
              placeholder="Nhập tên nhóm cột..."
              title="Bấm để đổi tên nhóm"
            />
            <span class="group-count-badge">{{ (group.columns || []).length }} cột</span>
          </div>

          <div class="group-header-right">
            <!-- Move Group Up -->
            <button
              type="button"
              class="icon-action-btn"
              :disabled="gIdx === 0"
              @click="moveGroup(gIdx, -1)"
              title="Di chuyển nhóm lên trên"
            >
              <i class="pi pi-arrow-up"></i>
            </button>
            <!-- Move Group Down -->
            <button
              type="button"
              class="icon-action-btn"
              :disabled="gIdx === localGroups.length - 1"
              @click="moveGroup(gIdx, 1)"
              title="Di chuyển nhóm xuống dưới"
            >
              <i class="pi pi-arrow-down"></i>
            </button>
            <!-- Delete Group -->
            <button
              type="button"
              class="icon-action-btn delete"
              @click="removeGroup(gIdx)"
              title="Xóa nhóm này"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>

        <!-- Group Body: Columns Table -->
        <div v-show="!group.collapsed" class="group-columns-container">
          <div v-if="!group.columns || group.columns.length === 0" class="empty-col-msg">
            <i class="pi pi-info-circle"></i> Nhóm này hiện chưa có cột nào. Hãy chuyển cột từ nhóm khác sang hoặc tạo cột mới.
          </div>

          <table v-else class="options-col-table">
            <thead>
              <tr>
                <th style="width: 70px; text-align: center;">Thứ tự</th>
                <th style="min-width: 220px;">Tên cột / Field ID</th>
                <th style="width: 170px;">Chuyển nhóm</th>
                <th style="width: 130px; text-align: center;">Độ rộng Bảng</th>
                <th style="width: 130px; text-align: center;">Độ rộng Form</th>
                <th style="width: 100px; text-align: center;">Bắt buộc</th>
                <th style="width: 90px; text-align: center;">Hiển thị</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(col, cIdx) in group.columns"
                :key="col.id || cIdx"
                class="col-row"
                :class="{ 'is-hidden': col.hidden, 'is-required': col.required }"
              >
                <!-- 1. Thứ tự (Move up / down) -->
                <td style="text-align: center;">
                  <div class="order-controls">
                    <button
                      type="button"
                      class="mini-order-btn"
                      :disabled="cIdx === 0"
                      @click="moveColInGroup(group, cIdx, -1)"
                      title="Chuyển lên"
                    >
                      <i class="pi pi-chevron-up"></i>
                    </button>
                    <span class="order-num">#{{ cIdx + 1 }}</span>
                    <button
                      type="button"
                      class="mini-order-btn"
                      :disabled="cIdx === group.columns.length - 1"
                      @click="moveColInGroup(group, cIdx, 1)"
                      title="Chuyển xuống"
                    >
                      <i class="pi pi-chevron-down"></i>
                    </button>
                  </div>
                </td>

                <!-- 2. Tên cột / ID / Badge -->
                <td>
                  <div class="col-name-cell">
                    <div class="col-label-row">
                      <strong class="col-label-text">{{ col.label || col.id }}</strong>
                      <span v-if="col.required" class="required-star" title="Trường bắt buộc nhập">*</span>
                      <span v-if="col.format === 'formula'" class="col-type-badge formula">Công thức</span>
                      <span v-else-if="col.format === 'lookup'" class="col-type-badge lookup">Lookup</span>
                      <span v-else-if="col.isVirtual" class="col-type-badge virtual">Ảo</span>
                    </div>
                    <div class="col-id-text">
                      <code>{{ col.id }}</code>
                      <span v-if="col.format && col.format !== 'text'" class="format-tag">({{ col.format }})</span>
                    </div>
                  </div>
                </td>

                <!-- 3. Chuyển nhóm -->
                <td>
                  <select
                    class="move-group-select"
                    :value="group.title"
                    @change="handleMoveColToOtherGroup(col, group, $event.target.value)"
                    title="Chuyển cột sang nhóm khác"
                  >
                    <option v-for="targetGrp in localGroups" :key="targetGrp._tempId || targetGrp.title" :value="targetGrp.title">
                      {{ targetGrp.title }}
                    </option>
                  </select>
                </td>

                <!-- 4. Độ rộng Bảng (px) -->
                <td style="text-align: center;">
                  <div class="width-input-wrapper">
                    <input
                      v-model.number="col.tableWidth"
                      type="number"
                      min="60"
                      max="600"
                      step="10"
                      placeholder="Tự động"
                      class="mini-num-input"
                      title="Độ rộng hiển thị trên Bảng dữ liệu (px). Để trống = Tự động."
                    />
                    <span class="unit-text">px</span>
                  </div>
                </td>

                <!-- 5. Độ rộng Form -->
                <td style="text-align: center;">
                  <select v-model="col.width" class="form-width-select" title="Độ rộng hiển thị trên Form chỉnh sửa">
                    <option value="100%">100% (Cả hàng)</option>
                    <option value="50%">50% (Nửa hàng)</option>
                    <option value="33.33%">33% (1/3 hàng)</option>
                    <option value="25%">25% (1/4 hàng)</option>
                  </select>
                </td>

                <!-- 6. Bắt buộc nhập -->
                <td style="text-align: center;">
                  <label class="checkbox-label" title="Đánh dấu trường bắt buộc nhập">
                    <input
                      type="checkbox"
                      v-model="col.required"
                      class="custom-checkbox red-check"
                    />
                    <span class="check-text" :class="{ 'text-red': col.required }">
                      {{ col.required ? 'Bắt buộc' : 'Tùy chọn' }}
                    </span>
                  </label>
                </td>

                <!-- 7. Hiển thị / Ẩn -->
                <td style="text-align: center;">
                  <button
                    type="button"
                    class="visibility-toggle-btn"
                    :class="{ 'is-hidden': col.hidden }"
                    @click="col.hidden = !col.hidden"
                    :title="col.hidden ? 'Cột đang ẩn. Bấm để Hiện.' : 'Cột đang hiện. Bấm để Ẩn.'"
                  >
                    <i :class="col.hidden ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                    <span>{{ col.hidden ? 'Ẩn' : 'Hiện' }}</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Custom Footer -->
    <div class="options-footer">
      <div class="footer-left">
        <span class="footer-hint">
          💡 <strong>Mẹo:</strong> Thay đổi tại đây sẽ được lưu trực tiếp và áp dụng đồng nhất cho Bảng, Form chỉnh sửa và Xuất file PDF.
        </span>
      </div>
      <div class="footer-right">
        <Button
          label="Đóng"
          severity="secondary"
          text
          size="small"
          @click="$emit('update:modelValue', false)"
        />
        <Button
          label="Lưu cấu hình Bảng"
          icon="pi pi-check"
          severity="success"
          size="small"
          :loading="saving"
          @click="handleSave"
          style="font-weight: 700; padding: 6px 16px;"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { saveAppSettings } from '@/api/settings';
import { usePersonnelStore } from '@/stores/personnel';
import { PRESET_COLORS, AVAILABLE_ICONS, getIconLabel } from '@/utils/tableIcons';
import { ensureStandardDashboards, DEFAULT_UNIFIED_DASHBOARDS } from '@/utils/tableRegistry';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  tableId: {
    type: String,
    default: 'trips',
  },
  tableTitle: {
    type: String,
    default: '',
  },
  tableIcon: {
    type: String,
    default: '',
  },
  tableColor: {
    type: String,
    default: '',
  },
  groups: {
    type: Array,
    default: () => [],
  },
  customDashboards: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue', 'save']);

const personnelStore = usePersonnelStore();
const localTitle = ref('');
const localIcon = ref('pi-table');
const localColor = ref('#0284c7');
const showIconPicker = ref(false);
const iconSearchQuery = ref('');
const localGroups = ref([]);
const searchColQuery = ref('');
const saving = ref(false);

const filteredIcons = computed(() => {
  const q = iconSearchQuery.value.trim().toLowerCase();
  if (!q) return AVAILABLE_ICONS;
  return AVAILABLE_ICONS.filter((item) =>
    item.icon.toLowerCase().includes(q) ||
    item.label.toLowerCase().includes(q) ||
    item.keywords.toLowerCase().includes(q)
  );
});

const initIdentityAndGroups = () => {
  // 1. Tên Bảng
  if (props.tableTitle) {
    localTitle.value = props.tableTitle;
  } else if (props.tableId === 'trips') {
    localTitle.value = 'Chuyến đi';
  } else if (props.tableId === 'personnel') {
    localTitle.value = 'Cán bộ';
  } else if (props.tableId === 'relatives') {
    localTitle.value = 'Thân nhân';
  } else {
    const d = (props.customDashboards || []).find((x) => x.id === props.tableId);
    localTitle.value = d?.title || 'Bảng dữ liệu';
  }

  // 2. Biểu tượng (Icon)
  if (props.tableIcon) {
    localIcon.value = props.tableIcon;
  } else {
    const d = (props.customDashboards || []).find((x) => x.id === props.tableId);
    if (d?.icon) localIcon.value = d.icon;
    else if (props.tableId === 'trips') localIcon.value = 'pi-send';
    else if (props.tableId === 'personnel') localIcon.value = 'pi-users';
    else if (props.tableId === 'relatives') localIcon.value = 'pi-heart';
    else localIcon.value = 'pi-table';
  }

  // 3. Màu sắc nhận diện (Color)
  if (props.tableColor) {
    localColor.value = props.tableColor;
  } else {
    const d = (props.customDashboards || []).find((x) => x.id === props.tableId);
    if (d?.iconColor) localColor.value = d.iconColor;
    else if (props.tableId === 'trips') localColor.value = '#10b981';
    else if (props.tableId === 'personnel') localColor.value = '#0284c7';
    else if (props.tableId === 'relatives') localColor.value = '#a855f7';
    else localColor.value = '#0284c7';
  }

  // 4. Nhóm cột
  if (Array.isArray(props.groups) && props.groups.length > 0) {
    localGroups.value = JSON.parse(JSON.stringify(props.groups)).map((g, idx) => ({
      ...g,
      _tempId: 'grp_' + Date.now() + '_' + idx,
      collapsed: false,
      columns: Array.isArray(g.columns) ? g.columns : [],
    }));
  } else {
    let loaded = null;
    if (props.tableId === 'trips') loaded = personnelStore.importMappingTrips;
    else if (props.tableId === 'personnel') loaded = personnelStore.importMappingPersonnel;
    else if (props.tableId === 'relatives') loaded = personnelStore.importMappingRelative;
    else {
      try {
        const raw = localStorage.getItem('custom_table_groups_' + props.tableId);
        if (raw) loaded = JSON.parse(raw);
      } catch (e) {}
    }
    if (Array.isArray(loaded) && loaded.length > 0) {
      localGroups.value = JSON.parse(JSON.stringify(loaded)).map((g, idx) => ({
        ...g,
        _tempId: 'grp_' + Date.now() + '_' + idx,
        collapsed: false,
        columns: Array.isArray(g.columns) ? g.columns : [],
      }));
    } else {
      localGroups.value = [
        {
          _tempId: 'grp_' + Date.now() + '_0',
          title: 'Thông tin chung',
          collapsed: false,
          columns: [],
        },
      ];
    }
  }
};

watch(
  () => [props.modelValue, props.tableId, props.tableTitle, props.groups],
  ([isOpen]) => {
    if (isOpen) {
      initIdentityAndGroups();
      searchColQuery.value = '';
      showIconPicker.value = false;
      iconSearchQuery.value = '';
    }
  },
  { immediate: true, deep: true }
);

const totalColsCount = computed(() => {
  return localGroups.value.reduce((acc, g) => acc + (g.columns?.length || 0), 0);
});

const filteredGroups = computed(() => {
  const q = searchColQuery.value?.trim().toLowerCase();
  if (!q) return localGroups.value;

  return localGroups.value
    .map((g) => {
      const matchedCols = (g.columns || []).filter(
        (c) =>
          (c.label && c.label.toLowerCase().includes(q)) ||
          (c.id && c.id.toLowerCase().includes(q))
      );
      const groupNameMatched = g.title && g.title.toLowerCase().includes(q);
      if (groupNameMatched || matchedCols.length > 0) {
        return {
          ...g,
          collapsed: false,
          columns: groupNameMatched ? g.columns : matchedCols,
        };
      }
      return null;
    })
    .filter(Boolean);
});

const addNewGroup = () => {
  const newIdx = localGroups.value.length + 1;
  localGroups.value.push({
    _tempId: 'grp_' + Date.now() + '_' + newIdx,
    title: 'Nhóm ' + newIdx,
    collapsed: false,
    columns: [],
  });
};

const moveGroup = (fromIdx, dir) => {
  const toIdx = fromIdx + dir;
  if (toIdx < 0 || toIdx >= localGroups.value.length) return;
  const item = localGroups.value.splice(fromIdx, 1)[0];
  localGroups.value.splice(toIdx, 0, item);
};

const removeGroup = (gIdx) => {
  const grp = localGroups.value[gIdx];
  if (!grp) return;
  if (grp.columns && grp.columns.length > 0) {
    if (!confirm('Nhóm "' + grp.title + '" đang có ' + grp.columns.length + ' cột. Xóa nhóm này sẽ chuyển toàn bộ các cột sang nhóm đầu tiên. Bạn có chắc chắn không?')) {
      return;
    }
    const targetIdx = gIdx === 0 ? 1 : 0;
    if (localGroups.value[targetIdx]) {
      localGroups.value[targetIdx].columns.push(...grp.columns);
    }
  }
  localGroups.value.splice(gIdx, 1);
  if (localGroups.value.length === 0) {
    addNewGroup();
  }
};

const moveColInGroup = (group, fromIdx, dir) => {
  const toIdx = fromIdx + dir;
  if (!group || !Array.isArray(group.columns)) return;
  if (toIdx < 0 || toIdx >= group.columns.length) return;
  const col = group.columns.splice(fromIdx, 1)[0];
  group.columns.splice(toIdx, 0, col);
};

const handleMoveColToOtherGroup = (col, sourceGroup, targetGroupTitle) => {
  if (!targetGroupTitle || sourceGroup.title === targetGroupTitle) return;
  const targetGroup = localGroups.value.find((g) => g.title === targetGroupTitle);
  if (!targetGroup) return;

  const sIdx = sourceGroup.columns.findIndex((c) => c.id === col.id);
  if (sIdx >= 0) {
    const [movedCol] = sourceGroup.columns.splice(sIdx, 1);
    if (!Array.isArray(targetGroup.columns)) targetGroup.columns = [];
    targetGroup.columns.push(movedCol);
  }
};

const handleSave = async () => {
  saving.value = true;
  try {
    const cleanedGroups = localGroups.value.map((g) => {
      const cleanG = { ...g };
      delete cleanG._tempId;
      delete cleanG.collapsed;
      cleanG.columns = (cleanG.columns || []).map((c) => ({
        ...c,
        tableWidth: c.tableWidth ? Number(c.tableWidth) : null,
        width: c.width || '100%',
        required: Boolean(c.required),
        hidden: Boolean(c.hidden),
      }));
      return cleanG;
    });

    const src = props.tableId || 'trips';
    const newTitle = (localTitle.value || '').trim() || props.tableTitle || 'Bảng dữ liệu';
    const newIcon = localIcon.value || 'pi-table';
    const newColor = localColor.value || '#0284c7';

    // 1. Lưu cấu hình nhóm cột
    if (src === 'trips') {
      personnelStore.importMappingTrips = cleanedGroups;
      const keys = ['mapping_config_trips', 'import_mapping_trips', 'importMappingTrips'];
      keys.forEach((k) => {
        try { localStorage.setItem(k, JSON.stringify(cleanedGroups)); } catch (e) {}
        saveAppSettings(k, cleanedGroups).catch(() => {});
      });
    } else if (src === 'personnel') {
      personnelStore.importMappingPersonnel = cleanedGroups;
      const keys = ['mapping_config_personnel', 'import_mapping_personnel', 'importMappingPersonnel'];
      keys.forEach((k) => {
        try { localStorage.setItem(k, JSON.stringify(cleanedGroups)); } catch (e) {}
        saveAppSettings(k, cleanedGroups).catch(() => {});
      });
    } else if (src === 'relatives') {
      personnelStore.importMappingRelative = cleanedGroups;
      const keys = ['mapping_config_relative', 'import_mapping_relative', 'importMappingRelative'];
      keys.forEach((k) => {
        try { localStorage.setItem(k, JSON.stringify(cleanedGroups)); } catch (e) {}
        saveAppSettings(k, cleanedGroups).catch(() => {});
      });
    } else {
      // Custom tables
      try {
        localStorage.setItem('custom_table_groups_' + src, JSON.stringify(cleanedGroups));
        await saveAppSettings('custom_table_groups_' + src, cleanedGroups);
      } catch (e) {}
    }

    // 2. Lưu Tên bảng vào branding nếu là bảng mặc định
    if (src === 'personnel' || src === 'relatives' || src === 'trips') {
      try {
        const rawBranding = localStorage.getItem('system_branding_config');
        const branding = rawBranding ? JSON.parse(rawBranding) : {};
        if (src === 'personnel') branding.menuLabelPersonnel = newTitle;
        if (src === 'relatives') branding.menuLabelRelatives = newTitle;
        if (src === 'trips') branding.menuLabelTrips = newTitle;
        localStorage.setItem('system_branding_config', JSON.stringify(branding));
        await saveAppSettings('system_branding_config', branding);
        window.dispatchEvent(new CustomEvent('system-branding-updated', { detail: branding }));
      } catch (e) {}
    }

    // 3. Đồng bộ Tên bảng, Icon & Màu sắc vào custom_dashboards_config
    try {
      const local = localStorage.getItem('custom_dashboards_config');
      let list = local ? JSON.parse(local) : [...DEFAULT_UNIFIED_DASHBOARDS];
      list = ensureStandardDashboards(list);

      const idx = list.findIndex((d) => d.id === src);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          title: newTitle,
          icon: newIcon,
          iconColor: newColor,
        };
      } else {
        list.push({
          id: src,
          title: newTitle,
          icon: newIcon,
          iconColor: newColor,
        });
      }
      localStorage.setItem('custom_dashboards_config', JSON.stringify(list));
      await saveAppSettings('custom_dashboards_config', list);
      window.dispatchEvent(new CustomEvent('custom-dashboards-updated', { detail: list }));
    } catch (e) {}

    emit('save', {
      groups: cleanedGroups,
      tableId: src,
      title: newTitle,
      icon: newIcon,
      iconColor: newColor,
    });
    emit('update:modelValue', false);
  } catch (err) {
    console.error('Save table options error:', err);
    alert('Lỗi lưu cấu hình: ' + (err.message || err));
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
:deep(.p-dialog-content) {
  height: 100% !important;
  max-height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  padding: 0 !important;
}

.options-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

/* Identity Bar: Tên, Biểu tượng & Màu sắc */
.options-identity-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.identity-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.identity-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.identity-icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border: 1.5px solid;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.8rem;
  transition: all 0.15s ease;
}

.identity-icon-btn:hover {
  filter: brightness(0.95);
  transform: translateY(-1px);
}

.icon-label-inline {
  font-size: 0.78rem;
  color: #1e293b;
}

.color-swatches-inline {
  display: flex;
  align-items: center;
  gap: 5px;
}

.color-dot-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, border-color 0.15s ease;
  padding: 0;
}

.color-dot-btn:hover {
  transform: scale(1.15);
}

.color-dot-btn.active {
  border-color: #0f172a;
  transform: scale(1.15);
}

.color-picker-input {
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

/* Icon Picker Dropdown Panel */
.icon-picker-panel {
  flex-shrink: 0;
  padding: 12px 20px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03);
}

.icon-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.icon-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 6px;
  max-height: 160px;
  overflow-y: auto;
  padding: 4px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.icon-grid-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  color: #334155;
  transition: all 0.15s ease;
  text-align: left;
}

.icon-grid-btn:hover {
  border-color: #0284c7;
  color: #0284c7;
  background: #f0f9ff;
}

.icon-grid-btn.active {
  font-weight: 700;
  border-width: 1.5px;
}

.icon-btn-label {
  font-size: 0.72rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-icon-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.25);
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.header-stat-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #4338ca;
  background: #e0e7ff;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid #c7d2fe;
}

.header-subtitle {
  margin: 2px 0 0 0;
  font-size: 0.76rem;
  color: #64748b;
  line-height: 1.4;
}

.header-close-btn {
  background: transparent;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.15s ease;
}

.header-close-btn:hover {
  background: #fee2e2;
  color: #ef4444;
  border-color: #fca5a5;
}

.options-toolbar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  gap: 12px;
}

.toolbar-search {
  position: relative;
  width: 360px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.85rem;
}

.search-input {
  width: 100%;
  height: 34px;
  padding: 4px 30px 4px 32px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.82rem;
  outline: none;
  background: #f8fafc;
  transition: all 0.15s ease;
}

.search-input:focus {
  border-color: #6366f1;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 0.75rem;
}

.options-body {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 20px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.group-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.15s ease;
}

.group-card:hover {
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.group-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.collapse-toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  font-size: 0.8rem;
  padding: 4px;
}

.group-folder-icon {
  color: #eab308;
  font-size: 1.1rem;
}

.group-title-input {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 3px 8px;
  width: 320px;
  transition: all 0.15s;
}

.group-title-input:hover {
  border-color: #cbd5e1;
  background: #ffffff;
}

.group-title-input:focus {
  border-color: #6366f1;
  background: #ffffff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.group-count-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #475569;
  background: #e2e8f0;
  padding: 2px 7px;
  border-radius: 9999px;
}

.group-header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.15s;
}

.icon-action-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #0f172a;
}

.icon-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon-action-btn.delete:hover:not(:disabled) {
  background: #fee2e2;
  color: #ef4444;
  border-color: #fca5a5;
}

.group-columns-container {
  padding: 4px;
}

.empty-col-msg {
  padding: 16px;
  text-align: center;
  font-size: 0.8rem;
  color: #94a3b8;
  background: #fafafa;
}

.options-col-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.options-col-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  padding: 8px 10px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.options-col-table td {
  padding: 7px 10px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.col-row:hover {
  background: #f8fafc;
}

.col-row.is-hidden {
  opacity: 0.55;
  background: #fefce8;
}

.order-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.mini-order-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.65rem;
  color: #475569;
}

.mini-order-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #0f172a;
}

.mini-order-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.order-num {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  min-width: 22px;
  text-align: center;
}

.col-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.col-label-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.col-label-text {
  color: #1e293b;
  font-size: 0.85rem;
}

.required-star {
  color: #ef4444;
  font-weight: 800;
  font-size: 0.95rem;
}

.col-type-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  text-transform: uppercase;
}

.col-type-badge.formula {
  background: #fef3c7;
  color: #b45309;
}

.col-type-badge.lookup {
  background: #f3e8ff;
  color: #7e22ce;
}

.col-type-badge.virtual {
  background: #e0f2fe;
  color: #0369a1;
}

.col-id-text {
  font-size: 0.7rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.col-id-text code {
  background: #f1f5f9;
  padding: 1px 4px;
  border-radius: 3px;
  color: #475569;
}

.move-group-select {
  width: 100%;
  height: 28px;
  font-size: 0.76rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 6px;
  background: #ffffff;
  color: #334155;
  outline: none;
}

.move-group-select:focus {
  border-color: #6366f1;
}

.width-input-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.mini-num-input {
  width: 65px;
  height: 26px;
  font-size: 0.75rem;
  text-align: center;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px;
  outline: none;
}

.mini-num-input:focus {
  border-color: #6366f1;
}

.unit-text {
  font-size: 0.7rem;
  color: #94a3b8;
}

.form-width-select {
  width: 100%;
  height: 26px;
  font-size: 0.74rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 1px 4px;
  background: #ffffff;
  outline: none;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  user-select: none;
}

.custom-checkbox {
  cursor: pointer;
  accent-color: #ef4444;
}

.check-text {
  font-size: 0.74rem;
  font-weight: 600;
  color: #64748b;
}

.check-text.text-red {
  color: #dc2626;
}

.visibility-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 9999px;
  border: 1px solid #cbd5e1;
  background: #f0fdf4;
  color: #16a34a;
  cursor: pointer;
  transition: all 0.15s;
}

.visibility-toggle-btn:hover {
  background: #dcfce7;
}

.visibility-toggle-btn.is-hidden {
  background: #f1f5f9;
  color: #94a3b8;
  border-color: #e2e8f0;
}

.visibility-toggle-btn.is-hidden:hover {
  background: #e2e8f0;
  color: #475569;
}

.options-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
}

.footer-hint {
  font-size: 0.74rem;
  color: #64748b;
}

.footer-right {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
