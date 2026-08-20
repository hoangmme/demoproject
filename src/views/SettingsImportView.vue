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

      <button
        type="button"
        @click="activeTab = 'tags'"
        :style="{
          padding: '8px 16px',
          fontWeight: 700,
          fontSize: '0.85rem',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: activeTab === 'tags' ? '#7c3aed' : '#6b7280',
          borderBottom: activeTab === 'tags' ? '3px solid #7c3aed' : '3px solid transparent',
          marginBottom: '-6px'
        }"
      >
        <i class="pi pi-tags" style="margin-right: 6px;"></i>
        Bảng Tra cứu Mã Thẻ Tag (Word / PDF)
      </button>
    </div>

    <!-- Main Content: Tab 1 & 2 (Cấu hình Cột Cán bộ & Thân nhân) -->
    <div v-if="activeTab === 'personnel' || activeTab === 'relative'" class="app-card" style="padding: 1.25rem;">
      <!-- Khung Cấu hình Khóa Định Danh & Khóa Liên Kết -->
      <div style="margin-bottom: 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px;">
        <!-- Khi ở Tab Cán bộ -->
        <div v-if="activeTab === 'personnel'" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: #fee2e2; display: flex; align-items: center; justify-content: center;">
              <i class="pi pi-key" style="color: #dc2626; font-size: 1.1rem;"></i>
            </div>
            <div>
              <div style="font-size: 0.86rem; font-weight: 700; color: #1e293b;">
                Cột Khóa Định danh Duy nhất (Primary Unique Key) của Cán bộ:
              </div>
              <div style="font-size: 0.73rem; color: #64748b; margin-top: 2px;">
                Dùng để định danh chống trùng lặp cán bộ và làm khóa móc nối liên kết với thân nhân.
              </div>
            </div>
          </div>

          <div style="min-width: 280px;">
            <select v-model="personnelKeyField" class="custom-key-select">
              <option v-for="col in availablePersonnelCols" :key="col.id" :value="col.id">
                {{ col.label }} (mã: {{ col.id }})
              </option>
            </select>
          </div>
        </div>

        <!-- Khi ở Tab Thân nhân -->
        <div v-else style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <i class="pi pi-link" style="color: #0284c7; font-size: 0.95rem;"></i>
              <strong style="color: #1e293b; font-size: 0.82rem;">1. Cột Liên kết Cán bộ liên quan (Parent Link Key):</strong>
            </div>
            <select v-model="relativeParentKeyField" class="custom-key-select">
              <option v-for="col in availableRelativeCols" :key="col.id" :value="col.id">
                {{ col.label }} (mã: {{ col.id }})
              </option>
            </select>
            <span style="font-size: 0.7rem; color: #64748b;">(Cột chứa số CCCD / Mã định danh của Cán bộ cha/mẹ mà thân nhân trực thuộc)</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <i class="pi pi-id-card" style="color: #16a34a; font-size: 0.95rem;"></i>
              <strong style="color: #1e293b; font-size: 0.82rem;">2. Cột Định danh riêng Thân nhân (Relative Unique Key):</strong>
            </div>
            <select v-model="relativeKeyField" class="custom-key-select">
              <option v-for="col in availableRelativeCols" :key="col.id" :value="col.id">
                {{ col.label }} (mã: {{ col.id }})
              </option>
            </select>
            <span style="font-size: 0.7rem; color: #64748b;">(Cột chứa số CCCD / Mã định danh riêng của từng Thân nhân)</span>
          </div>
        </div>
      </div>

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
      <div style="max-height: 60vh; overflow-y: auto; padding-right: 6px;">
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

    <!-- Main Content: Tab 3 (Bảng Tra cứu Mã Thẻ Tag Word / PDF) -->
    <div v-else-if="activeTab === 'tags'" class="app-card" style="padding: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="pi pi-tags" style="color: #7c3aed; font-size: 1.2rem;"></i>
            <h2 style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0;">Bảng Tra cứu Toàn bộ Mã Thẻ Tag Word (.docx) & PDF</h2>
          </div>
          <p style="font-size: 0.8rem; color: #64748b; margin: 4px 0 0 0;">
            Tra cứu nhanh và sao chép 1-click các mã thẻ tag để dán vào file mẫu Microsoft Word của bạn.
          </p>
        </div>

        <Button
          label="Tải tệp Mẫu Word chuẩn (.docx)"
          icon="pi pi-download"
          severity="info"
          outlined
          size="small"
          @click="downloadSampleTemplate"
          style="font-size: 0.82rem; font-weight: 600;"
        />
      </div>

      <!-- Filters & Category Navigation -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
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
            <i class="pi pi-cog"></i> Thẻ Hệ thống & Ngày giờ ({{ systemTagsCount }} thẻ)
          </button>
          <button
            type="button"
            class="cheat-tab-btn"
            :class="{ 'cheat-tab-active': selectedCategory === 'all' }"
            @click="selectedCategory = 'all'"
          >
            Tất cả ({{ allAvailableTags.length }} thẻ)
          </button>
        </div>

        <div style="min-width: 260px;">
          <InputText
            v-model="tagSearch"
            placeholder="🔍 Tìm mã thẻ, số cột, tên trường..."
            size="small"
            style="width: 100%; font-size: 0.82rem;"
          />
        </div>
      </div>

      <!-- Tags Table Grid -->
      <div style="max-height: 62vh; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
          <thead style="background: #f8fafc; position: sticky; top: 0; z-index: 10; border-bottom: 1.5px solid #e2e8f0;">
            <tr>
              <th style="padding: 10px 12px; text-align: left; font-weight: 700; color: #475569; width: 100px;">Vị trí Cột</th>
              <th style="padding: 10px 12px; text-align: left; font-weight: 700; color: #475569; width: 120px;">Phân loại</th>
              <th style="padding: 10px 12px; text-align: left; font-weight: 700; color: #475569;">Tên Trường Dữ liệu</th>
              <th style="padding: 10px 12px; text-align: left; font-weight: 700; color: #475569;">Cú pháp Thẻ Tag Word</th>
              <th style="padding: 10px 12px; text-align: center; font-weight: 700; color: #475569; width: 100px;">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredTags"
              :key="item.tag"
              style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;"
              class="tag-table-row"
            >
              <td style="padding: 10px 12px;">
                <span v-if="item.colNum" class="col-num-badge">{{ item.colNum }}</span>
                <span v-else style="color: #94a3b8; font-size: 0.75rem;">—</span>
              </td>
              <td style="padding: 10px 12px;">
                <span class="tag-badge" :class="'tag-badge-' + item.category">
                  {{ getCategoryLabel(item.category) }}
                </span>
              </td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">
                {{ item.label }}
              </td>
              <td style="padding: 10px 12px;">
                <code class="tag-code">{{ item.tag }}</code>
              </td>
              <td style="padding: 10px 12px; text-align: center;">
                <button
                  type="button"
                  class="btn-copy"
                  :class="{ 'btn-copy-success': copiedTag === item.tag }"
                  @click="copyTag(item.tag)"
                >
                  <i :class="copiedTag === item.tag ? 'pi pi-check' : 'pi pi-copy'"></i>
                  <span>{{ copiedTag === item.tag ? 'Đã chép!' : 'Chép' }}</span>
                </button>
              </td>
            </tr>
            <tr v-if="filteredTags.length === 0">
              <td colspan="5" style="text-align: center; padding: 2.5rem; color: #94a3b8;">
                Không tìm thấy mã thẻ tag nào phù hợp với từ khóa "{{ tagSearch }}".
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Quick Guide Footer -->
      <div style="margin-top: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="background: #eff6ff; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #2563eb; font-size: 0.76rem; color: #1e40af; line-height: 1.45;">
          <strong>💡 Thẻ Lặp Thân nhân:</strong> Đặt <code>&#123;#than_nhan&#125;</code> ở đầu dòng/hàng bảng và <code>&#123;/than_nhan&#125;</code> ở cuối hàng. Hệ thống sẽ tự động nhân bản theo số lượng thân nhân!
        </div>
        <div style="background: #fdf4ff; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #c026d3; font-size: 0.76rem; color: #86198f; line-height: 1.45;">
          <strong>💡 Thẻ Lặp Chuyến đi:</strong> Đặt <code>&#123;#xuatnhapcanh&#125;</code> ở đầu hàng và <code>&#123;/xuatnhapcanh&#125;</code> ở cuối hàng để tự động in danh sách các chuyến đi nước ngoài!
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
import { computeColumnIndexMap } from '@/utils/formatters';
import { createSampleDocxTemplateBlob } from '@/utils/docxExport';
import { saveAs } from 'file-saver';

const personnelStore = usePersonnelStore();

const activeTab = ref('personnel');
const saving = ref(false);

const personnelGroups = ref([]);
const relativeGroups = ref([]);

const personnelKeyField = ref('cccdparent');
const relativeParentKeyField = ref('cccdparent');
const relativeKeyField = ref('cccdthannhan');

const tagSearch = ref('');
const selectedCategory = ref('personnel');
const copiedTag = ref('');

const availablePersonnelCols = computed(() => {
  const cols = [];
  (personnelGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') {
        cols.push({ id: c.id, label: c.label || c.id });
      }
    });
  });
  return cols;
});

const availableRelativeCols = computed(() => {
  const cols = [];
  (relativeGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') {
        cols.push({ id: c.id, label: c.label || c.id });
      }
    });
  });
  return cols;
});

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
  personnelKeyField.value = personnelStore.getPersonnelKeyField();
  relativeParentKeyField.value = personnelStore.getRelativeParentKeyField();
  relativeKeyField.value = personnelStore.getRelativeKeyField();
});

const currentGroups = computed(() => {
  return activeTab.value === 'personnel' ? personnelGroups.value : relativeGroups.value;
});

// Tra cứu thẻ Tag (Tab 3)
const personnelColMap = computed(() => {
  return computeColumnIndexMap(personnelGroups.value || []);
});

const relativeColMap = computed(() => {
  return computeColumnIndexMap(relativeGroups.value || []);
});

const allAvailableTags = computed(() => {
  const tags = [];
  const pMap = personnelColMap.value;
  const rMap = relativeColMap.value;

  // 1. Cán bộ
  (personnelGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((col) => {
      const colNum = pMap[col.id] || '';
      if (col.format === 'table_loop') {
        tags.push({
          label: `Bảng lặp: ${col.label}`,
          tag: `{#${col.id}}...{col0}, {col1}...{/${col.id}}`,
          category: 'personnel',
          colNum,
        });
      } else if ((col.format === 'checkbox_text' || col.format === 'checkbox') && col.options) {
        tags.push({
          label: `${col.label} (Toàn bộ tên + nội dung)`,
          tag: `{${col.id}}`,
          category: 'personnel',
          colNum,
        });
        tags.push({
          label: `${col.label} -> Tên mục đã tích chọn`,
          tag: `{label_${col.id}}`,
          category: 'personnel',
          colNum,
        });
        if (col.format === 'checkbox_text') {
          tags.push({
            label: `${col.label} -> Chi tiết Text đã nhập`,
            tag: `{detail_${col.id}}`,
            category: 'personnel',
            colNum,
          });
        }
        const opts = String(col.options).split(',').map((s) => s.trim()).filter(Boolean);
        opts.forEach((optName) => {
          const optSlug = generateSlug(optName);
          if (optSlug) {
            tags.push({
              label: `${col.label} -> [Tích X ${optName}]`,
              tag: `{is_${col.id}_${optSlug}}`,
              category: 'personnel',
              colNum,
            });
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
  });

  // 2. Thân nhân
  (relativeGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((col) => {
      const colNum = rMap[col.id] || '';
      if ((col.format === 'checkbox_text' || col.format === 'checkbox') && col.options) {
        tags.push({
          label: `[Thân nhân] ${col.label} (Đầy đủ)`,
          tag: `{${col.id}}`,
          category: 'relatives',
          colNum,
        });
        tags.push({
          label: `[Thân nhân] ${col.label} -> Tên mục đã chọn`,
          tag: `{label_${col.id}}`,
          category: 'relatives',
          colNum,
        });
        if (col.format === 'checkbox_text') {
          tags.push({
            label: `[Thân nhân] ${col.label} -> Chi tiết`,
            tag: `{detail_${col.id}}`,
            category: 'relatives',
            colNum,
          });
        }
      } else {
        tags.push({
          label: `[Thân nhân] ${col.label}`,
          tag: `{${col.id}}`,
          category: 'relatives',
          colNum,
        });
      }
    });
  });

  // 3. Khối lặp Chuyến đi & Thân nhân
  tags.push(
    { label: 'Khối lặp Chuyến đi nước ngoài (Bắt đầu)', tag: '{#xuatnhapcanh}', category: 'trips', colNum: 'Chuyến đi' },
    { label: 'Khối lặp Chuyến đi nước ngoài (Kết thúc)', tag: '{/xuatnhapcanh}', category: 'trips', colNum: 'Chuyến đi' },
    { label: '[Chuyến đi] Quốc gia đến', tag: '{countryName}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Mục đích chuyến đi', tag: '{label_purpose}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Chi tiết mục đích', tag: '{detail_purpose}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Ngày xuất cảnh', tag: '{departureDate}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Ngày nhập cảnh', tag: '{arrivalDate}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Nguồn kinh phí', tag: '{label_funding2}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Số quyết định', tag: '{decisionNumber}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Ngày ký quyết định', tag: '{decisionDate}', category: 'trips', colNum: '' },
    { label: 'Khối lặp Thân nhân (Bắt đầu)', tag: '{#than_nhan}', category: 'relatives', colNum: 'Thân nhân' },
    { label: 'Khối lặp Thân nhân (Kết thúc)', tag: '{/than_nhan}', category: 'relatives', colNum: 'Thân nhân' }
  );

  // 4. Hệ thống & Ngày giờ
  tags.push(
    { label: 'Ngày hiện tại (DD)', tag: '{ngay}', category: 'system', colNum: 'HT' },
    { label: 'Tháng hiện tại (MM)', tag: '{thang}', category: 'system', colNum: 'HT' },
    { label: 'Năm hiện tại (YYYY)', tag: '{nam}', category: 'system', colNum: 'HT' },
    { label: 'Giờ xuất file (HH)', tag: '{gio}', category: 'system', colNum: 'HT' },
    { label: 'Phút xuất file (mm)', tag: '{phut}', category: 'system', colNum: 'HT' },
    { label: 'Thời gian xuất (HH:mm)', tag: '{thoi_gian_xuat}', category: 'system', colNum: 'HT' },
    { label: 'Ngày giờ xuất đầy đủ (DD/MM/YYYY HH:mm)', tag: '{ngay_gio_xuat}', category: 'system', colNum: 'HT' },
    { label: 'Họ tên Người xuất file', tag: '{ho_ten_nguoi_xuat}', category: 'system', colNum: 'HT' },
    { label: 'Số thứ tự cán bộ', tag: '{stt}', category: 'system', colNum: 'HT' }
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

const downloadSampleTemplate = async () => {
  try {
    const blob = await createSampleDocxTemplateBlob();
    saveAs(blob, 'Mau_Word_Trich_Ngang_Chuan.docx');
  } catch (e) {
    alert('Lỗi tạo mẫu Word: ' + e.message);
  }
};

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

const validateUniqueIds = () => {
  const pSeen = new Map();
  for (const g of personnelGroups.value) {
    for (const c of (g.columns || [])) {
      if (c.id && c.id !== 'stt') {
        if (pSeen.has(c.id)) {
          return `Trong Cấu hình Cán bộ: Mã ID "${c.id}" (${c.label}) bị trùng với "${pSeen.get(c.id)}". Vui lòng đổi lại mã ID khác.`;
        }
        pSeen.set(c.id, c.label || c.id);
      }
    }
  }

  const rSeen = new Map();
  for (const g of relativeGroups.value) {
    for (const c of (g.columns || [])) {
      if (c.id && c.id !== 'stt') {
        if (rSeen.has(c.id)) {
          return `Trong Cấu hình Thân nhân: Mã ID "${c.id}" (${c.label}) bị trùng với "${rSeen.get(c.id)}". Vui lòng đổi lại mã ID khác.`;
        }
        rSeen.set(c.id, c.label || c.id);
      }
    }
  }

  // 3. Cảnh báo nếu trùng ID giữa Cán bộ và Thân nhân (trừ trường khóa liên kết cha mẹ)
  for (const [rId, rLabel] of rSeen.entries()) {
    if (pSeen.has(rId) && rId !== 'cccdparent' && rId !== relativeParentKeyField.value) {
      return `Mã ID "${rId}" đang tồn tại ở cả bảng Cán bộ (${pSeen.get(rId)}) và Thân nhân (${rLabel}). Vui lòng đặt mã khác nhau để xuất báo cáo không bị nhầm lẫn.`;
    }
  }

  return null;
};

const saveConfig = async () => {
  const errorMsg = validateUniqueIds();
  if (errorMsg) {
    alert('⚠️ KHÔNG THỂ LƯU CẤU HÌNH:\n\n' + errorMsg);
    return;
  }

  saving.value = true;
  try {
    const keyConfig = {
      personnelKeyField: personnelKeyField.value || 'cccdparent',
      relativeParentKeyField: relativeParentKeyField.value || 'cccdparent',
      relativeKeyField: relativeKeyField.value || 'cccdthannhan',
    };
    await saveAppSettings('system_key_config', keyConfig);
    personnelStore.systemKeyConfig = keyConfig;

    if (activeTab.value === 'personnel') {
      await saveAppSettings('mapping_config_personnel', personnelGroups.value);
      await saveAppSettings('importMappingPersonnel', personnelGroups.value);
      personnelStore.importMappingPersonnel = personnelGroups.value;
    } else {
      await saveAppSettings('mapping_config_relative', relativeGroups.value);
      await saveAppSettings('importMappingRelative', relativeGroups.value);
      personnelStore.importMappingRelative = relativeGroups.value;
    }
    alert('Đã lưu cấu hình cột và khóa liên kết thành công!');
  } catch (err) {
    alert('Lỗi lưu cấu hình: ' + (err.message || err));
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.custom-key-select {
  width: 100%;
  padding: 6px 10px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
  background-color: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-key-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

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
