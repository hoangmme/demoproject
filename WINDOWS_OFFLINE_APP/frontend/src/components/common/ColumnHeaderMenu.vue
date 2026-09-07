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

        <!-- 3. Độ rộng cột trên bảng -->
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

        <!-- 4. Độ rộng trong Form Chi tiết (%) -->
        <div class="menu-field">
          <label>Độ rộng trong Form Chi tiết (%):</label>
          <div style="display: flex; align-items: center; gap: 6px;">
            <select v-model="editFormWidth" class="menu-select" @change="handleSaveFormWidth">
              <option value="25">Rộng: 25% (1/4 dòng)</option>
              <option value="33">Rộng: 33% (1/3 dòng)</option>
              <option value="50">Rộng: 50% (1/2 dòng)</option>
              <option value="75">Rộng: 75% (3/4 dòng)</option>
              <option value="100">Rộng: 100% (Đầy đủ hàng)</option>
            </select>
          </div>
        </div>

        <!-- 5. Bắt buộc nhập dữ liệu (Required) -->
        <div class="menu-field" style="margin-top: 6px;">
          <label style="margin-bottom: 5px;">Quy tắc nhập liệu khi lưu:</label>
          <button
            type="button"
            class="btn-required-toggle"
            :class="{ 'is-required': editRequired }"
            @click="handleToggleRequired"
            title="Bắt buộc phải có dữ liệu trường này khi lưu"
          >
            <i :class="editRequired ? 'pi pi-check-square' : 'pi pi-stop'" style="font-size: 0.95rem;"></i>
            <span>★ Bắt buộc</span>
          </button>
        </div>

        <!-- 6. Cấu hình Cột ảo Thông tin Đối tượng / Cán bộ / Học sinh (nếu là _parentPersonnelName) -->
        <div v-if="column?.id === '_parentPersonnelName'" class="menu-field" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-top: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <label style="font-weight: 700; color: #1e293b; margin: 0;">Các trường hiển thị trong cột:</label>
            <span style="font-size: 0.7rem; color: #2563eb; font-weight: 700;">{{ selectedFieldCount }} trường</span>
          </div>
          <div style="font-size: 0.68rem; color: #64748b; margin-bottom: 8px; line-height: 1.35;">
            Linh hoạt theo mô hình (Cán bộ, Học sinh, Nhân sự...). Tick chọn các cột từ hồ sơ chính để hiển thị gộp vào cột này:
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px; max-height: 180px; overflow-y: auto; padding-right: 4px; border: 1px solid #f1f5f9; border-radius: 6px; padding: 6px; background: #ffffff;">
            <label
              v-for="opt in effectiveParentFieldOptions"
              :key="opt.key"
              style="display: flex; align-items: center; gap: 7px; font-size: 0.76rem; color: #334155; cursor: pointer; padding: 3px 6px; border-radius: 4px; user-select: none;"
              :style="nameColFields[opt.key] ? 'background: #eff6ff; font-weight: 600; color: #1d4ed8;' : ''"
            >
              <input
                type="checkbox"
                :checked="Boolean(nameColFields[opt.key])"
                @change="handleToggleParentField(opt.key)"
                style="accent-color: #2563eb; cursor: pointer; flex-shrink: 0;"
              />
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="opt.label">
                {{ opt.label }}
              </span>
            </label>
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

          <button
            v-if="!column?.isVirtual && column?.id !== '_primaryKey' && column?.id !== 'code' && column?.id !== 'stt'"
            type="button"
            class="menu-action-btn action-danger"
            @click="handleDeleteColumn"
            style="color: #ef4444;"
          >
            <i class="pi pi-trash" style="color: #ef4444;"></i>
            <span style="color: #ef4444; font-weight: 600;">Xóa cột này khỏi bảng</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

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
  nameColFields: {
    type: Object,
    default: () => ({ name: true, cccdCB: true, position: true, department: true }),
  },
  availableParentFields: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "update:visible",
  "rename-column",
  "change-format",
  "change-options",
  "change-width",
  "change-form-width",
  "change-required",
  "change-name-col-field",
  "delete-column",
  "hide-column",
  "filter-column",
]);

const editLabel = ref("");
const editFormat = ref("text");
const editOptions = ref("");
const editWidth = ref(160);
const editFormWidth = ref("50");
const editRequired = ref(false);

const defaultFallbackParentFields = [
  { key: 'name', label: 'Họ và tên' },
  { key: 'cccdCB', label: 'Số CCCD / Mã định danh' },
  { key: 'position', label: 'Chức vụ / Vị trí' },
  { key: 'department', label: 'Đơn vị / Phòng ban' },
];

const effectiveParentFieldOptions = computed(() => {
  if (Array.isArray(props.availableParentFields) && props.availableParentFields.length > 0) {
    return props.availableParentFields;
  }
  return defaultFallbackParentFields;
});

const selectedFieldCount = computed(() => {
  return effectiveParentFieldOptions.value.filter(opt => Boolean(props.nameColFields?.[opt.key])).length;
});

watch(
  () => props.column,
  (col) => {
    if (col) {
      editLabel.value = col.label || "";
      editFormat.value = col.format || "text";
      editOptions.value = col.options || "";
      editWidth.value = parseInt(col.tableWidth || col.width) || 160;
      editFormWidth.value = String(col.formWidth || col.width || "50").replace("%", "");
      editRequired.value = Boolean(col.required);
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

const handleSaveFormWidth = () => {
  emit("change-form-width", { colId: props.column.id, formWidth: editFormWidth.value });
};

const handleToggleRequired = () => {
  editRequired.value = !editRequired.value;
  emit("change-required", { colId: props.column.id, required: editRequired.value });
};

const handleToggleParentField = (key) => {
  emit("change-name-col-field", key);
};

const handleDeleteColumn = () => {
  if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn cột "${props.column?.label || props.column?.id}" khỏi bảng này không?`)) return;
  emit("delete-column", props.column.id);
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

.btn-required-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-required-toggle:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}

.btn-required-toggle.is-required {
  border-color: #dc2626;
  background: #fef2f2;
  color: #dc2626;
}
</style>
