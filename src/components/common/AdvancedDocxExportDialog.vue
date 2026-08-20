<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Xuất Hồ sơ Nâng cao theo Mẫu (Word / PDF)"
    :style="{ width: '1160px', maxWidth: '96vw' }"
    :breakpoints="{ '960px': '95vw', '640px': '100vw' }"
  >
    <div class="docx-export-container">
      <!-- ========================================== -->
      <!-- CỘT TRÁI: CẤU HÌNH XUẤT & CHỌN FILE MẪU   -->
      <!-- ========================================== -->
      <div class="docx-left-panel">
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
                  <div style="font-size: 0.72rem; color: #16a34a; font-weight: 600;">Mẫu có sẵn tích hợp đầy đủ thẻ Cán bộ & Thân nhân</div>
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
                    <div style="font-size: 0.72rem; color: #16a34a; font-weight: 600;">Đã nạp file mẫu tùy biến thành công</div>
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

        <!-- 4. Tiến trình & Nút Thực hiện -->
        <div style="margin-top: auto; padding-top: 8px;">
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
            :label="getExportButtonLabel()"
            :icon="outputFormat === 'pdf' ? 'pi pi-file-pdf' : 'pi pi-file-word'"
            :severity="outputFormat === 'pdf' ? 'danger' : 'primary'"
            class="w-full"
            :loading="exporting"
            :disabled="!effectiveTemplateBuffer || exporting"
            @click="handleExport"
            style="font-size: 0.92rem; font-weight: 700; padding: 0.75rem 1rem;"
          />
        </div>
      </div>

      <!-- ========================================== -->
      <!-- CỘT PHẢI: BẢNG TRA CỨU MÃ THẺ TAG (CHEAT-SHEET) -->
      <!-- ========================================== -->
      <div class="docx-right-panel">
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
import { useAuthStore } from '@/stores/auth';
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
const authStore = useAuthStore();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const outputFormat = ref('docx'); // 'docx' | 'pdf'
const exportScope = ref('single');
const templateSource = ref('sample'); // 'sample' | 'upload'

const fileInputRef = ref(null);
const sampleTemplateBuffer = ref(null);
const customTemplateFile = ref(null);
const customTemplateBuffer = ref(null);
const customTemplateFileName = ref('');

const exporting = ref(false);
const progressCurrent = ref(0);
const progressTotal = ref(0);

const tagSearch = ref('');
const selectedCategory = ref('personnel');
const copiedTag = ref('');

const selectedCount = computed(() => props.selectedPersonnel?.length || 0);
const totalPersonnelCount = computed(() => {
  if (props.allPersonnel && props.allPersonnel.length > 0) return props.allPersonnel.length;
  return personnelStore.personnelList.length;
});

const effectiveTemplateBuffer = computed(() => {
  if (templateSource.value === 'upload') {
    return customTemplateBuffer.value;
  }
  return sampleTemplateBuffer.value;
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
      loadSampleTemplate();
    }
  },
  { immediate: true }
);

const setTemplateSource = (src) => {
  templateSource.value = src;
  if (src === 'upload' && !customTemplateBuffer.value) {
    triggerFileInput();
  }
};

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

  customTemplateFile.value = file;
  customTemplateFileName.value = file.name;
  templateSource.value = 'upload';

  const reader = new FileReader();
  reader.onload = (event) => {
    customTemplateBuffer.value = event.target.result;
  };
  reader.readAsArrayBuffer(file);
};

const loadSampleTemplate = async () => {
  if (!sampleTemplateBuffer.value) {
    try {
      const sampleBlob = await createSampleDocxTemplateBlob();
      sampleTemplateBuffer.value = await sampleBlob.arrayBuffer();
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

  const generateSlug = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  personnelCols.forEach((col) => {
    const colNum = pMap[col.id] || '';
    if (col.format === 'table_loop' || col.format === 'table_2col') {
      tags.push({
        label: `Bảng lặp: ${col.label}`,
        tag: `{#${col.id}}...{col0}, {col1}...{/${col.id}}`,
        category: 'personnel',
        colNum,
      });
    } else if ((col.format === 'checkbox_text' || col.format === 'checkbox') && col.options) {
      // 1. Thẻ chung toàn bộ
      tags.push({
        label: `${col.label} (Đầy đủ cả tên + chi tiết)`,
        tag: `{${col.id}}`,
        category: 'personnel',
        colNum,
      });

      // 2. Thẻ chung: Tên lựa chọn đã tích (VD: ra chữ "Công tác")
      tags.push({
        label: `${col.label} (Tên lựa chọn đã tích)`,
        tag: `{label_${col.id}}`,
        category: 'personnel',
        colNum,
      });

      // 3. Thẻ chung: Nội dung chi tiết text đã nhập (VD: ra chữ "Đi hội thảo...")
      if (col.format === 'checkbox_text') {
        tags.push({
          label: `${col.label} (Nội dung chi tiết đã nhập)`,
          tag: `{detail_${col.id}}`,
          category: 'personnel',
          colNum,
        });
      }

      // 4. Thẻ phân rã từng mục cụ thể
      const subOpts = String(col.options).split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      subOpts.forEach((opt) => {
        const slug = generateSlug(opt);
        if (slug) {
          // Thẻ Đánh dấu tích X
          tags.push({
            label: `${col.label} -> [Tích X ${opt}]`,
            tag: `{is_${col.id}_${slug}}`,
            category: 'personnel',
            colNum,
          });

          // Thẻ Text chi tiết riêng của mục
          if (col.format === 'checkbox_text') {
            tags.push({
              label: `${col.label} -> [Text riêng ${opt}]`,
              tag: `{${col.id}_${slug}}`,
              category: 'personnel',
              colNum,
            });
          }
        }
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
    if ((col.format === 'checkbox_text' || col.format === 'checkbox') && col.options) {
      tags.push({
        label: `${col.label} (Đầy đủ cả tên + chi tiết)`,
        tag: `{${col.id}}`,
        category: 'relatives',
        colNum,
      });

      tags.push({
        label: `${col.label} (Tên lựa chọn đã tích)`,
        tag: `{label_${col.id}}`,
        category: 'relatives',
        colNum,
      });

      if (col.format === 'checkbox_text') {
        tags.push({
          label: `${col.label} (Nội dung chi tiết đã nhập)`,
          tag: `{detail_${col.id}}`,
          category: 'relatives',
          colNum,
        });
      }

      const subOpts = String(col.options).split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      subOpts.forEach((opt) => {
        const slug = generateSlug(opt);
        if (slug) {
          tags.push({
            label: `${col.label} -> [Tích X ${opt}]`,
            tag: `{is_${col.id}_${slug}}`,
            category: 'relatives',
            colNum,
          });

          if (col.format === 'checkbox_text') {
            tags.push({
              label: `${col.label} -> [Text riêng ${opt}]`,
              tag: `{${col.id}_${slug}}`,
              category: 'relatives',
              colNum,
            });
          }
        }
      });
    } else {
      tags.push({
        label: col.label,
        tag: `{${col.id}}`,
        category: 'relatives',
        colNum,
      });
    }
  });

  // 3. Hệ thống & Ngày tháng (Tab 3)
  tags.push(
    { label: 'Họ tên cán bộ xuất file', tag: '{ho_ten_nguoi_xuat}', category: 'system', colNum: 'HT' },
    { label: 'Số thứ tự cán bộ', tag: '{stt}', category: 'system', colNum: 'HT' },
    { label: 'Ngày xuất file (DD/MM/YYYY)', tag: '{ngay_hien_tai}', category: 'system', colNum: 'HT' },
    { label: 'Ngày (DD)', tag: '{ngay}', category: 'system', colNum: 'HT' },
    { label: 'Tháng (MM)', tag: '{thang}', category: 'system', colNum: 'HT' },
    { label: 'Năm (YYYY)', tag: '{nam}', category: 'system', colNum: 'HT' },
    { label: 'Giờ xuất file (HH)', tag: '{gio}', category: 'system', colNum: 'HT' },
    { label: 'Phút xuất file (mm)', tag: '{phut}', category: 'system', colNum: 'HT' },
    { label: 'Thời gian xuất (HH:mm)', tag: '{thoi_gian_xuat}', category: 'system', colNum: 'HT' },
    { label: 'Ngày giờ xuất đầy đủ (DD/MM/YYYY HH:mm)', tag: '{ngay_gio_xuat}', category: 'system', colNum: 'HT' },
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
  const typeLabel = outputFormat.value === 'pdf' ? 'PDF' : 'Word';
  if (exportScope.value === 'single') {
    return `Xuất file ${typeLabel}: ${props.targetPerson?.name || 'Hồ sơ Cán bộ'}`;
  }
  if (exportScope.value === 'selected') {
    return `Đóng gói ZIP ${typeLabel} (${selectedCount.value} Cán bộ được chọn)`;
  }
  return `Đóng gói ZIP ${typeLabel} (Toàn bộ ${totalPersonnelCount.value} Cán bộ)`;
};

const handleExport = async () => {
  const buf = effectiveTemplateBuffer.value;
  if (!buf) {
    alert('Vui lòng chọn hoặc tải lên tệp mẫu Word (.docx)');
    return;
  }

  exporting.value = true;
  progressCurrent.value = 0;

  try {
    if (exportScope.value === 'single' && props.targetPerson) {
      await exportSinglePersonnelDocx(
        buf,
        props.targetPerson,
        null,
        personnelStore,
        outputFormat.value,
        authStore.user
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
        buf,
        list,
        null,
        personnelStore,
        (curr, total) => {
          progressCurrent.value = curr;
          progressTotal.value = total;
        },
        outputFormat.value,
        authStore.user
      );
      visible.value = false;
    }
  } catch (error) {
    alert('Lỗi trong quá trình xuất:\n' + (error.message || error));
  } finally {
    exporting.value = false;
  }
};

onMounted(() => {
  loadSampleTemplate();
});
</script>

<style scoped>
.docx-export-container {
  display: grid;
  grid-template-columns: 1fr 1.05fr;
  gap: 1.25rem;
  max-height: 72vh;
  min-height: 520px;
}

@media (max-width: 900px) {
  .docx-export-container {
    grid-template-columns: 1fr;
  }
}

.docx-left-panel {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding-right: 0.5rem;
  overflow-y: auto;
}

.docx-right-panel {
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  overflow: hidden;
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
