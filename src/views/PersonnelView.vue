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

          <!-- Column Selector -->
          <ColumnSelector
            v-model="personnelStore.visibleColumns"
            :options="personnelStore.allAvailableColumns"
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

          <!-- Advanced Word (.docx) Export Button -->
          <Button
            :label="selectedPersonnel.length > 0 ? `Xuất Word (${selectedPersonnel.length})` : 'Xuất Word (.docx)'"
            icon="pi pi-file-word"
            severity="help"
            outlined
            size="small"
            @click="openAdvancedDocxExport(null)"
            v-tooltip.top="'Xuất file Word theo mẫu DOCX tùy biến'"
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
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} cán bộ"
        :loading="personnelStore.loading"
        responsiveLayout="scroll"
        stripedRows
        removableSort
        :customSort="customSort"
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
        <Column field="code" header="Mã CB" sortable :headerStyle="{ width: '115px', minWidth: '115px' }" :bodyStyle="{ width: '115px', minWidth: '115px' }">
          <template #body="{ data }">
            <span class="badge-code">{{ data.code || formatPersonnelCode(data.id) }}</span>
          </template>
        </Column>
        <Column
          v-for="col in activeColumns"
          :key="col.id"
          :field="col.id"
          :header="col.label"
          sortable
          :headerClass="'col-left'"
          :bodyClass="'col-left'"
          :headerStyle="{ width: col.width || '160px', minWidth: col.width || '160px' }"
          :bodyStyle="{ width: col.width || '160px', minWidth: col.width || '160px' }"
        >
          <template #body="{ data }">
            <!-- Name column -->
            <template v-if="col.id === 'name'">
              <strong style="color: #1f2937; cursor: pointer;">{{ data.name }}</strong>
            </template>

            <!-- Department column -->
            <template v-else-if="col.id === 'departmentId' || col.id === 'departmentName'">
              <span v-if="data.departmentName || (data.departmentId && personnelStore.departmentMap[data.departmentId])" style="font-weight: 500; color: #374151;">
                {{ data.departmentName || personnelStore.getDepartmentName(data.departmentId) }}
              </span>
              <span v-else class="badge-pill badge-green">
                Chưa phân bổ
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
                icon="pi pi-file-word"
                size="small"
                text
                severity="help"
                v-tooltip.top="'Xuất file Word cán bộ này'"
                @click.stop="openAdvancedDocxExport(data)"
                style="padding: 4px;"
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
            Danh sách Thân nhân liên quan ({{ flattenedRelatives.length }} người)
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
          <ColumnSelector
            v-model="personnelStore.visibleRelativeColumns"
            :options="personnelStore.allAvailableRelativeColumns"
            @change="onRelativeColumnsChange"
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
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} thân nhân"
        responsiveLayout="scroll"
        stripedRows
        removableSort
        :customSort="customSort"
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
        <Column field="parentName" header="Cán bộ liên quan" sortable :headerStyle="{ width: '210px', minWidth: '210px' }">
          <template #body="{ data }">
            <div v-if="isFirstRelativeOfParent(data)">
              <strong style="cursor: pointer; color: #1f2937; font-size: 0.82rem;" @click="openEditDialog(data.parentPerson)">{{ data.parentName || data.parentPersonnelName || 'Cán bộ' }}</strong>
              <div v-if="data.parentPosition" style="font-size: 0.72rem; color: #6b7280;">{{ data.parentPosition }}</div>
              <div v-if="data.cccd_can_bo" style="font-size: 0.7rem; color: #64748b; font-family: monospace;">CCCD: {{ data.cccd_can_bo }}</div>
            </div>
            <div v-else style="padding-left: 10px; color: #94a3b8; font-size: 0.74rem; display: flex; align-items: center; gap: 4px;">
              <span style="color: #cbd5e1;">↳</span> <span style="font-style: italic; color: #94a3b8;">(cùng cán bộ)</span>
            </div>
          </template>
        </Column>

        <!-- Dynamic Relative Columns from Settings -->
        <Column
          v-for="col in activeRelativeColumns"
          :key="col.id"
          :field="col.id"
          :header="col.label"
          sortable
          :headerClass="'col-left'"
          :bodyClass="'col-left'"
          :headerStyle="{ width: col.width || '150px', minWidth: col.width || '150px' }"
          :bodyStyle="{ width: col.width || '150px', minWidth: col.width || '150px' }"
        >
          <template #body="{ data }">
            <span :class="col.id === 'countryName' || col.id === 'country' || col.id === 'content' ? 'badge-pill badge-blue' : ''">
              {{ getDisplayValue(data, col.id) }}
            </span>
          </template>
        </Column>
        
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
                @click="handleRelativeDetail(data)"
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
      :initialTab="dialogInitialTab"
      :targetRelativeCode="dialogTargetRelativeCode"
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
      :style="{ width: '1200px', maxWidth: '96vw' }"
    >
      <div style="display: flex; flex-direction: column; gap: 1.25rem; padding-top: 8px;">
        <!-- Notice box -->
        <div style="padding: 10px 14px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #2e7d32; font-size: 0.82rem; color: #1b5e20;">
          <template v-if="currentImportType === 'personnel'">
            Hệ thống hỗ trợ import file <b>.xlsx, .xls, .csv</b> gồm đầy đủ các khối trường thông tin cán bộ. Nếu Số CCCD cán bộ đã có trong hệ thống, dữ liệu mới sẽ được cập nhật/ghi đè tương ứng.
          </template>
          <template v-else>
            Hệ thống sẽ <b>tự động liên kết thân nhân vào cán bộ tương ứng</b> theo số <b>`cccd_can_bo`</b> (khớp với <b>`cccdparent`</b> của Cán bộ).
          </template>
        </div>

        <!-- Big Dropzone Box -->
        <div
          style="border: 2px dashed #d1d5db; border-radius: 12px; padding: 1.5rem 1.5rem; text-align: center; background: #fcfdfc; cursor: pointer; transition: all 0.2s ease;"
          @click="$refs.importFileInput.click()"
          @dragover.prevent
          @drop.prevent="onFileDrop"
        >
          <input type="file" ref="importFileInput" accept=".xlsx, .xls, .csv" @change="onImportFileSelected" style="display: none;" />
          
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 14px; background: #e8f5e9; color: #2e7d32; margin-bottom: 8px;">
            <i class="pi pi-file-excel" style="font-size: 1.5rem;"></i>
          </div>

          <div style="font-size: 0.92rem; font-weight: 700; color: #1f2937; margin-bottom: 4px;">
            {{ selectedFileName || 'Kéo thả tệp Excel vào đây hoặc nhấp để tải lên' }}
          </div>
          <div style="font-size: 0.78rem; color: #6b7280; margin-bottom: 10px;">
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

        <!-- Sheet Selector Tabs -->
        <div
          v-if="availableSheets.length > 0"
          style="display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px;"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
            <span style="font-size: 0.85rem; font-weight: 700; color: #166534; display: flex; align-items: center; gap: 6px;">
              <i class="pi pi-file-excel" style="color: #16a34a; font-size: 1rem;"></i>
              File Excel có {{ availableSheets.length }} Sheet. Nhấp chọn Sheet cần Import:
            </span>
            <span style="font-size: 0.75rem; color: #15803d; font-weight: 600;">
              Đang chọn: <b>{{ selectedSheet }}</b>
            </span>
          </div>

          <!-- Clickable Sheet Tab Buttons -->
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <button
              v-for="s in availableSheets"
              :key="s"
              type="button"
              class="sheet-tab-btn"
              :class="{ 'sheet-tab-active': selectedSheet === s }"
              @click="selectSheetTab(s)"
            >
              <i class="pi pi-table"></i>
              <span>{{ s }}</span>
              <span class="sheet-tab-badge">
                {{ (parsedWorkbookData[s] || []).length }} dòng
              </span>
            </button>
          </div>
        </div>

        <!-- Full Column Preview Table -->
        <div v-if="importPreviewRows.length > 0" style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; background: #ffffff;">
          <div style="padding: 0.6rem 1rem; background: #f8fafc; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="pi pi-eye" style="color: #0284c7; font-size: 1rem;"></i>
              <span style="font-size: 0.85rem; font-weight: 700; color: #1e293b;">
                Xem trước toàn bộ dữ liệu: Tìm thấy {{ importPreviewRows[0]?.length || 0 }} cột | {{ importPreviewRows.length - 1 }} dòng dữ liệu
              </span>
            </div>
            <span class="badge-pill badge-green" style="font-size: 0.75rem;">Sẵn sàng Import</span>
          </div>

          <!-- Full Horizontal & Vertical Scrollable Table -->
          <div style="max-height: 300px; overflow: auto; border-bottom: 1px solid #f1f5f9;">
            <table style="width: max-content; min-width: 100%; border-collapse: collapse; font-size: 0.76rem;">
              <thead style="position: sticky; top: 0; z-index: 2; background: #f1f5f9; box-shadow: 0 1px 2px rgba(0,0,0,0.06);">
                <tr>
                  <th style="padding: 8px 10px; border: 1px solid #cbd5e1; background: #e2e8f0; color: #334155; font-weight: 700; text-align: center; white-space: nowrap; position: sticky; left: 0; z-index: 3; min-width: 50px;">
                    Dòng
                  </th>
                  <th
                    v-for="(headerText, colIdx) in (importPreviewRows[0] || [])"
                    :key="colIdx"
                    style="padding: 8px 12px; border: 1px solid #cbd5e1; background: #f8fafc; color: #1e293b; font-weight: 700; text-align: left; white-space: nowrap; min-width: 130px;"
                  >
                    {{ headerText || `[Cột ${colIdx + 1}]` }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, rIdx) in importPreviewRows.slice(1, 15)"
                  :key="rIdx"
                  :style="{ backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }"
                >
                  <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: 700; color: #64748b; text-align: center; white-space: nowrap; position: sticky; left: 0; background: inherit; z-index: 1;">
                    #{{ rIdx + 1 }}
                  </td>
                  <td
                    v-for="(colName, colIdx) in (importPreviewRows[0] || [])"
                    :key="colIdx"
                    style="padding: 6px 12px; border: 1px solid #e2e8f0; color: #334155; white-space: nowrap; max-width: 280px; overflow: hidden; text-overflow: ellipsis;"
                    :title="String(row[colIdx] !== undefined && row[colIdx] !== null ? row[colIdx] : '')"
                  >
                    <span v-if="row[colIdx] !== undefined && row[colIdx] !== null && String(row[colIdx]).trim() !== ''">
                      {{ row[colIdx] }}
                    </span>
                    <span v-else style="color: #cbd5e1; font-style: italic;">
                      -
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="importPreviewRows.length > 15" style="text-align: center; padding: 6px 12px; font-size: 0.75rem; color: #64748b; background: #f8fafc;">
            ...và <b>{{ importPreviewRows.length - 15 }}</b> dòng dữ liệu tiếp theo sẽ được xử lý đầy đủ khi bấm bắt đầu Import.
          </div>
        </div>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
          <span style="font-size: 0.78rem; color: #6b7280;">
            {{ importPreviewRows.length > 0 ? `Đã nạp ${importPreviewRows[0]?.length || 0} cột | ${importPreviewRows.length - 1} dòng dữ liệu` : 'Chưa chọn tệp' }}
          </span>
          <div style="display: flex; gap: 8px;">
            <Button label="Hủy" severity="secondary" text size="small" @click="isImportOpen = false" />
            <Button
              :label="currentImportType === 'personnel' ? `Bắt đầu Import (${importPreviewRows.length - 1} hồ sơ)` : `Bắt đầu Gộp (${importPreviewRows.length - 1} thân nhân)`"
              icon="pi pi-check"
              severity="success"
              size="small"
              :loading="importing"
              :disabled="importPreviewRows.length < 2"
              @click="executeImport"
            />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Advanced DOCX Export Modal -->
    <AdvancedDocxExportDialog
      v-model="isDocxExportOpen"
      :targetPerson="docxExportTargetPerson"
      :selectedPersonnel="selectedPersonnel"
      :allPersonnel="filteredPersonnel"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import ColumnSelector from '@/components/common/ColumnSelector.vue';
import apiClient from '@/api/client';
import { usePersonnelStore } from '@/stores/personnel';
import { useAuthStore } from '@/stores/auth';
import { formatPersonnelCode, formatDate, formatExcelDate } from '@/utils/formatters';
import {
  exportToExcel,
  exportMultiSheetExcel,
  exportFullPersonnelExcel,
  exportFullRelativesExcel,
  downloadPersonnelTemplate,
  downloadRelativeTemplate,
  getSubOptionsList,
  parseExcelFile,
  readExcelWorkbook,
} from '@/utils/excel';
import { createPersonnel, updatePersonnel } from '@/api/personnel';
import { logActivity } from '@/api/audit';
import PersonnelDialog from '@/components/personnel/PersonnelDialog.vue';
import AdvancedDocxExportDialog from '@/components/common/AdvancedDocxExportDialog.vue';

const personnelStore = usePersonnelStore();
const authStore = useAuthStore();

const mainTab = ref('canhan'); // 'canhan' or 'thannhan'
const searchQuery = ref('');
const relativeSearchQuery = ref('');
const selectedPersonnel = ref([]);
const selectedRelatives = ref([]);
const isDialogOpen = ref(false);
const selectedPerson = ref(null);
const dialogInitialTab = ref(0);
const dialogTargetRelativeCode = ref('');

// Advanced DOCX Export Modal State
const isDocxExportOpen = ref(false);
const docxExportTargetPerson = ref(null);

const openAdvancedDocxExport = (person = null) => {
  docxExportTargetPerson.value = person;
  isDocxExportOpen.value = true;
};

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
const availableSheets = ref([]);
const selectedSheet = ref('');
const parsedWorkbookData = ref({});

// Custom Vietnamese and Natural Sort Function
const customSort = (event) => {
  event.data.sort((data1, data2) => {
    let value1 = data1[event.field];
    let value2 = data2[event.field];
    let result = null;

    if (value1 == null && value2 != null) result = -1;
    else if (value1 != null && value2 == null) result = 1;
    else if (value1 == null && value2 == null) result = 0;
    else if (typeof value1 === 'string' && typeof value2 === 'string') {
      const v1 = value1.trim();
      const v2 = value2.trim();
      // Date DD/MM/YYYY support
      const isDate1 = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v1);
      const isDate2 = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v2);
      if (isDate1 && isDate2) {
        const [d1, m1, y1] = v1.split('/').map(Number);
        const [d2, m2, y2] = v2.split('/').map(Number);
        const t1 = new Date(y1, m1 - 1, d1).getTime();
        const t2 = new Date(y2, m2 - 1, d2).getTime();
        result = t1 < t2 ? -1 : (t1 > t2 ? 1 : 0);
      } else {
        result = v1.localeCompare(v2, 'vi', { numeric: true, sensitivity: 'base' });
      }
    } else {
      result = value1 < value2 ? -1 : (value1 > value2 ? 1 : 0);
    }

    return event.order * result;
  });
};

onMounted(async () => {
  if (personnelStore.personnelList.length === 0) {
    await personnelStore.init();
  }
});

const activeColumns = computed(() => {
  const map = {};
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt' && c.id !== 'code') map[c.id] = c;
    });
  });

  const getColWidth = (id) => {
    if (id === 'name') return '190px';
    if (id === 'cccd') return '135px';
    if (id === 'birthYear') return '115px';
    if (id === 'position' || id === 'positionName') return '170px';
    if (id === 'departmentId' || id === 'departmentName') return '190px';
    if (id === 'otherName') return '125px';
    if (id === 'thuongTru' || id === 'tamTru' || id === 'hometown') return '180px';
    return '160px';
  };

  return personnelStore.visibleColumns
    .filter((id) => map[id])
    .map((id) => {
      const cfg = map[id];
      return {
        id: cfg.id,
        label: cfg.label || cfg.id,
        width: getColWidth(cfg.id),
        format: cfg.format || 'text',
      };
    });
});

const activeRelativeColumns = computed(() => {
  const map = {};
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id) map[c.id] = c;
    });
  });

  return (personnelStore.visibleRelativeColumns || [])
    .filter((id) => id !== 'parentName' && id !== 'parentPersonnelName' && id !== 'stt' && id !== 'code' && id !== 'cccd_can_bo')
    .map((id) => {
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
    if (val instanceof Date) {
      return formatDate(val);
    }
    if (Array.isArray(val)) {
      return val
        .map((x) => {
          if (typeof x === 'object' && x !== null) {
            if (x.col1 !== undefined || x.col2 !== undefined) {
              return `${x.col1 || ''}: ${x.col2 || ''}`.trim().replace(/^:\s*/, '');
            }
            return x.name || JSON.stringify(x);
          }
          return x;
        })
        .filter(Boolean)
        .join('; ') || '-';
    }
    return val.name || JSON.stringify(val) || '-';
  }

  const str = String(val).trim();
  const cLower = String(colId || '').toLowerCase();
  if (
    cLower.includes('birth') ||
    cLower.includes('date') ||
    cLower.includes('ngay') ||
    cLower.includes('nam_sinh') ||
    cLower.includes('departure') ||
    cLower.includes('arrival') ||
    str.includes('GMT') ||
    str.includes('T00:') ||
    /^\d{4}-\d{2}-\d{2}/.test(str)
  ) {
    return formatDate(str);
  }
  return str;
};

const onColumnsChange = () => {
  localStorage.setItem('vue_visible_columns', JSON.stringify(personnelStore.visibleColumns));
};

const onRelativeColumnsChange = () => {
  localStorage.setItem('vue_visible_relative_columns', JSON.stringify(personnelStore.visibleRelativeColumns));
};

const openCreateDialog = () => {
  selectedPerson.value = null;
  dialogInitialTab.value = 0;
  dialogTargetRelativeCode.value = '';
  isDialogOpen.value = true;
};

const openEditDialog = (person, options = {}) => {
  if (!person) return;
  selectedPerson.value = person;
  dialogInitialTab.value = options.tab !== undefined ? options.tab : 0;
  dialogTargetRelativeCode.value = options.targetRelativeCode || '';
  isDialogOpen.value = true;
};

const handleRelativeDetail = (relData) => {
  if (!relData) return;
  let parent = relData.parentPerson;
  if (!parent && relData.cccd_can_bo) {
    parent = personnelStore.personnelList.find(
      (p) => String(p.cccdparent || p.cccd || p.custom_data?.cccdparent || p.custom_data?.cccd || '').trim() === String(relData.cccd_can_bo).trim()
    );
  }
  if (!parent && relData.personnelId) {
    parent = personnelStore.personnelList.find((p) => p.id === relData.personnelId);
  }

  const relCode = relData.code || ('TN-' + String(relData.id || '').slice(-5).padStart(5, '0'));

  if (parent) {
    openEditDialog(parent, {
      tab: 1, // Open Tab 2: Thân nhân
      targetRelativeCode: relCode,
    });
  } else {
    // If not linked to a parent yet, display relative in modal
    openEditDialog({
      name: relData.parentName || 'Cán bộ liên quan',
      relatives: [relData],
    }, {
      tab: 1,
      targetRelativeCode: relCode,
    });
  }
};

const isFirstRelativeOfParent = (data) => {
  const list = filteredRelatives.value || [];
  const actualIndex = list.findIndex((item) => item.id === data.id);
  if (actualIndex <= 0) return true;
  const prev = list[actualIndex - 1];
  if (!prev) return true;
  const curKey = String(data.cccd_can_bo || data.parentName || data.personnelId || '').trim();
  const prevKey = String(prev.cccd_can_bo || prev.parentName || prev.personnelId || '').trim();
  return !curKey || curKey !== prevKey;
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
  const ids = selectedRelatives.value.map((r) => r.id).filter(Boolean);
  await personnelStore.deleteMultipleRelatives(ids);
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
    const res = await readExcelWorkbook(file);
    availableSheets.value = res.sheetNames || [];
    parsedWorkbookData.value = res.sheetsData || {};
    if (availableSheets.value.length > 0) {
      selectedSheet.value = availableSheets.value[0];
      importPreviewRows.value = (res.sheetsData[selectedSheet.value] || []).filter((r) => r && r.length > 0);
    } else {
      importPreviewRows.value = [];
    }
  } catch (err) {
    alert('Lỗi đọc tệp Excel: ' + err.message);
  }
};

const selectSheetTab = (s) => {
  selectedSheet.value = s;
  if (parsedWorkbookData.value && parsedWorkbookData.value[s]) {
    importPreviewRows.value = (parsedWorkbookData.value[s] || []).filter((r) => r && r.length > 0);
  }
};

const onSheetChange = () => {
  if (parsedWorkbookData.value && selectedSheet.value) {
    importPreviewRows.value = (parsedWorkbookData.value[selectedSheet.value] || []).filter((r) => r && r.length > 0);
  }
};

const normalizeKey = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/\[cột\s*\d+(\s*-\s*\d+)?\]/gi, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
};

const executeImport = async () => {
  if (importPreviewRows.value.length === 0) return;
  importing.value = true;
  let count = 0;
  let updatedCount = 0;
  let createdCount = 0;
  let relCreatedCount = 0;
  let relUpdatedCount = 0;

  try {
    const rawRows = importPreviewRows.value;
    if (rawRows.length < 2) {
      alert('File Excel không có đủ dữ liệu để import!');
      return;
    }

    const headerRow = rawRows[0] || [];

    if (currentImportType.value === 'personnel') {
      // 1. Build exact column dictionary from importMappingPersonnel
      let currentColIdx = 0;
      const colByNum = {};
      const colById = {};
      const colByLabel = {};

      (personnelStore.importMappingPersonnel || []).forEach((g) => {
        (g.columns || []).forEach((c) => {
          currentColIdx++;
          const subOpts = getSubOptionsList(c);
          if (subOpts.length > 1) {
            subOpts.forEach((opt, sIdx) => {
              const colNum = currentColIdx + sIdx;
              const entry = {
                id: c.id,
                colNum: colNum,
                subOpt: opt,
                group: g.group || '',
                raw: c,
              };
              colByNum[colNum] = entry;
              colByLabel[normalizeKey(`[Cột ${colNum}] ${c.label || c.id}: ${opt}`)] = entry;
              colByLabel[normalizeKey(`${c.label || c.id}: ${opt}`)] = entry;
              colByLabel[normalizeKey(`${c.label || c.id} ${opt}`)] = entry;
            });
            currentColIdx += (subOpts.length - 1);
          } else {
            const entry = {
              id: c.id,
              colNum: currentColIdx,
              subOpt: null,
              group: g.group || '',
              raw: c,
            };
            colByNum[currentColIdx] = entry;
            colById[c.id.toLowerCase()] = entry;
            colByLabel[normalizeKey(`[Cột ${currentColIdx}] ${c.label || c.id}`)] = entry;
            colByLabel[normalizeKey(c.label || c.id)] = entry;
          }
        });
      });

      // Existing Personnel map strictly by cccdparent
      const existingByCccd = {};
      personnelStore.personnelList.forEach((p) => {
        const pCccd = p.cccdparent || p.custom_data?.cccdparent;
        if (pCccd) existingByCccd[String(pCccd).trim()] = p;
      });

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0 || !row.some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== '')) continue;

        const rowData = {};
        const customData = {};
        const trips = [];
        const flags = {};
        const currentTrip = {};
        const checkboxValues = {};

        headerRow.forEach((rawHeader, colIdx) => {
          const rawCell = row[colIdx];
          if (rawCell === undefined || rawCell === null) return;
          const val = typeof rawCell === 'number' ? rawCell : String(rawCell).trim();
          if (val === '') return; // Ô trống -> Bỏ qua hoàn toàn, không ghi đè!

          const hKey = normalizeKey(rawHeader);

          // 1. Ưu tiên 1: Khớp chính xác 100% theo Tên nhãn (Label) hoặc Mã trường (ID)
          let matched = colByLabel[hKey] || colById[hKey];

          // 2. Ưu tiên 2: Khớp theo [Cột N] nếu Tên nhãn không khớp
          if (!matched) {
            const colNumMatch = String(rawHeader || '').match(/\[\s*c[ộo]t\s*(\d+)\s*\]/i);
            if (colNumMatch && colByNum[Number(colNumMatch[1])]) {
              matched = colByNum[Number(colNumMatch[1])];
            }
          }

          if (!matched) return;

          const fId = matched.id;
          const grp = String(matched.group || '');
          let finalVal = val;

          // Xử lý Ngày tháng
          if (matched.raw?.format === 'date' || fId.toLowerCase().includes('date') || fId.toLowerCase().includes('year') || fId.toLowerCase().includes('sinh')) {
            finalVal = formatExcelDate(val);
          }

          // Xử lý CCCD
          if (fId === 'cccdparent') {
            finalVal = String(val).trim();
          }

          // Xử lý Hộp kiểm nhiều lựa chọn
          if (matched.subOpt) {
            const strVal = String(val).toLowerCase().trim();
            if (['x', '1', 'có', 'co', 'v', 'true', 'yes', 'y'].includes(strVal) || strVal.includes(matched.subOpt.toLowerCase())) {
              if (!checkboxValues[fId]) checkboxValues[fId] = [];
              if (!checkboxValues[fId].includes(matched.subOpt)) {
                checkboxValues[fId].push(matched.subOpt);
              }
            } else if (strVal !== '') {
              const combined = `${matched.subOpt}: ${val}`;
              if (!checkboxValues[fId]) checkboxValues[fId] = [];
              checkboxValues[fId].push(combined);
            }
            return;
          }

          rowData[fId] = finalVal;
          customData[fId] = finalVal;

          if (grp.includes('Khối B') || grp.includes('Chuyến đi')) {
            currentTrip[fId] = finalVal;
          } else if (grp.includes('Khối C') || grp.includes('Lưu ý') || grp.includes('Kỷ luật')) {
            flags[fId] = finalVal;
          }

          // Đồng bộ tên trường chuẩn
          if (fId === 'cccdparent') {
            rowData.cccdparent = finalVal;
            customData.cccdparent = finalVal;
          } else if (fId === 'positionName' || fId === 'position') {
            rowData.position = finalVal;
            rowData.positionName = finalVal;
            customData.position = finalVal;
            customData.positionName = finalVal;
          } else if (fId === 'departmentName' || fId === 'departmentId') {
            rowData.departmentName = finalVal;
            customData.departmentName = finalVal;
          } else if (fId === 'hcCaNhan' || fId === 'passportPersonal') {
            rowData.passportPersonal = finalVal;
            rowData.hcCaNhan = finalVal;
            customData.hcCaNhan = finalVal;
            customData.passportPersonal = finalVal;
          } else if (fId === 'hcCongVu' || fId === 'passportOfficial') {
            rowData.passportOfficial = finalVal;
            rowData.hcCongVu = finalVal;
            customData.hcCongVu = finalVal;
            customData.passportOfficial = finalVal;
          } else if (fId === 'kqThamTra' || fId === 'tcctResult') {
            rowData.tcctResult = finalVal;
            rowData.kqThamTra = finalVal;
            customData.kqThamTra = finalVal;
            customData.tcctResult = finalVal;
          }
        });

        // Nạp kết quả hộp kiểm
        Object.keys(checkboxValues).forEach((fId) => {
          const valJoined = checkboxValues[fId].join(', ');
          rowData[fId] = valJoined;
          customData[fId] = valJoined;
          if (currentTrip && Object.keys(currentTrip).length > 0) currentTrip[fId] = valJoined;
          if (flags) flags[fId] = valJoined;
        });

        if (Object.keys(currentTrip).length > 0) {
          trips.push(currentTrip);
        }

        // Bắt buộc phải có tên cán bộ
        if (!rowData.name && row[1] !== undefined && row[1] !== null) rowData.name = String(row[1]).trim();
        if (!rowData.name && row[2] !== undefined && row[2] !== null) rowData.name = String(row[2]).trim();
        const cleanName = String(rowData.name || '').trim();
        if (!cleanName || cleanName.toLowerCase() === 'họ và tên') continue;
        rowData.name = cleanName;

        const cleanCccd = String(rowData.cccdparent || customData.cccdparent || '').trim();

        // NẾU CÁ NHÂN KHÔNG CÓ cccdparent (Số CCCD cán bộ) -> BỎ QUA NGAY LẬP TỨC
        if (!cleanCccd) {
          continue;
        }

        // Kiểm tra cán bộ đã tồn tại theo DUY NHẤT cccdparent
        const existingPerson = existingByCccd[cleanCccd] || null;
        let targetPersonId = '';

        if (existingPerson) {
          targetPersonId = existingPerson.id;
          // Ghi đè / Cập nhật (Update) theo đúng cccdparent
          const mergedFlags = { ...(existingPerson.flags || {}), ...(existingPerson.custom_data?.flags || {}), ...flags };
          const updatedPayload = {
            ...existingPerson,
            ...rowData,
            flags: mergedFlags,
            custom_data: {
              ...(existingPerson.custom_data || {}),
              ...customData,
              ...rowData,
              flags: mergedFlags,
            },
          };
          await updatePersonnel(existingPerson.id, updatedPayload);
          updatedCount++;
        } else {
          // Tạo mới (Create)
          const nextIndex = personnelStore.personnelList.length + createdCount + 1;
          const assignedCode = rowData.code || ('CB-' + String(nextIndex).padStart(5, '0'));
          targetPersonId = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);
          const newPayload = {
            id: targetPersonId,
            ...rowData,
            code: assignedCode,
            trips: trips.length > 0 ? trips : [],
            relatives: [],
            flags: flags,
            custom_data: {
              ...customData,
              ...rowData,
              flags: flags,
            },
          };
          await createPersonnel(newPayload);
          existingByCccd[cleanCccd] = newPayload;
          createdCount++;
        }

        // Tạo bản ghi chuyến đi nếu có thông tin
        if (Object.keys(currentTrip).length > 0 && targetPersonId) {
          const tripPayload = {
            id: 'trip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7),
            personnelId: targetPersonId,
            personnelName: rowData.name,
            ...currentTrip,
          };
          await apiClient.post('/items/appendix1', tripPayload).catch(() => {});
        }

        count++;
      }

      await logActivity('Import Excel Cán bộ', `Đã import ${count} cán bộ (Tạo mới: ${createdCount}, Cập nhật ghi đè theo CCCD: ${updatedCount})`);
    } else {
      // Relative Import
      // 1. Build sequential column dictionary from importMappingRelative (with sub-options support)
      let currentRelColIdx = 0;
      const relColByNum = {};
      const relColById = {};
      const relColByLabel = {};

      (personnelStore.importMappingRelative || []).forEach((g) => {
        (g.columns || []).forEach((c) => {
          currentRelColIdx++;
          const subOpts = getSubOptionsList(c);
          if (subOpts.length > 1) {
            subOpts.forEach((opt, sIdx) => {
              const colNum = currentRelColIdx + sIdx;
              const entry = {
                id: c.id,
                colNum: colNum,
                subOpt: opt,
                group: g.group || '',
                raw: c,
              };
              relColByNum[colNum] = entry;
              relColByLabel[normalizeKey(`[Cột ${colNum}] ${c.label || c.id}: ${opt}`)] = entry;
              relColByLabel[normalizeKey(`${c.label || c.id}: ${opt}`)] = entry;
              relColByLabel[normalizeKey(`${c.label || c.id} ${opt}`)] = entry;
            });
            currentRelColIdx += (subOpts.length - 1);
          } else {
            const entry = {
              id: c.id,
              colNum: currentRelColIdx,
              subOpt: null,
              group: g.group || '',
              raw: c,
            };
            relColByNum[currentRelColIdx] = entry;
            relColById[c.id.toLowerCase()] = entry;
            relColByLabel[normalizeKey(`[Cột ${currentRelColIdx}] ${c.label || c.id}`)] = entry;
            relColByLabel[normalizeKey(c.label || c.id)] = entry;
          }
        });
      });

      const pByCccd = {};
      personnelStore.personnelList.forEach((p) => {
        const cccd = p.cccdparent || p.custom_data?.cccdparent || p.cccd;
        if (cccd) pByCccd[String(cccd).trim()] = p;
      });

      // Lookup existing relatives by cccdthannhan ONLY
      const existingRelatives = [...(personnelStore.relativesList || [])];
      const relByCccd = {};

      existingRelatives.forEach((r) => {
        const rCccd = String(r.cccdthannhan || r.custom_data?.cccdthannhan || r.cccd || '').trim();
        if (rCccd) {
          relByCccd[rCccd] = r;
        }
      });

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0 || !row.some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== '')) continue;

        const relData = {};
        const checkboxValues = {};

        headerRow.forEach((rawHeader, colIdx) => {
          const rawCell = row[colIdx];
          if (rawCell === undefined || rawCell === null) return;
          const val = typeof rawCell === 'number' ? rawCell : String(rawCell).trim();
          if (val === '') return;

          const hKey = normalizeKey(rawHeader);
          let matched = relColByLabel[hKey] || relColById[hKey];

          if (!matched) {
            const colNumMatch = String(rawHeader || '').match(/\[\s*c[ộo]t\s*(\d+)\s*\]/i);
            if (colNumMatch) {
              const num = parseInt(colNumMatch[1], 10);
              matched = relColByNum[num];
            }
          }

          // Strict fallback to column index order if header name does not match
          if (!matched) {
            matched = relColByNum[colIdx + 1];
          }

          if (matched) {
            if (matched.subOpt) {
              const isChecked = String(val).toLowerCase() === 'x' || String(val).toLowerCase() === '1' || String(val).toLowerCase() === 'true' || String(val).toLowerCase() === 'có' || String(val).toLowerCase().includes(matched.subOpt.toLowerCase());
              if (isChecked) {
                if (!checkboxValues[matched.id]) checkboxValues[matched.id] = [];
                checkboxValues[matched.id].push(matched.subOpt);
              }
            } else {
              relData[matched.id] = val;
            }
          }
        });

        // Merge checkbox sub-options
        Object.entries(checkboxValues).forEach(([k, arr]) => {
          if (arr.length > 0) {
            relData[k] = arr.join(', ');
          }
        });

        // Resolve essential identifiers directly from relData or configured column positions
        const cleanParentCccd = String(
          relData['cccd_can_bo'] ||
          relData['cccdparent'] ||
          relData['parentCccd'] ||
          (relColByNum[2] ? relData[relColByNum[2].id] : '') ||
          ''
        ).trim();

        const cleanRelCccd = String(
          relData['cccdthannhan'] ||
          relData['cccd'] ||
          (relColByNum[15] ? relData[relColByNum[15].id] : '') ||
          ''
        ).trim();

        let relativeName = String(
          relData['relativeName'] ||
          relData['name'] ||
          (relColByNum[7] ? relData[relColByNum[7].id] : '') ||
          ''
        ).trim();

        const relationshipName = String(
          relData['relationshipName'] ||
          relData['relationship'] ||
          (relColByNum[6] ? relData[relColByNum[6].id] : '') ||
          'Thân nhân'
        ).trim();

        if (!relativeName) {
          relativeName = relationshipName || 'Thân nhân';
        }

        // BẮT BUỘC PHẢI CÓ CCCD CÁN BỘ
        if (!cleanParentCccd) {
          continue;
        }

        const parentPerson = pByCccd[cleanParentCccd] || null;

        // Lookup existing relative by CCCD thân nhân
        let existingRel = null;
        if (cleanRelCccd && relByCccd[cleanRelCccd]) {
          existingRel = relByCccd[cleanRelCccd];
        }

        if (existingRel) {
          // GỘP / CẬP NHẬT THÂN NHÂN ĐÃ TỒN TẠI
          const updatedPayload = {
            ...existingRel,
            ...existingRel.custom_data,
            ...relData,
            personnelId: parentPerson ? parentPerson.id : existingRel.personnelId,
            personnelCode: parentPerson ? parentPerson.code : existingRel.personnelCode,
            personnelName: parentPerson ? parentPerson.name : existingRel.personnelName,
            parentName: parentPerson ? parentPerson.name : existingRel.parentName,
            cccd_can_bo: cleanParentCccd,
            relationshipName: relationshipName || existingRel.relationshipName,
            relativeName: relativeName || existingRel.relativeName,
            custom_data: {
              ...(existingRel.custom_data || {}),
              ...relData,
              cccd_can_bo: cleanParentCccd,
              cccdthannhan: cleanRelCccd,
            },
          };
          await apiClient.patch(`/items/appendix2/${existingRel.id}`, updatedPayload);
          relUpdatedCount++;
        } else {
          // THÊM MỚI THÂN NHÂN
          const nextTnIndex = (personnelStore.relativesList || []).length + relCreatedCount + 1;
          const newRel = {
            id: 'rel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7),
            code: 'TN-' + String(nextTnIndex).padStart(5, '0'),
            personnelId: parentPerson ? parentPerson.id : '',
            personnelCode: parentPerson ? parentPerson.code : '',
            personnelName: parentPerson ? parentPerson.name : 'Chưa liên kết',
            parentName: parentPerson ? parentPerson.name : 'Chưa liên kết',
            cccd_can_bo: cleanParentCccd,
            relationshipName: relationshipName || 'Thân nhân',
            relativeName: relativeName || 'Thân nhân',
            ...relData,
            custom_data: {
              ...relData,
              cccd_can_bo: cleanParentCccd,
              cccdthannhan: cleanRelCccd,
            },
          };
          await apiClient.post('/items/appendix2', newRel);
          if (cleanRelCccd) relByCccd[cleanRelCccd] = newRel;
          relCreatedCount++;
        }
        count++;
      }
      await logActivity('Import Excel Thân nhân', `Đã import ${count} thân nhân (Tạo mới: ${relCreatedCount}, Gộp cập nhật: ${relUpdatedCount})`);
    }

    await personnelStore.fetchPersonnel();
    const resultMsg = currentImportType.value === 'personnel'
      ? `Import hoàn tất ${count} hồ sơ cán bộ (Tạo mới: ${createdCount}, Cập nhật ghi đè theo CCCD: ${updatedCount})!`
      : `Import hoàn tất ${count} thân nhân (Tạo mới: ${relCreatedCount}, Gộp cập nhật: ${relUpdatedCount})!`;
    alert(resultMsg);
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
