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
            title="Tải tệp Word mẫu chuẩn đã có sẵn thẻ tag để tham khảo hoặc chỉnh sửa"
          >
            <i class="pi pi-download"></i> Tải mẫu chuẩn (.docx)
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
            <i class="pi pi-bookmark"></i> Mẫu Chuẩn Hệ Thống
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

          <!-- Nguồn 1: Mẫu chuẩn hệ thống -->
          <div v-if="templateSource === 'sample'" class="file-loaded-box">
            <div style="display: flex; align-items: center; gap: 10px;">
              <i class="pi pi-file-word" style="font-size: 1.8rem; color: #2563eb;"></i>
              <div>
                <div style="font-size: 0.84rem; font-weight: 700; color: #1e293b;">Mau_so_yeu_ly_lich_chuan.docx</div>
                <div style="font-size: 0.72rem; color: #16a34a; font-weight: 600;">Mẫu chuẩn tích hợp đầy đủ thẻ Cán bộ & Thân nhân</div>
              </div>
            </div>
            <Button
              label="Tải về xem"
              icon="pi pi-download"
              size="small"
              text
              severity="info"
              @click="downloadSampleTemplate"
              style="font-size: 0.75rem; padding: 2px 6px;"
            />
          </div>

          <!-- Nguồn 2: Tải lên mẫu riêng -->
          <div v-else>
            <div
              v-if="!customTemplateBuffer"
              class="drop-zone"
              @click="triggerFileInput"
            >
              <i class="pi pi-cloud-upload" style="font-size: 2.2rem; color: #3b82f6; margin-bottom: 6px;"></i>
              <div style="font-size: 0.88rem; font-weight: 700; color: #1e293b;">Nhấp hoặc Kéo thả tệp Mẫu Word (.docx) vào đây</div>
              <div style="font-size: 0.74rem; color: #64748b; margin-top: 3px;">Hệ thống sẽ điền dữ liệu vào các thẻ tag bạn đã đặt trong file</div>
            </div>

            <div v-else class="file-loaded-box">
              <div style="display: flex; align-items: center; gap: 10px;">
                <i class="pi pi-file-word" style="font-size: 1.8rem; color: #2563eb;"></i>
                <div>
                  <div style="font-size: 0.84rem; font-weight: 700; color: #1e293b;">{{ customTemplateFileName }}</div>
                  <div style="font-size: 0.72rem; color: #16a34a; font-weight: 600;">Đã nạp file mẫu tùy biến thành công (tự động lưu)</div>
                </div>
              </div>
              <Button
                label="Đổi file khác"
                icon="pi pi-sync"
                size="small"
                outlined
                severity="secondary"
                @click="triggerFileInput"
                style="font-size: 0.75rem; padding: 3px 8px;"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Tiến trình & Nút Thực hiện Xuất -->
      <div style="margin-top: 4px;">
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
          class="w-full"
          :loading="exporting"
          :disabled="!effectiveTemplateBuffer || exporting"
          @click="handleExport"
          style="font-size: 0.92rem; font-weight: 700; padding: 0.75rem 1rem;"
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
  createSampleDocxTemplateBlob,
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
const templateSource = ref('sample');

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

const loadSavedTemplate = async () => {
  try {
    const cachedB64 = localStorage.getItem('cached_custom_docx_template');
    const cachedName = localStorage.getItem('cached_custom_docx_name');
    if (cachedB64 && cachedName) {
      customTemplateBuffer.value = base64ToArrayBuffer(cachedB64);
      customTemplateFileName.value = cachedName;
      templateSource.value = 'upload';
      return;
    }
    const serverTemplate = await getAppSettings('custom_docx_template', null);
    if (serverTemplate?.base64) {
      customTemplateBuffer.value = base64ToArrayBuffer(serverTemplate.base64);
      customTemplateFileName.value = serverTemplate.fileName || 'Mau_Word_tuy_bien.docx';
      templateSource.value = 'upload';
    }
  } catch (err) { console.warn('Failed to load saved template:', err); }
};

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
  };
  reader.readAsArrayBuffer(file);
};

const loadSampleTemplate = async () => {
  if (!sampleTemplateBuffer.value) {
    try {
      const sampleBlob = await createSampleDocxTemplateBlob();
      sampleTemplateBuffer.value = await sampleBlob.arrayBuffer();
    } catch (e) { console.error('Failed to init sample docx:', e); }
  }
};

const downloadSampleTemplate = async () => {
  try {
    const blob = await createSampleDocxTemplateBlob();
    saveAs(blob, 'Mau_Word_Trich_Ngang_Chuan.docx');
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
