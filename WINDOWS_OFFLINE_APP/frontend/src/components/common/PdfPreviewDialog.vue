<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="dialogTitle"
    :style="{ width: '92vw', maxWidth: '1120px' }"
    :contentStyle="{ height: '82vh', padding: '0', display: 'flex', flexDirection: 'column' }"
    :closable="true"
    @hide="onClose"
  >
    <!-- Top toolbar inside dialog -->
    <div class="pdf-preview-toolbar">
      <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
        <i class="pi pi-file-pdf" style="color: #ef4444; font-size: 1.2rem; flex-shrink: 0;"></i>
        <div style="min-width: 0;">
          <div style="font-weight: 700; font-size: 0.88rem; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ safeFileName }}
          </div>
          <div style="font-size: 0.72rem; color: #64748b;">
            Xem trực tiếp tài liệu PDF trước khi tải về hoặc in ấn
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
        <Button
          label="Tải về máy"
          icon="pi pi-download"
          severity="primary"
          size="small"
          @click="downloadPdf"
          style="font-size: 0.78rem; font-weight: 700;"
        />
        <Button
          label="In hồ sơ"
          icon="pi pi-print"
          severity="secondary"
          size="small"
          outlined
          @click="printPdf"
          style="font-size: 0.78rem;"
        />
        <Button
          label="Mở tab mới"
          icon="pi pi-external-link"
          severity="secondary"
          size="small"
          text
          @click="openInNewTab"
          style="font-size: 0.78rem;"
        />
        <Button
          icon="pi pi-times"
          severity="secondary"
          size="small"
          text
          @click="visible = false"
          title="Đóng xem trước"
        />
      </div>
    </div>

    <!-- PDF Display iframe -->
    <div class="pdf-preview-viewer">
      <iframe
        v-if="blobUrl"
        ref="pdfIframeRef"
        :src="blobUrl"
        class="pdf-iframe"
        title="Xem trước PDF"
      ></iframe>
      <div v-else class="pdf-loading-state">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #3b82f6;"></i>
        <span style="font-size: 0.85rem; font-weight: 600; color: #cbd5e1; margin-top: 10px;">
          Đang khởi tạo tài liệu PDF...
        </span>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { saveAs } from 'file-saver';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  pdfBlob: {
    type: Object, // Blob
    default: null,
  },
  title: {
    type: String,
    default: 'Hồ sơ Cán bộ',
  },
  fileName: {
    type: String,
    default: 'Ho_so.pdf',
  },
});

const emit = defineEmits(['update:modelValue']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const blobUrl = ref('');
const pdfIframeRef = ref(null);

const dialogTitle = computed(() => {
  return `📄 Xem trước Hồ sơ (PDF) - ${props.title || 'Chi tiết'}`;
});

const safeFileName = computed(() => {
  const name = props.fileName || 'Ho_so.pdf';
  return name.endsWith('.pdf') ? name : `${name}.pdf`;
});

const updateBlobUrl = (blob) => {
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value);
    blobUrl.value = '';
  }
  if (blob) {
    blobUrl.value = URL.createObjectURL(blob);
  }
};

watch(
  () => props.pdfBlob,
  (newBlob) => {
    if (newBlob) {
      updateBlobUrl(newBlob);
    }
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.pdfBlob && !blobUrl.value) {
      updateBlobUrl(props.pdfBlob);
    }
  }
);

const downloadPdf = () => {
  if (props.pdfBlob) {
    saveAs(props.pdfBlob, safeFileName.value);
  }
};

const printPdf = () => {
  if (pdfIframeRef.value && pdfIframeRef.value.contentWindow) {
    try {
      pdfIframeRef.value.contentWindow.focus();
      pdfIframeRef.value.contentWindow.print();
      return;
    } catch (e) {}
  }
  if (blobUrl.value) {
    const printWin = window.open(blobUrl.value, '_blank');
    if (printWin) {
      printWin.focus();
      printWin.print();
    }
  }
};

const openInNewTab = () => {
  if (blobUrl.value) {
    window.open(blobUrl.value, '_blank');
  }
};

const onClose = () => {
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value);
    blobUrl.value = '';
  }
};

onBeforeUnmount(() => {
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value);
  }
});
</script>

<style scoped>
.pdf-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  gap: 12px;
  flex-wrap: wrap;
}

.pdf-preview-viewer {
  flex: 1;
  min-height: 0;
  background: #525659;
  position: relative;
  overflow: hidden;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.pdf-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
