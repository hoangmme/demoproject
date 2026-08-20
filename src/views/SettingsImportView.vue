<template>
  <div class="app-content">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <div>
        <h1 style="font-size: 1.35rem; font-weight: 700; color: #1f2937; margin: 0;">
          Cấu hình Cột & Mẫu Dữ liệu Excel
        </h1>
        <p style="font-size: 0.85rem; color: #6b7280; margin: 4px 0 0 0;">
          Tùy chỉnh thứ tự cột, dời vị trí, nhãn hiển thị và định dạng trường thông tin.
        </p>
      </div>

      <div style="display: flex; gap: 8px;">
        <Button
          label="Lưu Cấu hình"
          icon="pi pi-save"
          severity="success"
          :loading="saving"
          @click="saveConfig"
          style="font-size: 0.85rem;"
        />
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div style="display: flex; gap: 8px; margin-bottom: 1.25rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px;">
      <button
        type="button"
        @click="activeTab = 'personnel'"
        :style="{
          padding: '8px 16px',
          fontWeight: 700,
          fontSize: '0.85rem',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: activeTab === 'personnel' ? '#2e7d32' : '#6b7280',
          borderBottom: activeTab === 'personnel' ? '3px solid #2e7d32' : '3px solid transparent',
          marginBottom: '-6px'
        }"
      >
        <i class="pi pi-user" style="margin-right: 6px;"></i>
        Cấu hình Cột Cán bộ (Cá nhân)
      </button>

      <button
        type="button"
        @click="activeTab = 'relative'"
        :style="{
          padding: '8px 16px',
          fontWeight: 700,
          fontSize: '0.85rem',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: activeTab === 'relative' ? '#2e7d32' : '#6b7280',
          borderBottom: activeTab === 'relative' ? '3px solid #2e7d32' : '3px solid transparent',
          marginBottom: '-6px'
        }"
      >
        <i class="pi pi-users" style="margin-right: 6px;"></i>
        Cấu hình Cột Thân nhân
      </button>
    </div>

    <!-- Main Content -->
    <div class="app-card" style="padding: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <span style="font-size: 0.95rem; font-weight: 700; color: #1f2937;">
          Danh sách Nhóm & Cột dữ liệu ({{ activeTab === 'personnel' ? 'Hồ sơ Cán bộ' : 'Hồ sơ Thân nhân' }})
        </span>
        <Button
          label="Thêm Nhóm mới"
          icon="pi pi-plus-circle"
          size="small"
          severity="primary"
          @click="addGroup"
          style="font-size: 0.8rem;"
        />
      </div>

      <!-- Columns List -->
      <div style="max-height: 65vh; overflow-y: auto; padding-right: 6px;">
        <div v-for="(group, gIdx) in currentGroups" :key="gIdx" style="margin-bottom: 1.5rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <!-- Group Header -->
          <div style="padding: 0.75rem 1rem; background: #f8fafc; border-bottom: 1px solid #e5e7eb; border-top-left-radius: 12px; border-top-right-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
              <InputText
                v-model="group.group"
                placeholder="Tên Nhóm (VD: Khối A: Thông tin cơ bản)"
                size="small"
                style="font-weight: 700; font-size: 0.9rem; flex: 1; max-width: 400px;"
              />
              <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 600; color: #6b21a8; cursor: pointer;">
                <input type="checkbox" v-model="group.isMultiple" style="accent-color: #6b21a8;" />
                <span>Cho phép lặp lại (Nhập nhiều lần)</span>
              </label>
            </div>

            <Button
              label="Xóa Nhóm"
              icon="pi pi-trash"
              severity="danger"
              text
              size="small"
              @click="removeGroup(gIdx)"
              style="font-size: 0.75rem;"
            />
          </div>

          <!-- Group Columns List -->
          <div style="padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 10px;">
            <div
              v-for="(col, cIdx) in group.columns"
              :key="cIdx"
              style="display: flex; flex-direction: column; gap: 6px; padding: 8px 12px; background: #fafafa; border: 1px solid #f0f0f0; border-radius: 8px; font-size: 0.8rem;"
            >
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                <!-- Move Buttons + Column Badge + Field ID + Field Label -->
                <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 280px;">
                  <!-- Move Up / Down Buttons -->
                  <div style="display: flex; flex-direction: column; gap: 2px;">
                    <button
                      type="button"
                      class="btn-reorder"
                      :disabled="gIdx === 0 && cIdx === 0"
                      @click="moveColumn(gIdx, cIdx, -1)"
                      title="Dời cột lên trên (Ví dụ từ cột 17 lên 16)"
                    >
                      <i class="pi pi-chevron-up" style="font-size: 0.62rem;"></i>
                    </button>
                    <button
                      type="button"
                      class="btn-reorder"
                      :disabled="gIdx === currentGroups.length - 1 && cIdx === group.columns.length - 1"
                      @click="moveColumn(gIdx, cIdx, 1)"
                      title="Dời cột xuống dưới"
                    >
                      <i class="pi pi-chevron-down" style="font-size: 0.62rem;"></i>
                    </button>
                  </div>

                  <span class="badge-pill badge-green" style="font-weight: 700; font-size: 0.72rem; min-width: 68px; justify-content: center;">
                    {{ getColLabelBadge(gIdx, cIdx) }}
                  </span>
                  
                  <!-- Editable/Readable Field ID -->
                  <InputText
                    v-model="col.id"
                    placeholder="Mã ID"
                    size="small"
                    style="font-family: monospace; font-size: 0.75rem; width: 140px; background: #f1f5f9; color: #334155; font-weight: 600;"
                    title="Mã trường hệ thống (ID)"
                  />

                  <InputText
                    v-model="col.label"
                    placeholder="Tên nhãn hiển thị"
                    size="small"
                    style="font-size: 0.8rem; flex: 1;"
                    @blur="onLabelBlur(col)"
                  />
                </div>

                <!-- Format & Width Settings using clean native selects -->
                <div style="display: flex; align-items: center; gap: 8px;">
                  <select
                    v-model="col.format"
                    class="custom-col-select"
                    style="width: 175px;"
                    title="Định dạng dữ liệu"
                  >
                    <option v-for="opt in formatOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>

                  <select
                    v-model="col.width"
                    class="custom-col-select"
                    style="width: 110px;"
                    title="Độ rộng hiển thị Form"
                  >
                    <option v-for="w in widthOptions" :key="w.value" :value="w.value">
                      {{ w.label }}
                    </option>
                  </select>

                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    size="small"
                    @click="removeColumn(gIdx, cIdx)"
                    style="padding: 2px 4px;"
                    title="Xóa cột này"
                  />
                </div>
              </div>

              <!-- Options Config (for Checkbox, Checkbox_Text, Dropdown, Table Loop) -->
              <div
                v-if="col.format === 'checkbox' || col.format === 'checkbox_text' || col.format === 'dropdown' || col.format === 'table_2col' || col.format === 'table_loop'"
                style="padding-left: 104px; display: flex; flex-direction: column; gap: 4px;"
              >
                <div style="display: flex; align-items: center; gap: 8px;">
                  <i class="pi pi-list" style="font-size: 0.75rem; color: #6b7280;"></i>
                  <InputText
                    v-model="col.options"
                    :placeholder="(col.format === 'table_2col' || col.format === 'table_loop') ? 'Cấu hình các tiêu đề cột (cách nhau bởi dấu phẩy, VD: Từ ngày, Đến ngày, Đơn vị, Chức vụ)' : 'Danh sách tùy chọn (cách nhau bởi dấu phẩy, VD: Ngân sách, Tự túc, Học bổng, Tài trợ)'"
                    size="small"
                    style="font-size: 0.75rem; width: 100%;"
                  />
                </div>
                
                <!-- Sub-columns Excel breakdown preview (Only for checkbox_text) -->
                <div v-if="col.format === 'checkbox_text' && getSubOptions(col).length > 1" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px;">
                  <span style="font-size: 0.7rem; color: #6b7280; font-weight: 600;">Sẽ xuất ra {{ getSubOptions(col).length }} cột Excel riêng biệt:</span>
                  <span
                    v-for="(subOpt, sIdx) in getSubOptions(col)"
                    :key="sIdx"
                    style="font-size: 0.7rem; background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 4px; font-weight: 600;"
                  >
                    Cột +{{ sIdx }}: {{ subOpt }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Add column button -->
            <div style="margin-top: 6px;">
              <Button
                label="Thêm Cột Tùy chỉnh vào nhóm này"
                icon="pi pi-plus"
                size="small"
                text
                severity="primary"
                @click="addColumn(gIdx)"
                style="font-size: 0.78rem;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import { saveAppSettings } from '@/api/settings';

const personnelStore = usePersonnelStore();

const activeTab = ref('personnel');
const saving = ref(false);

const personnelGroups = ref([]);
const relativeGroups = ref([]);

const formatOptions = [
  { label: 'Văn bản (Text)', value: 'text' },
  { label: 'Số (Number)', value: 'number' },
  { label: 'Ngày tháng (Date)', value: 'date' },
  { label: 'List Dữ liệu (Text Loop)', value: 'text_loop' },
  { label: 'Bảng lặp nhiều cột (Tùy biến tiêu đề)', value: 'table_loop' },
  { label: 'Hộp kiểm (Nhiều lựa chọn)', value: 'checkbox' },
  { label: 'Hộp kiểm + Nhập Text (Có điều kiện)', value: 'checkbox_text' },
  { label: 'Dropdown (Lựa chọn đơn)', value: 'dropdown' },
  { label: 'Tệp đính kèm (File/Ảnh/PDF)', value: 'file' },
];

const widthOptions = [
  { label: 'Rộng: 25%', value: '25' },
  { label: 'Rộng: 33%', value: '33' },
  { label: 'Rộng: 50%', value: '50' },
  { label: 'Rộng: 75%', value: '75' },
  { label: 'Rộng: 100%', value: '100' },
];

const generateSlug = (str) => {
  if (!str) return 'cot_' + Date.now();
  const slug = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'cot_' + Date.now();
};

const getSubOptions = (col) => {
  if (col.format === 'checkbox_text' && col.options) {
    return String(col.options)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeGroupColumns = (groups) => {
  (groups || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (!c.width) c.width = '25';
      if (c.id && c.id.startsWith('custom_') && c.label) {
        const cleanSlug = generateSlug(c.label);
        if (cleanSlug) c.id = cleanSlug;
      }
    });
  });
  return groups;
};

onMounted(async () => {
  await personnelStore.loadSettings();
  personnelGroups.value = normalizeGroupColumns(JSON.parse(JSON.stringify(personnelStore.importMappingPersonnel || [])));
  relativeGroups.value = normalizeGroupColumns(JSON.parse(JSON.stringify(personnelStore.importMappingRelative || [])));
});

const currentGroups = computed(() => {
  return activeTab.value === 'personnel' ? personnelGroups.value : relativeGroups.value;
});

const getColLabelBadge = (groupIndex, columnIndex) => {
  const groups = currentGroups.value;
  let count = 0;
  for (let i = 0; i < groupIndex; i++) {
    (groups[i]?.columns || []).forEach((c) => {
      const sub = getSubOptions(c);
      count += sub.length > 1 ? sub.length : 1;
    });
  }
  for (let j = 0; j < columnIndex; j++) {
    const prevCol = groups[groupIndex]?.columns?.[j];
    const sub = prevCol ? getSubOptions(prevCol) : [];
    count += sub.length > 1 ? sub.length : 1;
  }

  const currentCol = groups[groupIndex]?.columns?.[columnIndex];
  const currentSub = currentCol ? getSubOptions(currentCol) : [];
  const startCol = count + 1;

  if (currentSub.length > 1) {
    const endCol = count + currentSub.length;
    return `Cột ${startCol} - ${endCol} (${currentSub.length} cột)`;
  }
  return `Cột ${startCol}`;
};

const moveColumn = (gIdx, cIdx, direction) => {
  const groups = currentGroups.value;
  const currentGroup = groups[gIdx];
  if (!currentGroup || !currentGroup.columns) return;

  const targetIdx = cIdx + direction;

  // Move within the same group
  if (targetIdx >= 0 && targetIdx < currentGroup.columns.length) {
    const temp = currentGroup.columns[cIdx];
    currentGroup.columns[cIdx] = currentGroup.columns[targetIdx];
    currentGroup.columns[targetIdx] = temp;
    return;
  }

  // Move to previous group
  if (direction === -1 && gIdx > 0) {
    const col = currentGroup.columns.splice(cIdx, 1)[0];
    const prevGroup = groups[gIdx - 1];
    prevGroup.columns.push(col);
    return;
  }

  // Move to next group
  if (direction === 1 && gIdx < groups.length - 1) {
    const col = currentGroup.columns.splice(cIdx, 1)[0];
    const nextGroup = groups[gIdx + 1];
    nextGroup.columns.unshift(col);
    return;
  }
};

const onLabelBlur = (col) => {
  if (!col.id || col.id.startsWith('cot_') || col.id.startsWith('custom_')) {
    col.id = generateSlug(col.label);
  }
};

const addGroup = () => {
  currentGroups.value.push({
    group: 'Nhóm trường mới ' + (currentGroups.value.length + 1),
    isMultiple: false,
    columns: [],
  });
};

const removeGroup = (gIndex) => {
  if (!confirm(`Bạn có chắc muốn xóa nhóm "${currentGroups.value[gIndex]?.group}" cùng tất cả cột bên trong không?`)) return;
  currentGroups.value.splice(gIndex, 1);
};

const addColumn = (gIdx) => {
  const label = 'Cột mới ' + (currentGroups.value[gIdx].columns.length + 1);
  const slugId = generateSlug(label);
  currentGroups.value[gIdx].columns.push({
    id: slugId,
    label: label,
    format: 'text',
    width: '25',
    options: '',
  });
};

const removeColumn = (gIdx, cIdx) => {
  currentGroups.value[gIdx].columns.splice(cIdx, 1);
};

const saveConfig = async () => {
  saving.value = true;
  try {
    if (activeTab.value === 'personnel') {
      await saveAppSettings('mapping_config_personnel', personnelGroups.value);
      await saveAppSettings('importMappingPersonnel', personnelGroups.value);
      personnelStore.importMappingPersonnel = personnelGroups.value;
    } else {
      await saveAppSettings('mapping_config_relative', relativeGroups.value);
      await saveAppSettings('importMappingRelative', relativeGroups.value);
      personnelStore.importMappingRelative = relativeGroups.value;
    }
    alert('Đã lưu cấu hình cột thành công!');
  } catch (err) {
    alert('Lỗi lưu cấu hình: ' + (err.message || err));
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.btn-reorder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 14px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 3px;
  color: #475569;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
}

.btn-reorder:hover:not(:disabled) {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.btn-reorder:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.custom-col-select {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.35rem 0.5rem;
  font-size: 0.78rem;
  background-color: #ffffff;
  color: #1f2937;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.custom-col-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}
</style>
