<template>
  <div class="app-content">
    <div class="app-card">
      <!-- Toolbar -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span style="font-size: 1rem; font-weight: 700; color: #1f2937;">
            Danh sách Cán bộ ({{ personnelStore.personnelList.length }} hồ sơ)
          </span>

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
            style="width: 180px; font-size: 0.8rem;"
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
            style="width: 175px; font-size: 0.8rem;"
            @change="onColumnsChange"
          />

          <!-- Import Excel Button -->
          <Button
            label="Import Excel"
            icon="pi pi-upload"
            severity="info"
            outlined
            size="small"
            @click="openImportModal"
            style="font-size: 0.8rem;"
          />

          <!-- Export Button -->
          <Button
            label="Xuất Excel"
            icon="pi pi-file-excel"
            severity="secondary"
            outlined
            size="small"
            @click="handleExportExcel"
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

      <!-- PrimeVue DataTable -->
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
        tableStyle="min-width: 50rem"
        @row-click="onRowClick"
      >
        <Column selectionMode="multiple" headerStyle="width: 3rem" />

        <Column
          v-for="col in activeColumns"
          :key="col.id"
          :field="col.id"
          :header="col.label"
          sortable
        >
          <template #body="{ data }">
            <!-- Code column -->
            <template v-if="col.id === 'code'">
              <span style="font-family: monospace; font-weight: 600; color: #4b5563;">
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

        <!-- Actions column -->
        <Column header="Thao tác" headerStyle="width: 145px; min-width: 145px; text-align: right;" bodyStyle="width: 145px; min-width: 145px; text-align: right;">
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

    <!-- Edit/Create Dialog -->
    <PersonnelDialog
      v-model="isDialogOpen"
      :personData="selectedPerson"
      @saved="onPersonSaved"
      @deleted="onPersonDeleted"
    />

    <!-- Import Excel Modal -->
    <Dialog v-model:visible="isImportOpen" modal header="Import Cán bộ từ file Excel (.xlsx, .csv)" :style="{ width: '600px' }">
      <div style="display: flex; flex-direction: column; gap: 1rem; padding-top: 8px;">
        <p style="font-size: 0.85rem; color: #4b5563;">
          Chọn tệp Excel hoặc CSV chứa danh sách cán bộ để hệ thống tự động import vào cơ sở dữ liệu.
        </p>

        <div>
          <input type="file" ref="importFileInput" accept=".xlsx, .xls, .csv" @change="onImportFileSelected" style="display: none;" />
          <Button
            label="Chọn tệp Excel từ máy tính"
            icon="pi pi-file-excel"
            severity="primary"
            outlined
            @click="$refs.importFileInput.click()"
            style="width: 100%;"
          />
        </div>

        <div v-if="importPreviewRows.length > 0" style="padding: 0.75rem; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="font-size: 0.85rem; font-weight: 700; color: #1f2937; margin-bottom: 6px;">
            Đã đọc được {{ importPreviewRows.length }} dòng dữ liệu từ tệp:
          </div>
          <div style="max-height: 150px; overflow-y: auto; font-size: 0.75rem; color: #6b7280;">
            <div v-for="(r, i) in importPreviewRows.slice(0, 5)" :key="i" style="padding: 2px 0;">
              • Dòng {{ i + 1 }}: {{ r[1] || r[0] || 'Dòng trống' }}
            </div>
            <div v-if="importPreviewRows.length > 5" style="color: #2e7d32; font-weight: 600; margin-top: 4px;">
              ...và {{ importPreviewRows.length - 5 }} dòng tiếp theo.
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isImportOpen = false" />
        <Button
          label="Tiến hành Import"
          icon="pi pi-check"
          severity="success"
          size="small"
          :loading="importing"
          :disabled="importPreviewRows.length === 0"
          @click="executeImport"
        />
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
import { usePersonnelStore } from '@/stores/personnel';
import { useAuthStore } from '@/stores/auth';
import { formatPersonnelCode } from '@/utils/formatters';
import { exportToExcel, parseExcelFile } from '@/utils/excel';
import { createPersonnel } from '@/api/personnel';
import { logActivity } from '@/api/audit';
import PersonnelDialog from '@/components/personnel/PersonnelDialog.vue';

const personnelStore = usePersonnelStore();
const authStore = useAuthStore();

const searchQuery = ref('');
const selectedPersonnel = ref([]);
const isDialogOpen = ref(false);
const selectedPerson = ref(null);

// Import Modal State
const isImportOpen = ref(false);
const importing = ref(false);
const importPreviewRows = ref([]);
const importFileInput = ref(null);

onMounted(async () => {
  if (personnelStore.personnelList.length === 0) {
    await personnelStore.init();
  }
});

const activeColumns = computed(() => {
  return personnelStore.visibleColumns.map((id) => {
    const found = personnelStore.allAvailableColumns.find((c) => c.id === id);
    return found || { id, label: id };
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

const handleExportExcel = () => {
  const exportData = filteredPersonnel.value.map((p, idx) => {
    const row = {
      'STT': idx + 1,
      'Mã CB': p.code || formatPersonnelCode(p.id),
      'Họ và tên': p.name || '',
      'Năm sinh': p.birthYear || '',
      'Phòng ban': personnelStore.getDepartmentName(p.departmentId) || '',
      'Chức vụ': p.position || '',
      'Số CCCD': p.cccd || '',
      'Quê quán': p.hometown || '',
      'Thường trú': p.thuongTru || '',
      'Tạm trú': p.tamTru || '',
    };
    return row;
  });
  exportToExcel(exportData, 'Danh_sach_Can_bo');
};

const openImportModal = () => {
  importPreviewRows.value = [];
  isImportOpen.value = true;
};

const onImportFileSelected = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const rows = await parseExcelFile(file);
    // filter header or empty rows
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
    // Determine header row index
    let startIdx = 0;
    const firstRowStr = importPreviewRows.value[0]?.join(' ').toLowerCase() || '';
    if (firstRowStr.includes('họ và tên') || firstRowStr.includes('họ tên') || firstRowStr.includes('stt')) {
      startIdx = 1;
    }

    for (let i = startIdx; i < importPreviewRows.value.length; i++) {
      const row = importPreviewRows.value[i];
      if (!row || row.length === 0) continue;
      const name = String(row[1] || row[0] || '').trim();
      if (!name || name.toLowerCase() === 'họ và tên') continue;

      const newPerson = {
        name,
        birthYear: String(row[2] || row[3] || ''),
        cccd: String(row[4] || row[11] || ''),
        position: String(row[5] || row[8] || ''),
        hometown: String(row[6] || ''),
        trips: '[]',
        relatives: '[]',
        flags: '{}',
        custom_data: '{}',
      };
      await createPersonnel(newPerson);
      count++;
    }

    await logActivity('Import Excel Cán bộ', `Đã import thành công ${count} cán bộ từ tệp Excel`);
    await personnelStore.fetchPersonnel();
    alert(`Import hoàn tất thành công ${count} cán bộ!`);
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
