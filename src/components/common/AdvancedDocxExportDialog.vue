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

        <!-- Cheat-sheet Category Tabs (Khớp cấu trúc Cấu hình Cột) -->
        <div style="display: flex; gap: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px; flex-wrap: wrap;">
          <button
            type="button"
            class="cheat-tab-btn"
            :class="{ 'cheat-tab-active': selectedCategory === 'personnel' }"
            @click="selectedCategory = 'personnel'"
          >
            <i class="pi pi-user"></i> Cán bộ ({{ personnelTagsCount }} cột)
          </button>
          <button
            type="button"
            class="cheat-tab-btn"
            :class="{ 'cheat-tab-active': selectedCategory === 'relatives' }"
            @click="selectedCategory = 'relatives'"
          >
            <i class="pi pi-users"></i> Thân nhân ({{ relativeTagsCount }} cột)
          </button>
          <button
            type="button"
            class="cheat-tab-btn"
            :class="{ 'cheat-tab-active': selectedCategory === 'system' }"
            @click="selectedCategory = 'system'"
          >
            <i class="pi pi-cog"></i> Thẻ Hệ thống bổ trợ ({{ systemTagsCount }} thẻ)
          </button>
          <button
            type="button"
            class="cheat-tab-btn"
            :class="{ 'cheat-tab-active': selectedCategory === 'all' }"
            @click="selectedCategory = 'all'"
          >
            Tất cả
          </button>
        </div>

        <!-- Filter & Search Tag -->
        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
          <InputText
            v-model="tagSearch"
            placeholder="Tìm mã thẻ, số cột, tên trường..."
            size="small"
            style="flex: 1; font-size: 0.78rem;"
          />
        </div>

        <!-- Tags List Container -->
        <div style="flex: 1; overflow-y: auto; padding-right: 4px; display: flex; flex-direction: column; gap: 6px;">
          <div
            v-for="item in filteredTags"
            :key="item.tag"
            class="tag-item-row"
            @click="copyTag(item.tag)"
          >
            <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
              <!-- Col Number Badge -->
              <span v-if="item.colNum" class="col-num-badge" style="font-size: 0.68rem; padding: 2px 6px; flex-shrink: 0;">
                {{ item.colNum }}
              </span>
              <span v-else class="tag-badge" :class="'tag-badge-' + item.category" style="flex-shrink: 0;">
                {{ getCategoryLabel(item.category) }}
              </span>

              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 0.8rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  {{ item.label }}
                </div>
                <code class="tag-code">{{ item.tag }}</code>
              </div>
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
import { computeColumnIndexMap } from '@/utils/formatters';
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
const selectedCategory = ref('personnel'); // default to 'personnel'
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
      localStorage.setItem('lastDocxTemplateName', file.name);
    } catch (err) {}
  };
  reader.readAsArrayBuffer(file);
};

const loadLastTemplate = async () => {
  if (!templateBuffer.value) {
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
const personnelColMap = computed(() => {
  return computeColumnIndexMap(personnelStore.importMappingPersonnel || []);
});

const relativeColMap = computed(() => {
  return computeColumnIndexMap(personnelStore.importMappingRelative || []);
});

const allAvailableTags = computed(() => {
  const tags = [];
  const pMap = personnelColMap.value;
  const rMap = relativeColMap.value;

  // 1. Cán bộ (Lấy 100% các cột từ importMappingPersonnel + Chuyến đi)
  const personnelCols = (personnelStore.allAvailablePersonnelColumns && personnelStore.allAvailablePersonnelColumns.length > 0)
    ? personnelStore.allAvailablePersonnelColumns
    : (personnelStore.allAvailableColumns || []);

  personnelCols.forEach((col) => {
    const colNum = pMap[col.id] || '';
    if (col.format === 'table_loop' || col.format === 'table_2col') {
      tags.push({
        label: `Bảng lặp: ${col.label}`,
        tag: `{#${col.id}}...{col0}, {col1}...{/${col.id}}`,
        category: 'personnel',
        colNum,
      });
    } else {
      tags.push({
        label: col.label,
        tag: `{${col.id}}`,
        category: 'personnel',
        colNum,
      });
    }
  });

  // Chuyến đi nằm trong Hồ sơ Cán bộ (Tab 1)
  tags.push(
    {
      label: 'Khối/Hàng lặp Chuyến đi (Bắt đầu)',
      tag: '{#chuyen_di}',
      category: 'personnel',
      colNum: 'Khối',
    },
    {
      label: 'Khối/Hàng lặp Chuyến đi (Kết thúc)',
      tag: '{/chuyen_di}',
      category: 'personnel',
      colNum: 'Khối',
    },
    { label: '[Chuyến đi] Quốc gia đến', tag: '{quoc_gia_den}', category: 'personnel', colNum: 'Đi' },
    { label: '[Chuyến đi] Mục đích', tag: '{muc_dich}', category: 'personnel', colNum: 'Đi' },
    { label: '[Chuyến đi] Ngày xuất cảnh', tag: '{ngay_di}', category: 'personnel', colNum: 'Đi' },
    { label: '[Chuyến đi] Ngày nhập cảnh', tag: '{ngay_ve}', category: 'personnel', colNum: 'Đi' },
    { label: '[Chuyến đi] Nguồn kinh phí', tag: '{kinh_phi}', category: 'personnel', colNum: 'Đi' },
    { label: '[Chuyến đi] Số quyết định', tag: '{so_quyet_dinh}', category: 'personnel', colNum: 'Đi' },
    { label: '[Chuyến đi] Ngày đi được duyệt', tag: '{ngay_di_duoc_duyet}', category: 'personnel', colNum: 'Đi' },
    { label: '[Chuyến đi] Ngày về được duyệt', tag: '{ngay_ve_duoc_duyet}', category: 'personnel', colNum: 'Đi' },
    { label: '[Chuyến đi] Ngày gia hạn', tag: '{ngay_gia_han}', category: 'personnel', colNum: 'Đi' }
  );

  // 2. Khối lặp Thân nhân (Tab 2)
  tags.push(
    {
      label: 'Khối/Hàng lặp Thân nhân (Bắt đầu)',
      tag: '{#than_nhan}',
      category: 'relatives',
      colNum: 'Khối',
    },
    {
      label: 'Khối/Hàng lặp Thân nhân (Kết thúc)',
      tag: '{/than_nhan}',
      category: 'relatives',
      colNum: 'Khối',
    }
  );

  const relativeCols = personnelStore.allAvailableRelativeColumns || [];
  relativeCols.forEach((col) => {
    const colNum = rMap[col.id] || '';
    tags.push({
      label: col.label,
      tag: `{${col.id}}`,
      category: 'relatives',
      colNum,
    });
  });

  // 3. Hệ thống & Ngày tháng (Tab 3)
  tags.push(
    { label: 'Số thứ tự cán bộ', tag: '{stt}', category: 'system', colNum: 'HT' },
    { label: 'Ngày xuất file (DD/MM/YYYY)', tag: '{ngay_hien_tai}', category: 'system', colNum: 'HT' },
    { label: 'Ngày (DD)', tag: '{ngay}', category: 'system', colNum: 'HT' },
    { label: 'Tháng (MM)', tag: '{thang}', category: 'system', colNum: 'HT' },
    { label: 'Năm (YYYY)', tag: '{nam}', category: 'system', colNum: 'HT' },
    { label: 'Tổng số thân nhân', tag: '{so_luong_than_nhan}', category: 'system', colNum: 'HT' },
    { label: 'Tổng số chuyến đi', tag: '{so_luong_chuyen_di}', category: 'system', colNum: 'HT' }
  );

  return tags;
});

const personnelTagsCount = computed(() => {
  return allAvailableTags.value.filter((t) => t.category === 'personnel').length;
});

const relativeTagsCount = computed(() => {
  return allAvailableTags.value.filter((t) => t.category === 'relatives').length;
});

const systemTagsCount = computed(() => {
  return allAvailableTags.value.filter((t) => t.category === 'system').length;
});

const filteredTags = computed(() => {
  const q = (tagSearch.value || '').toLowerCase().trim();
  const cat = selectedCategory.value;

  return allAvailableTags.value.filter((item) => {
    let matchCat = false;
    if (cat === 'all') matchCat = true;
    else matchCat = item.category === cat;

    const matchQ =
      !q ||
      item.label.toLowerCase().includes(q) ||
      item.tag.toLowerCase().includes(q) ||
      (item.colNum && String(item.colNum).toLowerCase().includes(q));

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

.cheat-tab-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s ease;
}

.cheat-tab-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.cheat-tab-active {
  background: #0284c7 !important;
  color: #ffffff !important;
  border-color: #0284c7 !important;
  box-shadow: 0 1px 3px rgba(2, 132, 199, 0.25);
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
