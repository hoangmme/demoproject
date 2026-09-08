<template>
  <div class="app-content">
    <!-- Breadcrumb & Top Bar -->
    <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
      <span>Bảng dữ liệu</span>
      <span>/</span>
      <span style="color: #0f172a; font-weight: 600;">{{ mainTab === 'thannhan' ? relativeTableTitle : mainTableTitle }}</span>
    </div>

    <!-- TAB 1: DANH SÁCH CÁN BỘ (CÁ NHÂN) -->
    <div v-show="mainTab === 'canhan'">
      <!-- Header Section with Actions -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <!-- Biểu tượng Bảng với màu sắc tùy chỉnh -->
          <button
            v-if="authStore.isAdmin"
            type="button"
            class="table-icon-badge-btn"
            :style="{
              color: getTableIconColor('personnel'),
              borderColor: getTableIconColor('personnel') + '40',
              background: getTableIconColor('personnel') + '15'
            }"
            @click="openIconColorDialog('personnel', mainTableTitle)"
            title="Nhấn để đổi biểu tượng (Icon) & màu sắc bảng Cán bộ"
          >
            <i :class="['pi', getTableIcon('personnel')]" style="font-size: 1.25rem;"></i>
          </button>
          <span
            v-else
            class="table-icon-badge"
            :style="{
              color: getTableIconColor('personnel'),
              borderColor: getTableIconColor('personnel') + '40',
              background: getTableIconColor('personnel') + '15'
            }"
          >
            <i :class="['pi', getTableIcon('personnel')]" style="font-size: 1.25rem;"></i>
          </span>

          <div>
            <h1 style="font-size: 1.35rem; font-weight: 700; color: #0f172a; margin: 0; display: inline-flex; align-items: center; gap: 8px;">
              {{ mainTableTitle }}
              <span style="font-size: 0.85rem; font-weight: 500; color: #64748b;">· {{ filteredPersonnel.length }} bản ghi</span>
            </h1>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
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

          <!-- Search input with Icon -->
          <div class="search-input-wrapper">
            <i class="pi pi-search search-icon-left"></i>
            <InputText
              v-model="searchQuery"
              placeholder="Tìm tên, CCCD, chức vụ, đơn vị..."
              size="small"
              style="width: 250px; font-size: 0.8rem; height: 32px;"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="search-clear-btn"
              @click="searchQuery = ''"
              title="Xóa tìm kiếm"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Chip hiển thị bộ lọc từ Dashboard Widget -->
          <div
            v-if="routeFilterField && routeFilterValue"
            style="display: inline-flex; align-items: center; gap: 6px; background: #eff6ff; border: 1px solid #93c5fd; padding: 3px 10px; border-radius: 9999px; font-size: 0.75rem; color: #1d4ed8; font-weight: 600;"
          >
            <span>🎯 Lọc: {{ getRouteFilterFieldLabel() }}: <b>{{ routeFilterValue }}</b></span>
            <button
              type="button"
              @click="clearRouteFilter"
              style="background: none; border: none; cursor: pointer; color: #ef4444; padding: 0; font-size: 0.75rem; display: flex; align-items: center;"
              title="Xóa bộ lọc"
            >
              <i class="pi pi-times-circle"></i>
            </button>
          </div>

          <!-- ➕ Nút Thêm Cột Mới chuẩn Lark Base -->
          <Button
            v-if="authStore.isAdmin"
            icon="pi pi-plus"
            label="Thêm cột mới"
            severity="success"
            size="small"
            @click="openAddColumnModal('personnel')"
            title="Tạo thêm cột dữ liệu mới trực tiếp trên bảng này"
            style="font-size: 0.8rem;"
          />

          <!-- ⚙️ Tùy chọn Cột hiển thị Popover -->
          <div class="header-menu-wrapper" @mouseenter="onMouseEnterFilter" @mouseleave="onMouseLeaveFilter">
            <Button
              icon="pi pi-sliders-h"
              label="Tùy chọn Cột"
              severity="secondary"
              outlined
              size="small"
              @click="isFilterMenuOpen = !isFilterMenuOpen; isDataMenuOpen = false;"
              title="Tùy chọn Cột"
              style="font-size: 0.8rem;"
            />

            <div v-show="isFilterMenuOpen" class="header-menu-dropdown filter-panel-dropdown" style="padding: 0; overflow: hidden;">
              <ColumnSelector
                :inline="true"
                v-model="personnelStore.visibleColumns"
                :options="personnelStore.allAvailableColumns"
                @change="onColumnsChange"
                @open-col-menu="handleColMenuFromSelector"
              />
            </div>
          </div>

          <!-- 🔑 Cấu hình Khóa Định danh & Khóa Liên Kết -->
          <Button
            label="Khóa & Liên kết"
            icon="pi pi-key"
            severity="secondary"
            outlined
            size="small"
            @click="isKeyLinkDialogOpen = true"
            title="Cấu hình Khóa Định Danh & Khóa Liên Kết giữa các Bảng dữ liệu"
            style="font-size: 0.8rem;"
          />

          <!-- 📥 Menu Xuất / Nhập Dropdown chuẩn dùng chung ExportImportMenu -->
          <ExportImportMenu
            :tableTitle="mainTableTitle"
            :selectedCount="selectedPersonnel.length"
            @import="openImportWizard('personnel')"
            @export-pdf="openAdvancedDocxExport(null)"
            @export-excel="exportPersonnelExcel"
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

      <!-- Lark Base View Tabs strip for Cán bộ -->
      <div class="lark-base-view-tabs-container">
        <div class="lark-base-view-tabs-strip">
          <template v-for="(card, cIdx) in activePersonnelMetricCards" :key="card.id || cIdx">
            <div
              class="lark-tab-item-wrapper"
              :class="{ 'tab-active': activePersonnelCardIdx === cIdx }"
            >
              <button
                type="button"
                class="lark-base-tab-item"
                :class="{ 'tab-active': activePersonnelCardIdx === cIdx }"
                @click="selectPersonnelCard(card, cIdx)"
              >
                <i class="pi pi-table" style="font-size: 0.82rem; color: #0284c7;"></i>
                <span style="font-weight: 700;">{{ card.label }}</span>
                <span :class="['lark-tab-count-pill', `pill-${card.color || 'blue'}`]">
                  {{ getPersonnelCardMetricValue(card) }}
                </span>
              </button>

              <!-- Thao tác View: Menu Cấu hình Setup (Dời trái, Dời phải, Sửa, Xóa) -->
              <div v-if="authStore.isAdmin" class="lark-tab-actions">
                <button
                  type="button"
                  class="btn-tab-action btn-tab-setup"
                  :class="{ active: activeTabMenuKey === `personnel_${cIdx}` }"
                  @click.stop="toggleTabMenu('personnel', cIdx)"
                  title="Tùy chọn Chế độ xem"
                >
                  <i class="pi pi-ellipsis-v"></i>
                </button>
                <div v-if="activeTabMenuKey === `personnel_${cIdx}`" class="lark-tab-dropdown-menu" @click.stop>
                  <button type="button" class="lark-tab-menu-item" @click="openEditViewDialog('personnel', card, cIdx); closeTabMenu()">
                    <i class="pi pi-pencil"></i>
                    <span>Sửa tên & Điều kiện lọc</span>
                  </button>
                  <button v-if="cIdx > 0" type="button" class="lark-tab-menu-item" @click="moveView('personnel', cIdx, -1); closeTabMenu()">
                    <i class="pi pi-arrow-left"></i>
                    <span>Dời sang trái</span>
                  </button>
                  <button v-if="cIdx < activePersonnelMetricCards.length - 1" type="button" class="lark-tab-menu-item" @click="moveView('personnel', cIdx, 1); closeTabMenu()">
                    <i class="pi pi-arrow-right"></i>
                    <span>Dời sang phải</span>
                  </button>
                  <div v-if="cIdx > 0" class="lark-tab-menu-divider"></div>
                  <button v-if="cIdx > 0" type="button" class="lark-tab-menu-item item-danger" @click="deleteView('personnel', card, cIdx); closeTabMenu()">
                    <i class="pi pi-trash"></i>
                    <span>Xóa Chế độ xem</span>
                  </button>
                </div>
              </div>
            </div>
          </template>

          <button
            v-if="authStore.isAdmin"
            type="button"
            class="lark-base-tab-add"
            @click="openAddViewDialog('personnel')"
            title="+ Thêm Chế độ xem (View) mới cho bảng Cán bộ"
          >
            <i class="pi pi-plus" style="font-size: 0.72rem;"></i>
            <span>Thêm View</span>
          </button>
        </div>
      </div>

      <!-- PrimeVue DataTable with Fixed Column Widths & Centered Actions -->
      <div class="app-card" style="padding: 0; overflow-x: auto; max-width: 100%; position: relative;">
      <DataTable
        v-model:selection="selectedPersonnel"
        :value="filteredPersonnel"
        dataKey="id"
        paginator
        :rows="15"
        :selectionPageOnly="true"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} cán bộ"
        :loading="personnelStore.loading"
        responsiveLayout="scroll"
        stripedRows
        removableSort
        :customSort="customSort"
        class="p-datatable-sm"
        :class="['table-row-clamp-' + currentRowHeightLimit]"
        :tableStyle="{ minWidth: 'max-content', width: '100%' }"
        @row-click="onRowClick"
        @page="e => dtFirst = e.first"
      >
        <Column selectionMode="multiple" headerClass="col-center" bodyClass="col-center" :headerStyle="{ width: '48px', minWidth: '48px' }" :bodyStyle="{ width: '48px', minWidth: '48px' }" />
        <Column field="stt" header="STT" headerClass="col-center" bodyClass="col-center" :headerStyle="{ width: '55px', minWidth: '55px' }" :bodyStyle="{ width: '55px', minWidth: '55px' }">
          <template #body="{ index }">
            <span style="font-weight: 600; color: #4b5563;">{{ dtFirst + index + 1 }}</span>
          </template>
        </Column>
        <Column
          v-if="personnelStore.visibleColumns.includes('code')"
          field="code"
          header="Mã CB"
          :headerStyle="{ width: '115px', minWidth: '115px' }"
          :bodyStyle="{ width: '115px', minWidth: '115px' }"
        >
          <template #body="{ data }">
            <span class="badge-code">{{ data.code || formatPersonnelCode(data.id) }}</span>
          </template>
        </Column>

        <!-- Cột ưu tiên từ Thống kê / Widget -->
        <Column
          v-if="routeFilterField"
          :header="`🎯 ${getRouteFilterFieldLabel()}`"
          headerClass="col-active-filter-header"
          bodyClass="col-active-filter-body"
          :headerStyle="{ minWidth: '190px', color: '#0369a1', fontWeight: '700', background: '#f0f9ff' }"
          :bodyStyle="{ minWidth: '190px', background: '#f0f9ff' }"
        >
          <template #body="{ data }">
            <template v-if="isPresenceField(routeFilterField)">
              <span
                :style="{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  background: getPresenceBadge(data).bg,
                  color: getPresenceBadge(data).color,
                  border: getPresenceBadge(data).border,
                }"
              >
                <i :class="getPresenceBadge(data).icon"></i>
                {{ getPresenceBadge(data).text }}
              </span>
            </template>
            <template v-else>
              <span style="font-weight: 700; color: #0369a1; font-size: 0.8rem;">
                {{ resolveVirtualColumnValue(data, routeFilterField) ?? (data[routeFilterField] !== undefined ? data[routeFilterField] : (data.custom_data?.[routeFilterField] ?? '-')) }}
              </span>
            </template>
          </template>
        </Column>

        <Column
          v-for="col in activeColumns"
          :key="col.id"
          :field="col.id"
          :headerClass="'col-left'"
          :bodyClass="'col-left'"
          :headerStyle="{ width: col.tableWidth || col.width || '160px', minWidth: col.tableWidth === 'auto' ? undefined : (col.tableWidth || col.width || '160px') }"
          :bodyStyle="{ width: col.tableWidth || col.width || '160px', minWidth: col.tableWidth === 'auto' ? undefined : (col.tableWidth || col.width || '160px') }"
        >
          <template #header>
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 4px;">
              <span class="table-col-header-wrap">
                <span v-if="showColIndex && col.colIndex && !col.isVirtual" style="color: #64748b; font-weight: 600; margin-right: 4px; font-size: 0.72rem;">
                  Cột {{ col.colIndex }}:
                </span>
                <span class="table-col-title-inline">
                  <span>{{ col.label }}</span>
                </span>
              </span>
              <button
                type="button"
                class="btn-col-menu-trigger"
                @click.stop="openColMenu($event, col)"
                title="Tùy chỉnh cột này (Đổi tên, đổi kiểu, ẩn cột...)"
              >
                <i class="pi pi-cog" style="font-size: 0.72rem;"></i>
              </button>
            </div>
          </template>
          <template #body="{ data }">
            <!-- Cột Khóa chính (_primaryKey) -->
            <template v-if="col.id === '_primaryKey'">
              <span style="display: inline-flex; align-items: center; font-family: monospace; font-size: 0.76rem; font-weight: 600; color: #475569; background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
                {{ getDisplayValue(data, col.id) }}
              </span>
            </template>

            <!-- Cột hệ thống / Thông tin cán bộ liên quan -->
            <template v-else-if="col.id === '_parentPersonnelName'">
              <span>{{ getPersonFieldValue(data, 'name') || data.name || '-' }}</span>
            </template>

            <!-- Name column -->
            <template v-else-if="col.id === 'name'">
              <strong style="color: #1f2937; cursor: pointer;">{{ getDisplayValue(data, col.id) !== '-' ? getDisplayValue(data, col.id) : (data.name || '-') }}</strong>
            </template>

            <!-- Presence Status Column -->
            <template v-else-if="isPresenceField(col.id)">
              <span
                :style="{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  background: getPresenceBadge(data).bg,
                  color: getPresenceBadge(data).color,
                  border: getPresenceBadge(data).border,
                }"
              >
                <i :class="getPresenceBadge(data).icon"></i>
                {{ getPresenceBadge(data).text }}
              </span>
            </template>

            <!-- Formula column -->
            <template v-else-if="isFormulaCol(col.id)">
              <div
                v-if="String(getFormulaStatus(data, allColumnDefsMap[col.id] || {})).includes('\n')"
                style="white-space: pre-line; font-size: 0.78rem; line-height: 1.45; color: #1e293b;"
              >
                <div style="font-weight: 700; color: #0369a1;">
                  {{ getFormulaStatus(data, allColumnDefsMap[col.id] || {}).split('\n')[0] }}
                </div>
                <div style="font-size: 0.73rem; color: #475569; margin-top: 2px;">
                  {{ getFormulaStatus(data, allColumnDefsMap[col.id] || {}).split('\n').slice(1).join('\n') }}
                </div>
              </div>
              <span
                v-else
                class="badge-pill badge-green"
                style="font-size: 0.76rem;"
              >
                {{ getFormulaStatus(data, allColumnDefsMap[col.id] || {}) }}
              </span>
            </template>

            <!-- Text + File Loop column -->
            <template v-else-if="col.format === 'text_file_loop'">
              <div v-if="getTextFileLoopItems(data, col.id).length > 0" style="display: flex; flex-direction: column; gap: 4px;">
                <div
                  v-for="(it, iIdx) in getTextFileLoopItems(data, col.id)"
                  :key="iIdx"
                  style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 0.76rem; line-height: 1.35;"
                >
                  <span v-if="it.text" style="color: #1e293b; word-break: break-word;">{{ it.text }}</span>
                  <a
                    v-if="it.file && (it.file.url || it.file.id)"
                    :href="getFileUrl(it.file)"
                    target="_blank"
                    style="display: inline-flex; align-items: center; gap: 3px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 1px 6px; border-radius: 4px; text-decoration: none; font-size: 0.7rem; font-weight: 500; white-space: nowrap;"
                    title="Mở xem tệp"
                  >
                    <i class="pi pi-paperclip" style="font-size: 0.68rem;"></i>
                    <span>{{ it.file.name || 'Tệp' }}</span>
                  </a>
                </div>
              </div>
              <span v-else>-</span>
            </template>

            <!-- Checkbox + File (Không loop) -->
            <template v-else-if="col.format === 'checkbox_file'">
              <div v-if="getCheckboxFileItem(data, col.id).hasValue" style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 0.76rem; line-height: 1.35;">
                <span v-if="getCheckboxFileItem(data, col.id).text" style="color: #1e293b; font-weight: 600;">
                  {{ getCheckboxFileItem(data, col.id).text }}
                </span>
                <a
                  v-if="getCheckboxFileItem(data, col.id).file && (getCheckboxFileItem(data, col.id).file.url || getCheckboxFileItem(data, col.id).file.id)"
                  :href="getFileUrl(getCheckboxFileItem(data, col.id).file)"
                  target="_blank"
                  style="display: inline-flex; align-items: center; gap: 3px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 1px 6px; border-radius: 4px; text-decoration: none; font-size: 0.7rem; font-weight: 500; white-space: nowrap;"
                  title="Mở xem tệp"
                >
                  <i class="pi pi-paperclip" style="font-size: 0.68rem;"></i>
                  <span>{{ getCheckboxFileItem(data, col.id).file.name || 'Tệp' }}</span>
                </a>
              </div>
              <span v-else>-</span>
            </template>

            <!-- Checkbox + File Loop column -->
            <template v-else-if="col.format === 'checkbox_file_loop'">
              <div v-if="getCheckboxFileLoopItems(data, col.id).length > 0" style="display: flex; flex-direction: column; gap: 6px;">
                <div
                  v-for="(it, iIdx) in getCheckboxFileLoopItems(data, col.id)"
                  :key="iIdx"
                  style="display: flex; align-items: flex-start; gap: 6px; font-size: 0.76rem; line-height: 1.4;"
                >
                  <i
                    :class="it.checked ? 'pi pi-check-circle' : 'pi pi-circle'"
                    :style="{ fontSize: '0.75rem', color: it.checked ? '#16a34a' : '#94a3b8', flexShrink: 0, marginTop: '3px' }"
                  ></i>
                  <span
                    v-if="it.selectedOptions && it.selectedOptions.length"
                    style="background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; white-space: nowrap; flex-shrink: 0; line-height: 1.3;"
                  >
                    {{ Array.isArray(it.selectedOptions) ? it.selectedOptions.join(', ') : it.selectedOptions }}
                  </span>
                  <span style="flex: 1; min-width: 0; word-break: break-word; color: #1e293b;">
                    {{ it.text || (it.selectedOptions && it.selectedOptions.length ? '' : '(Chưa nhập tên)') }}
                  </span>
                  <a
                    v-if="it.file && (it.file.url || it.file.id)"
                    :href="getFileUrl(it.file)"
                    target="_blank"
                    style="display: inline-flex; align-items: center; gap: 3px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 1px 6px; border-radius: 4px; text-decoration: none; font-size: 0.7rem; font-weight: 500; white-space: nowrap; flex-shrink: 0;"
                    title="Mở xem tệp"
                  >
                    <i class="pi pi-paperclip" style="font-size: 0.68rem;"></i>
                    <span>{{ it.file.name || 'Tệp' }}</span>
                  </a>
                </div>
              </div>
              <span v-else>-</span>
            </template>

            <!-- Format File đính kèm tiêu chuẩn -->
            <template v-else-if="col.format === 'file'">
              <div v-if="getFileColumnItems(data, col.id).length > 0" style="display: flex; flex-wrap: wrap; gap: 4px;">
                <a
                  v-for="(f, fIdx) in getFileColumnItems(data, col.id)"
                  :key="fIdx"
                  :href="getFileUrl(f)"
                  target="_blank"
                  style="display: inline-flex; align-items: center; gap: 3px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 1px 6px; border-radius: 4px; text-decoration: none; font-size: 0.7rem; font-weight: 500; white-space: nowrap;"
                  title="Mở xem tệp"
                >
                  <i class="pi pi-paperclip" style="font-size: 0.68rem;"></i>
                  <span>{{ f.name || 'Tệp' }}</span>
                </a>
              </div>
              <span v-else>-</span>
            </template>

            <!-- General columns (Direct value matching Chi tiết 100% + Inline Editing) -->
            <template v-else>
              <div
                class="inline-cell-wrapper"
                @dblclick.stop="startInlineEdit(data, col)"
                :title="'Nhấp đúp để chỉnh sửa nhanh ô này'"
              >
                <!-- Đang sửa inline -->
                <div v-if="editingCell?.rowId === data.id && editingCell?.colId === col.id" class="inline-edit-box" @click.stop>
                  <input
                    v-if="col.format === 'text' || !col.format"
                    v-model="editingCell.value"
                    class="inline-edit-input"
                    autofocus
                    @keyup.enter="saveInlineEdit"
                    @keyup.esc="cancelInlineEdit"
                    @blur="saveInlineEdit"
                  />
                  <input
                    v-else-if="col.format === 'number'"
                    type="number"
                    v-model="editingCell.value"
                    class="inline-edit-input"
                    autofocus
                    @keyup.enter="saveInlineEdit"
                    @keyup.esc="cancelInlineEdit"
                    @blur="saveInlineEdit"
                  />
                  <input
                    v-else-if="col.format === 'date'"
                    type="date"
                    v-model="editingCell.value"
                    class="inline-edit-input"
                    autofocus
                    @change="saveInlineEdit"
                    @keyup.esc="cancelInlineEdit"
                    @blur="saveInlineEdit"
                  />
                  <select
                    v-else-if="col.format === 'dropdown'"
                    v-model="editingCell.value"
                    class="inline-edit-select"
                    autofocus
                    @change="saveInlineEdit"
                    @blur="saveInlineEdit"
                  >
                    <option value="">-- Trống --</option>
                    <option v-for="opt in getColDropdownOptions(col)" :key="opt" :value="opt">
                      {{ opt }}
                    </option>
                  </select>
                  <input
                    v-else
                    v-model="editingCell.value"
                    class="inline-edit-input"
                    autofocus
                    @keyup.enter="saveInlineEdit"
                    @keyup.esc="cancelInlineEdit"
                    @blur="saveInlineEdit"
                  />
                </div>

                <!-- Hiển thị giá trị bình thường -->
                <span v-else style="word-break: break-word; line-height: 1.45;">{{ getDisplayValue(data, col.id) }}</span>
              </div>
            </template>
          </template>
        </Column>

        <!-- ➕ Nút Thêm Cột Mới chuẩn Airtable / Lark Base / Teable -->
        <Column :headerStyle="{ width: '48px', minWidth: '48px', padding: '0', textAlign: 'center' }" :bodyStyle="{ width: '48px', minWidth: '48px', padding: '0', textAlign: 'center', background: '#f8fafc' }">
          <template #header>
            <button
              type="button"
              class="btn-add-col-plus"
              @click.stop="openAddColumnModal"
              title="Thêm Cột Dữ Liệu Mới (Airtable / Lark Base style)"
            >
              <i class="pi pi-plus"></i>
            </button>
          </template>
          <template #body>
            <span style="color: #cbd5e1; font-size: 0.8rem;">·</span>
          </template>
        </Column>
      </DataTable>
      </div>
    </div>

    <!-- TAB 2: DANH SÁCH THÂN NHÂN -->
    <div v-show="mainTab === 'thannhan'">
      <!-- Header Section with Actions -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <!-- Biểu tượng Bảng với màu sắc tùy chỉnh -->
          <button
            v-if="authStore.isAdmin"
            type="button"
            class="table-icon-badge-btn"
            :style="{
              color: getTableIconColor('relatives'),
              borderColor: getTableIconColor('relatives') + '40',
              background: getTableIconColor('relatives') + '15'
            }"
            @click="openIconColorDialog('relatives', relativeTableTitle)"
            title="Nhấn để đổi biểu tượng (Icon) & màu sắc bảng Thân nhân"
          >
            <i :class="['pi', getTableIcon('relatives')]" style="font-size: 1.25rem;"></i>
          </button>
          <span
            v-else
            class="table-icon-badge"
            :style="{
              color: getTableIconColor('relatives'),
              borderColor: getTableIconColor('relatives') + '40',
              background: getTableIconColor('relatives') + '15'
            }"
          >
            <i :class="['pi', getTableIcon('relatives')]" style="font-size: 1.25rem;"></i>
          </span>

          <div>
            <h1 style="font-size: 1.35rem; font-weight: 700; color: #0f172a; margin: 0; display: inline-flex; align-items: center; gap: 8px;">
              {{ relativeTableTitle }}
              <span style="font-size: 0.85rem; font-weight: 500; color: #64748b;">· {{ filteredRelatives.length }} bản ghi</span>
            </h1>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <Button
            v-if="selectedRelatives.length > 0"
            :label="`Xóa (${selectedRelatives.length} đã chọn)`"
            icon="pi pi-trash"
            severity="danger"
            size="small"
            @click="handleBulkDeleteRelatives"
            style="font-size: 0.8rem;"
          />

          <div class="search-input-wrapper">
            <i class="pi pi-search search-icon-left"></i>
            <InputText
              v-model="relativeSearchQuery"
              placeholder="Tìm tên thân nhân, cán bộ, CCCD, đơn vị..."
              size="small"
              style="width: 250px; font-size: 0.8rem; height: 32px;"
            />
            <button
              v-if="relativeSearchQuery"
              type="button"
              class="search-clear-btn"
              @click="relativeSearchQuery = ''"
              title="Xóa tìm kiếm"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Chip hiển thị bộ lọc từ Dashboard Widget -->
          <div
            v-if="routeFilterField && routeFilterValue"
            style="display: inline-flex; align-items: center; gap: 6px; background: #faf5ff; border: 1px solid #d8b4fe; padding: 3px 10px; border-radius: 9999px; font-size: 0.75rem; color: #7e22ce; font-weight: 600;"
          >
            <span>🎯 Lọc: {{ getRouteFilterFieldLabel() }}: <b>{{ routeFilterValue }}</b></span>
            <button
              type="button"
              @click="clearRouteFilter"
              style="background: none; border: none; cursor: pointer; color: #ef4444; padding: 0; font-size: 0.75rem; display: flex; align-items: center;"
              title="Xóa bộ lọc"
            >
              <i class="pi pi-times-circle"></i>
            </button>
          </div>

          <!-- ➕ Nút Thêm Cột Mới Thân nhân -->
          <Button
            v-if="authStore.isAdmin"
            icon="pi pi-plus"
            label="Thêm cột mới"
            severity="success"
            size="small"
            @click="openAddColumnModal('relatives')"
            title="Tạo thêm cột dữ liệu mới cho bảng Thân nhân"
            style="font-size: 0.8rem;"
          />

          <!-- ⚙️ Cài đặt Cột Thân nhân Popover -->
          <div class="header-menu-wrapper" @mouseenter="onMouseEnterRelFilter" @mouseleave="onMouseLeaveRelFilter">
            <Button
              icon="pi pi-sliders-h"
              label="Tùy chọn Cột"
              severity="secondary"
              outlined
              size="small"
              @click="isRelativeFilterMenuOpen = !isRelativeFilterMenuOpen; isRelativeDataMenuOpen = false;"
              title="Tùy biến cột hiển thị bảng Thân nhân"
              style="font-size: 0.8rem;"
            />

            <div v-show="isRelativeFilterMenuOpen" class="header-menu-dropdown filter-panel-dropdown" style="padding: 0; overflow: hidden;">
              <ColumnSelector
                :inline="true"
                v-model="personnelStore.visibleRelativeColumns"
                :options="personnelStore.allAvailableRelativeColumns"
                @change="onRelativeColumnsChange"
                @open-col-menu="handleColMenuFromSelector"
              />
            </div>
          </div>

          <!-- 🔑 Cấu hình Khóa Định danh & Khóa Liên Kết Thân nhân -->
          <Button
            label="Khóa & Liên kết"
            icon="pi pi-key"
            severity="secondary"
            outlined
            size="small"
            @click="isKeyLinkDialogOpen = true"
            title="Cấu hình Khóa Định Danh & Khóa Liên Kết giữa các Bảng dữ liệu"
            style="font-size: 0.8rem;"
          />

          <!-- 📥 Menu Xuất / Nhập Dropdown chuẩn dùng chung ExportImportMenu -->
          <ExportImportMenu
            :tableTitle="relativeTableTitle"
            :selectedCount="selectedPersonnel.length"
            @import="openImportWizard('relative')"
            @export-pdf="openAdvancedDocxExport(null)"
            @export-excel="exportRelativeExcel"
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

      <!-- Lark Base View Tabs strip for Thân nhân -->
      <div class="lark-base-view-tabs-container">
        <div class="lark-base-view-tabs-strip">
          <template v-for="(card, cIdx) in activeRelativeMetricCards" :key="card.id || cIdx">
            <div
              class="lark-tab-item-wrapper"
              :class="{ 'tab-active': activeRelativeCardIdx === cIdx }"
            >
              <button
                type="button"
                class="lark-base-tab-item"
                :class="{ 'tab-active': activeRelativeCardIdx === cIdx }"
                @click="selectRelativeCard(card, cIdx)"
              >
                <i class="pi pi-table" style="font-size: 0.82rem; color: #9333ea;"></i>
                <span style="font-weight: 700;">{{ card.label }}</span>
                <span :class="['lark-tab-count-pill', `pill-${card.color || 'purple'}`]">
                  {{ getRelativeCardMetricValue(card) }}
                </span>
              </button>

              <!-- Thao tác View: Menu Cấu hình Setup (Dời trái, Dời phải, Sửa, Xóa) -->
              <div v-if="authStore.isAdmin" class="lark-tab-actions">
                <button
                  type="button"
                  class="btn-tab-action btn-tab-setup"
                  :class="{ active: activeTabMenuKey === `relatives_${cIdx}` }"
                  @click.stop="toggleTabMenu('relatives', cIdx)"
                  title="Tùy chọn Chế độ xem"
                >
                  <i class="pi pi-ellipsis-v"></i>
                </button>
                <div v-if="activeTabMenuKey === `relatives_${cIdx}`" class="lark-tab-dropdown-menu" @click.stop>
                  <button type="button" class="lark-tab-menu-item" @click="openEditViewDialog('relatives', card, cIdx); closeTabMenu()">
                    <i class="pi pi-pencil"></i>
                    <span>Sửa tên & Điều kiện lọc</span>
                  </button>
                  <button v-if="cIdx > 0" type="button" class="lark-tab-menu-item" @click="moveView('relatives', cIdx, -1); closeTabMenu()">
                    <i class="pi pi-arrow-left"></i>
                    <span>Dời sang trái</span>
                  </button>
                  <button v-if="cIdx < activeRelativeMetricCards.length - 1" type="button" class="lark-tab-menu-item" @click="moveView('relatives', cIdx, 1); closeTabMenu()">
                    <i class="pi pi-arrow-right"></i>
                    <span>Dời sang phải</span>
                  </button>
                  <div v-if="cIdx > 0" class="lark-tab-menu-divider"></div>
                  <button v-if="cIdx > 0" type="button" class="lark-tab-menu-item item-danger" @click="deleteView('relatives', card, cIdx); closeTabMenu()">
                    <i class="pi pi-trash"></i>
                    <span>Xóa Chế độ xem</span>
                  </button>
                </div>
              </div>
            </div>
          </template>

          <button
            v-if="authStore.isAdmin"
            type="button"
            class="lark-base-tab-add"
            @click="openAddViewDialog('relatives')"
            title="+ Thêm Chế độ xem (View) mới cho bảng Thân nhân"
          >
            <i class="pi pi-plus" style="font-size: 0.72rem;"></i>
            <span>Thêm View</span>
          </button>
        </div>
      </div>

      <!-- PrimeVue DataTable with Fixed Column Widths & Centered Actions -->
      <div class="app-card" style="padding: 0; overflow-x: auto; max-width: 100%; position: relative;">
      <DataTable
        v-model:selection="selectedRelatives"
        :value="filteredRelatives"
        paginator
        :rows="15"
        :selectionPageOnly="true"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} thân nhân"
        responsiveLayout="scroll"
        stripedRows
        removableSort
        :customSort="customSort"
        class="p-datatable-sm"
        :class="['table-row-clamp-' + currentRowHeightLimit]"
        :tableStyle="{ minWidth: 'max-content', width: '100%' }"
        @row-click="onRelativeRowClick"
        @page="e => dtFirstRel = e.first"
      >
        <Column selectionMode="multiple" :headerStyle="{ width: '45px', minWidth: '45px' }" :bodyStyle="{ width: '45px', minWidth: '45px' }" />
        <Column 
          field="stt" 
          header="STT" 
          headerClass="col-center" 
          bodyClass="col-center" 
          :headerStyle="{ width: '55px', minWidth: '55px' }" 
          :bodyStyle="{ width: '55px', minWidth: '55px' }"
        >
          <template #body="{ index }">
            <span style="font-weight: 600; color: #4b5563;">{{ dtFirstRel + index + 1 }}</span>
          </template>
        </Column>
        <!-- Cột Mã Thân nhân / Mã Đối tượng (Có thể ẩn/hiện, đổi tên) -->
        <Column
          v-if="personnelStore.visibleRelativeColumns.includes('code')"
          field="code"
          :headerStyle="{ width: '110px', minWidth: '110px' }"
        >
          <template #header>
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 4px;">
              <span class="table-col-header-wrap">
                {{ getCustomColLabel('code', 'Mã thân nhân') }}
              </span>
              <button
                type="button"
                class="btn-col-menu-trigger"
                @click.stop="openColMenu($event, { id: 'code', label: getCustomColLabel('code', 'Mã thân nhân'), isVirtual: true })"
                title="Tùy chỉnh cột này (Đổi tên, ẩn cột...)"
              >
                <i class="pi pi-cog" style="font-size: 0.72rem;"></i>
              </button>
            </div>
          </template>
          <template #body="{ data, index }">
            <span class="badge-code">{{ data.code || ('TN-' + String(data.id || (index + 1)).slice(-5).padStart(5, '0')) }}</span>
          </template>
        </Column>

        <!-- Cột Đối tượng liên quan / Hồ sơ chính (Có thể ẩn/hiện, đổi tên, cấu hình trường con) -->
        <Column
          v-if="personnelStore.visibleRelativeColumns.includes('_parentPersonnelName') || personnelStore.visibleRelativeColumns.includes('parentName')"
          field="parentName"
          :headerStyle="{ width: '220px', minWidth: '220px' }"
        >
          <template #header>
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 4px;">
              <span class="table-col-header-wrap">
                {{ getCustomColLabel('_parentPersonnelName', 'Đối tượng liên quan') }}
              </span>
              <div style="display: inline-flex; align-items: center; gap: 2px;">
                <button
                  type="button"
                  class="btn-col-menu-trigger"
                  @click.stop="openNameColModal"
                  title="Chọn các trường thông tin hiển thị (Họ tên, CCCD/Mã, Chức vụ, Đơn vị...)"
                  style="opacity: 0.85;"
                >
                  <i class="pi pi-sliders-h" style="font-size: 0.72rem; color: #4338ca;"></i>
                </button>
                <button
                  type="button"
                  class="btn-col-menu-trigger"
                  @click.stop="openColMenu($event, { id: '_parentPersonnelName', label: getCustomColLabel('_parentPersonnelName', 'Đối tượng liên quan'), isVirtual: true })"
                  title="Tùy chỉnh cột này (Đổi tên, ẩn cột...)"
                >
                  <i class="pi pi-cog" style="font-size: 0.72rem;"></i>
                </button>
              </div>
            </div>
          </template>
          <template #body="{ data }">
            <div v-if="isFirstRelativeOfParent(data)">
              <div style="display: flex; flex-direction: column; gap: 2px; line-height: 1.35; padding: 2px 0;">
                <template v-for="(opt, fIdx) in activeParentFieldsList" :key="opt.key">
                  <div v-if="getPersonFieldValue(data.parentPerson || data, opt.key)">
                    <strong
                      v-if="opt.key === 'name' || (fIdx === 0 && !activeParentFieldsList.some(o => o.key === 'name'))"
                      style="cursor: pointer; color: #1f2937; font-weight: 700; font-size: 0.85rem;"
                      @click="data.parentPerson && openEditDialog(data.parentPerson)"
                    >
                      {{ getPersonFieldValue(data.parentPerson || data, opt.key) }}
                    </strong>
                    <div v-else style="font-size: 0.72rem; color: #4b5563; line-height: 1.3;">
                      <span style="color: #64748b; font-weight: 600;">{{ opt.label }}: </span>
                      <span>{{ getPersonFieldValue(data.parentPerson || data, opt.key) }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            <div v-else style="padding-left: 10px; color: #94a3b8; font-size: 0.74rem; display: flex; align-items: center; gap: 4px;">
              <span style="color: #cbd5e1;">↳</span> <span style="font-style: italic; color: #94a3b8;">(cùng hồ sơ liên quan)</span>
            </div>
          </template>
        </Column>

        <!-- Cột ưu tiên từ Thống kê / Widget -->
        <Column
          v-if="routeFilterField"
          :header="`🎯 ${getRouteFilterFieldLabel()}`"
          headerClass="col-active-filter-header"
          bodyClass="col-active-filter-body"
          :headerStyle="{ minWidth: '190px', color: '#7e22ce', fontWeight: '700', background: '#faf5ff' }"
          :bodyStyle="{ minWidth: '190px', background: '#faf5ff' }"
        >
          <template #body="{ data }">
            <template v-if="isPresenceField(routeFilterField)">
              <span
                :style="{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  background: getPresenceBadge(data).bg,
                  color: getPresenceBadge(data).color,
                  border: getPresenceBadge(data).border,
                }"
              >
                <i :class="getPresenceBadge(data).icon"></i>
                {{ getPresenceBadge(data).text }}
              </span>
            </template>
            <template v-else>
              <span style="font-weight: 700; color: #7e22ce; font-size: 0.8rem;">
                {{ resolveVirtualColumnValue(data, routeFilterField) ?? (data[routeFilterField] !== undefined ? data[routeFilterField] : (data.custom_data?.[routeFilterField] ?? '-')) }}
              </span>
            </template>
          </template>
        </Column>

        <!-- Dynamic Relative Columns from Settings -->
        <Column
          v-for="col in activeRelativeColumns"
          :key="col.id"
          :field="col.id"
          :headerClass="'col-left'"
          :bodyClass="'col-left'"
          :headerStyle="{ width: col.tableWidth || col.width || '150px', minWidth: col.tableWidth === 'auto' ? undefined : (col.tableWidth || col.width || '150px') }"
          :bodyStyle="{ width: col.tableWidth || col.width || '150px', minWidth: col.tableWidth === 'auto' ? undefined : (col.tableWidth || col.width || '150px') }"
        >
          <template #header>
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 4px;">
              <span class="table-col-header-wrap">
                <span v-if="showColIndex && col.colIndex && !col.isVirtual" style="color: #64748b; font-weight: 600; margin-right: 4px; font-size: 0.72rem;">
                  Cột {{ col.colIndex }}:
                </span>
                <span class="table-col-title-inline">
                  <span>{{ col.label }}</span>
                </span>
              </span>
              <button
                type="button"
                class="btn-col-menu-trigger"
                @click.stop="openColMenu($event, col)"
                title="Tùy chỉnh cột này (Đổi tên, đổi kiểu, ẩn cột...)"
              >
                <i class="pi pi-cog" style="font-size: 0.72rem;"></i>
              </button>
            </div>
          </template>
          <template #body="{ data }">
            <!-- Cột Khóa chính (_primaryKey) -->
            <template v-if="col.id === '_primaryKey'">
              <span style="display: inline-flex; align-items: center; gap: 5px; font-family: monospace; font-size: 0.76rem; font-weight: 700; color: #475569; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">
                <i class="pi pi-key" style="font-size: 0.7rem; color: #d97706;"></i>
                {{ getDisplayValue(data, col.id) }}
              </span>
            </template>
            <template v-else-if="col.format === 'checkbox_file_loop'">
              <div v-if="getCheckboxFileLoopItems(data, col.id).length > 0" style="display: flex; flex-direction: column; gap: 6px;">
                <div
                  v-for="(it, iIdx) in getCheckboxFileLoopItems(data, col.id)"
                  :key="iIdx"
                  style="display: flex; align-items: flex-start; gap: 6px; font-size: 0.76rem; line-height: 1.4;"
                >
                  <i
                    :class="it.checked ? 'pi pi-check-circle' : 'pi pi-circle'"
                    :style="{ fontSize: '0.75rem', color: it.checked ? '#16a34a' : '#94a3b8', flexShrink: 0, marginTop: '3px' }"
                  ></i>
                  <span
                    v-if="it.selectedOptions && it.selectedOptions.length"
                    style="background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; white-space: nowrap; flex-shrink: 0; line-height: 1.3;"
                  >
                    {{ Array.isArray(it.selectedOptions) ? it.selectedOptions.join(', ') : it.selectedOptions }}
                  </span>
                  <span style="flex: 1; min-width: 0; word-break: break-word; color: #1e293b;">
                    {{ it.text || (it.selectedOptions && it.selectedOptions.length ? '' : '(Chưa nhập tên)') }}
                  </span>
                  <a
                    v-if="it.file && (it.file.url || it.file.id)"
                    :href="getFileUrl(it.file)"
                    target="_blank"
                    style="display: inline-flex; align-items: center; gap: 3px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 1px 6px; border-radius: 4px; text-decoration: none; font-size: 0.7rem; font-weight: 500; white-space: nowrap; flex-shrink: 0;"
                    title="Mở xem tệp"
                  >
                    <i class="pi pi-paperclip" style="font-size: 0.68rem;"></i>
                    <span>{{ it.file.name || 'Tệp' }}</span>
                  </a>
                </div>
              </div>
              <span v-else>-</span>
            </template>

            <!-- Format File đính kèm tiêu chuẩn (Thân nhân) -->
            <template v-else-if="col.format === 'file'">
              <div v-if="getFileColumnItems(data, col.id).length > 0" style="display: flex; flex-wrap: wrap; gap: 4px;">
                <a
                  v-for="(f, fIdx) in getFileColumnItems(data, col.id)"
                  :key="fIdx"
                  :href="getFileUrl(f)"
                  target="_blank"
                  style="display: inline-flex; align-items: center; gap: 3px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 1px 6px; border-radius: 4px; text-decoration: none; font-size: 0.7rem; font-weight: 500; white-space: nowrap;"
                  title="Mở xem tệp"
                >
                  <i class="pi pi-paperclip" style="font-size: 0.68rem;"></i>
                  <span>{{ f.name || 'Tệp' }}</span>
                </a>
              </div>
              <span v-else>-</span>
            </template>

            <!-- Presence Status Column -->
            <template v-else-if="isPresenceField(col.id)">
              <span
                :style="{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  background: getPresenceBadge(data).bg,
                  color: getPresenceBadge(data).color,
                  border: getPresenceBadge(data).border,
                }"
              >
                <i :class="getPresenceBadge(data).icon"></i>
                {{ getPresenceBadge(data).text }}
              </span>
            </template>
            <div
              v-else-if="String(getDisplayValue(data, col.id)).includes('\n')"
              style="white-space: pre-line; line-height: 1.45; font-size: 0.78rem; color: #1e293b;"
            >
              <div style="font-weight: 700; color: #0369a1;">
                {{ String(getDisplayValue(data, col.id)).split('\n')[0] }}
              </div>
              <div style="font-size: 0.73rem; color: #475569; margin-top: 2px;">
                {{ String(getDisplayValue(data, col.id)).split('\n').slice(1).join('\n') }}
              </div>
            </div>
            <span v-else :class="col.id === 'countryName' || col.id === 'country' || col.id === 'content' ? 'badge-pill badge-blue' : ''">
              {{ getDisplayValue(data, col.id) }}
            </span>
          </template>
        </Column>

        <!-- ➕ Nút Thêm Cột Mới chuẩn Lark Base cho Thân nhân -->
        <Column :headerStyle="{ width: '48px', minWidth: '48px', padding: '0', textAlign: 'center' }" :bodyStyle="{ width: '48px', minWidth: '48px', padding: '0', textAlign: 'center', background: '#f8fafc' }">
          <template #header>
            <button
              type="button"
              class="btn-add-col-plus"
              @click.stop="openAddColumnModal('relatives')"
              title="Thêm Cột Dữ Liệu Mới cho Thân nhân"
            >
              <i class="pi pi-plus"></i>
            </button>
          </template>
          <template #body>
            <span style="color: #cbd5e1; font-size: 0.8rem;">·</span>
          </template>
        </Column>
      </DataTable>
      </div>
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
      :selectedPersonnel="effectiveSelectedPersonnelForDocx"
      :allPersonnel="effectiveAllPersonnelForDocx"
    />

    <!-- Excel Import Wizard (4 Steps) -->
    <ExcelImportWizard
      v-model:visible="isWizardOpen"
      :defaultTarget="wizardTarget"
      @imported="onWizardImported"
    />
  </div>

    <!-- Header Cột thông minh Context Menu Popover -->
    <ColumnHeaderMenu
      v-model:visible="isColMenuVisible"
      :column="selectedMenuCol"
      :tableSource="targetColSource"
      :position="colMenuPosition"
      :nameColFields="nameColFields"
      :availableParentFields="availableParentFields"
      @rename-column="onRenameColumn"
      @change-format="onChangeColumnFormat"
      @change-formula-type="onChangeColumnFormulaType"
      @change-options="onChangeColumnOptions"
      @change-width="onChangeColumnWidth"
      @change-form-width="onChangeColumnFormWidth"
      @change-required="onColChangeRequired"
      @change-lookup="onChangeColumnLookup"
      @change-name-col-field="toggleNameColField"
      @delete-column="onDeleteColumnFromTable"
      @hide-column="onHideColumn"
      @filter-column="onFilterByColumn"
      @insert-left="onInsertColLeft"
      @insert-right="onInsertColRight"
      @duplicate-column="onDuplicateCol"
      @open-key-config="isKeyLinkDialogOpen = true"
    />

    <!-- Dialog Thêm Cột Mới Chuẩn Lark Base -->
    <AddColumnDialog
      v-model:visible="isAddColOpen"
      :tableSource="targetColSource"
      :targetIndex="addColTargetIndex"
      @save="onSaveNewColumn"
    />

    <!-- Dialog Cấu hình Khóa Định danh & Khóa Liên Kết giữa các Bảng -->
    <TableKeyLinkDialog
      v-model:visible="isKeyLinkDialogOpen"
      :activeSource="mainTab === 'thannhan' || route.path === '/relatives' ? 'relatives' : 'personnel'"
    />

    <!-- Dialog Quản lý Chế độ xem (View) đa hình (Thêm / Sửa / Xóa / Bộ lọc điều kiện dùng chung) -->
    <TableViewManagerDialog
      v-model="isViewManagerOpen"
      :mode="viewManagerMode"
      :viewData="selectedViewForEdit"
      :canDelete="selectedViewIdx > 0"
      :columns="addViewTargetTable === 'relatives' ? allAvailableRelativeColumns : allAvailablePersonnelColumns"
      :tableTitle="addViewTargetTable === 'relatives' ? relativeTableTitle : mainTableTitle"
      @save="handleSaveView"
      @delete="deleteView(addViewTargetTable, selectedViewForEdit, selectedViewIdx)"
    />

    <!-- Dialog Tùy chỉnh Biểu tượng & Màu sắc Bảng -->
    <TableIconColorDialog
      v-model:visible="isIconColorDialogOpen"
      :tableId="iconDialogTableId"
      :tableTitle="iconDialogTableTitle"
      :currentIcon="iconDialogCurrentIcon"
      :currentColor="iconDialogCurrentColor"
      @saved="onIconColorSaved"
    />

</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import ColumnSelector from '@/components/common/ColumnSelector.vue';
import ColumnHeaderMenu from '@/components/common/ColumnHeaderMenu.vue';
import AddColumnDialog from '@/components/common/AddColumnDialog.vue';
import TableKeyLinkDialog from '@/components/common/TableKeyLinkDialog.vue';
import TableIconColorDialog from '@/components/common/TableIconColorDialog.vue';
import TableViewManagerDialog from '@/components/common/TableViewManagerDialog.vue';

import ExcelImportWizard from '@/components/common/ExcelImportWizard.vue';
import apiClient from '@/api/client';
import { getAppSettings, saveAppSettings } from '@/api/settings';
import { usePersonnelStore } from '@/stores/personnel';
import { useAuthStore } from '@/stores/auth';
import { DEFAULT_UNIFIED_DASHBOARDS, ensureStandardDashboards } from '@/utils/tableRegistry';
import { matchCardCondition as matchSharedCardCondition, isCardAllType as isSharedCardAllType, computeMetricCardCount } from '@/utils/dashboardMetrics';
import { computeColumnIndexMap, formatPersonnelCode, formatDate, formatExcelDate, computePresenceStatus, computeOverdueStatus, evaluateFormula, evaluateLookup, evaluateRollup, formatGenericCellValue, resolvePresence, isPresenceField, resolveVirtualColumnValue, getPresenceBadge } from '@/utils/formatters';
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
import { getFileUrl } from '@/api/files';
import { logActivity } from '@/api/audit';
import PersonnelDialog from '@/components/personnel/PersonnelDialog.vue';
import AdvancedDocxExportDialog from '@/components/common/AdvancedDocxExportDialog.vue';
import ExportImportMenu from '@/components/common/ExportImportMenu.vue';

const route = useRoute();
const router = useRouter();
const personnelStore = usePersonnelStore();
const authStore = useAuthStore();
const mainTableTitle = computed(() => {
  try {
    const local = localStorage.getItem('system_branding_config');
    if (local) {
      const p = JSON.parse(local);
      if (p.menuLabelPersonnel && p.menuLabelPersonnel !== 'Bảng dữ liệu chính') return p.menuLabelPersonnel;
    }
  } catch (e) {}
  return 'Cán bộ';
});

const relativeTableTitle = computed(() => {
  try {
    const local = localStorage.getItem('system_branding_config');
    if (local) {
      const p = JSON.parse(local);
      if (p.menuLabelRelatives) return p.menuLabelRelatives;
    }
  } catch (e) {}
  return 'Thân nhân';
});

const isWizardOpen = ref(false);
const wizardTarget = ref('personnel');

const openImportWizard = (target = 'personnel') => {
  wizardTarget.value = target;
  isWizardOpen.value = true;
};

const onWizardImported = async () => {
  await personnelStore.fetchPersonnel();
};

const exportPersonnelExcel = () => {
  const list = filteredPersonnelList.value || [];
  const cols = activeColumns.value || [];
  if (cols.length > 0) {
    const rows = list.map((item, idx) => {
      const obj = { 'STT': dtFirst.value + idx + 1 };
      cols.forEach((col) => {
        obj[col.label || col.id] = getDisplayValue(item, col.id);
      });
      return obj;
    });
    exportToExcel(rows, `Danh_sach_Can_bo_${new Date().toISOString().slice(0, 10)}`, 'Cán bộ');
  } else {
    exportFullPersonnelExcel(list, personnelStore.importMappingPersonnel, (id) => personnelStore.getDepartmentName(id));
  }
};

const exportRelativeExcel = () => {
  const list = filteredRelativesList.value || [];
  const cols = activeRelativeColumns.value || [];
  if (cols.length > 0) {
    const rows = list.map((item, idx) => {
      const obj = { 'STT': dtFirstRel.value + idx + 1 };
      cols.forEach((col) => {
        obj[col.label || col.id] = getDisplayValue(item, col.id);
      });
      return obj;
    });
    exportToExcel(rows, `Danh_sach_Than_nhan_${new Date().toISOString().slice(0, 10)}`, 'Thân nhân');
  } else {
    exportFullRelativesExcel(list, personnelStore.importMappingRelative, (id) => personnelStore.getDepartmentName(id));
  }
};

const mainTab = ref('canhan'); // 'canhan' or 'thannhan'

const syncTabWithRoute = () => {
  if (route.path === '/relatives' || route.query.tab === 'thannhan' || route.query.tab === 'relatives') {
    mainTab.value = 'thannhan';
  } else {
    mainTab.value = 'canhan';
  }
};

const switchToTable = (tab) => {
  mainTab.value = tab;
  if (tab === 'thannhan') {
    router.replace({ path: '/relatives', query: { ...route.query, tab: 'thannhan' } });
  } else {
    router.replace({ path: '/personnel', query: { ...route.query, tab: 'canhan' } });
  }
};

watch(
  () => [route.path, route.query.tab],
  () => {
    syncTabWithRoute();
  },
  { immediate: true }
);

// ==================== CẤU HÌNH BẢNG & CHẾ ĐỘ XEM (LARK BASE VIEW TABS) ====================
const getInitialCustomDashboards = () => {
  try {
    const local = localStorage.getItem('custom_dashboards_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return ensureStandardDashboards(parsed);
    }
  } catch (e) {}
  return ensureStandardDashboards([...DEFAULT_UNIFIED_DASHBOARDS]);
};

const customDashboards = ref(getInitialCustomDashboards());

const loadCustomDashboards = async () => {
  try {
    const saved = await getAppSettings('custom_dashboards_config', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      customDashboards.value = ensureStandardDashboards(saved);
      localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
    } else {
      const local = localStorage.getItem('custom_dashboards_config');
      if (local && (!customDashboards.value || customDashboards.value.length === 0)) {
        customDashboards.value = ensureStandardDashboards(JSON.parse(local));
      } else {
        customDashboards.value = ensureStandardDashboards(customDashboards.value);
      }
    }
  } catch (e) {}
};

const personnelDashboardConfig = computed(() => {
  return (customDashboards.value || []).find((d) => d.id === 'personnel') || DEFAULT_UNIFIED_DASHBOARDS[0];
});

const relativeDashboardConfig = computed(() => {
  return (customDashboards.value || []).find((d) => d.id === 'relatives') || DEFAULT_UNIFIED_DASHBOARDS[1];
});

// Tùy chỉnh Biểu tượng & Màu sắc Bảng
const isIconColorDialogOpen = ref(false);
const iconDialogTableId = ref('personnel');
const iconDialogTableTitle = ref('Cán bộ');
const iconDialogCurrentIcon = ref('pi-users');
const iconDialogCurrentColor = ref('#0284c7');

const getTableConfig = (tableKey) => {
  const normKey = (tableKey === 'canhan' || tableKey === 'personnel') ? 'personnel' : (tableKey === 'thannhan' || tableKey === 'relatives') ? 'relatives' : tableKey;
  return (customDashboards.value || []).find((d) => d.id === normKey) || null;
};

const getTableIcon = (tableKey) => {
  const cfg = getTableConfig(tableKey);
  if (cfg && cfg.icon) return cfg.icon;
  return (tableKey === 'canhan' || tableKey === 'personnel') ? 'pi-users' : 'pi-heart';
};

const getTableIconColor = (tableKey) => {
  const cfg = getTableConfig(tableKey);
  if (cfg && cfg.iconColor) return cfg.iconColor;
  return (tableKey === 'canhan' || tableKey === 'personnel') ? '#0284c7' : '#a855f7';
};

const openIconColorDialog = (tableId, defaultTitle) => {
  const normKey = (tableId === 'canhan' || tableId === 'personnel') ? 'personnel' : (tableId === 'thannhan' || tableId === 'relatives') ? 'relatives' : tableId;
  iconDialogTableId.value = normKey;
  iconDialogTableTitle.value = defaultTitle || (normKey === 'relatives' ? relativeTableTitle.value : mainTableTitle.value);
  iconDialogCurrentIcon.value = getTableIcon(normKey);
  iconDialogCurrentColor.value = getTableIconColor(normKey);
  isIconColorDialogOpen.value = true;
};

const onIconColorSaved = ({ tableId, icon, iconColor }) => {
  const normKey = (tableId === 'canhan' || tableId === 'personnel') ? 'personnel' : (tableId === 'thannhan' || tableId === 'relatives') ? 'relatives' : tableId;
  const idx = (customDashboards.value || []).findIndex((d) => d.id === normKey);
  if (idx !== -1) {
    customDashboards.value[idx].icon = icon;
    customDashboards.value[idx].iconColor = iconColor;
  }
};

const activePersonnelMetricCards = computed(() => {
  return personnelDashboardConfig.value.metricCards || DEFAULT_UNIFIED_DASHBOARDS[0].metricCards;
});

const activeRelativeMetricCards = computed(() => {
  return relativeDashboardConfig.value.metricCards || DEFAULT_UNIFIED_DASHBOARDS[1].metricCards;
});

const activePersonnelCardIdx = ref(0);
const activeRelativeCardIdx = ref(0);

const selectPersonnelCard = (card, idx) => {
  activePersonnelCardIdx.value = idx;
  if (card && card.columns && Array.isArray(card.columns) && card.columns.length > 0) {
    personnelStore.visibleColumns = [...card.columns];
  }
};

const selectRelativeCard = (card, idx) => {
  activeRelativeCardIdx.value = idx;
  if (card && card.columns && Array.isArray(card.columns) && card.columns.length > 0) {
    personnelStore.visibleRelativeColumns = [...card.columns];
  }
};

const getPersonnelCardMetricValue = (card) => {
  if (!card) return 0;
  const pList = personnelStore.personnelList || [];
  if (card.condition === 'all' || isSharedCardAllType(card)) return pList.length;
  if (card.field === 'has_trips' || card.id === 'has_trips') {
    return pList.filter((p) => {
      const cd = p.custom_data || {};
      const trips = cd.chuyen_di || cd.xuatnhapcanh || p.trips || [];
      return (Array.isArray(trips) && trips.length > 0) || Boolean(p.countryName || cd.countryName || cd.quoc_gia_den);
    }).length;
  }
  if (card.field === 'has_relatives' || card.id === 'has_relatives') {
    const pWithRelatives = new Set((personnelStore.relativesList || []).map((r) => r.personnelId || r.personnelCode).filter(Boolean));
    return pList.filter((p) => pWithRelatives.has(p.id) || (p.code && pWithRelatives.has(p.code))).length;
  }
  if (card.field === 'has_issues' || card.id === 'has_issues') {
    return pList.filter((p) => {
      const cd = p.custom_data || {};
      return Boolean(
        p.tcctResult || p.kqThamTra || cd.tcctResult || cd.kqThamTra ||
        cd.trongYeu || cd.thamNhung || cd.yeuToNuocNgoai || cd.van_de_chinh_tri
      );
    }).length;
  }
  return pList.filter((p) => matchSharedCardCondition(p, card, personnelStore)).length;
};

const getRelativeCardMetricValue = (card) => {
  if (!card) return 0;
  const rList = flattenedRelatives.value || [];
  if (card.condition === 'all' || isSharedCardAllType(card)) return rList.length;
  return rList.filter((r) => matchSharedCardCondition(r, card, personnelStore)).length;
};

// State Quản lý Chế độ xem (View) đa hình chuẩn Lark Base (Thêm / Sửa / Xóa / Dời vị trí)
const isViewManagerOpen = ref(false);
const viewManagerMode = ref('create'); // 'create' | 'edit'
const selectedViewForEdit = ref(null);
const selectedViewIdx = ref(-1);
const addViewTargetTable = ref('personnel');

const allAvailablePersonnelColumns = computed(() => {
  const cols = [];
  const seen = new Set();
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
        seen.add(c.id);
        cols.push({ id: c.id, label: c.label || c.id });
      }
    });
  });
  cols.push({ id: 'presenceStatus', label: 'Trạng thái hiện diện' });
  return cols;
});

const allAvailableRelativeColumns = computed(() => {
  const cols = [];
  const seen = new Set();
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
        seen.add(c.id);
        cols.push({ id: c.id, label: c.label || c.id });
      }
    });
  });
  cols.push({ id: 'presenceStatus', label: 'Trạng thái hiện diện' });
  cols.push({ id: '_parentPersonnelName', label: 'Cán bộ liên quan (Tên)' });
  cols.push({ id: '_parentPosition', label: 'Cán bộ liên quan (Chức vụ)' });
  cols.push({ id: '_parentDepartment', label: 'Cán bộ liên quan (Đơn vị)' });
  return cols;
});

const openAddViewDialog = (targetTable = 'personnel') => {
  addViewTargetTable.value = targetTable;
  viewManagerMode.value = 'create';
  selectedViewForEdit.value = null;
  selectedViewIdx.value = -1;
  isViewManagerOpen.value = true;
};

const activeTabMenuKey = ref(null);
const toggleTabMenu = (type, idx) => {
  const key = `${type}_${idx}`;
  activeTabMenuKey.value = activeTabMenuKey.value === key ? null : key;
};
const closeTabMenu = () => {
  activeTabMenuKey.value = null;
};

const openEditViewDialog = (targetTable, card, cIdx) => {
  addViewTargetTable.value = targetTable;
  viewManagerMode.value = 'edit';
  selectedViewForEdit.value = { ...card };
  selectedViewIdx.value = cIdx;
  isViewManagerOpen.value = true;
};

const handleSaveView = async (savedData) => {
  const targetId = addViewTargetTable.value === 'relatives' ? 'relatives' : 'personnel';
  const currentCols = targetId === 'relatives' ? [...personnelStore.visibleRelativeColumns] : [...personnelStore.visibleColumns];
  let dashboards = customDashboards.value ? [...customDashboards.value] : [];
  let idx = dashboards.findIndex((d) => d.id === targetId);
  if (idx === -1) {
    dashboards = ensureStandardDashboards(dashboards);
    idx = dashboards.findIndex((d) => d.id === targetId);
  }
  if (idx === -1) return;

  const currentDash = { ...dashboards[idx] };
  const defaultCards = targetId === 'relatives' ? DEFAULT_UNIFIED_DASHBOARDS[1].metricCards : DEFAULT_UNIFIED_DASHBOARDS[0].metricCards;
  const cards = currentDash.metricCards ? [...currentDash.metricCards] : [...defaultCards];

  if (viewManagerMode.value === 'edit' && selectedViewIdx.value >= 0 && selectedViewIdx.value < cards.length) {
    cards[selectedViewIdx.value] = {
      ...cards[selectedViewIdx.value],
      ...savedData,
    };
  } else {
    const newCard = {
      ...savedData,
      id: savedData.id || ('view_' + Date.now()),
      columns: currentCols,
    };
    cards.push(newCard);
    if (targetId === 'relatives') {
      activeRelativeCardIdx.value = cards.length - 1;
    } else {
      activePersonnelCardIdx.value = cards.length - 1;
    }
  }

  currentDash.metricCards = cards;
  dashboards[idx] = currentDash;
  customDashboards.value = dashboards;

  try {
    localStorage.setItem('custom_dashboards_config', JSON.stringify(dashboards));
    await saveAppSettings('custom_dashboards_config', dashboards);
  } catch (e) {
    console.error('Error saving view:', e);
  }

  isViewManagerOpen.value = false;
};

const deleteView = async (targetTable, card, cIdx) => {
  if (cIdx <= 0) {
    alert('Không thể xóa Chế độ xem mặc định (Toàn bộ)');
    return;
  }
  const label = card?.label || 'này';
  if (!confirm(`Bạn có chắc muốn xóa Chế độ xem "${label}"?`)) return;

  const targetId = targetTable === 'relatives' ? 'relatives' : 'personnel';
  let dashboards = customDashboards.value ? [...customDashboards.value] : [];
  let idx = dashboards.findIndex((d) => d.id === targetId);
  if (idx === -1) {
    dashboards = ensureStandardDashboards(dashboards);
    idx = dashboards.findIndex((d) => d.id === targetId);
  }
  if (idx === -1) return;

  const currentDash = { ...dashboards[idx] };
  const cards = currentDash.metricCards ? [...currentDash.metricCards] : [];
  if (cIdx < cards.length) {
    cards.splice(cIdx, 1);
    currentDash.metricCards = cards;
    dashboards[idx] = currentDash;
    customDashboards.value = dashboards;

    if (targetId === 'relatives') {
      if (activeRelativeCardIdx.value >= cards.length) {
        activeRelativeCardIdx.value = Math.max(0, cards.length - 1);
      }
    } else {
      if (activePersonnelCardIdx.value >= cards.length) {
        activePersonnelCardIdx.value = Math.max(0, cards.length - 1);
      }
    }

    try {
      localStorage.setItem('custom_dashboards_config', JSON.stringify(dashboards));
      await saveAppSettings('custom_dashboards_config', dashboards);
    } catch (e) {
      console.error('Error deleting view:', e);
    }
  }
  isViewManagerOpen.value = false;
};

const moveView = async (targetTable, cIdx, direction) => {
  const targetIdx = cIdx + direction;
  const targetId = targetTable === 'relatives' ? 'relatives' : 'personnel';
  let dashboards = customDashboards.value ? [...customDashboards.value] : [];
  let idx = dashboards.findIndex((d) => d.id === targetId);
  if (idx === -1) {
    dashboards = ensureStandardDashboards(dashboards);
    idx = dashboards.findIndex((d) => d.id === targetId);
  }
  if (idx === -1) return;

  const currentDash = { ...dashboards[idx] };
  const cards = currentDash.metricCards ? [...currentDash.metricCards] : [];
  if (targetIdx < 0 || targetIdx >= cards.length) return;

  const temp = cards[cIdx];
  cards[cIdx] = cards[targetIdx];
  cards[targetIdx] = temp;

  currentDash.metricCards = cards;
  dashboards[idx] = currentDash;
  customDashboards.value = dashboards;

  if (targetId === 'relatives') {
    if (activeRelativeCardIdx.value === cIdx) activeRelativeCardIdx.value = targetIdx;
    else if (activeRelativeCardIdx.value === targetIdx) activeRelativeCardIdx.value = cIdx;
  } else {
    if (activePersonnelCardIdx.value === cIdx) activePersonnelCardIdx.value = targetIdx;
    else if (activePersonnelCardIdx.value === targetIdx) activePersonnelCardIdx.value = cIdx;
  }

  try {
    localStorage.setItem('custom_dashboards_config', JSON.stringify(dashboards));
    await saveAppSettings('custom_dashboards_config', dashboards);
  } catch (e) {
    console.error('Error moving view:', e);
  }
};
const searchQuery = ref('');
const relativeSearchQuery = ref('');
const selectedPersonnel = ref([]);
const selectedRelatives = ref([]);
const isDialogOpen = ref(false);
const selectedPerson = ref(null);
const dialogInitialTab = ref(0);
const dialogTargetRelativeCode = ref('');

// Menu & Smart Filter State
const isFilterMenuOpen = ref(false);
const isDataMenuOpen = ref(false);
const isRelativeFilterMenuOpen = ref(false);
const isRelativeDataMenuOpen = ref(false);
const smartFilter = ref('all'); // 'all' | 'has_decision' | 'has_trips' | 'has_relatives' | 'has_issues' | 'has_passport' | 'field_not_empty'
const smartFilterField = ref('');

let dataMenuTimer = null;
let filterMenuTimer = null;
let relDataMenuTimer = null;
let relFilterMenuTimer = null;

const onMouseEnterData = () => {
  clearTimeout(dataMenuTimer);
  isDataMenuOpen.value = true;
};
const onMouseLeaveData = () => {
  dataMenuTimer = setTimeout(() => {
    isDataMenuOpen.value = false;
  }, 280);
};

const onMouseEnterFilter = () => {
  clearTimeout(filterMenuTimer);
  isFilterMenuOpen.value = true;
};
const onMouseLeaveFilter = () => {
  filterMenuTimer = setTimeout(() => {
    isFilterMenuOpen.value = false;
  }, 280);
};

const onMouseEnterRelData = () => {
  clearTimeout(relDataMenuTimer);
  isRelativeDataMenuOpen.value = true;
};
const onMouseLeaveRelData = () => {
  relDataMenuTimer = setTimeout(() => {
    isRelativeDataMenuOpen.value = false;
  }, 280);
};

const onMouseEnterRelFilter = () => {
  clearTimeout(relFilterMenuTimer);
  isRelativeFilterMenuOpen.value = true;
};
const onMouseLeaveRelFilter = () => {
  relFilterMenuTimer = setTimeout(() => {
    isRelativeFilterMenuOpen.value = false;
  }, 280);
};

// Advanced DOCX Export Modal State
const isDocxExportOpen = ref(false);
const docxExportTargetPerson = ref(null);

const effectiveSelectedPersonnelForDocx = computed(() => {
  if (mainTab.value === 'thannhan') {
    if (selectedRelatives.value && selectedRelatives.value.length > 0) {
      const list = [];
      const seenIds = new Set();
      selectedRelatives.value.forEach((r) => {
        const p = r.parentPersonnel || (r.cccdparent ? personnelStore.findPersonByCccd(r.cccdparent) : null) || (r.personnelId ? (personnelStore.personnelList || []).find((x) => x.id === r.personnelId) : null);
        if (p && p.id && !seenIds.has(p.id)) {
          seenIds.add(p.id);
          list.push(p);
        }
      });
      return list;
    }
    return [];
  }
  return selectedPersonnel.value || [];
});

const effectiveAllPersonnelForDocx = computed(() => {
  if (mainTab.value === 'thannhan') {
    const list = [];
    const seenIds = new Set();
    (filteredRelatives.value || []).forEach((r) => {
      const p = r.parentPersonnel || (r.cccdparent ? personnelStore.findPersonByCccd(r.cccdparent) : null) || (r.personnelId ? (personnelStore.personnelList || []).find((x) => x.id === r.personnelId) : null);
      if (p && p.id && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        list.push(p);
      }
    });
    if (list.length > 0) return list;
    return personnelStore.personnelList || [];
  }
  return filteredPersonnel.value || personnelStore.personnelList || [];
});

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
const dtFirst = ref(0);
const dtFirstRel = ref(0);
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

const routeFilterField = ref('');
const routeFilterValue = ref('');

const clearRouteFilter = () => {
  routeFilterField.value = '';
  routeFilterValue.value = '';
};

const getRouteFilterFieldLabel = () => {
  if (!routeFilterField.value) return '';
  const f = routeFilterField.value;
  if (isPresenceField(f)) {
    return 'Trạng thái hiện diện';
  }
  if (f === 'isRelative' || f === '_doiTuong' || f === 'doi_tuong') return 'Đối tượng';
  if (f === '_parentPersonnelName') return 'Cán bộ liên quan';
  const def = allColumnDefsMap.value?.[f];
  return def?.label || f;
};

const handleRouteAction = () => {
  const action = route.query.action;
  const targetCccd = route.query.targetCccd;
  const targetRelativeCode = route.query.targetRelativeCode;

  if (route.query.tab === 'thannhan' || route.query.tab === 'relatives') {
    mainTab.value = 'thannhan';
  } else if (route.query.tab === 'canbo' || route.query.tab === 'personnel') {
    mainTab.value = 'canbo';
  }

  if (route.query.filterField && route.query.filterValue) {
    routeFilterField.value = String(route.query.filterField);
    routeFilterValue.value = String(route.query.filterValue);
  } else {
    routeFilterField.value = '';
    routeFilterValue.value = '';
  }

  if (action === 'new_personnel') {
    selectedPerson.value = null;
    dialogInitialTab.value = 0;
    dialogTargetRelativeCode.value = '';
    isDialogOpen.value = true;
  } else if (action === 'new_relative') {
    mainTab.value = 'thannhan';
    if (personnelStore.personnelList.length > 0) {
      selectedPerson.value = personnelStore.personnelList[0];
      dialogInitialTab.value = 2; // Tab 3: Thân nhân
      dialogTargetRelativeCode.value = '';
      isDialogOpen.value = true;
    } else {
      selectedPerson.value = null;
      dialogInitialTab.value = 0;
      dialogTargetRelativeCode.value = '';
      isDialogOpen.value = true;
    }
  } else if (action === 'new_trip') {
    if (targetCccd) {
      const person = personnelStore.findPersonByCccd ? personnelStore.findPersonByCccd(targetCccd) : personnelStore.personnelList.find((p) => (p.cccd || p.cccdparent) === targetCccd);
      if (person) {
        selectedPerson.value = person;
        if (targetRelativeCode) {
          dialogInitialTab.value = 2; // Tab 3: Thân nhân
          dialogTargetRelativeCode.value = targetRelativeCode;
        } else {
          dialogInitialTab.value = 1; // Tab 2: Chuyến đi
          dialogTargetRelativeCode.value = '';
        }
        isDialogOpen.value = true;
      }
    } else if (personnelStore.personnelList.length > 0) {
      selectedPerson.value = personnelStore.personnelList[0];
      dialogInitialTab.value = 1; // Tab 2: Chuyến đi
      dialogTargetRelativeCode.value = '';
      isDialogOpen.value = true;
    }
  }
};

const currentRowHeightLimit = ref(localStorage.getItem('app_table_row_clamp') || '1');
const onRowHeightChanged = (e) => {
  currentRowHeightLimit.value = String(e.detail || '1');
};

const showColIndex = ref(localStorage.getItem('app_show_col_index') !== 'false');
const onColIndexChanged = (e) => {
  showColIndex.value = Boolean(e.detail);
};

const onCustomDashboardsUpdated = (e) => {
  if (e && e.detail) {
    customDashboards.value = ensureStandardDashboards(e.detail);
  } else {
    loadCustomDashboards();
  }
};

onMounted(async () => {
  if (personnelStore.personnelList.length === 0) {
    await personnelStore.init();
  }
  await loadCustomDashboards();
  await loadPersonnelFilterState();
  await loadNameColConfig();
  await loadCustomColLabels();
  handleRouteAction();
  window.addEventListener('table-row-height-changed', onRowHeightChanged);
  window.addEventListener('table-show-col-index-changed', onColIndexChanged);
  window.addEventListener('custom-dashboards-updated', onCustomDashboardsUpdated);
  window.addEventListener('click', closeTabMenu);
});

onUnmounted(() => {
  window.removeEventListener('table-row-height-changed', onRowHeightChanged);
  window.removeEventListener('table-show-col-index-changed', onColIndexChanged);
  window.removeEventListener('custom-dashboards-updated', onCustomDashboardsUpdated);
  window.removeEventListener('click', closeTabMenu);
});

watch(
  () => route.query,
  () => {
    handleRouteAction();
  }
);

// ===== Name Column Config (Linh hoạt cho mọi mô hình: Cán bộ, Học sinh, Nhân sự...) =====
const isPersonnelPrimaryKey = (colId, isRel = false) => {
  if (!colId) return false;
  if (isRel) return personnelStore.getRelativeKeyField() === colId;
  return personnelStore.getPersonnelKeyField() === colId;
};

const availableParentFields = computed(() => {
  const list = [];
  const seen = new Set();

  list.push({ key: 'name', label: 'Họ và tên' });
  seen.add('name');

  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c && c.id && c.id !== 'stt' && !seen.has(c.id)) {
        seen.add(c.id);
        list.push({
          key: c.id,
          label: c.label || c.id,
        });
      }
    });
  });

  if (!seen.has('cccdCB')) {
    list.push({ key: 'cccdCB', label: 'Số CCCD / Mã định danh' });
    seen.add('cccdCB');
  }
  if (!seen.has('position') && !seen.has('positionName')) {
    list.push({ key: 'position', label: 'Chức vụ / Vị trí' });
    seen.add('position');
  }
  if (!seen.has('department') && !seen.has('departmentName') && !seen.has('departmentId')) {
    list.push({ key: 'department', label: 'Đơn vị / Phòng ban' });
    seen.add('department');
  }

  return list;
});

const DEFAULT_NAME_COL_FIELDS = { name: true, cccdCB: true, position: true, department: true };
const nameColFields = ref({ ...DEFAULT_NAME_COL_FIELDS });

const activeParentFieldsList = computed(() => {
  const selected = availableParentFields.value.filter((opt) => Boolean(nameColFields.value[opt.key]));
  if (selected.length === 0) {
    return [{ key: 'name', label: 'Họ và tên' }];
  }
  return selected;
});

const toggleNameColField = async (key) => {
  nameColFields.value = { ...nameColFields.value, [key]: !nameColFields.value[key] };
  try {
    await saveAppSettings('name_col_display_config', nameColFields.value);
  } catch (e) {}
};

const loadNameColConfig = async () => {
  try {
    const saved = await getAppSettings('name_col_display_config');
    if (saved && typeof saved === 'object') {
      nameColFields.value = { ...DEFAULT_NAME_COL_FIELDS, ...saved };
    }
  } catch (e) {}
};

const getPersonFieldValue = (data, fieldKey) => {
  if (!data) return '';
  const pKeyField = personnelStore.getPersonnelKeyField();
  const posField = personnelStore.getPersonnelPositionField();
  const deptField = personnelStore.getPersonnelDepartmentField();

  let cd = data.custom_data;
  if (typeof cd === 'string') {
    try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
  }

  if (fieldKey === 'name') {
    return data.name || data.fullName || cd?.name || cd?.fullName || '-';
  }

  if (fieldKey === 'cccdCB' || fieldKey === pKeyField || fieldKey === 'cccd' || fieldKey === 'cccdparent') {
    const cVal = data[pKeyField] || cd?.[pKeyField] || data.cccdparent || data.cccd || '';
    if (cVal && String(cVal).trim() !== '' && String(cVal).trim() !== '-' && !String(cVal).startsWith('p_') && !String(cVal).startsWith('cd_') && !String(cVal).startsWith('rel_') && !String(cVal).startsWith('trip_')) {
      return String(cVal).trim();
    }
    return '';
  }

  if (fieldKey === 'position' || fieldKey === posField || fieldKey === 'positionName' || fieldKey === 'chuc_vu') {
    const pVal = data[posField] || cd?.[posField] || data.positionName || data.position || data.chuc_vu || '';
    if (pVal && String(pVal).trim() !== '' && String(pVal).trim() !== '-') return String(pVal).trim();
    return '';
  }

  if (fieldKey === 'department' || fieldKey === deptField || fieldKey === 'departmentName' || fieldKey === 'departmentId' || fieldKey === 'don_vi') {
    const dVal = data[deptField] || cd?.[deptField] || data.departmentName || data.department || (data.departmentId ? personnelStore.getDepartmentName(data.departmentId) : '') || '';
    if (dVal && String(dVal).trim() !== '' && String(dVal).trim() !== '-') return String(dVal).trim();
    return '';
  }

  const val = data[fieldKey] ?? cd?.[fieldKey];
  if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '-') {
    return String(val).trim();
  }

  return '';
};

const getPersonVirtualInfo = (data) => {
  if (!data) return { name: '-', cccd: '', position: '', dept: '' };
  const pKey = personnelStore.getPersonnelKeyField();
  const pName = personnelStore.getPersonnelNameField();
  const pPos = personnelStore.getPersonnelPositionField();
  const pDept = personnelStore.getPersonnelDepartmentField();
  let cd = data.custom_data;
  if (typeof cd === 'string') {
    try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
  }
  const name = data[pName] || cd?.[pName] || data.name || data.fullName || '-';
  const cccd = data[pKey] || cd?.[pKey] || data.cccdparent || data.cccd || '';
  const position = data[pPos] || cd?.[pPos] || data.positionName || data.position || data.chuc_vu || '';
  const dept = data[pDept] || cd?.[pDept] || data.departmentName || data.department || (data.departmentId ? personnelStore.getDepartmentName(data.departmentId) : '') || '';
  return {
    name,
    cccd: cccd && String(cccd).trim() !== '-' ? String(cccd).trim() : '',
    position: position && String(position).trim() !== '-' ? String(position).trim() : '',
    dept: dept && String(dept).trim() !== '-' ? String(dept).trim() : '',
  };
};

const activeColumns = computed(() => {
  const map = {
    _parentPersonnelName: { id: '_parentPersonnelName', label: 'Thông tin cán bộ', tableWidth: '220px', format: 'text', isVirtual: true },
  };
  const colMap = computeColumnIndexMap(personnelStore.importMappingPersonnel || []);
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

  const orderedIds = personnelStore.visibleColumns.filter((id) => map[id]);

  return orderedIds.map((id) => {
    const cfg = map[id];
    const rawIdx = colMap[cfg.id];
    const idxText = rawIdx ? rawIdx.replace(/^Cột\s+/, '') : null;
    return {
      id: cfg.id,
      label: cfg.label || cfg.id,
      colIndex: idxText,
      width: cfg.tableWidth || getColWidth(cfg.id),
      tableWidth: cfg.tableWidth || null,
      format: cfg.format || 'text',
      required: Boolean(cfg.required),
      options: cfg.options || '',
    };
  });
});

const getFileColumnItems = (data, colId) => {
  const val = data?.[colId] ?? (data?.custom_data ? data.custom_data[colId] : null);
  if (!val) return [];
  let raw = val;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (e) {
      if (raw.includes('/assets/') || raw.startsWith('http') || raw.length > 20) {
        raw = [{ name: 'Tệp đính kèm', url: raw }];
      } else {
        return [];
      }
    }
  }
  if (!Array.isArray(raw)) raw = [raw];
  return raw.filter((x) => x && (x.url || x.id || typeof x === 'string'));
};

const getTextFileLoopItems = (data, colId) => {
  const val = data?.[colId] ?? (data?.custom_data ? data.custom_data[colId] : null);
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
    try {
      const p = JSON.parse(val);
      if (Array.isArray(p)) return p;
    } catch (e) {}
  }
  return [];
};

const getCheckboxFileItem = (data, colId) => {
  const val = data?.[colId] ?? (data?.custom_data ? data.custom_data[colId] : null);
  if (!val) return { hasValue: false, text: '', file: null };

  const colDef = allColumnDefsMap.value?.[colId];
  const validOpts = colDef?.options ? String(colDef.options).split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [];

  const resolveItemText = (rawObj) => {
    let sel = Array.isArray(rawObj.selected) ? rawObj.selected : (typeof rawObj.selected === 'string' ? [rawObj.selected] : []);
    if (validOpts.length > 0) {
      const matched = sel.filter((s) => validOpts.includes(s));
      if (matched.length > 0) return matched.join('; ');
      const matchedFromText = validOpts.filter((opt) => String(rawObj.text || '').toLowerCase().includes(opt.toLowerCase()));
      if (matchedFromText.length > 0) return matchedFromText.join('; ');
    }
    return sel.length > 0 ? sel.join('; ') : (rawObj.text || (rawObj.checked ? (colDef?.options || 'Có') : ''));
  };

  if (typeof val === 'object' && val !== null) {
    const text = resolveItemText(val);
    const file = val.file || null;
    return {
      hasValue: Boolean(text || file),
      text,
      file,
    };
  }
  if (typeof val === 'string') {
    try {
      const p = JSON.parse(val);
      if (typeof p === 'object' && p !== null) {
        const text = resolveItemText(p);
        const file = p.file || null;
        return { hasValue: Boolean(text || file), text, file };
      }
    } catch {}
    if (validOpts.length > 0) {
      const matched = validOpts.filter((opt) => val.toLowerCase().includes(opt.toLowerCase()));
      if (matched.length > 0) return { hasValue: true, text: matched.join('; '), file: null };
    }
    return { hasValue: true, text: val, file: null };
  }
  if (typeof val === 'boolean') {
    return { hasValue: val, text: val ? (colDef?.options || 'Có') : '', file: null };
  }
  return { hasValue: false, text: '', file: null };
};

const getCheckboxFileLoopItems = (data, colId) => {
  const val = data?.[colId] ?? (data?.custom_data ? data.custom_data[colId] : null);
  if (!val) return [];
  let list = [];
  if (Array.isArray(val)) {
    list = val;
  } else if (typeof val === 'object' && val !== null) {
    list = Array.isArray(val.items) ? val.items : [];
  } else if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
    try {
      const p = JSON.parse(val);
      if (Array.isArray(p)) list = p;
      else if (p && typeof p === 'object' && Array.isArray(p.items)) list = p.items;
    } catch (e) {}
  }
  return list.filter((it) => {
    if (!it) return false;
    if (typeof it === 'string') return it.trim() !== '' && it.trim() !== '-';
    const hasOpts = (Array.isArray(it.selectedOptions) && it.selectedOptions.length > 0) ||
                    (Array.isArray(it.selected) && it.selected.length > 0) ||
                    (typeof it.selectedOptions === 'string' && it.selectedOptions.trim() !== '') ||
                    Boolean(it.name?.trim());
    const hasText = Boolean((it.text || it.details || it.fullText || '').trim());
    const hasFile = Boolean(it.file && (it.file.url || it.file.name || it.file.fileName));
    return hasOpts || hasText || hasFile;
  });
};

const activeRelativeColumns = computed(() => {
  const map = {};
  const colMap = computeColumnIndexMap(personnelStore.importMappingRelative || []);
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id) map[c.id] = c;
    });
  });

  const filteredIds = (personnelStore.visibleRelativeColumns || [])
    .filter((id) => id !== 'parentName' && id !== 'parentPersonnelName' && id !== 'stt' && id !== 'code' && id !== 'cccd_can_bo');

  return filteredIds.map((id) => {
    const cfg = map[id];
    const rawIdx = colMap[id];
    const idxText = rawIdx ? rawIdx.replace(/^Cột\s+/, '') : null;
    if (cfg && cfg.label) {
      return {
        id: cfg.id,
        label: cfg.label,
        colIndex: idxText,
        width: cfg.tableWidth || '160px',
        tableWidth: cfg.tableWidth || null,
        required: Boolean(cfg.required),
        options: cfg.options || '',
      };
    }
    const found = personnelStore.allAvailableRelativeColumns.find((c) => c.id === id);
    return found ? { ...found, colIndex: idxText } : { id, label: id, width: '160px', colIndex: idxText };
  });
});

const filteredPersonnel = computed(() => {
  let list = personnelStore.personnelList;

  // 0. Lọc theo URL Query Filter từ Dashboard Widget
  if (routeFilterField.value && routeFilterValue.value) {
    const field = routeFilterField.value;
    const targetVal = routeFilterValue.value.toLowerCase().trim();

    list = list.filter((p) => {
      const vVal = resolveVirtualColumnValue(p, field);
      if (vVal !== undefined) {
        const strVVal = String(vVal).toLowerCase().trim();
        if (strVVal === targetVal) return true;
        if ((targetVal.includes('nước ngoài') || targetVal === 'abroad') && strVVal.includes('nước ngoài')) return true;
        if ((targetVal.includes('quá hạn') || targetVal === 'overdue') && strVVal.includes('quá hạn')) return true;
        if ((targetVal.includes('trong nước') || targetVal.includes('về nước') || targetVal === 'completed') && (strVVal.includes('trong nước') || strVVal.includes('đã về'))) return true;
        return strVVal.includes(targetVal);
      }
      let cd = p.custom_data;
      if (typeof cd === 'string') {
        try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
      }
      const val = p[field] !== undefined ? p[field] : (cd?.[field] ?? '');
      const strVal = String(val || '').toLowerCase().trim();
      if (strVal === targetVal) return true;
      if ((targetVal.includes('nước ngoài') || targetVal === 'abroad') && strVal.includes('nước ngoài')) return true;
      if ((targetVal.includes('quá hạn') || targetVal === 'overdue') && (strVal.includes('quá hạn') || strVal.includes('chưa về'))) return true;
      if ((targetVal.includes('trong nước') || targetVal.includes('về nước') || targetVal === 'completed') && (strVal.includes('trong nước') || strVal.includes('về nước') || strVal.includes('đã về'))) return true;
      return strVal.includes(targetVal);
    });
  }

  // 1. Lọc theo Chế độ xem (Lark Base View Tab)
  const activeCard = (activePersonnelMetricCards.value || [])[activePersonnelCardIdx.value];
  if (activeCard && activeCard.condition !== 'all' && !isSharedCardAllType(activeCard)) {
    if (activeCard.field === 'has_trips' || activeCard.id === 'has_trips') {
      list = list.filter((p) => {
        const cd = p.custom_data || {};
        const trips = cd.chuyen_di || cd.xuatnhapcanh || p.trips || [];
        return (Array.isArray(trips) && trips.length > 0) || Boolean(p.countryName || cd.countryName || cd.quoc_gia_den);
      });
    } else if (activeCard.field === 'has_relatives' || activeCard.id === 'has_relatives') {
      const pWithRelatives = new Set((personnelStore.relativesList || []).map((r) => r.personnelId || r.personnelCode).filter(Boolean));
      list = list.filter((p) => pWithRelatives.has(p.id) || (p.code && pWithRelatives.has(p.code)));
    } else if (activeCard.field === 'has_issues' || activeCard.id === 'has_issues') {
      list = list.filter((p) => {
        const cd = p.custom_data || {};
        return Boolean(
          p.tcctResult || p.kqThamTra || cd.tcctResult || cd.kqThamTra ||
          cd.trongYeu || cd.thamNhung || cd.yeuToNuocNgoai || cd.van_de_chinh_tri
        );
      });
    } else {
      list = list.filter((p) => matchSharedCardCondition(p, activeCard, personnelStore));
    }
  }

  // 2. Bộ lọc thông minh bổ trợ (Smart Filter)
  if (smartFilter.value === 'has_decision') {
    list = list.filter((p) => {
      const cd = p.custom_data || {};
      const trips = cd.chuyen_di || cd.xuatnhapcanh || [];
      const hasTripDecision = Array.isArray(trips) && trips.some((t) => t.decisionNumber || t.so_quyet_dinh || t.col5);
      return Boolean(p.decisionNumber || cd.decisionNumber || cd.so_quyet_dinh || hasTripDecision);
    });
  } else if (smartFilter.value === 'has_trips') {
    list = list.filter((p) => {
      const cd = p.custom_data || {};
      const trips = cd.chuyen_di || cd.xuatnhapcanh || [];
      return (Array.isArray(trips) && trips.length > 0) || Boolean(p.countryName || cd.countryName || cd.quoc_gia_den);
    });
  } else if (smartFilter.value === 'has_relatives') {
    const pWithRelatives = new Set(personnelStore.relativesList.map((r) => r.personnelId || r.personnelCode).filter(Boolean));
    list = list.filter((p) => pWithRelatives.has(p.id) || (p.code && pWithRelatives.has(p.code)));
  } else if (smartFilter.value === 'has_issues') {
    list = list.filter((p) => {
      const cd = p.custom_data || {};
      return Boolean(
        p.tcctResult || p.kqThamTra || cd.tcctResult || cd.kqThamTra ||
        cd.trongYeu || cd.thamNhung || cd.yeuToNuocNgoai || cd.van_de_chinh_tri
      );
    });
  } else if (smartFilter.value === 'has_passport') {
    list = list.filter((p) => {
      const cd = p.custom_data || {};
      return Boolean(p.passportPersonal || p.passportOfficial || p.hcCaNhan || p.hcCongVu || cd.passportPersonal || cd.passportOfficial || cd.hcCaNhan || cd.hcCongVu);
    });
  } else if (smartFilter.value === 'field_not_empty' && smartFilterField.value) {
    const field = smartFilterField.value;
    list = list.filter((p) => {
      const val = p[field] !== undefined ? p[field] : (p.custom_data ? p.custom_data[field] : undefined);
      if (val === undefined || val === null) return false;
      if (typeof val === 'string') return val.trim() !== '';
      if (Array.isArray(val)) return val.length > 0;
      return true;
    });
  }

  // 2. Tìm kiếm từ khóa (Search Query) theo đúng Primary Key & Key Config đã cấu hình
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return list;

  const pKeyField = personnelStore.getPersonnelKeyField();
  const pNameField = personnelStore.getPersonnelNameField();
  const pPosField = personnelStore.getPersonnelPositionField();
  const pDeptField = personnelStore.getPersonnelDepartmentField();

  return list.filter((p) => {
    let cd = p.custom_data;
    if (typeof cd === 'string') {
      try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
    }
    // CCCD Cán bộ theo Primary Key cấu hình
    const cccd = String(p[pKeyField] ?? cd?.[pKeyField] ?? p.cccd ?? p.cccdparent ?? '').toLowerCase();
    // Tên Cán bộ theo Cấu hình
    const name = String(p[pNameField] ?? cd?.[pNameField] ?? p.name ?? p.fullName ?? '').toLowerCase();
    // Chức vụ theo Cấu hình
    const position = String(p[pPosField] ?? cd?.[pPosField] ?? p.positionName ?? p.position ?? '').toLowerCase();
    // Đơn vị theo Cấu hình
    const dept = String(p[pDeptField] ?? cd?.[pDeptField] ?? p.departmentName ?? (p.departmentId ? personnelStore.getDepartmentName(p.departmentId) : '') ?? '').toLowerCase();
    // Mã hồ sơ
    const code = String(p.code || p.id || '').toLowerCase();

    return (
      name.includes(q) ||
      cccd.includes(q) ||
      position.includes(q) ||
      dept.includes(q) ||
      code.includes(q)
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

    const presence = resolvePresence(r);

    return {
      stt: stt++,
      ...r,
      code: formattedCode,
      parentPerson: parent,
      parentName: parent?.name || r.personnelName || 'Chưa liên kết',
      parentDepartment: parent ? (parent.departmentName || personnelStore.getDepartmentName(parent.departmentId)) : (r.departmentName || '-'),
      parentPosition: parent ? (parent.positionName || parent.position || '') : (r.parentPosition || ''),
      isAbroad: presence.isAbroad,
      isOverdue: presence.isOverdue,
      overdueDays: presence.overdueDays || 0,
      presenceStatus: presence.shortLabel,
      presenceLabel: presence.label,
      _presenceStatus: presence.shortLabel,
    };
  });
});

const filteredRelatives = computed(() => {
  let list = flattenedRelatives.value;

  // 0. Lọc theo URL Query Filter từ Dashboard Widget
  if (routeFilterField.value && routeFilterValue.value) {
    const field = routeFilterField.value;
    const targetVal = routeFilterValue.value.toLowerCase().trim();

    list = list.filter((r) => {
      const vVal = resolveVirtualColumnValue(r, field);
      if (vVal !== undefined) {
        const strVVal = String(vVal).toLowerCase().trim();
        if (strVVal === targetVal) return true;
        if ((targetVal.includes('nước ngoài') || targetVal === 'abroad') && strVVal.includes('nước ngoài')) return true;
        if ((targetVal.includes('quá hạn') || targetVal === 'overdue') && strVVal.includes('quá hạn')) return true;
        if ((targetVal.includes('trong nước') || targetVal.includes('về nước') || targetVal === 'completed') && (strVVal.includes('trong nước') || strVVal.includes('đã về'))) return true;
        return strVVal.includes(targetVal);
      }
      let cd = r.custom_data;
      if (typeof cd === 'string') {
        try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
      }
      const val = r[field] !== undefined ? r[field] : (cd?.[field] ?? '');
      const strVal = String(val || '').toLowerCase().trim();
      if (strVal === targetVal) return true;
      if ((targetVal.includes('nước ngoài') || targetVal === 'abroad') && strVal.includes('nước ngoài')) return true;
      if ((targetVal.includes('quá hạn') || targetVal === 'overdue') && (strVal.includes('quá hạn') || strVal.includes('chưa về'))) return true;
      if ((targetVal.includes('trong nước') || targetVal.includes('về nước') || targetVal === 'completed') && (strVal.includes('trong nước') || strVal.includes('về nước') || strVal.includes('đã về'))) return true;
      return strVal.includes(targetVal);
    });
  }

  // 1. Lọc theo Chế độ xem (Lark Base View Tab)
  const activeRelCard = (activeRelativeMetricCards.value || [])[activeRelativeCardIdx.value];
  if (activeRelCard && activeRelCard.condition !== 'all' && !isSharedCardAllType(activeRelCard)) {
    list = list.filter((r) => matchSharedCardCondition(r, activeRelCard, personnelStore));
  }

  const q = relativeSearchQuery.value.trim().toLowerCase();
  if (!q) return list;

  const pKeyField = personnelStore.getPersonnelKeyField();
  const pNameField = personnelStore.getPersonnelNameField();
  const pPosField = personnelStore.getPersonnelPositionField();
  const pDeptField = personnelStore.getPersonnelDepartmentField();
  const rParentKeyField = personnelStore.getRelativeParentKeyField();
  const rKeyField = personnelStore.getRelativeKeyField();

  return flattenedRelatives.value.filter((r) => {
    let cd = r.custom_data;
    if (typeof cd === 'string') {
      try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
    }
    const parent = r.parentPerson || {};
    let parentCd = parent.custom_data;
    if (typeof parentCd === 'string') {
      try { parentCd = JSON.parse(parentCd); } catch (e) { parentCd = {}; }
    }

    // CCCD Cán bộ liên quan theo Primary Key cấu hình
    const parentCccd = String(r[rParentKeyField] ?? cd?.[rParentKeyField] ?? parent[pKeyField] ?? parentCd?.[pKeyField] ?? r.cccdparent ?? parent.cccd ?? '').toLowerCase();
    // CCCD Thân nhân theo Primary Key cấu hình
    const relCccd = String(r[rKeyField] ?? cd?.[rKeyField] ?? r.cccdthannhan ?? r.cccd ?? '').toLowerCase();
    // Họ và tên Cán bộ / Thân nhân theo cấu hình
    const relName = String(r.relativeName || r.name || cd?.relativeName || '').toLowerCase();
    const parentName = String(parent[pNameField] ?? parentCd?.[pNameField] ?? r.parentName ?? parent.name ?? '').toLowerCase();
    // Chức vụ theo cấu hình
    const position = String(parent[pPosField] ?? parentCd?.[pPosField] ?? r.parentPosition ?? parent.positionName ?? parent.position ?? r.position ?? '').toLowerCase();
    // Đơn vị theo cấu hình
    const dept = String(parent[pDeptField] ?? parentCd?.[pDeptField] ?? r.parentDepartment ?? parent.departmentName ?? (parent.departmentId ? personnelStore.getDepartmentName(parent.departmentId) : '') ?? r.departmentName ?? '').toLowerCase();

    const relCode = String(r.code || r.id || '').toLowerCase();
    const parentCode = String(parent.code || r.personnelCode || '').toLowerCase();

    return (
      parentCccd.includes(q) ||
      relCccd.includes(q) ||
      relName.includes(q) ||
      parentName.includes(q) ||
      position.includes(q) ||
      dept.includes(q) ||
      relCode.includes(q) ||
      parentCode.includes(q)
    );
  });
});

const allColumnDefsMap = computed(() => {
  const map = {};
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => { if (c.id) map[c.id] = c; });
  });
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => { if (c.id) map[c.id] = c; });
  });
  return map;
});

const isFormulaCol = (colId) => {
  const colDef = allColumnDefsMap.value[colId];
  return colDef && colDef.format === 'formula';
};

const getFormulaStatus = (person, col) => {
  const result = evaluateFormula(person, col);
  return result?.label || result?.shortLabel || '-';
};

const getPersonnelDepartmentValue = (person, colId = '') => {
  if (!person) return '-';

  // 1. Direct field by colId if provided
  let cd = person.custom_data;
  if (typeof cd === 'string') {
    try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
  }
  if (colId) {
    const directByCol = person[colId] ?? cd?.[colId];
    if (directByCol !== undefined && directByCol !== null && String(directByCol).trim() !== '' && String(directByCol).trim() !== '-') {
      return String(directByCol).trim();
    }
  }

  // 2. Direct standard fields
  const direct = person.departmentName || (person.departmentId ? personnelStore.getDepartmentName(person.departmentId) : '') || person.department;
  if (direct && String(direct).trim() !== '' && String(direct).trim() !== '-' && String(direct).trim() !== 'Chưa rõ' && String(direct).trim() !== 'Chưa phân bổ') {
    return String(direct).trim();
  }

  // 3. Search in custom_data
  if (cd && typeof cd === 'object') {
    for (const [k, v] of Object.entries(cd)) {
      const cleanK = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        (cleanK.includes('donvi') || cleanK.includes('phongban') || cleanK.includes('department') || cleanK.includes('coquan')) &&
        v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '-' && String(v).trim() !== 'Chưa phân bổ'
      ) {
        return String(v).trim();
      }
    }
  }

  // 4. Check import mapping columns
  for (const group of (personnelStore.importMappingPersonnel || [])) {
    for (const col of (group.columns || [])) {
      const labelClean = String(col.label || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (labelClean.includes('donvi') || labelClean.includes('phongban') || labelClean.includes('department') || labelClean.includes('coquan')) {
        const v = person[col.id] ?? cd?.[col.id];
        if (v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '-' && String(v).trim() !== 'Chưa phân bổ') {
          return String(v).trim();
        }
      }
    }
  }

  // 5. Check all top-level person keys
  for (const [k, v] of Object.entries(person)) {
    const cleanK = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (
      (cleanK.includes('donvi') || cleanK.includes('phongban') || cleanK.includes('department') || cleanK.includes('coquan')) &&
      v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '-' && String(v).trim() !== 'Chưa phân bổ' && typeof v !== 'object'
    ) {
      return String(v).trim();
    }
  }

  return '-';
};

const isDepartmentCol = (col) => {
  if (!col) return false;
  const colId = typeof col === 'string' ? col : (col.id || '');
  const colLabel = typeof col === 'object' ? (col.label || '') : '';
  const clean = `${colId}_${colLabel}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean.includes('donvi') || clean.includes('phongban') || clean.includes('department') || clean.includes('coquan');
};

const getDisplayValue = (person, colId) => {
  if (!person) return '-';

  // 0. Phân giải Cột ảo (Trạng thái hiện diện, Đối tượng, Thông tin Cán bộ liên quan...)
  const vVal = resolveVirtualColumnValue(person, colId);
  if (vVal !== undefined) return vVal || '-';

  const colDef = allColumnDefsMap.value[colId];
  if (colDef && colDef.format === 'lookup') {
    return evaluateLookup(person, colDef, personnelStore);
  }
  if (colDef && colDef.format === 'rollup') {
    return evaluateRollup(person, colDef, personnelStore);
  }

  if (isFormulaCol(colId)) {
    return getFormulaStatus(person, colDef || {});
  }

  let cd = person.custom_data;
  if (typeof cd === 'string') {
    try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
  }

  // 1. Direct property or custom_data match (EXACT match with Chi tiết popup)
  let val = person[colId] ?? cd?.[colId];

  // 2. Department fallback if empty
  if ((val === undefined || val === null || val === '' || val === '-') && (colId === 'departmentId' || colId === 'departmentName' || isDepartmentCol(colId))) {
    val = getPersonnelDepartmentValue(person, colId);
  }

  // 3. Position fallback if empty
  if ((val === undefined || val === null || val === '' || val === '-') && (colId === 'position' || colId === 'positionName')) {
    val = person.positionName || person.position || cd?.positionName || cd?.position || cd?.chuc_vu;
  }

  // 4. Case-insensitive key match in person or custom_data
  if (val === undefined || val === null || val === '' || val === '-') {
    const targetKeyClean = String(colId).toLowerCase().replace(/[^a-z0-9]/g, '');
    const searchInObj = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      for (const [k, v] of Object.entries(obj)) {
        const cleanK = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanK === targetKeyClean && v !== undefined && v !== null && String(v).trim() !== '') {
          return v;
        }
      }
      return null;
    };
    val = searchInObj(person) ?? searchInObj(cd);
  }

  // 5. Look for matching column in importMappingPersonnel by label
  if (val === undefined || val === null || val === '' || val === '-') {
    const cleanColId = String(colId).toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const group of (personnelStore.importMappingPersonnel || [])) {
      for (const c of (group.columns || [])) {
        const cCleanId = String(c.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cCleanLabel = String(c.label || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cCleanId === cleanColId || cCleanLabel === cleanColId) {
          const found = person[c.id] ?? cd?.[c.id];
          if (found !== undefined && found !== null && String(found).trim() !== '') {
            val = found;
            break;
          }
        }
      }
      if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '-') break;
    }
  }

  const finalColDef = colDef || { id: colId };
  return formatGenericCellValue(val, finalColDef);
};

const onColumnsChange = async () => {
  try {
    localStorage.setItem('vue_visible_columns', JSON.stringify(personnelStore.visibleColumns));
    await saveAppSettings('vue_visible_columns', personnelStore.visibleColumns);
    const activeCard = (activePersonnelMetricCards.value || [])[activePersonnelCardIdx.value];
    if (activeCard) {
      activeCard.columns = [...personnelStore.visibleColumns];
      localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
      await saveAppSettings('custom_dashboards_config', customDashboards.value);
    }
  } catch (e) {
    console.error('Lỗi khi lưu cấu hình cột cán bộ vào DB:', e);
  }
};

const onRelativeColumnsChange = async () => {
  try {
    localStorage.setItem('vue_visible_relative_columns', JSON.stringify(personnelStore.visibleRelativeColumns));
    await saveAppSettings('vue_visible_relative_columns', personnelStore.visibleRelativeColumns);
    const activeCard = (activeRelativeMetricCards.value || [])[activeRelativeCardIdx.value];
    if (activeCard) {
      activeCard.columns = [...personnelStore.visibleRelativeColumns];
      localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
      await saveAppSettings('custom_dashboards_config', customDashboards.value);
    }
  } catch (e) {
    console.error('Lỗi khi lưu cấu hình cột thân nhân vào DB:', e);
  }
};

// ==================== LƯU VÀ TẢI BỘ LỌC VÀO DATABASE ====================
let pFilterDebounceTimer = null;
const savePersonnelFilterState = async () => {
  const filterData = {
    mainTab: mainTab.value,
    searchQuery: searchQuery.value,
    relativeSearchQuery: relativeSearchQuery.value,
    smartFilter: smartFilter.value,
    smartFilterField: smartFilterField.value,
  };
  try {
    localStorage.setItem('personnel_view_filters', JSON.stringify(filterData));
    await saveAppSettings('personnel_view_filters', filterData);
  } catch (e) {
    console.warn('Lỗi khi lưu bộ lọc cán bộ vào DB:', e);
  }
};

const triggerAutoSavePersonnelFilter = () => {
  if (pFilterDebounceTimer) clearTimeout(pFilterDebounceTimer);
  pFilterDebounceTimer = setTimeout(() => {
    savePersonnelFilterState();
  }, 400);
};

const loadPersonnelFilterState = async () => {
  try {
    let saved = await getAppSettings('personnel_view_filters', null);
    if (!saved) {
      const local = localStorage.getItem('personnel_view_filters');
      if (local) {
        try { saved = JSON.parse(local); } catch (e) {}
      }
    }
    if (saved && typeof saved === 'object') {
      syncTabWithRoute();
      if (saved.searchQuery !== undefined) searchQuery.value = saved.searchQuery;
      if (saved.relativeSearchQuery !== undefined) relativeSearchQuery.value = saved.relativeSearchQuery;
      if (saved.smartFilter !== undefined) smartFilter.value = saved.smartFilter;
      if (saved.smartFilterField !== undefined) smartFilterField.value = saved.smartFilterField;
    }
  } catch (e) {
    console.warn('Lỗi khi tải bộ lọc cán bộ từ DB:', e);
  }
};

watch(
  [mainTab, searchQuery, relativeSearchQuery, smartFilter, smartFilterField],
  () => {
    triggerAutoSavePersonnelFilter();
  }
);

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
  if (!parent && relData.cccdparent) {
    parent = personnelStore.personnelList.find(
      (p) => String(p.cccdparent || p.custom_data?.cccdparent || '').trim() === String(relData.cccdparent).trim()
    );
  }
  if (!parent && relData.personnelId) {
    parent = personnelStore.personnelList.find((p) => p.id === relData.personnelId);
  }

  const relCode = relData.code || ('TN-' + String(relData.id || '').slice(-5).padStart(5, '0'));

  if (parent) {
    openEditDialog(parent, {
      tab: 2, // Open Tab 3: Thân nhân
      targetRelativeCode: relCode,
    });
  } else {
    // If not linked to a parent yet, display relative in modal
    openEditDialog({
      name: relData.parentName || 'Hồ sơ liên quan',
      relatives: [relData],
    }, {
      tab: 2,
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
  const curKey = String(data.cccdparent || data.parentName || data.personnelId || '').trim();
  const prevKey = String(prev.cccdparent || prev.parentName || prev.personnelId || '').trim();
  return !curKey || curKey !== prevKey;
};


// ===== TEABLE / LARK BASE INTERACTIVE GRID STATE & METHODS =====
const isColMenuVisible = ref(false);
const selectedMenuCol = ref(null);
const colMenuPosition = ref({ x: 0, y: 0 });

const customColLabels = ref({});
const getCustomColLabel = (colId, defaultLabel) => {
  return customColLabels.value[colId] || localStorage.getItem('col_label_' + colId) || defaultLabel;
};

const loadCustomColLabels = async () => {
  const keys = ['code', '_parentPersonnelName', 'parentName'];
  for (const k of keys) {
    try {
      const local = localStorage.getItem('col_label_' + k);
      if (local) customColLabels.value[k] = local;
      const saved = await getAppSettings('col_label_' + k);
      if (saved) customColLabels.value[k] = saved;
    } catch (e) {}
  }
};

const isKeyLinkDialogOpen = ref(false);
const addColTargetIndex = ref(-1);

const openColMenu = (event, col) => {
  const thElem = event.currentTarget.closest('th') || event.currentTarget.closest('.table-col-header-wrap') || event.currentTarget;
  const thRect = thElem.getBoundingClientRect();
  colMenuPosition.value = {
    x: Math.max(10, Math.min(thRect.left, window.innerWidth - 320)),
    y: thRect.bottom + 4,
  };
  selectedMenuCol.value = col;
  isColMenuVisible.value = true;
};

const handleColMenuFromSelector = ({ event, col }) => {
  openColMenu(event, col);
};

const onInsertColLeft = (col) => {
  const { mapping } = getActiveTableMapping();
  for (const g of (mapping || [])) {
    const found = (g.columns || []).findIndex(c => c.id === col.id);
    if (found !== -1) {
      // Cột đầu tiên (Cột chính index 0) là bất khả xâm phạm, không cho chèn trước nó
      addColTargetIndex.value = Math.max(1, found);
      break;
    }
  }
  openAddColumnModal();
};

const onInsertColRight = (col) => {
  const { mapping } = getActiveTableMapping();
  for (const g of (mapping || [])) {
    const found = (g.columns || []).findIndex(c => c.id === col.id);
    if (found !== -1) {
      addColTargetIndex.value = found + 1;
      break;
    }
  }
  openAddColumnModal();
};

const onDuplicateCol = async (col) => {
  const { isRelative, mappingKey, mapping } = getActiveTableMapping();
  const copyId = col.id + '_copy_' + Math.random().toString(36).substring(2, 6);
  const copyCol = {
    ...col,
    id: copyId,
    label: (col.label || col.id) + ' (Bản sao)',
  };
  delete copyCol.isVirtual;
  delete copyCol.isPrimaryField;

  let inserted = false;
  for (const g of (mapping || [])) {
    const idx = (g.columns || []).findIndex(c => c.id === col.id);
    if (idx !== -1) {
      g.columns.splice(idx + 1, 0, copyCol);
      inserted = true;
      break;
    }
  }
  if (!inserted && mapping && mapping[0]) {
    mapping[0].columns.push(copyCol);
  }

  await saveAppSettings(mappingKey, mapping);

  if (isRelative) {
    personnelStore.visibleRelativeColumns.push(copyId);
    await saveAppSettings('relative_visible_columns', personnelStore.visibleRelativeColumns);
  } else {
    personnelStore.visibleColumns.push(copyId);
    await saveAppSettings('personnel_visible_columns', personnelStore.visibleColumns);
  }
  alert(`Đã nhân bản cột thành công: "${copyCol.label}"!`);
};

const onChangeColumnFormulaType = async ({ colId, formulaType }) => {
  const { mappingKey, mapping } = getActiveTableMapping();
  let found = false;
  for (const g of (mapping || [])) {
    for (const c of (g.columns || [])) {
      if (c.id === colId) {
        c.formulaType = formulaType;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) {
    await saveAppSettings(mappingKey, mapping);
  }
};

const getActiveTableMapping = () => {
  const isRel = mainTab.value === 'thannhan' || route.path === '/relatives';
  if (isRel) {
    return {
      isRelative: true,
      mappingKey: 'import_mapping_relative',
      mapping: personnelStore.importMappingRelative,
    };
  }
  return {
    isRelative: false,
    mappingKey: 'import_mapping_personnel',
    mapping: personnelStore.importMappingPersonnel,
  };
};

const onRenameColumn = async ({ colId, newLabel }) => {
  const { mappingKey, mapping } = getActiveTableMapping();
  let found = false;
  for (const g of (mapping || [])) {
    for (const c of (g.columns || [])) {
      if (c.id === colId) {
        c.label = newLabel;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) {
    await saveAppSettings(mappingKey, mapping);
  } else {
    customColLabels.value[colId] = newLabel;
    try { localStorage.setItem('col_label_' + colId, newLabel); } catch (e) {}
    await saveAppSettings('col_label_' + colId, newLabel);
  }
};

const onChangeColumnFormat = async ({ colId, newFormat }) => {
  const { mappingKey, mapping } = getActiveTableMapping();
  let found = false;
  for (const g of (mapping || [])) {
    for (const c of (g.columns || [])) {
      if (c.id === colId) {
        c.format = newFormat;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) {
    await saveAppSettings(mappingKey, mapping);
  }
};

const onChangeColumnLookup = async ({ colId, lookupTarget, lookupLinkCol, lookupField }) => {
  const { mappingKey, mapping } = getActiveTableMapping();
  let found = false;
  for (const g of (mapping || [])) {
    for (const c of (g.columns || [])) {
      if (c.id === colId) {
        c.format = 'lookup';
        c.lookupTarget = lookupTarget;
        c.lookupLinkCol = lookupLinkCol;
        c.lookupField = lookupField;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) {
    await saveAppSettings(mappingKey, mapping);
  }
};

const onChangeColumnOptions = async ({ colId, options }) => {
  const { mappingKey, mapping } = getActiveTableMapping();
  let found = false;
  for (const g of (mapping || [])) {
    for (const c of (g.columns || [])) {
      if (c.id === colId) {
        c.options = options;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) {
    await saveAppSettings(mappingKey, mapping);
  }
};

const onChangeColumnWidth = async ({ colId, width }) => {
  const { mappingKey, mapping } = getActiveTableMapping();
  let found = false;
  for (const g of (mapping || [])) {
    for (const c of (g.columns || [])) {
      if (c.id === colId) {
        c.tableWidth = width;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) {
    await saveAppSettings(mappingKey, mapping);
  }
};

const onColChangeRequired = async ({ colId, required }) => {
  const { mappingKey, mapping } = getActiveTableMapping();
  let found = false;
  for (const g of (mapping || [])) {
    for (const c of (g.columns || [])) {
      if (c.id === colId) {
        c.required = Boolean(required);
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) {
    await saveAppSettings(mappingKey, mapping);
  }
};

const onChangeColumnFormWidth = async ({ colId, formWidth }) => {
  const { mappingKey, mapping } = getActiveTableMapping();
  let found = false;
  for (const g of (mapping || [])) {
    for (const c of (g.columns || [])) {
      if (c.id === colId) {
        c.width = String(formWidth);
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) {
    await saveAppSettings(mappingKey, mapping);
    alert('Đã cập nhật độ rộng form chi tiết cho cột này!');
  }
};

const onDeleteColumnFromTable = async (colId) => {
  const { isRelative, mappingKey, mapping } = getActiveTableMapping();
  let found = false;
  for (const g of (mapping || [])) {
    if (Array.isArray(g.columns)) {
      const initLen = g.columns.length;
      g.columns = g.columns.filter((c) => c.id !== colId);
      if (g.columns.length < initLen) {
        found = true;
      }
    }
  }
  if (found) {
    if (isRelative) {
      personnelStore.visibleRelativeColumns = personnelStore.visibleRelativeColumns.filter((id) => id !== colId);
      try { localStorage.setItem('relative_visible_columns', JSON.stringify(personnelStore.visibleRelativeColumns)); } catch (e) {}
      await saveAppSettings('relative_visible_columns', personnelStore.visibleRelativeColumns);
    } else {
      personnelStore.visibleColumns = personnelStore.visibleColumns.filter((id) => id !== colId);
      try { localStorage.setItem('personnel_visible_columns', JSON.stringify(personnelStore.visibleColumns)); } catch (e) {}
      await saveAppSettings('personnel_visible_columns', personnelStore.visibleColumns);
    }
    await saveAppSettings(mappingKey, mapping);
    alert('Đã xóa cột thành công khỏi bảng!');
  }
};

const onHideColumn = async (colId) => {
  const isRel = mainTab.value === 'thannhan' || route.path === '/relatives';
  if (isRel) {
    personnelStore.visibleRelativeColumns = personnelStore.visibleRelativeColumns.filter((id) => id !== colId);
    try {
      localStorage.setItem('relative_visible_columns', JSON.stringify(personnelStore.visibleRelativeColumns));
    } catch (e) {}
    await saveAppSettings('relative_visible_columns', personnelStore.visibleRelativeColumns);
  } else {
    personnelStore.visibleColumns = personnelStore.visibleColumns.filter((id) => id !== colId);
    try {
      localStorage.setItem('personnel_visible_columns', JSON.stringify(personnelStore.visibleColumns));
    } catch (e) {}
    await saveAppSettings('personnel_visible_columns', personnelStore.visibleColumns);
  }
};

const onFilterByColumn = (col) => {
  searchQuery.value = col.label || col.id;
};

// INLINE EDITING
const editingCell = ref(null);

const startInlineEdit = (row, col) => {
  // Không cho sửa trực tiếp các cột tính toán / công thức / tệp qua inline
  if (col.format === 'formula' || col.format === 'file' || col.format === 'text_file_loop' || col.format === 'checkbox_file_loop') {
    openEditDialog(row);
    return;
  }
  const currentVal = row[col.id] ?? row.custom_data?.[col.id] ?? '';
  editingCell.value = {
    rowId: row.id,
    colId: col.id,
    row: row,
    col: col,
    value: currentVal !== '-' ? currentVal : '',
  };
};

const cancelInlineEdit = () => {
  editingCell.value = null;
};

const saveInlineEdit = async () => {
  if (!editingCell.value) return;
  const { row, colId, value } = editingCell.value;
  editingCell.value = null;

  const oldVal = row[colId] ?? row.custom_data?.[colId] ?? '';
  if (String(oldVal) === String(value)) return;

  try {
    row[colId] = value;
    if (!row.custom_data) row.custom_data = {};
    if (typeof row.custom_data === 'string') {
      try { row.custom_data = JSON.parse(row.custom_data); } catch (e) { row.custom_data = {}; }
    }
    row.custom_data[colId] = value;

    await personnelStore.savePerson(row);
  } catch (err) {
    console.error('Lỗi cập nhật nhanh inline:', err);
  }
};

const getColDropdownOptions = (col) => {
  if (!col.options) return [];
  return String(col.options).split(',').map((s) => s.trim()).filter(Boolean);
};

const isAddColOpen = ref(false);
const targetColSource = ref('personnel');

const openAddColumnModal = (src) => {
  targetColSource.value = src === 'relatives' || mainTab.value === 'thannhan' || route.path === '/relatives' ? 'relatives' : 'personnel';
  isAddColOpen.value = true;
};

const onSaveNewColumn = async (colPayload) => {
  const isRel = targetColSource.value === 'relatives';
  const mappingKey = isRel ? 'import_mapping_relative' : 'import_mapping_personnel';
  let mapping = isRel ? personnelStore.importMappingRelative : personnelStore.importMappingPersonnel;
  if (!mapping || mapping.length === 0) {
    mapping = [{ group: 'Thông tin bổ sung', columns: [] }];
    if (isRel) personnelStore.importMappingRelative = mapping;
    else personnelStore.importMappingPersonnel = mapping;
  }
  const targetIdx = typeof colPayload.targetIndex === 'number' ? Math.max(1, colPayload.targetIndex) : null;
  if (targetIdx !== null && mapping[0].columns.length >= targetIdx) {
    mapping[0].columns.splice(targetIdx, 0, colPayload);
  } else {
    mapping[0].columns.push(colPayload);
  }
  await saveAppSettings(mappingKey, mapping);

  if (isRel) {
    if (!personnelStore.visibleRelativeColumns.includes(colPayload.id)) {
      personnelStore.visibleRelativeColumns.push(colPayload.id);
      try { localStorage.setItem('relative_visible_columns', JSON.stringify(personnelStore.visibleRelativeColumns)); } catch (e) {}
      await saveAppSettings('relative_visible_columns', personnelStore.visibleRelativeColumns);
    }
  } else {
    if (!personnelStore.visibleColumns.includes(colPayload.id)) {
      personnelStore.visibleColumns.push(colPayload.id);
      try { localStorage.setItem('personnel_visible_columns', JSON.stringify(personnelStore.visibleColumns)); } catch (e) {}
      await saveAppSettings('personnel_visible_columns', personnelStore.visibleColumns);
    }
  }
  alert(`Đã thêm thành công cột "${colPayload.label}" vào bảng!`);
};
// ===== END TEABLE / LARK BASE STATE & METHODS =====

const onRowClick = (event) => {
  openEditDialog(event.data);
};

const onRelativeRowClick = (event) => {
  if (event?.data) {
    handleRelativeDetail(event.data);
  }
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

      // Existing Personnel map strictly by configured primary key (cccdparent)
      const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
      const existingByCccd = {};
      personnelStore.personnelList.forEach((p) => {
        const canBoCccd = p[pKeyField] ?? p.custom_data?.[pKeyField] ?? p.cccdparent;
        if (canBoCccd) existingByCccd[String(canBoCccd).trim()] = p;
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
  z-index: 1000;
  padding: 8px;
  margin-top: 4px;
}

/* Cầu nối vô hình giúp chuột di chuyển từ nút bấm xuống menu không bao giờ bị đứt đoạn */
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

.filter-panel-dropdown {
  width: 320px;
  max-width: 90vw;
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
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
}

.menu-action-sub {
  font-size: 0.68rem;
  color: #64748b;
}

.filter-section-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.smart-chips-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.smart-chip {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 0.76rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  text-align: left;
  transition: all 0.15s ease;
}

.smart-chip:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.chip-active {
  background: #eff6ff !important;
  color: #2563eb !important;
  border-color: #3b82f6 !important;
  font-weight: 700 !important;
}

.filter-active-dot {
  width: 7px;
  height: 7px;
  background: #2563eb;
  border-radius: 50%;
  display: inline-block;
  margin-left: 4px;
}

.custom-field-filter-select {
  width: 100%;
  padding: 5px 8px;
  font-size: 0.76rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #1e293b;
  outline: none;
}

.custom-field-filter-select:focus {
  border-color: #2563eb;
}

.segmented-tab-btn {
  background: transparent;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.segmented-tab-btn:hover {
  color: #1e293b;
}

.segmented-tab-btn.tab-active {
  background: #ffffff;
  color: #16a34a !important;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.table-col-header-wrap {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
  line-height: 1.35 !important;
}
.table-col-title-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: normal;
  word-break: break-word;
}
.table-col-lock-badge,
.table-col-key-badge {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  flex-shrink: 0;
  font-size: 0.72rem;
  line-height: 1;
}
:deep(.p-datatable .p-datatable-thead > tr > th .p-column-title),
:deep(.p-datatable .p-datatable-thead > tr > th .p-column-header-content) {
  white-space: normal !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  line-height: 1.35 !important;
  max-width: 100%;
}

/* Teable / Lark Base Smart Grid Styles */
.btn-col-menu-trigger {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: all 0.15s ease;
}
.btn-col-menu-trigger:hover {
  background: #e2e8f0;
  color: #0284c7;
  opacity: 1;
}

.btn-add-col-plus {
  background: transparent;
  border: 1px dashed #cbd5e1;
  color: #64748b;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}
.btn-add-col-plus:hover {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.inline-cell-wrapper {
  cursor: pointer;
  min-height: 22px;
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}
.inline-cell-wrapper:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.inline-edit-box {
  width: 100%;
}
.inline-edit-input {
  width: 100%;
  height: 26px;
  font-size: 0.78rem;
  padding: 2px 6px;
  border: 1.5px solid #0284c7;
  border-radius: 4px;
  outline: none;
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
}
.inline-edit-select {
  width: 100%;
  height: 26px;
  font-size: 0.78rem;
  padding: 2px 4px;
  border: 1.5px solid #0284c7;
  border-radius: 4px;
  outline: none;
  background: #ffffff;
}

</style>
