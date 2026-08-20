<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Xuất Hồ sơ Word (.docx) Nâng cao theo Mẫu"
    :style="{ width: '92vw', maxWidth: '1080px' }"
    :breakpoints="{ '960px': '95vw', '640px': '100vw' }"
  >
    <div style="display: grid; grid-template-columns: 1fr 1.15fr; gap: 1.25rem; max-height: 68vh; min-height: 480px;">
      <!-- ========================================== -->
      <!-- CỘT TRÁI: CẤU HÌNH XUẤT & CHỌN FILE MẪU   -->
      <!-- ========================================== -->
      <div style="display: flex; flex-direction: column; gap: 1.25rem; padding-right: 0.5rem; overflow-y: auto;">
        <!-- 1. Phạm vi xuất -->
        <div class="export-box">
          <div class="box-title">
            <i class="pi pi-users" style="color: #0284c7;"></i>
            <span>1. Chọn Phạm vi xuất Cán bộ</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
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
                <strong style="color: #1e293b;">Toàn bộ cán bộ trong hệ thống:</strong>
                <span style="color: #16a34a; margin-left: 4px; font-weight: 700;">{{ totalPersonnelCount }} cán bộ</span>
              </div>
            </label>
          </div>
        </div>

        <!-- 2. Chọn Tệp Mẫu Word (.docx) -->
        <div class="export-box">
          <div class="box-title" style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <i class="pi pi-file-word" style="color: #2563eb;"></i>
              <span>2. Chọn Tệp Mẫu Word (.docx)</span>
            </div>
            <button
              type="button"
              class="btn-link"
              @click="downloadSampleTemplate"
              title="Tải tệp Word mẫu đã có sẵn thẻ tag để tham khảo hoặc chỉnh sửa"
            >
              <i class="pi pi-download"></i> Tải mẫu chuẩn
            </button>
          </div>

          <div style="margin-top: 10px;">
            <input
              ref="fileInputRef"
              type="file"
              accept=".docx"
              style="display: none;"
              @change="handleFileUpload"
            />

            <div
              v-if="!templateFile && !templateBuffer"
              class="drop-zone"
              @click="triggerFileInput"
            >
              <i class="pi pi-cloud-upload" style="font-size: 2rem; color: #3b82f6; margin-bottom: 6px;"></i>
              <div style="font-size: 0.85rem; font-weight: 700; color: #1e293b;">Nhấp để chọn tệp Mẫu Word (.docx)</div>
              <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Chỉ hỗ trợ định dạng Microsoft Word .docx</div>
            </div>

            <div v-else class="file-loaded-box">
              <div style="display: flex; align-items: center; gap: 10px;">
                <i class="pi pi-file-word" style="font-size: 1.8rem; color: #2563eb;"></i>
                <div>
                  <div style="font-size: 0.85rem; font-weight: 700; color: #1e293b;">{{ templateFileName }}</div>
                  <div style="font-size: 0.72rem; color: #16a34a; font-weight: 600;">Đã sẵn sàng xuất dữ liệu</div>
                </div>
              </div>
              <div style="display: flex; gap: 6px;">
                <Button
                  label="Đổi file"
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

        <!-- 3. Tiến trình & Nút Thực hiện -->
        <div style="margin-top: auto; padding-top: 10px;">
          <div v-if="exporting" style="margin-bottom: 12px; background: #eff6ff; padding: 10px 14px; border-radius: 8px; border: 1px solid #bfdbfe;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; color: #1e40af; margin-bottom: 6px;">
              <span>Đang xử lý xuất dữ liệu...</span>
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
            :label="getExportButtonLabel()"
            :icon="exportScope === 'single' ? 'pi pi-file-word' : 'pi pi-folder-open'"
            severity="primary"
            class="w-full"
            :loading="exporting"
            :disabled="!templateBuffer || exporting"
            @click="handleExport"
            style="font-size: 0.92rem; font-weight: 700; padding: 0.75rem 1rem;"
          />
        </div>
      </div>

      <!-- ========================================== -->
      <!-- CỘT PHẢI: BẢNG TRA CỨU MÃ THẺ TAG (CHEAT-SHEET) -->
      <!-- ========================================== -->
      <div style="display: flex; flex-direction: column; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <i class="pi pi-tags" style="color: #7c3aed; font-size: 1rem;"></i>
            <span style="font-size: 0.88rem; font-weight: 700; color: #1e293b;">Bảng Tra cứu Mã Thẻ Tag Word</span>
          </div>
          <span style="font-size: 0.72rem; color: #64748b;">(Bấm để copy dán vào Word)</span>
        </div>

        <!-- Filter & Search Tag -->
        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
          <InputText
            v-model="tagSearch"
            placeholder="Tìm mã thẻ / tên trường..."
            size="small"
            style="flex: 1; font-size: 0.78rem;"
          />
          <select
            v-model="selectedCategory"
            class="tag-cat-select"
            style="font-size: 0.78rem; padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff;"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="personnel">Thông tin Cán bộ</option>
            <option value="relatives">Khối lặp Thân nhân</option>
            <option value="trips">Khối lặp Chuyến đi</option>
            <option value="custom_tables">Bảng lặp tùy chỉnh</option>
            <option value="system">Ngày tháng & Hệ thống</option>
          </select>
        </div>

        <!-- Tags List Container -->
        <div style="flex: 1; overflow-y: auto; padding-right: 4px; display: flex; flex-direction: column; gap: 6px;">
          <div
            v-for="item in filteredTags"
            :key="item.tag"
            class="tag-item-row"
            @click="copyTag(item.tag)"
          >
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                <span class="tag-badge" :class="'tag-badge-' + item.category">{{ getCategoryLabel(item.category) }}</span>
                <strong style="font-size: 0.8rem; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  {{ item.label }}
                </strong>
              </div>
              <code class="tag-code">{{ item.tag }}</code>
            </div>

            <button
              type="button"
              class="btn-copy"
              :class="{ 'btn-copy-success': copiedTag === item.tag }"
            >
              <i :class="copiedTag === item.tag ? 'pi pi-check' : 'pi pi-copy'"></i>
              <span>{{ copiedTag === item.tag ? 'Đã chép!' : 'Chép' }}</span>
            </button>
          </div>

          <div v-if="filteredTags.length === 0" style="text-align: center; color: #94a3b8; padding: 2rem 0; font-size: 0.8rem;">
            Không tìm thấy mã thẻ tag nào phù hợp.
          </div>
        </div>

        <!-- Notice & Guide Footer -->
        <div style="margin-top: 10px; background: #e0f2fe; padding: 8px 12px; border-radius: 8px; font-size: 0.72rem; color: #0369a1; border-left: 3px solid #0284c7; line-height: 1.4;">
          <strong>💡 Hướng dẫn Thẻ Lặp:</strong> Đặt <code>&#123;#than_nhan&#125;</code> ở đầu dòng/hàng và <code>&#123;/than_nhan&#125;</code> ở cuối hàng để Word tự động nhân bản theo số lượng thân nhân!
        </div>
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
import InputText from 'primevue/inputtext';
import { usePersonnelStore } from '@/stores/personnel';
import { saveAs } from 'file-saver';
import {
  exportSinglePersonnelDocx,
  exportMultiplePersonnelZip,
  createSampleDocxTemplateBlob,
} from '@/utils/docxExport';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  targetPerson: {
    type: Object,
    default: null,
  },
  selectedPersonnel: {
    type: Array,
    default: () => [],
  },
  allPersonnel: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);
const personnelStore = usePersonnelStore();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const exportScope = ref('single');
const fileInputRef = ref(null);
const templateFile = ref(null);
const templateBuffer = ref(null);
const templateFileName = ref('');

const exporting = ref(false);
const progressCurrent = ref(0);
const progressTotal = ref(0);

const tagSearch = ref('');
const selectedCategory = ref('all');
const copiedTag = ref('');

const selectedCount = computed(() => props.selectedPersonnel?.length || 0);
const totalPersonnelCount = computed(() => {
  if (props.allPersonnel && props.allPersonnel.length > 0) return props.allPersonnel.length;
  return personnelStore.personnelList.length;
});

watch(
  () => [props.modelValue, props.targetPerson, props.selectedPersonnel],
  ([isOpen, p, selected]) => {
    if (isOpen) {
      if (p) {
        exportScope.value = 'single';
      } else if (selected && selected.length > 0) {
        exportScope.value = 'selected';
      } else {
        exportScope.value = 'all';
      }
      loadLastTemplate();
    }
  },
  { immediate: true }
);

const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const handleFileUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.name.endsWith('.docx')) {
    alert('Vui lòng chọn đúng tệp Microsoft Word định dạng .docx');
    return;
  }

  templateFile.value = file;
  templateFileName.value = file.name;

  const reader = new FileReader();
  reader.onload = (event) => {
    templateBuffer.value = event.target.result;
    try {
      // Lưu tên tệp gần nhất
      localStorage.setItem('lastDocxTemplateName', file.name);
    } catch (err) {}
  };
  reader.readAsArrayBuffer(file);
};

const loadLastTemplate = async () => {
  if (!templateBuffer.value) {
    // Tải mặc định mẫu chuẩn nếu chưa có file nào
    try {
      const sampleBlob = await createSampleDocxTemplateBlob();
      templateBuffer.value = await sampleBlob.arrayBuffer();
      templateFileName.value = 'Mau_so_yeu_ly_lich_chuan.docx';
    } catch (e) {
      console.error('Failed to init sample docx:', e);
    }
  }
};

const downloadSampleTemplate = async () => {
  try {
    const blob = await createSampleDocxTemplateBlob();
    saveAs(blob, 'Mau_Word_Trich_Ngang_Chuan.docx');
  } catch (e) {
    alert('Lỗi tạo mẫu Word: ' + e.message);
  }
};

// Tra cứu thẻ Tag
const allAvailableTags = computed(() => {
  const tags = [];

  // 1. Hệ thống & Ngày tháng
  tags.push(
    { label: 'Số thứ tự', tag: '{stt}', category: 'system' },
    { label: 'Ngày xuất file (DD/MM/YYYY)', tag: '{ngay_hien_tai}', category: 'system' },
    { label: 'Ngày (DD)', tag: '{ngay}', category: 'system' },
    { label: 'Tháng (MM)', tag: '{thang}', category: 'system' },
    { label: 'Năm (YYYY)', tag: '{nam}', category: 'system' },
    { label: 'Tổng số thân nhân', tag: '{so_luong_than_nhan}', category: 'system' },
    { label: 'Tổng số chuyến đi', tag: '{so_luong_chuyen_di}', category: 'system' }
  );

  // 2. Cán bộ (Lấy 100% các cột từ importMappingPersonnel)
  const personnelCols = personnelStore.allAvailablePersonnelColumns || [];
  personnelCols.forEach((col) => {
    if (col.format === 'table_loop' || col.format === 'table_2col') {
      tags.push({
        label: `Bảng lặp: ${col.label}`,
        tag: `{#${col.id}}...{col0}, {col1}...{/${col.id}}`,
        category: 'custom_tables',
      });
    } else {
      tags.push({
        label: col.label,
        tag: `{${col.id}}`,
        category: 'personnel',
      });
    }
  });

  // 3. Khối lặp Thân nhân
  tags.push(
    {
      label: 'Khối/Hàng lặp Thân nhân (Bắt đầu)',
      tag: '{#than_nhan}',
      category: 'relatives',
    },
    {
      label: 'Khối/Hàng lặp Thân nhân (Kết thúc)',
      tag: '{/than_nhan}',
      category: 'relatives',
    }
  );

  const relativeCols = personnelStore.allAvailableRelativeColumns || [];
  relativeCols.forEach((col) => {
    tags.push({
      label: `[Thân nhân] ${col.label}`,
      tag: `{${col.id}}`,
      category: 'relatives',
    });
  });

  // 4. Khối lặp Chuyến đi
  tags.push(
    {
      label: 'Khối/Hàng lặp Chuyến đi (Bắt đầu)',
      tag: '{#chuyen_di}',
      category: 'trips',
    },
    {
      label: 'Khối/Hàng lặp Chuyến đi (Kết thúc)',
      tag: '{/chuyen_di}',
      category: 'trips',
    },
    { label: '[Chuyến đi] Quốc gia đến', tag: '{quoc_gia_den}', category: 'trips' },
    { label: '[Chuyến đi] Mục đích', tag: '{muc_dich}', category: 'trips' },
    { label: '[Chuyến đi] Ngày xuất cảnh', tag: '{ngay_di}', category: 'trips' },
    { label: '[Chuyến đi] Ngày nhập cảnh', tag: '{ngay_ve}', category: 'trips' },
    { label: '[Chuyến đi] Nguồn kinh phí', tag: '{kinh_phi}', category: 'trips' },
    { label: '[Chuyến đi] Số quyết định', tag: '{so_quyet_dinh}', category: 'trips' },
    { label: '[Chuyến đi] Ngày đi được duyệt', tag: '{ngay_di_duoc_duyet}', category: 'trips' },
    { label: '[Chuyến đi] Ngày về được duyệt', tag: '{ngay_ve_duoc_duyet}', category: 'trips' },
    { label: '[Chuyến đi] Ngày gia hạn', tag: '{ngay_gia_han}', category: 'trips' }
  );

  return tags;
});

const filteredTags = computed(() => {
  const q = (tagSearch.value || '').toLowerCase().trim();
  const cat = selectedCategory.value;

  return allAvailableTags.value.filter((item) => {
    const matchCat = cat === 'all' || item.category === cat;
    const matchQ = !q || item.label.toLowerCase().includes(q) || item.tag.toLowerCase().includes(q);
    return matchCat && matchQ;
  });
});

const getCategoryLabel = (cat) => {
  switch (cat) {
    case 'personnel':
      return 'Cán bộ';
    case 'relatives':
      return 'Thân nhân';
    case 'trips':
      return 'Chuyến đi';
    case 'custom_tables':
      return 'Bảng lặp';
    case 'system':
      return 'Hệ thống';
    default:
      return 'Khác';
  }
};

const copyTag = (tag) => {
  navigator.clipboard.writeText(tag);
  copiedTag.value = tag;
  setTimeout(() => {
    if (copiedTag.value === tag) copiedTag.value = '';
  }, 2000);
};

const getExportButtonLabel = () => {
  if (exportScope.value === 'single') {
    return `Xuất file Word: ${props.targetPerson?.name || 'Hồ sơ Cán bộ'}`;
  }
  if (exportScope.value === 'selected') {
    return `Đóng gói ZIP (${selectedCount.value} Cán bộ được chọn)`;
  }
  return `Đóng gói ZIP (Toàn bộ ${totalPersonnelCount.value} Cán bộ)`;
};

const handleExport = async () => {
  if (!templateBuffer.value) {
    alert('Vui lòng chọn hoặc tải lên tệp mẫu Word (.docx)');
    return;
  }

  exporting.value = true;
  progressCurrent.value = 0;

  try {
    if (exportScope.value === 'single' && props.targetPerson) {
      exportSinglePersonnelDocx(
        templateBuffer.value,
        props.targetPerson,
        `Ho_so_${(props.targetPerson.name || 'Can_bo').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}.docx`,
        personnelStore
      );
      visible.value = false;
    } else {
      let list = [];
      if (exportScope.value === 'selected') {
        list = props.selectedPersonnel;
      } else {
        list = (props.allPersonnel && props.allPersonnel.length > 0) ? props.allPersonnel : personnelStore.personnelList;
      }

      if (!list || list.length === 0) {
        alert('Không có dữ liệu cán bộ nào để xuất!');
        return;
      }

      progressTotal.value = list.length;

      await exportMultiplePersonnelZip(
        templateBuffer.value,
        list,
        `Danh_sach_Ho_so_${list.length}_can_bo.zip`,
        personnelStore,
        (curr, total) => {
          progressCurrent.value = curr;
          progressTotal.value = total;
        }
      );
      visible.value = false;
    }
  } catch (error) {
    alert('Lỗi trong quá trình xuất Word:\n' + (error.message || error));
  } finally {
    exporting.value = false;
  }
};

onMounted(() => {
  loadLastTemplate();
});
</script>

<style scoped>
.export-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
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

.btn-link:hover {
  color: #0369a1;
}

.tag-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tag-item-row:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.tag-badge {
  font-size: 0.65rem;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
}

.tag-badge-personnel {
  background: #dbeafe;
  color: #1d4ed8;
}

.tag-badge-relatives {
  background: #f3e8ff;
  color: #6d28d9;
}

.tag-badge-trips {
  background: #dcfce7;
  color: #15803d;
}

.tag-badge-custom_tables {
  background: #fef3c7;
  color: #b45309;
}

.tag-badge-system {
  background: #f1f5f9;
  color: #475569;
}

.tag-code {
  font-family: monospace;
  font-size: 0.76rem;
  color: #dc2626;
  background: #fef2f2;
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid #fee2e2;
  font-weight: 600;
}

.btn-copy {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease;
}

.btn-copy:hover {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.btn-copy-success {
  background: #16a34a !important;
  color: #ffffff !important;
  border-color: #16a34a !important;
}
</style>
