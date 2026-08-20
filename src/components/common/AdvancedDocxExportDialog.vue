<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Xuất Hồ sơ theo Mẫu (Word / PDF)"
    :style="{ width: '560px', maxWidth: '95vw' }"
    :breakpoints="{ '640px': '98vw' }"
  >
    <div class="docx-export-container">
      <!-- 1. Chọn định dạng xuất -->
      <div class="export-box">
        <div class="box-title">
          <i class="pi pi-file" style="color: #0284c7;"></i>
          <span>1. Định dạng Tệp xuất</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
          <label class="radio-item" :class="{ 'radio-active': outputFormat === 'docx' }">
            <input type="radio" v-model="outputFormat" value="docx" style="accent-color: #2563eb;" />
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="pi pi-file-word" style="color: #2563eb; font-size: 1.25rem;"></i>
              <div>
                <strong style="color: #1e293b; display: block; font-size: 0.84rem;">File Word (.docx)</strong>
                <span style="font-size: 0.7rem; color: #64748b;">Chỉnh sửa được trong Word</span>
              </div>
            </div>
          </label>

          <label class="radio-item" :class="{ 'radio-active': outputFormat === 'pdf' }">
            <input type="radio" v-model="outputFormat" value="pdf" style="accent-color: #dc2626;" />
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="pi pi-file-pdf" style="color: #dc2626; font-size: 1.25rem;"></i>
              <div>
                <strong style="color: #1e293b; display: block; font-size: 0.84rem;">File PDF (.pdf)</strong>
                <span style="font-size: 0.7rem; color: #64748b;">Khóa nội dung, in ấn chuẩn</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- 2. Phạm vi xuất -->
      <div class="export-box">
        <div class="box-title">
          <i class="pi pi-users" style="color: #0284c7;"></i>
          <span>2. Chọn Phạm vi xuất Cán bộ</span>
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

      <!-- 3. Chọn Tệp Mẫu Word (.docx) -->
      <div class="export-box">
        <div class="box-title" style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <i class="pi pi-file-word" style="color: #2563eb;"></i>
            <span>3. Tệp Mẫu DOCX sử dụng</span>
          </div>
          <button
            type="button"
            class="btn-link"
            @click="downloadSampleTemplate"
            title="Tải tệp Word mẫu đã chọn để xem hoặc chỉnh sửa"
          >
            <i class="pi pi-download"></i> Tải mẫu hiện tại (.docx)
          </button>
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
            <i class="pi pi-upload"></i> Tải lên Mẫu Riêng (.docx)
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

          <!-- Nguồn 1: Chọn Group cấu hình cột -->
          <div v-if="templateSource === 'sample'" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
            <div style="font-size: 0.76rem; font-weight: 700; color: #475569; margin-bottom: 6px; display: flex; justify-content: space-between;">
              <span>TÍCH CHỌN CÁC KHỐI/NHÓM CỘT MUỐN XUẤT:</span>
              <span style="color: #0284c7; font-weight: 600;">(Khối A luôn cố định)</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 5px; max-height: 160px; overflow-y: auto; padding-right: 4px;">
              <!-- Group 0: Luôn cố định -->
              <label class="group-select-item group-fixed">
                <input type="checkbox" checked disabled style="accent-color: #2563eb;" />
                <span style="font-weight: 700; color: #1e293b;">Khối A: {{ personnelGroups[0]?.group || 'Thông tin cá nhân cơ bản' }}</span>
                <span class="badge-fixed">Bắt buộc</span>
              </label>

              <!-- Các Group B, C, D... -->
              <label
                v-for="(grp, gIdx) in otherPersonnelGroups"
                :key="gIdx + 1"
                class="group-select-item"
                :class="{ 'group-selected': selectedGroupIndices.includes(gIdx + 1) }"
              >
                <input
                  type="checkbox"
                  :value="gIdx + 1"
                  v-model="selectedGroupIndices"
                  style="accent-color: #2563eb;"
                />
                <span style="font-weight: 600; color: #334155; flex: 1;">
                  Khối {{ String.fromCharCode(66 + gIdx) }}: {{ grp.group || 'Nhóm cột ' + (gIdx + 2) }}
                  <small style="color: #64748b; font-weight: normal;">({{ grp.columns?.length || 0 }} cột)</small>
                </span>
              </label>

              <!-- Khối Chuyến đi & Thân nhân -->
              <label class="group-select-item" :class="{ 'group-selected': includeTrips }">
                <input type="checkbox" v-model="includeTrips" style="accent-color: #2563eb;" />
                <span style="font-weight: 600; color: #334155;">Lịch sử Xuất nhập cảnh & Chuyến đi nước ngoài</span>
              </label>

              <label class="group-select-item" :class="{ 'group-selected': includeRelatives }">
                <input type="checkbox" v-model="includeRelatives" style="accent-color: #2563eb;" />
                <span style="font-weight: 600; color: #334155;">Danh sách Thân nhân liên quan</span>
              </label>
            </div>
          </div>

          <!-- Nguồn 2: Tải lên mẫu riêng -->
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
                style="padding: 6px 10px;"
              >
                <input
                  type="radio"
                  :value="tpl.id"
                  v-model="selectedSavedTemplateId"
                  @change="selectSavedTemplate(tpl)"
                  style="accent-color: #2563eb;"
                />
                <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                  <i class="pi pi-file-word" style="color: #2563eb; font-size: 1rem;"></i>
                  <span style="font-size: 0.8rem; font-weight: 600; color: #1e293b; flex: 1;">{{ tpl.name }}</span>
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

            <div v-else class="file-loaded-box">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                <i class="pi pi-file-word" style="font-size: 1.5rem; color: #2563eb;"></i>
                <div>
                  <div style="font-size: 0.82rem; font-weight: 700; color: #1e293b;">{{ customTemplateFileName }}</div>
                  <div style="font-size: 0.7rem; color: #16a34a; font-weight: 600;">Đang sử dụng mẫu này để xuất</div>
                </div>
              </div>
              <Button
                label="Đổi file khác"
                icon="pi pi-sync"
                size="small"
                outlined
                severity="secondary"
                @click="triggerFileInput"
                style="font-size: 0.72rem; padding: 2px 6px;"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Tiến trình & Nút Thực hiện Xuất -->
      <div style="margin-top: 6px; width: 100%;">
        <div v-if="exporting" style="margin-bottom: 10px; background: #eff6ff; padding: 10px 14px; border-radius: 8px; border: 1px solid #bfdbfe;">
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; color: #1e40af; margin-bottom: 6px;">
            <span>Đang xử lý xuất dữ liệu ({{ outputFormat === 'pdf' ? 'PDF' : 'Word' }})...</span>
            <span>{{ progressCurrent }} / {{ progressTotal }} ({{ Math.round((progressCurrent / (progressTotal || 1)) * 100) }}%)</span>
          </div>
          <div style="width: 100%; height: 8px; background: #dbeafe; border-radius: 4px; overflow: hidden;">
            <div
              style="height: 100%; background: #2563eb; transition: width 0.2s ease;"
              :style="{ width: ((progressCurrent / (progressTotal || 1)) * 100) + '%' }"
            ></div>
          </div>
        </div>

        <Button
          :label="getDownloadButtonLabel()"
          :icon="outputFormat === 'pdf' ? 'pi pi-file-pdf' : 'pi pi-file-word'"
          :severity="outputFormat === 'pdf' ? 'danger' : 'primary'"
          style="width: 100%; font-size: 0.95rem; font-weight: 700; padding: 0.8rem 1rem; display: flex; justify-content: center; align-items: center; text-align: center;"
          :loading="exporting"
          :disabled="!effectiveTemplateBuffer || exporting"
          @click="handleExport"
        />
      </div>

      <!-- Gợi ý tra cứu thẻ tag -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 0.73rem; color: #64748b; display: flex; align-items: center; gap: 6px;">
        <i class="pi pi-info-circle" style="color: #7c3aed;"></i>
        <span>Tra cứu toàn bộ danh sách mã thẻ tag tại <strong>Cấu hình Cột & Mẫu Dữ liệu Excel</strong> (Tab Bảng Tra cứu Mã Thẻ Tag).</span>
      </div>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: flex-end;">
        <Button label="Đóng" severity="secondary" text size="small" @click="visible = false" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import { useAuthStore } from '@/stores/auth';
import { getAppSettings, saveAppSettings } from '@/api/settings';
import { saveAs } from 'file-saver';
import {
  exportSinglePersonnelDocx,
  exportMultiplePersonnelZip,
  createDynamicDocxTemplateBlob,
} from '@/utils/docxExport';

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

const outputFormat = ref('docx');
const exportScope = ref('single');
const templateSource = ref('sample'); // 'sample' (Group) | 'upload'

// Group selector state
const selectedGroupIndices = ref([1, 2, 3]);
const includeTrips = ref(true);
const includeRelatives = ref(true);

const personnelGroups = computed(() => personnelStore.importMappingPersonnel || []);
const otherPersonnelGroups = computed(() => personnelGroups.value.slice(1));

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
  return templateSource.value === 'upload' ? customTemplateBuffer.value : sampleTemplateBuffer.value;
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

const loadAllSavedTemplates = async () => {
  try {
    const list = await getAppSettings('system_docx_templates', []);
    if (Array.isArray(list) && list.length > 0) {
      savedTemplatesList.value = list;
      const defaultTpl = list.find((t) => t.isDefault) || list[0];
      if (defaultTpl && !customTemplateBuffer.value) {
        selectSavedTemplate(defaultTpl);
      }
    }
  } catch (e) {
    console.error('Error loading saved templates in dialog:', e);
  }
};

const loadSavedTemplate = async () => {
  try {
    await loadAllSavedTemplates();
    const cachedB64 = localStorage.getItem('cached_custom_docx_template');
    const cachedName = localStorage.getItem('cached_custom_docx_name');
    if (cachedB64 && cachedName) {
      customTemplateBuffer.value = base64ToArrayBuffer(cachedB64);
      customTemplateFileName.value = cachedName;
      return;
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
    const activeIndices = [0, ...selectedGroupIndices.value];
    const blob = await createDynamicDocxTemplateBlob(
      activeIndices,
      personnelGroups.value,
      includeTrips.value,
      includeRelatives.value
    );
    sampleTemplateBuffer.value = await blob.arrayBuffer();
  } catch (e) {
    console.error('Failed to generate dynamic group template:', e);
  }
};

watch(
  () => [selectedGroupIndices.value, includeTrips.value, includeRelatives.value],
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
  const isPdf = outputFormat.value === 'pdf';
  const typeLabel = isPdf ? 'PDF' : 'Word';
  const ext = isPdf ? '.pdf' : '.docx';
  const isSingle = exportScope.value === 'single' || (exportScope.value === 'selected' && selectedCount.value === 1);
  if (isSingle) {
    const pName = (exportScope.value === 'single' && props.targetPerson?.name) ? props.targetPerson.name : (props.selectedPersonnel[0]?.name || 'Hồ sơ Cán bộ');
    return `Tải về file ${typeLabel} (${ext}): ${pName}`;
  }
  return `Tải file ZIP ${typeLabel} (${exportScope.value === 'selected' ? selectedCount.value : totalPersonnelCount.value} Cán bộ)`;
};

const handleExport = async () => {
  const buf = effectiveTemplateBuffer.value;
  if (!buf) return alert('Vui lòng chọn hoặc tải lên tệp mẫu Word (.docx)');
  exporting.value = true;
  progressCurrent.value = 0;
  try {
    const isSingle = exportScope.value === 'single' || (exportScope.value === 'selected' && selectedCount.value === 1);
    const targetP = (exportScope.value === 'single' && props.targetPerson) ? props.targetPerson : (exportScope.value === 'selected' && selectedCount.value === 1 ? props.selectedPersonnel[0] : null);
    if (isSingle && targetP) {
      await exportSinglePersonnelDocx(buf, targetP, null, personnelStore, outputFormat.value, authStore.user);
      visible.value = false;
    } else {
      let list = exportScope.value === 'selected' ? props.selectedPersonnel : (props.allPersonnel?.length > 0 ? props.allPersonnel : personnelStore.personnelList);
      if (!list?.length) return alert('Không có dữ liệu cán bộ!');
      progressTotal.value = list.length;
      await exportMultiplePersonnelZip(buf, list, null, personnelStore, (curr, total) => { progressCurrent.value = curr; progressTotal.value = total; }, outputFormat.value, authStore.user);
      visible.value = false;
    }
  } catch (error) { alert('Lỗi: ' + (error.message || error)); } finally { exporting.value = false; }
};

onMounted(() => loadSampleTemplate());
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

.group-select-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.78rem;
  transition: all 0.15s ease;
}

.group-select-item:hover {
  background: #f1f5f9;
}

.group-selected {
  background: #eff6ff;
  border-color: #93c5fd;
}

.group-fixed {
  background: #f1f5f9;
  border-color: #cbd5e1;
  cursor: not-allowed;
}

.badge-fixed {
  font-size: 0.65rem;
  font-weight: 700;
  background: #fee2e2;
  color: #dc2626;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: auto;
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

.btn-link {
  background: none;
  border: none;
  color: #0284c7;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: underline;
}
</style>
