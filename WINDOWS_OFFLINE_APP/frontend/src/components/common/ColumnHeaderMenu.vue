<template>
  <div v-if="visible" class="column-header-menu-backdrop" @click="closeMenu">
    <div
      class="column-header-menu-popover"
      :style="{ top: `${position.y}px`, left: `${position.x}px` }"
      @click.stop
    >
      <!-- Header Menu -->
      <div class="menu-header">
        <div class="menu-header-title">
          <i class="pi pi-cog" style="color: #0284c7; font-size: 0.85rem;"></i>
          <span>Tùy chỉnh Cột: <strong>{{ column?.label || column?.id }}</strong></span>
        </div>
        <button type="button" class="btn-close" @click="closeMenu">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Content / Form Quick Edit -->
      <div class="menu-body">
        <!-- 1. Đổi tên cột -->
        <div class="menu-field">
          <label>Tên hiển thị cột:</label>
          <div style="display: flex; gap: 4px;">
            <input
              v-model="editLabel"
              class="menu-input"
              placeholder="Nhập tên cột..."
              @keyup.enter="handleSaveRename"
            />
            <button
              type="button"
              class="btn-save-mini"
              :disabled="!editLabel.trim() || editLabel === column?.label"
              @click="handleSaveRename"
              title="Lưu đổi tên"
            >
              <i class="pi pi-check"></i>
            </button>
          </div>
        </div>

        <!-- 2. Đổi kiểu dữ liệu (Format) -->
        <div class="menu-field">
          <label>Kiểu dữ liệu:</label>
          <select v-model="editFormat" class="menu-select" @change="handleFormatChange">
            <option value="text">Văn bản (Text)</option>
            <option value="number">Số (Number)</option>
            <option value="date">Ngày tháng (Date)</option>
            <option value="dropdown">Danh mục lựa chọn (Single Select)</option>
            <option value="checkbox">Hộp kiểm đơn (Checkbox)</option>
            <option value="checkbox_file">Hộp kiểm kèm Tệp (Checkbox + File)</option>
            <option value="file">Tệp đính kèm (Attachment)</option>
          </select>
        </div>

        <!-- Tùy chọn Options nếu là dropdown -->
        <div v-if="editFormat === 'dropdown' || editFormat === 'checkbox'" class="menu-field">
          <label>Danh sách tùy chọn (cách nhau bởi dấu phẩy):</label>
          <input
            v-model="editOptions"
            class="menu-input"
            placeholder="VD: Lựa chọn 1, Lựa chọn 2, Lựa chọn 3"
            @blur="handleSaveOptions"
          />
        </div>

        <!-- 3. Độ rộng cột -->
        <div class="menu-field">
          <label>Độ rộng hiển thị (px):</label>
          <div style="display: flex; align-items: center; gap: 6px;">
            <input
              v-model.number="editWidth"
              type="number"
              min="80"
              max="600"
              step="10"
              class="menu-input"
              style="width: 90px; text-align: center;"
            />
            <button type="button" class="btn-save-mini" @click="handleSaveWidth">
              Đặt
            </button>
          </div>
        </div>

        <div class="menu-divider"></div>

        <!-- Actions -->
        <div class="menu-actions">
          <button type="button" class="menu-action-btn" @click="handleFilterByCol">
            <i class="pi pi-filter" style="color: #0284c7;"></i>
            <span>Lọc theo cột này</span>
          </button>

          <button type="button" class="menu-action-btn" @click="handleHideColumn">
            <i class="pi pi-eye-slash" style="color: #f59e0b;"></i>
            <span>Ẩn cột này</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  column: {
    type: Object,
    default: null,
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
});

const emit = defineEmits([
  "update:visible",
  "rename-column",
  "change-format",
  "change-options",
  "change-width",
  "hide-column",
  "filter-column",
]);

const editLabel = ref("");
const editFormat = ref("text");
const editOptions = ref("");
const editWidth = ref(160);

watch(
  () => props.column,
  (col) => {
    if (col) {
      editLabel.value = col.label || "";
      editFormat.value = col.format || "text";
      editOptions.value = col.options || "";
      editWidth.value = parseInt(col.tableWidth || col.width) || 160;
    }
  },
  { immediate: true }
);

const closeMenu = () => {
  emit("update:visible", false);
};

const handleSaveRename = () => {
  if (!editLabel.value.trim()) return;
  emit("rename-column", { colId: props.column.id, newLabel: editLabel.value.trim() });
  closeMenu();
};

const handleFormatChange = () => {
  emit("change-format", { colId: props.column.id, newFormat: editFormat.value });
};

const handleSaveOptions = () => {
  emit("change-options", { colId: props.column.id, options: editOptions.value.trim() });
};

const handleSaveWidth = () => {
  emit("change-width", { colId: props.column.id, width: editWidth.value });
  closeMenu();
};

const handleHideColumn = () => {
  emit("hide-column", props.column.id);
  closeMenu();
};

const handleFilterByCol = () => {
  emit("filter-column", props.column);
  closeMenu();
};
</script>

<style scoped>
.column-header-menu-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: transparent;
}

.column-header-menu-popover {
  position: absolute;
  width: 280px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  animation: fadeIn 0.12s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.menu-header-title {
  font-size: 0.78rem;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}
.btn-close:hover {
  color: #ef4444;
}

.menu-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.menu-field label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
}

.menu-input {
  width: 100%;
  height: 28px;
  font-size: 0.75rem;
  padding: 2px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  outline: none;
}
.menu-input:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 1px #0284c7;
}

.menu-select {
  width: 100%;
  height: 28px;
  font-size: 0.75rem;
  padding: 2px 6px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #fff;
  outline: none;
}

.btn-save-mini {
  background: #0284c7;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0 8px;
  height: 28px;
  cursor: pointer;
  font-size: 0.72rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-save-mini:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.menu-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 4px 0;
}

.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  color: #334155;
  text-align: left;
  transition: background 0.15s ease;
}
.menu-action-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}
</style>
