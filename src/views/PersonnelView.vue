<template>
  <div class="app-content">
    <!-- Top-level Tab Switcher between Cán bộ (Cá nhân) & Thân nhân -->
    <div style="display: flex; gap: 8px; margin-bottom: 1rem;">
      <Button
        :label="'1. Quản lý Cán bộ (Cá nhân) (' + personnelStore.personnelList.length + ')'"
        icon="pi pi-user"
        :severity="mainTab === 'canhan' ? 'primary' : 'secondary'"
        :text="mainTab !== 'canhan'"
        size="small"
        @click="mainTab = 'canhan'"
      />
      <Button
        :label="'2. Quản lý Thân nhân (' + personnelStore.relativesList.length + ')'"
        icon="pi pi-users"
        :severity="mainTab === 'thannhan' ? 'primary' : 'secondary'"
        :text="mainTab !== 'thannhan'"
        size="small"
        @click="mainTab = 'thannhan'"
      />
    </div>

    <!-- TAB 1: DANH SÁCH CÁN BỘ (CÁ NHÂN) -->
    <div v-show="mainTab === 'canhan'" class="app-card">
      <!-- Toolbar -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span style="font-size: 1rem; font-weight: 700; color: #1f2937;">
            Danh sách Cán bộ ({{ personnelStore.personnelList.length }} hồ sơ)
          </span>

          <!-- Reset / Đánh lại Mã CB Button -->
          <Button
            v-if="authStore.isAdmin"
            icon="pi pi-refresh"
            label="Đánh lại Mã CB"
            severity="warn"
            text
            size="small"
            @click="personnelStore.renumberPersonnelCodes"
            title="Đánh lại Mã CB liên tục (CB-00001, CB-00002...)"
            style="font-size: 0.8rem;"
          />

          <!-- Bulk delete button -->
          <Button
            v-if="authStore.isAdmin && selectedPersonnel.length > 0"
            :label="'Xóa đã chọn (' + selectedPersonnel.length + ')'"
            icon="pi pi-trash"
            severity="danger"
            size="small"
            @click="handleBulkDelete"
            style="font-size: 0.8rem;"
          />
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <!-- Search input -->
          <InputText
            v-model="searchQuery"
            placeholder="Tìm tên, CCCD, chức vụ..."
            size="small"
            style="width: 170px; font-size: 0.8rem;"
          />

          <!-- Column Selector MultiSelect -->
          <MultiSelect
            v-model="personnelStore.visibleColumns"
            :options="personnelStore.allAvailableColumns"
            optionLabel="label"
            optionValue="id"
            :maxSelectedLabels="1"
            :selectedItemsLabel="'{0} cột được chọn'"
            placeholder="Cột hiển thị"
            size="small"
            appendTo="body"
            :showToggleAll="false"
            :filter="false"
            style="width: 165px; font-size: 0.8rem;"
            @change="onColumnsChange"
          />

          <!-- Import Excel Button -->
          <Button
            label="Import Excel"
            icon="pi pi-upload"
            severity="info"
            outlined
            size="small"
            @click="openImportModal('personnel')"
            style="font-size: 0.8rem;"
          />

          <!-- Direct Full Export Button -->
          <Button
            :label="selectedPersonnel.length > 0 ? `Xuất Excel (${selectedPersonnel.length} đã chọn)` : 'Xuất Excel Cán bộ'"
            icon="pi pi-file-excel"
            severity="secondary"
            outlined
            size="small"
            @click="handleExportPersonnelFull"
            style="font-size: 0.8rem;"
          />

          <!-- Add Button -->
          <Button
            label="Thêm Cán bộ"
            icon="pi pi-plus"
            severity="success"
            size="small"
            @click="openCreateDialog"
            style="font-size: 0.8rem;"
          />
        </div>
      </div>

      <!-- PrimeVue DataTable with Fixed Column Widths & Centered Actions -->
      <DataTable
        v-model:selection="selectedPersonnel"
        :value="filteredPersonnel"
        dataKey="id"
        paginator
        :rows="15"
        :rowsPerPageOptions="[10, 15, 25, 50]"
        :loading="personnelStore.loading"
        responsiveLayout="scroll"
        stripedRows
        class="p-datatable-sm"
        tableStyle="min-width: 60rem; table-layout: fixed;"
        @row-click="onRowClick"
      >
        <Column selectionMode="multiple" headerClass="col-center" bodyClass="col-center" :headerStyle="{ width: '48px', minWidth: '48px' }" :bodyStyle="{ width: '48px', minWidth: '48px' }" />
        <Column field="stt" header="STT" headerClass="col-center" bodyClass="col-center" :headerStyle="{ width: '55px', minWidth: '55px' }" :bodyStyle="{ width: '55px', minWidth: '55px' }">
          <template #body="{ index }">
            <span style="font-weight: 600; color: #4b5563;">{{ index + 1 }}</span>
          </template>
        </Column>
        <Column
          v-for="col in activeColumns"
          :key="col.id"
          :field="col.id"
          :header="col.label"
          sortable
          :headerClass="col.id === 'code' || col.id === 'birthYear' || col.id === 'cccd' ? 'col-left' : 'col-left'"
          :bodyClass="col.id === 'code' || col.id === 'birthYear' || col.id === 'cccd' ? 'col-left' : 'col-left'"
          :headerStyle="{ width: col.width || '160px', minWidth: col.width || '160px' }"
          :bodyStyle="{ width: col.width || '160px', minWidth: col.width || '160px' }"
        >
          <template #body="{ data }">
            <!-- Code column -->
            <template v-if="col.id === 'code'">
              <span style="font-family: monospace; font-weight: 700; color: #374151; padding-left: 2px;">
                {{ data.code || formatPersonnelCode(data.id) }}
              </span>
            </template>

            <!-- Name column -->
            <template v-else-if="col.id === 'name'">
              <strong style="color: #1f2937; cursor: pointer;">{{ data.name }}</strong>
            </template>

            <!-- Department column -->
            <template v-else-if="col.id === 'departmentId' || col.id === 'departmentName'">
              <span class="badge-pill badge-green">
                {{ personnelStore.getDepartmentName(data.departmentId) || data.departmentName || 'Chưa phân bổ' }}
              </span>
            </template>

            <!-- Default value rendering -->
            <template v-else>
              <span>{{ getDisplayValue(data, col.id) }}</span>
            </template>
          </template>
        </Column>

        <!-- Actions column (Centered) -->
        <Column headerClass="col-center" bodyClass="col-center" :headerStyle="{ width: '150px', minWidth: '150px' }" :bodyStyle="{ width: '150px', minWidth: '150px' }">
          <template #header>
            <div style="text-align: center; width: 100%; font-weight: 700;">THAO TÁC</div>
          </template>
          <template #body="{ data }">
            <div class="table-actions">
              <Button
                label="Chi tiết"
                size="small"
                outlined
                severity="info"
                @click.stop="openEditDialog(data)"
              />
              <Button
                v-if="authStore.isAdmin"
                label="Xóa"
                size="small"
                outlined
                severity="danger"
                @click.stop="handleDeleteOne(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- TAB 2: DANH SÁCH THÂN NHÂN -->
    <div v-show="mainTab === 'thannhan'" class="app-card">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1rem; font-weight: 700; color: #1f2937;">
            Danh sách Thân nhân có yếu tố nước ngoài ({{ flattenedRelatives.length }} người)
          </span>
          <Button
            v-if="selectedRelatives.length > 0"
            :label="`Xóa (${selectedRelatives.length} đã chọn)`"
            icon="pi pi-trash"
            severity="danger"
            size="small"
            @click="handleBulkDeleteRelatives"
            style="font-size: 0.8rem;"
          />
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <InputText
            v-model="relativeSearchQuery"
            placeholder="Tìm tên thân nhân, cán bộ..."
            size="small"
            style="width: 200px; font-size: 0.8rem;"
          />

          <!-- Column Selector for Relatives -->
          <MultiSelect
            v-model="personnelStore.visibleRelativeColumns"
            :options="personnelStore.allAvailableRelativeColumns"
            optionLabel="label"
            optionValue="id"
            :maxSelectedLabels="1"
            :selectedItemsLabel="'{0} cột được chọn'"
            placeholder="Cột hiển thị"
            size="small"
            appendTo="self"
            :showToggleAll="false"
            :filter="false"
            style="width: 165px; font-size: 0.8rem;"
          />

          <!-- Import Relatives Button -->
          <Button
            label="Import Thân nhân"
            icon="pi pi-upload"
            severity="info"
            outlined
            size="small"
            @click="openImportModal('relative')"
            style="font-size: 0.8rem;"
          />

          <!-- Export Relatives Button -->
          <Button
            :label="selectedRelatives.length > 0 ? `Xuất Excel (${selectedRelatives.length} đã chọn)` : 'Xuất Excel Thân nhân'"
            icon="pi pi-file-excel"
            severity="secondary"
            outlined
            size="small"
            @click="handleExportRelativesFull"
            style="font-size: 0.8rem;"
          />

          <!-- Add Relative Button -->
          <Button
            label="Thêm Thân nhân"
            icon="pi pi-plus"
            severity="success"
            size="small"
            @click="openAddRelativeDialog"
            style="font-size: 0.8rem;"
          />
        </div>
      </div>

      <DataTable
        v-model:selection="selectedRelatives"
        :value="filteredRelatives"
        paginator
        :rows="15"
        :rowsPerPageOptions="[10, 15, 25, 50]"
        responsiveLayout="scroll"
        stripedRows
        class="p-datatable-sm"
        tableStyle="min-width: 60rem; table-layout: fixed;"
      >
        <Column selectionMode="multiple" :headerStyle="{ width: '45px', minWidth: '45px' }" :bodyStyle="{ width: '45px', minWidth: '45px' }" />
        <Column field="stt" header="STT" headerClass="col-center" bodyClass="col-center" :headerStyle="{ width: '55px', minWidth: '55px' }" :bodyStyle="{ width: '55px', minWidth: '55px' }" />
        <Column field="code" header="Mã TN" sortable :headerStyle="{ width: '110px', minWidth: '110px' }">
          <template #body="{ data, index }">
            <span class="badge-code">{{ data.code || ('TN-' + String(data.id || (index + 1)).slice(-5).padStart(5, '0')) }}</span>
          </template>
        </Column>
        <Column field="parentName" header="Cán bộ liên quan" sortable :headerStyle="{ width: '200px', minWidth: '200px' }">
          <template #body="{ data }">
            <strong style="cursor: pointer; color: #1f2937;" @click="openEditDialog(data.parentPerson)">{{ data.parentName }}</strong>
            <div style="font-size: 0.75rem; color: #6b7280;">{{ data.parentDepartment }}</div>
          </template>
        </Column>
        <Column field="relationshipName" header="Mối quan hệ" sortable :headerStyle="{ width: '130px', minWidth: '130px' }">
          <template #body="{ data }">
            <span class="badge-pill badge-purple">{{ data.relationshipName || '-' }}</span>
          </template>
        </Column>
        <Column field="relativeName" header="Họ và tên thân nhân" sortable :headerStyle="{ width: '180px', minWidth: '180px' }" />
        <Column field="birthYear" header="Năm sinh" sortable :headerStyle="{ width: '100px', minWidth: '100px' }" />
        <Column field="countryName" header="Quốc gia" sortable :headerStyle="{ width: '130px', minWidth: '130px' }">
          <template #body="{ data }">
            <span class="badge-pill badge-blue">{{ data.countryName || '-' }}</span>
          </template>
        </Column>
        <Column field="currentAddress" header="Nơi cư trú" sortable :headerStyle="{ width: '180px', minWidth: '180px' }" />
        <Column field="occupation" header="Nghề nghiệp / Nơi làm việc" sortable :headerStyle="{ width: '200px', minWidth: '200px' }" />
        
        <!-- Actions column (Centered with Chi tiết + Xóa) -->
        <Column headerClass="col-center" bodyClass="col-center" :headerStyle="{ width: '150px', minWidth: '150px' }" :bodyStyle="{ width: '150px', minWidth: '150px' }">
          <template #header>
            <div style="text-align: center; width: 100%; font-weight: 700;">THAO TÁC</div>
          </template>
          <template #body="{ data }">
            <div class="table-actions">
              <Button
                label="Chi tiết"
                size="small"
                outlined
                severity="info"
                @click="openEditDialog(data.parentPerson)"
              />
              <Button
                label="Xóa"
                size="small"
                outlined
                severity="danger"
                @click.stop="handleDeleteRelative(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Edit/Create Dialog -->
    <PersonnelDialog
      v-model="isDialogOpen"
      :personData="selectedPerson"
      @saved="onPersonSaved"
      @deleted="onPersonDeleted"
    />

    <!-- Advanced Export Modal -->
    <Dialog v-model:visible="isExportOpen" modal header="Tùy chọn Xuất Dữ liệu Excel" :style="{ width: '560px' }">
      <div style="display: flex; flex-direction: column; gap: 1.25rem; padding-top: 8px;">
        <!-- Scope -->
        <div>
          <label style="font-size: 0.85rem; font-weight: 700; color: #1f2937; margin-bottom: 6px; display: block;">
            1. Phạm vi cán bộ xuất dữ liệu:
          </label>
          <div style="display: flex; gap: 16px; font-size: 0.85rem;">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="radio" value="all" v-model="exportScope" />
              <span>Tất cả hồ sơ ({{ personnelStore.personnelList.length }} cán bộ)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;" :style="{ opacity: selectedPersonnel.length === 0 ? 0.5 : 1 }">
              <input type="radio" value="selected" v-model="exportScope" :disabled="selectedPersonnel.length === 0" />
              <span>Chỉ các cán bộ đã chọn ({{ selectedPersonnel.length }} cán bộ)</span>
            </label>
          </div>
        </div>

        <!-- Dynamic Groups Selection -->
        <div>
          <label style="font-size: 0.85rem; font-weight: 700; color: #1f2937; margin-bottom: 6px; display: block;">
            2. Chọn các Khối dữ liệu cần xuất (Tự động chia thành các Sheet):
          </label>
          <div style="display: flex; flex-direction: column; gap: 8px; background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; max-height: 240px; overflow-y: auto;">
            <div
              v-for="(group, gIdx) in exportGroupsList"
              :key="gIdx"
              style="display: flex; align-items: center; justify-content: space-between; padding: 4px 0;"
            >
              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; cursor: pointer; flex: 1;">
                <input type="checkbox" v-model="group.enabled" style="accent-color: #2e7d32;" />
                <strong>{{ group.title }}</strong>
              </label>
              <span style="font-size: 0.72rem; color: #6b7280; background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
                {{ group.type === 'relatives' ? `${flattenedRelatives.length} thân nhân` : `${group.columnsCount} cột` }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isExportOpen = false" />
        <Button
          label="Tiến hành Xuất Excel"
          icon="pi pi-file-excel"
          severity="success"
          size="small"
          @click="executeAdvancedExport"
        />
      </template>
    </Dialog>

    <!-- Modern Apple Clean Import Excel Modal -->
    <Dialog
      v-model:visible="isImportOpen"
      modal
      :header="currentImportType === 'personnel' ? 'Import Hồ sơ Cán bộ từ Excel' : 'Import Thân nhân từ Excel (Gộp dữ liệu)'"
      :style="{ width: '680px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 1.25rem; padding-top: 8px;">
        <!-- Notice box -->
        <div style="padding: 10px 14px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #2e7d32; font-size: 0.82rem; color: #1b5e20;">
          <template v-if="currentImportType === 'personnel'">
            Hệ thống hỗ trợ import file <b>.xlsx, .xls, .csv</b> gồm đầy đủ các khối trường thông tin cán bộ. Nếu Mã CB đã có, hệ thống sẽ cập nhật thông tin tương ứng.
          </template>
          <template v-else>
            Hệ thống sẽ <b>tự động ghép thân nhân vào cán bộ tương ứng</b> theo Mã CB hoặc Họ tên. Dữ liệu thân nhân sẽ được <b>gộp thêm (append)</b>, bảo toàn danh sách cũ.
          </template>
        </div>

        <!-- Big Dropzone Box -->
        <div
          style="border: 2px dashed #d1d5db; border-radius: 12px; padding: 2rem 1.5rem; text-align: center; background: #fcfdfc; cursor: pointer; transition: all 0.2s ease;"
          @click="$refs.importFileInput.click()"
          @dragover.prevent
          @drop.prevent="onFileDrop"
        >
          <input type="file" ref="importFileInput" accept=".xlsx, .xls, .csv" @change="onImportFileSelected" style="display: none;" />
          
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 16px; background: #e8f5e9; color: #2e7d32; margin-bottom: 12px;">
            <i class="pi pi-file-excel" style="font-size: 1.75rem;"></i>
          </div>

          <div style="font-size: 0.95rem; font-weight: 700; color: #1f2937; margin-bottom: 4px;">
            {{ selectedFileName || 'Kéo thả tệp Excel vào đây hoặc nhấp để tải lên' }}
          </div>
          <div style="font-size: 0.78rem; color: #6b7280; margin-bottom: 12px;">
            Định dạng hỗ trợ: Microsoft Excel (.xlsx, .xls), CSV (.csv)
          </div>

          <div style="display: inline-flex; gap: 8px;">
            <Button
              label="Chọn tệp từ máy tính"
              icon="pi pi-folder-open"
              size="small"
              severity="primary"
              @click.stop="$refs.importFileInput.click()"
            />
            <Button
              label="Tải File Mẫu Excel Đầy Đủ"
              icon="pi pi-download"
              size="small"
              severity="secondary"
              outlined
              @click.stop="currentImportType === 'personnel' ? downloadPersonnelTemplate(personnelStore.importMappingPersonnel) : downloadRelativeTemplate(personnelStore.importMappingRelative)"
            />
          </div>
        </div>

        <!-- Preview Table if rows loaded -->
        <div v-if="importPreviewRows.length > 0" style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; background: #ffffff;">
          <div style="padding: 0.6rem 1rem; background: #f9fafb; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #1f2937;">
              Xem trước dữ liệu (Tìm thấy {{ importPreviewRows.length }} dòng dữ liệu)
            </span>
            <span class="badge-pill badge-green" style="font-size: 0.75rem;">Sẵn sàng Import</span>
          </div>

          <div style="max-height: 180px; overflow: auto; padding: 0.5rem;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
              <tbody>
                <tr v-for="(r, idx) in importPreviewRows.slice(0, 5)" :key="idx" style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 6px 8px; font-weight: 600; color: #6b7280; width: 40px;">#{{ idx + 1 }}</td>
                  <td style="padding: 6px 8px; font-weight: 600; color: #1f2937;">{{ r[1] || r[0] || '-' }}</td>
                  <td style="padding: 6px 8px; color: #4b5563;">{{ r[2] || '-' }}</td>
                  <td style="padding: 6px 8px; color: #6b7280;">{{ r[3] || '-' }}</td>
                  <td style="padding: 6px 8px; color: #6b7280;">{{ r[4] || '-' }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="importPreviewRows.length > 5" style="text-align: center; padding: 6px; font-size: 0.72rem; color: #6b7280;">
              ...và {{ importPreviewRows.length - 5 }} dòng tiếp theo sẽ được xử lý.
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
          <span style="font-size: 0.78rem; color: #6b7280;">
            {{ importPreviewRows.length > 0 ? `Đã chọn ${importPreviewRows.length} dòng` : 'Chưa chọn tệp' }}
          </span>
          <div style="display: flex; gap: 8px;">
            <Button label="Hủy" severity="secondary" text size="small" @click="isImportOpen = false" />
            <Button
              :label="currentImportType === 'personnel' ? `Bắt đầu Import (${importPreviewRows.length} hồ sơ)` : `Bắt đầu Gộp (${importPreviewRows.length} thân nhân)`"
              icon="pi pi-check"
              severity="success"
              size="small"
              :loading="importing"
              :disabled="importPreviewRows.length === 0"
              @click="executeImport"
            />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Dialog from 'primevue/dialog';
import apiClient from '@/api/client';
import { usePersonnelStore } from '@/stores/personnel';
import { useAuthStore } from '@/stores/auth';
import { formatPersonnelCode } from '@/utils/formatters';
import {
  exportToExcel,
  exportMultiSheetExcel,
  exportFullPersonnelExcel,
  exportFullRelativesExcel,
  downloadPersonnelTemplate,
  downloadRelativeTemplate,
  parseExcelFile,
} from '@/utils/excel';
import { createPersonnel } from '@/api/personnel';
import { logActivity } from '@/api/audit';
import PersonnelDialog from '@/components/personnel/PersonnelDialog.vue';

const personnelStore = usePersonnelStore();
const authStore = useAuthStore();

const mainTab = ref('canhan'); // 'canhan' or 'thannhan'
const searchQuery = ref('');
const relativeSearchQuery = ref('');
const selectedPersonnel = ref([]);
const selectedRelatives = ref([]);
const isDialogOpen = ref(false);
const selectedPerson = ref(null);

// Advanced Export Modal
const isExportOpen = ref(false);
const exportScope = ref('all'); // 'all' or 'selected'
const exportSections = ref({
  basic: true,
  trips: true,
  relatives: true,
  notes: true,
});

// Import Modal State
const isImportOpen = ref(false);
const currentImportType = ref('personnel'); // 'personnel' or 'relative'
const importing = ref(false);
const importPreviewRows = ref([]);
const importFileInput = ref(null);
const selectedFileName = ref('');

onMounted(async () => {
  if (personnelStore.personnelList.length === 0) {
    await personnelStore.init();
  }
});

const activeColumns = computed(() => {
  const map = {};
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id) map[c.id] = c;
    });
  });

  return personnelStore.visibleColumns.map((id) => {
    const cfg = map[id];
    if (cfg && cfg.label) {
      return {
        id: cfg.id,
        label: cfg.label,
        width: '160px',
      };
    }
    const found = personnelStore.allAvailableColumns.find((c) => c.id === id);
    return found || { id, label: id, width: '160px' };
  });
});

const activeRelativeColumns = computed(() => {
  const map = {};
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id) map[c.id] = c;
    });
  });

  return (personnelStore.visibleRelativeColumns || []).map((id) => {
    const cfg = map[id];
    if (cfg && cfg.label) {
      return {
        id: cfg.id,
        label: cfg.label,
        width: '160px',
      };
    }
    const found = personnelStore.allAvailableRelativeColumns.find((c) => c.id === id);
    return found || { id, label: id, width: '160px' };
  });
});

const filteredPersonnel = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return personnelStore.personnelList;
  return personnelStore.personnelList.filter((p) => {
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.cccd && p.cccd.toLowerCase().includes(q)) ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.position && p.position.toLowerCase().includes(q)) ||
      (p.birthYear && String(p.birthYear).includes(q))
    );
  });
});

const flattenedRelatives = computed(() => {
  const pMap = {};
  personnelStore.personnelList.forEach((p) => {
    pMap[p.id] = p;
    if (p.code) pMap[p.code] = p;
  });

  let stt = 1;
  return personnelStore.relativesList.map((r, idx) => {
    const parent = pMap[r.personnelId] || pMap[r.personnelCode] || null;
    const formattedCode = r.code && r.code.startsWith('TN-') && !isNaN(Number(r.code.replace('TN-', '')))
      ? r.code
      : `TN-${String(idx + 1).padStart(5, '0')}`;

    return {
      stt: stt++,
      ...r,
      code: formattedCode,
      parentPerson: parent,
      parentName: parent?.name || r.personnelName || 'Chưa liên kết',
      parentDepartment: parent ? personnelStore.getDepartmentName(parent.departmentId) : (r.departmentName || '-'),
    };
  });
});

const filteredRelatives = computed(() => {
  const q = relativeSearchQuery.value.trim().toLowerCase();
  if (!q) return flattenedRelatives.value;
  return flattenedRelatives.value.filter((r) => {
    return (
      (r.relativeName && r.relativeName.toLowerCase().includes(q)) ||
      (r.parentName && r.parentName.toLowerCase().includes(q)) ||
      (r.relationshipName && r.relationshipName.toLowerCase().includes(q)) ||
      (r.countryName && r.countryName.toLowerCase().includes(q))
    );
  });
});

const getDisplayValue = (person, colId) => {
  if (!person) return '-';
  let val = person[colId];
  if (val === undefined || val === null || val === '') {
    if (person.custom_data && typeof person.custom_data === 'object') {
      val = person.custom_data[colId];
    }
  }
  if (val === undefined || val === null || val === '') return '-';
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map((x) => (typeof x === 'object' ? x.name || JSON.stringify(x) : x)).join(', ') || '-';
    }
    return val.name || JSON.stringify(val) || '-';
  }
  return String(val);
};

const onColumnsChange = () => {
  localStorage.setItem('vue_visible_columns', JSON.stringify(personnelStore.visibleColumns));
};

const openCreateDialog = () => {
  selectedPerson.value = null;
  isDialogOpen.value = true;
};

const openEditDialog = (person) => {
  if (!person) return;
  selectedPerson.value = person;
  isDialogOpen.value = true;
};

const onRowClick = (event) => {
  openEditDialog(event.data);
};

const handleDeleteOne = async (person) => {
  if (!confirm(`Bạn có chắc chắn muốn xóa cán bộ: "${person.name}"?`)) return;
  await personnelStore.deletePerson(person);
};

const handleBulkDelete = async () => {
  const ids = selectedPersonnel.value.map((p) => p.id);
  if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn ${ids.length} cán bộ đã chọn không?`)) return;
  await personnelStore.deleteMultiple(ids);
  selectedPersonnel.value = [];
};

const handleExportPersonnelFull = () => {
  const target = selectedPersonnel.value.length > 0
    ? selectedPersonnel.value
    : personnelStore.personnelList;

  if (target.length === 0) {
    alert('Không có dữ liệu cán bộ để xuất!');
    return;
  }

  exportFullPersonnelExcel(target, personnelStore.importMappingPersonnel, personnelStore.getDepartmentName);
};

const handleExportRelativesFull = () => {
  const list = selectedRelatives.value.length > 0 ? selectedRelatives.value : flattenedRelatives.value;
  if (list.length === 0) {
    alert('Không có dữ liệu thân nhân để xuất!');
    return;
  }

  exportFullRelativesExcel(list, personnelStore.importMappingRelative);
};

const handleBulkDeleteRelatives = async () => {
  const count = selectedRelatives.value.length;
  if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn ${count} thân nhân đã chọn không?`)) return;
  for (const r of selectedRelatives.value) {
    await personnelStore.deleteRelative(r);
  }
  selectedRelatives.value = [];
};

const handleDeleteRelative = async (rel) => {
  if (!confirm(`Bạn có chắc chắn muốn xóa thân nhân: "${rel.relativeName || rel.name}" không?`)) return;
  await personnelStore.deleteRelative(rel);
};

const openAddRelativeDialog = () => {
  if (personnelStore.personnelList.length === 0) {
    alert('Vui lòng tạo hồ sơ Cán bộ trước khi thêm thân nhân!');
    return;
  }
  selectedPerson.value = personnelStore.personnelList[0];
  isDialogOpen.value = true;
};

const handleExportRelatives = () => {
  const exportData = flattenedRelatives.value.map((r) => ({
    'STT': r.stt,
    'Mã CB': r.personnelId || '',
    'Cán bộ liên quan': r.parentName,
    'Phòng ban': r.parentDepartment,
    'Mối quan hệ': r.relationshipName,
    'Họ và tên thân nhân': r.relativeName,
    'Năm sinh': r.birthYear,
    'Số CCCD': r.cccd || '',
    'Quốc gia': r.countryName,
    'Nơi cư trú': r.currentAddress || '',
    'Nghề nghiệp': r.occupation || '',
    'Thời gian ở NN': r.timeAbroad || '',
    'Cơ quan ở NN': r.unitAbroad || '',
  }));
  exportToExcel(exportData, 'Danh_sach_Than_nhan', 'Thân nhân');
};

const openImportModal = (type = 'personnel') => {
  currentImportType.value = type;
  importPreviewRows.value = [];
  selectedFileName.value = '';
  isImportOpen.value = true;
};

const onFileDrop = (e) => {
  const files = e.dataTransfer.files;
  if (files && files[0]) {
    handleFile(files[0]);
  }
};

const onImportFileSelected = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  handleFile(file);
};

const handleFile = async (file) => {
  selectedFileName.value = file.name;
  try {
    const rows = await parseExcelFile(file);
    importPreviewRows.value = rows.filter((r) => r && r.length > 0);
  } catch (err) {
    alert('Lỗi đọc tệp Excel: ' + err.message);
  }
};

const executeImport = async () => {
  if (importPreviewRows.value.length === 0) return;
  importing.value = true;
  let count = 0;
  try {
    let startIdx = 0;
    const firstRowStr = importPreviewRows.value[0]?.join(' ').toLowerCase() || '';
    if (firstRowStr.includes('họ và tên') || firstRowStr.includes('họ tên') || firstRowStr.includes('stt') || firstRowStr.includes('mã cb')) {
      startIdx = 1;
    }

    if (currentImportType.value === 'personnel') {
      for (let i = startIdx; i < importPreviewRows.value.length; i++) {
        const row = importPreviewRows.value[i];
        if (!row || row.length === 0) continue;
        const name = String(row[1] || row[2] || '').trim();
        if (!name || name.toLowerCase() === 'họ và tên') continue;

        const newPerson = {
          id: 'CB-' + Date.now() + '-' + i,
          code: String(row[1] || '').startsWith('CB') ? String(row[1]) : 'CB-' + Date.now() + '-' + i,
          name: String(row[2] || row[1] || ''),
          otherName: String(row[3] || ''),
          birthYear: String(row[4] || row[3] || ''),
          ethnicity: String(row[5] || 'Kinh'),
          religion: String(row[6] || 'Không'),
          cccd: String(row[7] || row[11] || ''),
          position: String(row[9] || row[8] || ''),
          hometown: String(row[10] || ''),
          thuongTru: String(row[11] || ''),
          tamTru: String(row[12] || ''),
          passportPersonal: String(row[13] || ''),
          passportOfficial: String(row[14] || ''),
          tcctResult: String(row[15] || ''),
          trips: [],
          relatives: [],
          flags: {},
          custom_data: {},
        };
        await createPersonnel(newPerson);
        count++;
      }
      await logActivity('Import Excel Cán bộ', `Đã import thành công ${count} hồ sơ cán bộ`);
    } else {
      const pMap = {};
      personnelStore.personnelList.forEach((p) => {
        if (p.id) pMap[p.id.toLowerCase()] = p;
        if (p.code) pMap[p.code.toLowerCase()] = p;
        if (p.name) pMap[p.name.toLowerCase().trim()] = p;
        if (p.cccd) pMap[p.cccd.toLowerCase().trim()] = p;
      });

      for (let i = startIdx; i < importPreviewRows.value.length; i++) {
        const row = importPreviewRows.value[i];
        if (!row || row.length === 0) continue;

        const codeOrName = String(row[1] || row[2] || '').toLowerCase().trim();
        const parentPerson = pMap[codeOrName] || pMap[String(row[2] || '').toLowerCase().trim()] || null;

        const relativeName = String(row[4] || row[3] || row[1] || '').trim();
        if (!relativeName || relativeName.toLowerCase() === 'họ và tên thân nhân') continue;

        const pId = parentPerson ? parentPerson.id : (String(row[1] || '').startsWith('CB') ? String(row[1]) : 'CB-UNKNOWN');

        const newRel = {
          id: 'rel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          personnelId: pId,
          personnelName: parentPerson?.name || String(row[2] || ''),
          relationshipName: String(row[3] || 'Thân nhân'),
          relativeName,
          birthYear: String(row[5] || ''),
          cccd: String(row[6] || ''),
          currentAddress: String(row[7] || ''),
          occupation: String(row[8] || ''),
          countryName: String(row[9] || ''),
          timeAbroad: String(row[10] || ''),
          unitAbroad: String(row[11] || ''),
          fundingName: String(row[12] || ''),
          marriedToForeigner: String(row[13] || 'Không').toLowerCase().includes('có') ? 1 : 0,
          workInForeignCompany: String(row[14] || 'Không').toLowerCase().includes('có') ? 1 : 0,
        };

        await apiClient.post('/items/appendix2', newRel);
        count++;
      }
      await logActivity('Import Excel Thân nhân', `Đã import và gộp ${count} thân nhân vào hồ sơ cán bộ`);
    }

    await personnelStore.fetchPersonnel();
    alert(`Import hoàn tất thành công ${count} bản ghi!`);
    isImportOpen.value = false;
  } catch (err) {
    alert('Lỗi trong quá trình import: ' + err.message);
  } finally {
    importing.value = false;
  }
};

const onPersonSaved = () => {};
const onPersonDeleted = () => {};
</script>
