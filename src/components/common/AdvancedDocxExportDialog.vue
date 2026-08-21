<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Xuất Hồ sơ Cán bộ (PDF)"
    :style="{ width: '560px', maxWidth: '95vw' }"
    :breakpoints="{ '640px': '98vw' }"
  >
    <div class="docx-export-container">
      <!-- 1. Phạm vi xuất -->
      <div class="export-box">
        <div class="box-title">
          <i class="pi pi-users" style="color: #0284c7;"></i>
          <span>1. Chọn Phạm vi xuất Cán bộ</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
          <label
            v-if="targetPerson"
            class="radio-item"
            :class="{ 'radio-active': exportScope === 'single' }"
          >
            <input type="radio" v-model="exportScope" value="single" style="accent-color: #0284c7;" />
            <div>
              <strong style="color: #1e293b;">Chỉ cán bộ hiện tại:</strong>
              <span style="color: #0284c7; margin-left: 4px; font-weight: 600;">{{ targetPerson.name }} ({{ targetPerson.code }})</span>
            </div>
          </label>

          <label
            v-if="selectedCount > 0"
            class="radio-item"
            :class="{ 'radio-active': exportScope === 'selected' }"
          >
            <input type="radio" v-model="exportScope" value="selected" style="accent-color: #0284c7;" />
            <div>
              <strong style="color: #1e293b;">Các cán bộ được tích chọn:</strong>
              <span style="color: #7c3aed; margin-left: 4px; font-weight: 700;">{{ selectedCount }} cán bộ</span>
            </div>
          </label>

          <label
            class="radio-item"
            :class="{ 'radio-active': exportScope === 'all' }"
          >
            <input type="radio" v-model="exportScope" value="all" style="accent-color: #0284c7;" />
            <div>
              <strong style="color: #1e293b;">Toàn bộ cán bộ trong danh sách:</strong>
              <span style="color: #16a34a; margin-left: 4px; font-weight: 700;">{{ totalPersonnelCount }} cán bộ</span>
            </div>
          </label>
        </div>
      </div>

      <!-- 2. Chọn Kiểu Xuất Hồ Sơ -->
      <div class="export-box">
        <div class="box-title" style="display: flex; align-items: center; gap: 6px;">
          <i class="pi pi-th-large" style="color: #2563eb;"></i>
          <span>2. Chọn kiểu xuất hồ sơ</span>
        </div>

        <!-- Tabs chọn nguồn mẫu -->
        <div style="display: flex; gap: 6px; margin: 8px 0;">
          <button
            type="button"
            class="tpl-src-btn"
            :class="{ 'tpl-src-active': templateSource === 'sample' }"
            @click="setTemplateSource('sample')"
          >
            <i class="pi pi-th-large"></i> Theo Nhóm Cột (Group)
          </button>
          <button
            type="button"
            class="tpl-src-btn"
            :class="{ 'tpl-src-active': templateSource === 'upload' }"
            @click="setTemplateSource('upload')"
          >
            <i class="pi pi-file-edit"></i> Theo Mẫu có sẵn / Tải lên
          </button>
        </div>

        <!-- Khu vực hiển thị theo nguồn mẫu -->
        <div style="margin-top: 6px;">
          <input
            ref="fileInputRef"
            type="file"
            accept=".docx"
            style="display: none;"
            @change="handleFileUpload"
          />

          <!-- Nguồn 1: Chọn Cấu trúc Cột & Trường dữ liệu (Dạng Phân Cấp: Cá Nhân > Group > Field Ngang hàng) -->
          <div v-if="templateSource === 'sample'" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
            <div style="font-size: 0.76rem; font-weight: 700; color: #475569; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span>TÍCH CHỌN CÁC TRƯỜNG DỮ LIỆU MUỐN XUẤT:</span>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-tree-action" @click="selectAllFields">Chọn tất cả</button>
                <button type="button" class="btn-tree-action" @click="deselectAllFields">Bỏ chọn hết</button>
              </div>
            </div>

            <div class="tree-container">
              <!-- CẤP 1: CÁ NHÂN -->
              <div class="tree-root-header tree-header-personnel">
                <i class="pi pi-user"></i>
                <span>Cá Nhân</span>
                <span class="tree-badge-count">({{ selectedFieldIds.length }} trường được chọn)</span>
              </div>

              <!-- CÁC GROUP TRONG CÁ NHÂN (Thụt lề cấp 1: 12px) -->
              <div
                v-for="(grp, gIdx) in personnelGroups"
                :key="'p_grp_' + gIdx"
                class="tree-group-box"
              >
                <!-- CẤP 2: GROUP HEADER -->
                <div class="tree-group-header" @click="toggleGroup(grp)">
                  <input
                    type="checkbox"
                    :checked="isGroupAllSelected(grp)"
                    @click.stop="toggleGroup(grp)"
                    style="accent-color: #2563eb; cursor: pointer;"
                  />
                  <span class="group-title-text">
                    {{ getCleanGroupName(grp, gIdx) }}
                  </span>
                  <span class="group-meta-count">
                    ({{ getGroupSelectedCount(grp) }}/{{ getGroupTotalCount(grp) }})
                  </span>
                </div>

                <!-- CẤP 3: FIELDS TRONG GROUP (Ngang hàng, Thụt lề cấp 2: 18px) -->
                <div class="tree-fields-inline-wrap">
                  <label
                    v-for="(col, cIdx) in (grp.columns || []).filter(c => c.id && c.id !== 'stt')"
                    :key="col.id"
                    class="tree-field-chip"
                    :class="{ 'chip-selected': selectedFieldIds.includes(col.id) }"
                  >
                    <input
                      type="checkbox"
                      :value="col.id"
                      v-model="selectedFieldIds"
                      style="accent-color: #2563eb; cursor: pointer;"
                    />
                    <span>{{ getCleanFieldLabel(col, getPersonnelColNum(gIdx, cIdx)) }}</span>
                  </label>
                </div>
              </div>

              <!-- CẤP 1: THÂN NHÂN -->
              <div class="tree-root-header tree-header-relative" style="margin-top: 10px;">
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0;">
                  <input
                    type="checkbox"
                    v-model="includeRelatives"
                    style="accent-color: #7c3aed; width: 15px; height: 15px;"
                  />
                  <i class="pi pi-users"></i>
                  <span>Thân Nhân</span>
                </label>
                <span class="tree-badge-count tree-badge-purple" v-if="includeRelatives">
                  ({{ selectedRelativeFieldIds.length }} trường được chọn)
                </span>
                <span v-else style="font-size: 0.72rem; color: #94a3b8; font-weight: normal;">
                  (Bỏ qua thân nhân)
                </span>
              </div>

              <!-- CÁC GROUP TRONG THÂN NHÂN (Nếu includeRelatives = true) -->
              <template v-if="includeRelatives">
                <div
                  v-for="(rGrp, rIdx) in relativeGroups"
                  :key="'r_grp_' + rIdx"
                  class="tree-group-box rel-group-box"
                >
                  <!-- CẤP 2: GROUP THÂN NHÂN HEADER -->
                  <div class="tree-group-header rel-group-header" @click="toggleRelGroup(rGrp)">
                    <input
                      type="checkbox"
                      :checked="isRelGroupAllSelected(rGrp)"
                      @click.stop="toggleRelGroup(rGrp)"
                      style="accent-color: #7c3aed; cursor: pointer;"
                    />
                    <span class="group-title-text" style="color: #6b21a8;">
                      {{ getCleanRelGroupName(rGrp, rIdx) }}
                    </span>
                    <span class="group-meta-count">
                      ({{ getRelGroupSelectedCount(rGrp) }}/{{ getRelGroupTotalCount(rGrp) }})
                    </span>
                  </div>

                  <!-- CẤP 3: FIELDS TRONG GROUP THÂN NHÂN (Ngang hàng, Thụt lề cấp 2) -->
                  <div class="tree-fields-inline-wrap">
                    <label
                      v-for="(col, rcIdx) in (rGrp.columns || []).filter(c => c.id && c.id !== 'stt')"
                      :key="'r_col_' + col.id"
                      class="tree-field-chip rel-field-chip"
                      :class="{ 'rel-chip-selected': selectedRelativeFieldIds.includes(col.id) }"
                    >
                      <input
                        type="checkbox"
                        :value="col.id"
                        v-model="selectedRelativeFieldIds"
                        style="accent-color: #7c3aed; cursor: pointer;"
                      />
                      <span>{{ getCleanFieldLabel(col, getRelativeColNum(rIdx, rcIdx)) }}</span>
                    </label>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Nguồn 2: Danh sách Mẫu đã lưu & Tải lên mẫu riêng -->
          <div v-else>
            <!-- Danh sách các mẫu đã lưu trong hệ thống -->
            <div v-if="savedTemplatesList.length > 0" style="margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px; max-height: 140px; overflow-y: auto;">
              <div style="font-size: 0.72rem; font-weight: 700; color: #475569; margin-bottom: 2px;">CHỌN NHANH MẪU ĐÃ LƯU:</div>
              <label
                v-for="tpl in savedTemplatesList"
                :key="tpl.id"
                class="radio-item"
                :class="{ 'radio-active': selectedSavedTemplateId === tpl.id }"
                style="padding: 6px 10px; cursor: pointer;"
                @click="selectSavedTemplate(tpl)"
              >
                <input
                  type="radio"
                  :value="tpl.id"
                  v-model="selectedSavedTemplateId"
                  style="accent-color: #2563eb;"
                />
                <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                  <i class="pi pi-file-word" style="color: #2563eb; font-size: 1rem;"></i>
                  <span style="font-size: 0.8rem; font-weight: 600; color: #1e293b; flex: 1;">{{ (tpl.name || '').replace(/\.docx$/i, '') }}</span>
                  <span v-if="tpl.isDefault" class="badge-fixed" style="background: #dbeafe; color: #1d4ed8;">Mặc định</span>
                </div>
              </label>
            </div>

            <!-- Khung tải lên / nạp mẫu mới -->
            <div
              v-if="!customTemplateBuffer"
              class="drop-zone"
              @click="triggerFileInput"
              style="padding: 14px;"
            >
              <i class="pi pi-cloud-upload" style="font-size: 1.8rem; color: #3b82f6; margin-bottom: 4px;"></i>
              <div style="font-size: 0.82rem; font-weight: 700; color: #1e293b;">+ Tải lên tệp Mẫu Word (.docx) mới</div>
              <div style="font-size: 0.7rem; color: #64748b;">Hệ thống sẽ điền dữ liệu theo các tag trong file</div>
            </div>

            <!-- Trạng thái tệp mẫu tùy biến hiện tại -->
            <div
              v-else
              class="uploaded-info"
              style="padding: 8px 12px; margin-top: 6px; display: flex; align-items: center; gap: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;"
            >
              <i class="pi pi-file-word" style="font-size: 1.5rem; color: #2563eb;"></i>
              <div style="flex: 1; min-width: 0;">
                <div class="uploaded-filename" style="font-size: 0.82rem; font-weight: 700; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ (customTemplateFileName || 'Mau_Word_tuy_bien').replace(/\.docx$/i, '') }}</div>
                <div class="uploaded-filesize" style="color: #16a34a; font-weight: 600; font-size: 0.7rem;">Đang sử dụng mẫu này để xuất</div>
              </div>
              <Button
                label="Đổi file khác"
                icon="pi pi-refresh"
                severity="secondary"
                size="small"
                outlined
                @click="triggerFileInput"
                style="font-size: 0.72rem; padding: 4px 8px;"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Khung Tiến độ Xuất hàng loạt ZIP -->
      <div v-if="exporting && progressTotal > 0" class="export-progress-panel">
        <div class="progress-info-row">
          <div class="progress-status-text">
            <i class="pi pi-spin pi-spinner" style="color: #2563eb; margin-right: 6px;"></i>
            <span>Đang tạo tài liệu: <strong>{{ progressCurrent }} / {{ progressTotal }}</strong> hồ sơ cán bộ</span>
          </div>
          <div class="progress-percent-badge">
            {{ Math.round((progressCurrent / progressTotal) * 100) }}%
          </div>
        </div>

        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: `${Math.round((progressCurrent / progressTotal) * 100)}%` }"
          ></div>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 0.6rem; padding-top: 0.8rem; border-top: 1px solid #e2e8f0;">
        <Button
          label="Đóng"
          size="small"
          @click="visible = false"
          class="btn-close-custom"
          :disabled="exporting"
        />

        <Button
          :label="getDownloadButtonLabel()"
          :icon="outputFormat === 'pdf' ? 'pi pi-file-pdf' : 'pi pi-download'"
          size="small"
          :loading="exporting"
          @click="handleExport"
          class="btn-download-primary"
          :disabled="!effectiveTemplateBuffer || exporting"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import { useAuthStore } from '@/stores/auth';
import { saveAs } from 'file-saver';
import {
  exportSinglePersonnelDocx,
  exportMultiplePersonnelZip,
  createDynamicDocxTemplateBlob,
} from '@/utils/docxExport';
import { getAppSettings, saveAppSettings } from '@/api/settings';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  targetPerson: { type: Object, default: null },
  selectedPersonnel: { type: Array, default: () => [] },
  allPersonnel: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue']);
const personnelStore = usePersonnelStore();
const authStore = useAuthStore();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const outputFormat = ref('pdf');
const exportScope = ref('single');
const templateSource = ref('sample'); // 'sample' (Group) | 'upload'

// Group & Field selector state (Dạng phân cấp Tree)
const selectedFieldIds = ref([]);
const selectedRelativeFieldIds = ref([]);

const selectedGroupIndices = ref([0, 1, 2, 3, 4, 5]);
const includeRelatives = ref(true);
const selectedRelativeGroupIndices = ref([0, 1, 2, 3, 4, 5]);

const personnelGroups = computed(() => personnelStore.importMappingPersonnel || []);
const otherPersonnelGroups = computed(() => personnelGroups.value.slice(1));
const relativeGroups = computed(() => personnelStore.importMappingRelative || []);

const initAllFields = () => {
  const pIds = [];
  (personnelGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') pIds.push(c.id);
    });
  });
  selectedFieldIds.value = pIds;

  const rIds = [];
  (relativeGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') rIds.push(c.id);
    });
  });
  selectedRelativeFieldIds.value = rIds;
};

const selectAllFields = () => {
  initAllFields();
  includeRelatives.value = true;
};

const deselectAllFields = () => {
  selectedFieldIds.value = [];
  selectedRelativeFieldIds.value = [];
};

const getGroupTotalCount = (grp) => {
  return (grp.columns || []).filter((c) => c.id && c.id !== 'stt').length;
};

const getGroupSelectedCount = (grp) => {
  const cols = (grp.columns || []).filter((c) => c.id && c.id !== 'stt');
  return cols.filter((c) => selectedFieldIds.value.includes(c.id)).length;
};

const isGroupAllSelected = (grp) => {
  const cols = (grp.columns || []).filter((c) => c.id && c.id !== 'stt');
  if (cols.length === 0) return false;
  return cols.every((c) => selectedFieldIds.value.includes(c.id));
};

const isGroupSomeSelected = (grp) => {
  const cols = (grp.columns || []).filter((c) => c.id && c.id !== 'stt');
  if (cols.length === 0) return false;
  const count = cols.filter((c) => selectedFieldIds.value.includes(c.id)).length;
  return count > 0 && count < cols.length;
};

const toggleGroup = (grp) => {
  const cols = (grp.columns || []).filter((c) => c.id && c.id !== 'stt');
  const allSel = isGroupAllSelected(grp);
  if (allSel) {
    selectedFieldIds.value = selectedFieldIds.value.filter((id) => !cols.some((c) => c.id === id));
  } else {
    const toAdd = cols.map((c) => c.id).filter((id) => !selectedFieldIds.value.includes(id));
    selectedFieldIds.value = [...selectedFieldIds.value, ...toAdd];
  }
};

const getRelGroupTotalCount = (rGrp) => {
  return (rGrp.columns || []).filter((c) => c.id && c.id !== 'stt').length;
};

const getRelGroupSelectedCount = (rGrp) => {
  const cols = (rGrp.columns || []).filter((c) => c.id && c.id !== 'stt');
  return cols.filter((c) => selectedRelativeFieldIds.value.includes(c.id)).length;
};

const isRelGroupAllSelected = (rGrp) => {
  const cols = (rGrp.columns || []).filter((c) => c.id && c.id !== 'stt');
  if (cols.length === 0) return false;
  return cols.every((c) => selectedRelativeFieldIds.value.includes(c.id));
};

const isRelGroupSomeSelected = (rGrp) => {
  const cols = (rGrp.columns || []).filter((c) => c.id && c.id !== 'stt');
  if (cols.length === 0) return false;
  const count = cols.filter((c) => selectedRelativeFieldIds.value.includes(c.id)).length;
  return count > 0 && count < cols.length;
};

const toggleRelGroup = (rGrp) => {
  const cols = (rGrp.columns || []).filter((c) => c.id && c.id !== 'stt');
  const allSel = isRelGroupAllSelected(rGrp);
  if (allSel) {
    selectedRelativeFieldIds.value = selectedRelativeFieldIds.value.filter((id) => !cols.some((c) => c.id === id));
  } else {
    const toAdd = cols.map((c) => c.id).filter((id) => !selectedRelativeFieldIds.value.includes(id));
    selectedRelativeFieldIds.value = [...selectedRelativeFieldIds.value, ...toAdd];
  }
};

const getCleanGroupName = (grp, gIdx) => {
  let raw = grp.group || `Nhóm cột ${gIdx + 1}`;
  raw = raw.replace(/^Khối\s+[A-Z0-9]+[:\s-]*/i, '').trim();
  return `Khối ${String.fromCharCode(65 + gIdx)}: ${raw}`;
};

const getCleanRelGroupName = (rGrp, rIdx) => {
  let raw = rGrp.group || `Nhóm thân nhân ${rIdx + 1}`;
  raw = raw.replace(/^Khối\s+TN\s+\d+[:\s-]*/i, '').trim();
  return `Khối TN ${rIdx + 1}: ${raw}`;
};

const getPersonnelColNum = (gIdx, cIdx) => {
  let count = 0;
  for (let i = 0; i < gIdx; i++) {
    const cols = (personnelGroups.value[i]?.columns || []).filter((c) => c.id && c.id !== 'stt');
    count += cols.length;
  }
  return count + cIdx + 1;
};

const getRelativeColNum = (rIdx, cIdx) => {
  let count = 0;
  for (let i = 0; i < rIdx; i++) {
    const cols = (relativeGroups.value[i]?.columns || []).filter((c) => c.id && c.id !== 'stt');
    count += cols.length;
  }
  return count + cIdx + 1;
};

const getCleanFieldLabel = (col, num) => {
  let label = col.label || col.id;
  label = label.replace(/\s*\(\d+\)$/, '').trim();
  return `${label} (${num})`;
};

const fileInputRef = ref(null);
const sampleTemplateBuffer = ref(null);
const customTemplateBuffer = ref(null);
const customTemplateFileName = ref('');

const exporting = ref(false);
const progressCurrent = ref(0);
const progressTotal = ref(0);

const selectedCount = computed(() => props.selectedPersonnel?.length || 0);
const totalPersonnelCount = computed(() => {
  if (props.allPersonnel && props.allPersonnel.length > 0) return props.allPersonnel.length;
  return personnelStore.personnelList.length;
});

const effectiveTemplateBuffer = computed(() => {
  // Ưu tiên tệp mẫu mặc định đã lưu / đã chọn nếu có
  if (customTemplateBuffer.value) {
    return customTemplateBuffer.value;
  }
  return sampleTemplateBuffer.value;
});

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
};

const savedTemplatesList = ref([]);
const selectedSavedTemplateId = ref('');

const selectSavedTemplate = (tpl) => {
  if (!tpl.base64) return;
  selectedSavedTemplateId.value = tpl.id;
  customTemplateBuffer.value = base64ToArrayBuffer(tpl.base64);
  customTemplateFileName.value = tpl.name;
};

const loadSavedTemplate = async () => {
  try {
    const list = await getAppSettings('system_docx_templates', []);
    if (Array.isArray(list) && list.length > 0) {
      savedTemplatesList.value = list;
      const defaultTpl = list.find((t) => t.isDefault) || list[0];
      if (defaultTpl) {
        selectSavedTemplate(defaultTpl);
        return;
      }
    }
    const serverTemplate = await getAppSettings('custom_docx_template', null);
    if (serverTemplate?.base64) {
      customTemplateBuffer.value = base64ToArrayBuffer(serverTemplate.base64);
      customTemplateFileName.value = serverTemplate.fileName || 'Mau_Word_tuy_bien.docx';
    }
  } catch (err) { console.warn('Failed to load saved template:', err); }
};

const loadSampleTemplate = async () => {
  try {
    const activeIndices = (personnelGroups.value || []).map((_, i) => i);
    const activeRelIndices = (relativeGroups.value || []).map((_, i) => i);
    const blob = await createDynamicDocxTemplateBlob(
      activeIndices,
      personnelGroups.value,
      includeRelatives.value,
      activeRelIndices,
      relativeGroups.value,
      selectedFieldIds.value,
      selectedRelativeFieldIds.value
    );
    sampleTemplateBuffer.value = await blob.arrayBuffer();
  } catch (e) {
    console.error('Failed to generate dynamic group template:', e);
  }
};

watch(
  () => [selectedFieldIds.value, includeRelatives.value, selectedRelativeFieldIds.value],
  () => {
    loadSampleTemplate();
  },
  { deep: true }
);

watch(() => [props.modelValue], ([isOpen]) => {
  if (isOpen) {
    if (props.targetPerson) exportScope.value = 'single';
    else if (selectedCount.value > 0) exportScope.value = 'selected';
    else exportScope.value = 'all';
    if (selectedFieldIds.value.length === 0) {
      initAllFields();
    }
    loadSampleTemplate();
    loadSavedTemplate();
  }
});

const setTemplateSource = (src) => {
  templateSource.value = src;
  if (src === 'upload' && !customTemplateBuffer.value) triggerFileInput();
};

const triggerFileInput = () => fileInputRef.value?.click();

const handleFileUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  customTemplateFileName.value = file.name;
  templateSource.value = 'upload';
  const reader = new FileReader();
  reader.onload = async (event) => {
    customTemplateBuffer.value = event.target.result;
    const b64 = arrayBufferToBase64(event.target.result);
    localStorage.setItem('cached_custom_docx_template', b64);
    localStorage.setItem('cached_custom_docx_name', file.name);
    await saveAppSettings('custom_docx_template', { fileName: file.name, base64: b64 });

    const newTpl = {
      id: 'tpl_' + Date.now(),
      name: file.name,
      size: file.size,
      base64: b64,
      isDefault: false,
      uploadedAt: new Date().toLocaleString('vi-VN'),
    };
    const updated = [...savedTemplatesList.value.filter((t) => t.name !== file.name), newTpl];
    savedTemplatesList.value = updated;
    selectedSavedTemplateId.value = newTpl.id;
    await saveAppSettings('system_docx_templates', updated);
  };
  reader.readAsArrayBuffer(file);
};

const downloadSampleTemplate = async () => {
  try {
    const buf = effectiveTemplateBuffer.value;
    if (!buf) return alert('Chưa có mẫu nào được khởi tạo!');
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, templateSource.value === 'upload' ? (customTemplateFileName.value || 'Mau_Word_tuy_bien.docx') : 'Mau_Word_Theo_Nhom_Cot.docx');
  } catch (e) { alert('Lỗi tạo mẫu Word: ' + e.message); }
};

const getDownloadButtonLabel = () => {
  const isSingle = exportScope.value === 'single' || (exportScope.value === 'selected' && selectedCount.value === 1);

  if (exporting.value && progressTotal.value > 0) {
    const pct = Math.round((progressCurrent.value / progressTotal.value) * 100);
    return `Đang xuất PDF ${progressCurrent.value}/${progressTotal.value} (${pct}%)...`;
  }

  if (isSingle) {
    const pName = (exportScope.value === 'single' && props.targetPerson)
      ? props.targetPerson.name
      : (props.selectedPersonnel[0]?.name || 'Cán bộ');
    return `Tải về file PDF: ${pName}`;
  }
  return `Tải file ZIP PDF (${exportScope.value === 'selected' ? selectedCount.value : totalPersonnelCount.value} Cán bộ)`;
};

const handleExport = async () => {
  const buf = effectiveTemplateBuffer.value;
  if (!buf) return alert('Vui lòng chọn hoặc tải lên tệp mẫu Word (.docx)');
  exporting.value = true;
  progressCurrent.value = 0;
  try {
    const exportOptions = {
      selectedGroupIndices: (personnelGroups.value || []).map((_, i) => i),
      includeRelatives: includeRelatives.value,
      selectedRelativeGroupIndices: (relativeGroups.value || []).map((_, i) => i),
      selectedFieldIds: selectedFieldIds.value,
      selectedRelativeFieldIds: selectedRelativeFieldIds.value,
    };
    const isSingle = exportScope.value === 'single' || (exportScope.value === 'selected' && selectedCount.value === 1);
    const targetP = (exportScope.value === 'single' && props.targetPerson) ? props.targetPerson : (exportScope.value === 'selected' && selectedCount.value === 1 ? props.selectedPersonnel[0] : null);
    if (isSingle && targetP) {
      const fileName = `Ho_so_${(targetP.name || 'Can_bo').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}_${targetP.code || ''}`;
      await exportSinglePersonnelDocx(buf, targetP, fileName, personnelStore, outputFormat.value, authStore.user, exportOptions);
      visible.value = false;
    } else {
      let list = exportScope.value === 'selected' ? props.selectedPersonnel : (props.allPersonnel?.length > 0 ? props.allPersonnel : personnelStore.personnelList);
      if (!list?.length) return alert('Không có dữ liệu cán bộ!');
      progressTotal.value = list.length;
      const zipName = `Ho_so_${list.length}_can_bo.zip`;
      await exportMultiplePersonnelZip(buf, list, zipName, personnelStore, (curr, total) => { progressCurrent.value = curr; progressTotal.value = total; }, outputFormat.value, authStore.user, exportOptions);
      visible.value = false;
    }
  } catch (error) { alert('Lỗi: ' + (error.message || error)); } finally { exporting.value = false; }
};

onMounted(() => {
  initAllFields();
  loadSampleTemplate();
  loadSavedTemplate();
});
</script>

<style scoped>
.docx-export-container {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 0.25rem;
}

.tpl-src-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
  transition: all 0.15s ease;
}

.tpl-src-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.tpl-src-active {
  background: #2563eb !important;
  color: #ffffff !important;
  border-color: #2563eb !important;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.25);
}

.export-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 14px;
}

.box-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.15s ease;
}

.radio-item:hover {
  background: #f1f5f9;
}

.radio-active {
  background: #eff6ff !important;
  border-color: #3b82f6 !important;
}

.tree-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
  padding-right: 4px;
}

.btn-tree-action {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.btn-tree-action:hover {
  color: #1d4ed8;
}

.tree-root-header {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tree-header-personnel {
  background: #eff6ff;
  color: #1e40af;
}
.tree-header-relative {
  background: #faf5ff;
  color: #6b21a8;
}

.tree-badge-count {
  font-size: 0.7rem;
  font-weight: normal;
  color: #3b82f6;
  margin-left: auto;
}
.tree-badge-purple {
  color: #9333ea;
}

.tree-group-box {
  margin-left: 12px; /* Thụt vô Group A, B */
  border-left: 2px solid #bfdbfe;
  padding-left: 8px;
  margin-bottom: 6px;
}
.rel-group-box {
  border-left-color: #e9d5ff;
}

.tree-group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #1e293b;
  padding: 3px 6px;
  background: #f1f5f9;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}
.tree-group-header:hover {
  background: #e2e8f0;
}
.rel-group-header {
  background: #fdf4ff;
}
.rel-group-header:hover {
  background: #fae8ff;
}

.group-title-text {
  flex: 1;
}
.group-meta-count {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: normal;
}

.tree-fields-inline-wrap {
  margin-left: 18px; /* Thụt vô Field trong Group */
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  margin-top: 4px;
  margin-bottom: 6px;
  padding: 4px 6px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #f1f5f9;
}

.tree-field-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.74rem;
  color: #334155;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.1s ease;
  user-select: none;
}
.tree-field-chip:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}
.chip-selected {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
  font-weight: 600;
}
.rel-field-chip:hover {
  background: #faf5ff;
  border-color: #d8b4fe;
}
.rel-chip-selected {
  background: #faf5ff;
  border-color: #e9d5ff;
  color: #7e22ce;
  font-weight: 600;
}

.drop-zone {
  border: 2px dashed #93c5fd;
  border-radius: 8px;
  padding: 1.25rem 1rem;
  text-align: center;
  background: #f0f9ff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.drop-zone:hover {
  background: #e0f2fe;
  border-color: #2563eb;
}

.file-loaded-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 10px 14px;
}

.btn-close-custom {
  background: #ffffff !important;
  color: #475569 !important;
  border: 1px solid #cbd5e1 !important;
  font-weight: 600 !important;
  padding: 7px 16px !important;
  border-radius: 8px !important;
  cursor: pointer !important;
}

.btn-close-custom:hover {
  background: #f1f5f9 !important;
  color: #1e293b !important;
  border-color: #94a3b8 !important;
}

.btn-download-primary {
  background: #2563eb !important;
  color: #ffffff !important;
  border: 1px solid #2563eb !important;
  font-weight: 700 !important;
  padding: 7px 20px !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35) !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}

.btn-download-primary:hover:not(:disabled) {
  background: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.45) !important;
}

.btn-download-primary:disabled {
  background: #94a3b8 !important;
  border-color: #94a3b8 !important;
  color: #ffffff !important;
  opacity: 0.65 !important;
  box-shadow: none !important;
  cursor: not-allowed !important;
}

.export-progress-panel {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 8px;
}

.progress-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.progress-status-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e40af;
  display: flex;
  align-items: center;
}

.progress-percent-badge {
  font-size: 0.78rem;
  font-weight: 800;
  color: #2563eb;
  background: #ffffff;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid #bfdbfe;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: #dbeafe;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 4px;
  transition: width 0.25s ease;
}
</style>
