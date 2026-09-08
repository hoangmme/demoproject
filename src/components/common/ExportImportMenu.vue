<template>
  <div class="header-menu-wrapper" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    <Button
      label="Xuất / Nhập"
      icon="pi pi-download"
      severity="secondary"
      outlined
      size="small"
      @click="toggleMenu"
      style="font-size: 0.8rem;"
    />

    <div v-show="isOpen" class="header-menu-dropdown data-menu-dropdown" @click.stop>
      <!-- 1. Nhập Excel (Wizard 4 Bước) -->
      <div v-if="showImport" class="menu-action-item" @click="handleImport">
        <div class="action-icon-box" style="background: #e0f2fe; color: #0284c7;">
          <i class="pi pi-upload"></i>
        </div>
        <div>
          <div class="menu-action-title">
            Import Excel {{ tableTitle }} (Wizard 4 Bước)
          </div>
          <div class="menu-action-sub">Tải dữ liệu từ tệp Excel .xlsx vào hệ thống</div>
        </div>
      </div>

      <!-- 2. Xuất Hồ sơ PDF / Word -->
      <div v-if="showPdf" class="menu-action-item" @click="handleExportPdf">
        <div class="action-icon-box" style="background: #fee2e2; color: #dc2626;">
          <i class="pi pi-file-pdf"></i>
        </div>
        <div>
          <div class="menu-action-title">
            {{ selectedCount > 0 ? `Xuất Hồ sơ PDF (${selectedCount} đã chọn)` : `Xuất Hồ sơ ${tableTitle} (PDF / Word)` }}
          </div>
          <div class="menu-action-sub">Xuất hồ sơ chi tiết theo mẫu chuẩn hoặc tải lên</div>
        </div>
      </div>

      <!-- 3. Xuất danh sách Excel (.xlsx) -->
      <div v-if="showExcel" class="menu-action-item" @click="handleExportExcel">
        <div class="action-icon-box" style="background: #dcfce7; color: #16a34a;">
          <i class="pi pi-file-excel"></i>
        </div>
        <div>
          <div class="menu-action-title">Xuất danh sách Excel (.xlsx)</div>
          <div class="menu-action-sub">Tải bảng dữ liệu hiện tại về máy tính</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Button from 'primevue/button';

const props = defineProps({
  tableTitle: {
    type: String,
    default: 'Bảng dữ liệu',
  },
  selectedCount: {
    type: Number,
    default: 0,
  },
  showImport: {
    type: Boolean,
    default: true,
  },
  showPdf: {
    type: Boolean,
    default: true,
  },
  showExcel: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['import', 'export-pdf', 'export-excel']);

const isOpen = ref(false);
let closeTimer = null;

const onMouseEnter = () => {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  isOpen.value = true;
};

const onMouseLeave = () => {
  closeTimer = setTimeout(() => {
    isOpen.value = false;
  }, 220);
};

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

const closeMenu = () => {
  isOpen.value = false;
};

const handleImport = () => {
  closeMenu();
  emit('import');
};

const handleExportPdf = () => {
  closeMenu();
  emit('export-pdf');
};

const handleExportExcel = () => {
  closeMenu();
  emit('export-excel');
};

onMounted(() => {
  window.addEventListener('click', closeMenu);
});

onUnmounted(() => {
  window.removeEventListener('click', closeMenu);
});
</script>

<style scoped>
.header-menu-wrapper {
  position: relative;
  display: inline-block;
}

.header-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  z-index: 1100;
  padding: 8px;
  margin-top: 4px;
}

/* Invisible bridge so mouse hover doesn't break between button and dropdown */
.header-menu-dropdown::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 0;
  right: 0;
  height: 12px;
  background: transparent;
}

.data-menu-dropdown {
  width: 290px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-action-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.menu-action-item:hover {
  background: #f1f5f9;
}

.action-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.menu-action-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
}

.menu-action-sub {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 2px;
  line-height: 1.2;
}
</style>
