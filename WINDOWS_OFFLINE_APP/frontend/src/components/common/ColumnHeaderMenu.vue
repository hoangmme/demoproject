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
          <div v-if="column?.id === '_primaryKey'" style="font-size: 0.73rem; color: #64748b; padding: 6px 8px; background: #f1f5f9; border-radius: 6px; font-weight: 600;">
            Mã định danh (ID Hệ thống)
          </div>
          <select v-else v-model="editFormat" class="menu-select" @change="handleFormatChange">
            <option value="text">Văn bản (Text) - Mặc định</option>
            <option value="number">Số (Number)</option>
            <option value="date">Ngày tháng (Date)</option>
            <option value="dropdown">Danh mục lựa chọn (Dropdown / Single Select)</option>
            <option value="checkbox">Hộp kiểm đơn (Checkbox)</option>
            <option value="checkbox_file_loop">Hộp kiểm kèm Tệp (Checkbox + File)</option>
            <option value="file">Tệp đính kèm (Attachment / File / Ảnh / PDF)</option>
            <option value="lookup">🔗 Tham chiếu tự động (Lookup - Lấy dữ liệu từ bảng liên kết)</option>
            <option value="formula">⚡ Công thức tính toán (Formula)</option>
            <option value="rollup">📊 Tính toán tổng hợp (Rollup)</option>
          </select>
        </div>

        <!-- Cấu hình Tham chiếu Lookup nếu là lookup (Lark Base Style) -->
        <div v-if="editFormat === 'lookup'" class="menu-field" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px; margin-top: 6px;">
          <div style="font-size: 0.76rem; font-weight: 700; color: #1d4ed8; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <i class="pi pi-link"></i>
              <span>Cấu hình Tham chiếu (Lookup)</span>
            </div>
            <span style="font-size: 0.65rem; background: #dbeafe; color: #1e40af; padding: 1px 6px; border-radius: 4px; font-weight: 600;">Lark Base</span>
          </div>

          <!-- 1. Look up data in this field: Chọn bảng đích & cột lấy dữ liệu -->
          <div style="margin-bottom: 8px;">
            <label style="font-size: 0.7rem; color: #1e3a8a; font-weight: 700; display: block; margin-bottom: 3px;">
              Lấy dữ liệu từ bảng (Look up data in this field):
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <select v-model="editLookupTarget" class="menu-select" @change="editLookupField = ''; handleSaveLookup()">
                <option value="personnel">Bảng Cán bộ</option>
                <option value="relatives">Bảng Thân nhân</option>
                <option value="trips">Bảng Chuyến đi</option>
              </select>
              <select v-model="editLookupField" class="menu-select" @change="handleSaveLookup">
                <option value="">-- Chọn cột lấy --</option>
                <option v-for="c in targetLookupCols" :key="c.id" :value="c.id">
                  {{ c.label }} ({{ c.id }})
                </option>
              </select>
            </div>
          </div>

          <!-- 2. Reference data if: Điều kiện tham chiếu đa tầng -->
          <div style="margin-bottom: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 0.7rem; color: #1e293b; font-weight: 700;">
                Tham chiếu khi (Reference data if):
              </span>
              <!-- Logic Operator (AND / OR) -->
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 0.66rem; color: #64748b;">Khớp:</span>
                <select
                  v-model="editLookupLogicOp"
                  class="menu-select"
                  style="width: 76px; height: 22px; font-size: 0.68rem; padding: 0 4px; font-weight: 700; color: #0369a1; background: #f0f9ff;"
                  @change="handleSaveLookup"
                >
                  <option value="AND">AND (Tất cả)</option>
                  <option value="OR">OR (Bất kỳ)</option>
                </select>
              </div>
            </div>

            <!-- Danh sách từng điều kiện -->
            <div v-if="editLookupConditions && editLookupConditions.length > 0" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px;">
              <div
                v-for="(cond, cIdx) in editLookupConditions"
                :key="cIdx"
                style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px;"
              >
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 0.66rem; font-weight: 700; color: #475569;">
                    ĐK {{ cIdx + 1 }}:
                  </span>
                  <button
                    type="button"
                    @click="removeLookupCondition(cIdx)"
                    style="border: none; background: transparent; color: #ef4444; cursor: pointer; font-size: 0.72rem; padding: 0 4px;"
                    title="Xóa điều kiện này"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <!-- Bảng đích Field -->
                  <select v-model="cond.targetField" class="menu-select" style="font-size: 0.7rem; height: 26px; padding: 0 4px;" @change="handleSaveLookup">
                    <option value="">-- Cột bảng đích --</option>
                    <option v-for="c in targetLookupCols" :key="c.id" :value="c.id">
                      {{ c.label }} ({{ c.id }})
                    </option>
                  </select>

                  <div style="display: grid; grid-template-columns: 110px 1fr; gap: 4px; align-items: center;">
                    <!-- Toán tử (Operator) -->
                    <select v-model="cond.operator" class="menu-select" style="font-size: 0.68rem; height: 26px; padding: 0 2px;" @change="handleSaveLookup">
                      <option v-for="op in lookupOperators" :key="op.value" :value="op.value">
                        {{ op.label }}
                      </option>
                    </select>

                    <!-- Cột bảng hiện tại (Field in current table) -->
                    <select
                      v-if="cond.operator !== 'is_empty' && cond.operator !== 'is_not_empty'"
                      v-model="cond.sourceField"
                      class="menu-select"
                      style="font-size: 0.7rem; height: 26px; padding: 0 4px;"
                      @change="handleSaveLookup"
                    >
                      <option value="">-- Cột bảng này --</option>
                      <option v-for="c in currentTableCols" :key="c.id" :value="c.id">
                        {{ c.label }} ({{ c.id }})
                      </option>
                    </select>
                    <span v-else style="font-size: 0.65rem; color: #94a3b8; font-style: italic; text-align: center;">
                      (Không cần cột so sánh)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Khi chưa có điều kiện nào: Nút thêm -->
            <div v-else style="font-size: 0.68rem; color: #64748b; font-style: italic; margin-bottom: 6px;">
              Chưa có điều kiện nào. Dữ liệu sẽ dùng Khóa liên kết mặc định của bảng.
            </div>

            <button
              type="button"
              @click="addLookupCondition"
              style="width: 100%; border: 1px dashed #3b82f6; background: #f0fdf4; color: #1d4ed8; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; font-weight: 600;"
            >
              <i class="pi pi-plus" style="font-size: 0.68rem;"></i>
              <span>+ Thêm điều kiện (Add Condition)</span>
            </button>
          </div>

          <!-- 3. Display data as & Field format -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>
              <label style="font-size: 0.68rem; color: #1e3a8a; font-weight: 600; display: block; margin-bottom: 2px;">
                Hiển thị dữ liệu (Display as):
              </label>
              <select v-model="editLookupDisplay" class="menu-select" style="font-size: 0.7rem;" @change="handleSaveLookup">
                <option value="value">Giá trị (Khớp đầu tiên)</option>
                <option value="join">Gộp tất cả (, )</option>
                <option value="count">Đếm số lượng</option>
                <option value="array">Nhiều dòng</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.68rem; color: #1e3a8a; font-weight: 600; display: block; margin-bottom: 2px;">
                Định dạng (Field format):
              </label>
              <select v-model="editLookupFormat" class="menu-select" style="font-size: 0.7rem;" @change="handleSaveLookup">
                <option value="default">Mặc định</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Cấu hình Công thức nếu là formula -->
        <div v-if="editFormat === 'formula'" class="menu-field" style="background: #fdf4ff; border: 1px solid #f0abfc; border-radius: 8px; padding: 10px; margin-top: 6px;">
          <div style="font-size: 0.76rem; font-weight: 700; color: #86198f; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
            <i class="pi pi-bolt"></i>
            <span>Cấu hình Công thức (Formula)</span>
          </div>
          <div>
            <label style="font-size: 0.7rem; color: #701a75; font-weight: 600; margin-bottom: 2px;">Loại công thức:</label>
            <select v-model="editFormulaType" class="menu-select" @change="handleSaveFormulaType">
              <option value="presence_status">Trạng thái Hiện diện (Trong nước / Nước ngoài)</option>
              <option value="overdue_status">Quá hạn chưa về (So sánh Ngày về với Deadline/Hôm nay)</option>
              <option value="date_delta">So sánh 2 cột ngày (Sớm / Muộn / Đúng lịch)</option>
              <option value="conditional_check">Kiểm tra điều kiện (Cảnh báo khi thiếu dữ liệu)</option>
              <option value="depart_before_decision">Đi khi chưa có cấp thẩm quyền quyết định</option>
              <option value="trips_count_in_year">Số lần xuất cảnh trong năm</option>
            </select>
          </div>
        </div>

        <!-- Tùy chọn Options nếu là dropdown -->
        <div v-if="editFormat === 'dropdown' || editFormat === 'checkbox' || editFormat === 'checkbox_file_loop'" class="menu-field">
          <label>Danh sách tùy chọn (cách nhau bởi dấu phẩy):</label>
          <input
            v-model="editOptions"
            class="menu-input"
            placeholder="VD: Lựa chọn 1, Lựa chọn 2, Lựa chọn 3"
            @blur="handleSaveOptions"
          />
        </div>

        <!-- 4. Độ rộng trong Form Chi tiết (%) -->
        <div class="menu-field">
          <label>Độ rộng trong Form Chi tiết (%):</label>
          <div style="display: flex; align-items: center; gap: 6px;">
            <select v-model="editFormWidth" class="menu-select" @change="handleSaveFormWidth">
              <option v-for="opt in formWidthOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
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

        <!-- 5b. Đặt làm Khóa chính / Khóa liên kết của bảng -->
        <div class="menu-field" style="margin-top: 6px; background: #fafafa; border: 1px solid #f1f5f9; border-radius: 6px; padding: 8px;">
          <label style="margin-bottom: 5px;">Khóa Định danh & Liên kết Bảng:</label>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <!-- Nút Khóa chính (Primary Unique Key) -->
            <button
              type="button"
              class="btn-primary-key-toggle"
              :class="{ 'is-primary-key': isCurrentPrimaryKey }"
              @click="handleSetPrimaryKey"
              :title="isCurrentPrimaryKey ? 'Cột này đang là Khóa chính (Primary Key) của bảng' : 'Đặt cột này làm Khóa chính của bảng'"
            >
              <i class="pi pi-key" style="font-size: 0.92rem;"></i>
              <span>{{ isCurrentPrimaryKey ? '🔑 Khóa chính (Đang áp dụng)' : '🔑 Đặt làm Khóa chính' }}</span>
            </button>

            <!-- Nút Khóa liên kết (nếu ở bảng Thân nhân hoặc Chuyến đi) -->
            <button
              v-if="tableSource === 'relatives' || tableSource === 'trips'"
              type="button"
              class="btn-primary-key-toggle"
              :class="{ 'is-primary-key': isCurrentLinkKey }"
              @click="handleSetLinkKey"
              :title="isCurrentLinkKey ? 'Cột này đang là Khóa liên kết của bảng' : 'Đặt cột này làm Khóa liên kết của bảng'"
            >
              <i class="pi pi-link" style="font-size: 0.92rem;"></i>
              <span>{{ isCurrentLinkKey ? '🔗 Khóa liên kết (Đang áp dụng)' : '🔗 Đặt làm Khóa liên kết' }}</span>
            </button>

            <!-- Nút mở Hộp thoại Toàn diện -->
            <button
              type="button"
              class="btn-open-all-keys"
              @click="$emit('open-key-config'); closeMenu();"
              style="display: flex; align-items: center; justify-content: center; gap: 5px; width: 100%; padding: 5px 8px; border: 1px dashed #cbd5e1; border-radius: 4px; background: #ffffff; font-size: 0.72rem; color: #475569; cursor: pointer;"
            >
              <i class="pi pi-sliders-h" style="font-size: 0.75rem; color: #2563eb;"></i>
              <span>Cấu hình Khóa & Liên kết Bảng...</span>
            </button>
          </div>
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

        <!-- Chèn cột & Nhân bản (Lark Base style) -->
        <div class="menu-actions" style="margin-bottom: 6px;">
          <button
            v-if="column?.id !== '_primaryKey'"
            type="button"
            class="menu-action-btn"
            @click="handleInsertLeft"
          >
            <i class="pi pi-arrow-left" style="color: #0284c7;"></i>
            <span>← Chèn cột bên trái (Insert Left)</span>
          </button>

          <button type="button" class="menu-action-btn" @click="handleInsertRight">
            <i class="pi pi-arrow-right" style="color: #0284c7;"></i>
            <span>→ Chèn cột bên phải (Insert Right)</span>
          </button>

          <button type="button" class="menu-action-btn" @click="handleDuplicate">
            <i class="pi pi-clone" style="color: #10b981;"></i>
            <span>⧉ Nhân bản cột (Duplicate Column)</span>
          </button>
        </div>

        <div class="menu-divider"></div>

        <!-- Actions -->
        <div class="menu-actions">
          <button type="button" class="menu-action-btn" @click="handleCopyColumnTag">
            <i :class="copiedTag ? 'pi pi-check' : 'pi pi-copy'" :style="{ color: copiedTag ? '#16a34a' : '#0284c7' }"></i>
            <span>{{ copiedTag ? '✓ Đã sao chép mã {' + column?.id + '}' : 'Sao chép mã thẻ Word: {' + column?.id + '}' }}</span>
          </button>

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
import { usePersonnelStore } from "@/stores/personnel";
import { saveAppSettings } from "@/api/settings";
import { formWidthOptions, lookupOperators } from "@/utils/formatters";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  column: {
    type: Object,
    default: null,
  },
  tableSource: {
    type: String,
    default: "personnel", // 'personnel' | 'relatives' | 'trips'
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
  isFirstColumn: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "update:visible",
  "rename-column",
  "change-format",
  "change-formula-type",
  "change-options",
  "change-form-width",
  "change-required",
  "change-lookup",
  "change-name-col-field",
  "delete-column",
  "hide-column",
  "filter-column",
  "insert-left",
  "insert-right",
  "duplicate-column",
  "open-key-config",
]);

const personnelStore = usePersonnelStore();

const editLabel = ref("");
const editFormat = ref("text");
const editFormulaType = ref("presence_status");
const editOptions = ref("");
const editFormWidth = ref("50");
const editRequired = ref(false);

const editLookupTarget = ref("personnel");
const editLookupLinkCol = ref("");
const editLookupField = ref("");
const editLookupConditions = ref([]);
const editLookupLogicOp = ref("AND");
const editLookupDisplay = ref("value");
const editLookupFormat = ref("default");

const availablePersonnelCols = computed(() => {
  const list = [];
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt' && c.id !== 'code') list.push({ id: c.id, label: c.label || c.id });
    });
  });
  return list;
});

const availableRelativeCols = computed(() => {
  const list = [];
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') list.push({ id: c.id, label: c.label || c.id });
    });
  });
  return list;
});

const availableTripCols = computed(() => {
  const list = [];
  (personnelStore.importMappingTrips || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') list.push({ id: c.id, label: c.label || c.id });
    });
  });
  return list;
});

const currentTableCols = computed(() => {
  if (props.tableSource === 'relatives') return availableRelativeCols.value;
  if (props.tableSource === 'trips') return availableTripCols.value;
  return availablePersonnelCols.value;
});

const targetLookupCols = computed(() => {
  if (editLookupTarget.value === 'relatives') return availableRelativeCols.value;
  if (editLookupTarget.value === 'trips') return availableTripCols.value;
  return availablePersonnelCols.value;
});

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
      editFormWidth.value = String(col.formWidth || col.width || "50").replace("%", "");
      editRequired.value = Boolean(col.required);
      editLookupTarget.value = col.lookupTarget || "personnel";
      editLookupLinkCol.value = col.lookupLinkCol || "";
      editLookupField.value = col.lookupField || "";
      editLookupConditions.value = Array.isArray(col.lookupConditions)
        ? JSON.parse(JSON.stringify(col.lookupConditions))
        : (col.lookupLinkCol ? [{ targetField: col.lookupLinkCol, operator: 'is', sourceField: col.lookupLinkCol }] : []);
      editLookupLogicOp.value = col.lookupLogicOp || "AND";
      editLookupDisplay.value = col.lookupDisplay || "value";
      editLookupFormat.value = col.lookupFormat || "default";
      editFormulaType.value = col.formulaType || "presence_status";
    }
  },
  { immediate: true }
);

const addLookupCondition = () => {
  const defaultTarget = targetLookupCols.value?.[0]?.id || '';
  const defaultSource = currentTableCols.value?.[0]?.id || '';
  editLookupConditions.value.push({
    targetField: defaultTarget,
    operator: 'is',
    sourceField: defaultSource,
  });
  handleSaveLookup();
};

const removeLookupCondition = (index) => {
  editLookupConditions.value.splice(index, 1);
  handleSaveLookup();
};

const closeMenu = () => {
  emit("update:visible", false);
};

const handleSaveRename = () => {
  if (!editLabel.value.trim()) return;
  emit("rename-column", { colId: props.column.id, newLabel: editLabel.value.trim() });
  closeMenu();
};

const handleSaveLookup = () => {
  emit("change-lookup", {
    colId: props.column.id,
    lookupTarget: editLookupTarget.value,
    lookupLinkCol: editLookupLinkCol.value.trim(),
    lookupField: editLookupField.value,
    lookupConditions: editLookupConditions.value,
    lookupLogicOp: editLookupLogicOp.value,
    lookupDisplay: editLookupDisplay.value,
    lookupFormat: editLookupFormat.value,
  });
};

const handleSaveFormulaType = () => {
  emit("change-formula-type", {
    colId: props.column.id,
    formulaType: editFormulaType.value,
  });
};

const handleFormatChange = () => {
  emit("change-format", { colId: props.column.id, newFormat: editFormat.value });
  if (editFormat.value === 'lookup') {
    handleSaveLookup();
  } else if (editFormat.value === 'formula') {
    handleSaveFormulaType();
  }
};

const handleSaveOptions = () => {
  emit("change-options", { colId: props.column.id, options: editOptions.value.trim() });
};

const handleSaveFormWidth = () => {
  emit("change-form-width", { colId: props.column.id, formWidth: editFormWidth.value });
};

const handleToggleRequired = () => {
  editRequired.value = !editRequired.value;
  emit("change-required", { colId: props.column.id, required: editRequired.value });
};

const isCurrentPrimaryKey = computed(() => {
  if (!props.column?.id) return false;
  const colId = props.column.id;
  const src = props.tableSource;
  if (src === 'relatives') {
    return personnelStore.getRelativeKeyField() === colId;
  }
  if (src === 'trips') {
    return personnelStore.getTripKeyField() === colId;
  }
  return personnelStore.getPersonnelKeyField() === colId;
});

const isCurrentLinkKey = computed(() => {
  if (!props.column?.id) return false;
  const colId = props.column.id;
  const src = props.tableSource;
  if (src === 'relatives') {
    return personnelStore.getRelativeParentKeyField() === colId;
  }
  if (src === 'trips') {
    return personnelStore.getTripKeyField() === colId;
  }
  return false;
});

const handleSetPrimaryKey = async () => {
  if (!props.column?.id) return;
  const colId = props.column.id;
  const src = props.tableSource;
  const keyConfig = {
    ...(personnelStore.systemKeyConfig || {}),
  };
  if (src === 'relatives') {
    keyConfig.relativeKeyField = colId;
  } else if (src === 'trips') {
    keyConfig.tripKeyField = colId;
  } else {
    keyConfig.personnelKeyField = colId;
  }
  personnelStore.systemKeyConfig = keyConfig;
  await saveAppSettings('system_key_config', keyConfig);
  alert(`Đã thiết lập cột "${props.column.label || colId}" làm Khóa chính (Primary Key / Cột primal) của bảng!`);
};

const handleSetLinkKey = async () => {
  if (!props.column?.id) return;
  const colId = props.column.id;
  const src = props.tableSource;
  const keyConfig = {
    ...(personnelStore.systemKeyConfig || {}),
  };
  if (src === 'relatives') {
    keyConfig.relativeParentKeyField = colId;
  } else if (src === 'trips') {
    keyConfig.tripKeyField = colId;
  }
  personnelStore.systemKeyConfig = keyConfig;
  await saveAppSettings('system_key_config', keyConfig);
  alert(`Đã thiết lập cột "${props.column.label || colId}" làm Khóa liên kết (Link Key) của bảng!`);
};

const handleInsertLeft = () => {
  emit("insert-left", props.column);
  closeMenu();
};

const handleInsertRight = () => {
  emit("insert-right", props.column);
  closeMenu();
};

const handleDuplicate = () => {
  emit("duplicate-column", props.column);
  closeMenu();
};

const handleToggleParentField = (key) => {
  emit("change-name-col-field", key);
};

const handleDeleteColumn = () => {
  if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn cột "${props.column?.label || props.column?.id}" khỏi bảng này không?`)) return;
  emit("delete-column", props.column.id);
  closeMenu();
};

const copiedTag = ref(false);
const handleCopyColumnTag = () => {
  if (!props.column || !props.column.id) return;
  const tag = `{${props.column.id}}`;
  try {
    navigator.clipboard.writeText(tag);
    copiedTag.value = true;
    setTimeout(() => {
      copiedTag.value = false;
      closeMenu();
    }, 1200);
  } catch (e) {
    console.error('Failed to copy column tag:', e);
  }
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
.btn-primary-key-toggle {
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
  width: 100%;
  justify-content: center;
}

.btn-primary-key-toggle:hover {
  background: #fffbeb;
  border-color: #f59e0b;
  color: #b45309;
}

.btn-primary-key-toggle.is-primary-key {
  border-color: #f59e0b;
  background: #fef3c7;
  color: #b45309;
}
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
  width: 360px;
  max-width: 95vw;
  max-height: 85vh;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
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
