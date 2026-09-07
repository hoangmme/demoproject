<template>
  <div class="app-content">
    <!-- Breadcrumb & Top Bar -->
    <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
      <span>Bảng dữ liệu</span>
      <span>/</span>
      <span style="color: #0f172a; font-weight: 600;">{{ currentDashboardConfig.title || 'Danh sách chuyến đi' }}</span>
    </div>

    <!-- Header Section with Actions -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="badge-code-cd">{{ currentDashboardConfig.code || 'CD-03' }}</span>
        <div>
          <h1 style="font-size: 1.35rem; font-weight: 700; color: #0f172a; margin: 0; display: inline-flex; align-items: center; gap: 8px;">
            {{ currentDashboardConfig.title || 'Danh sách chuyến đi' }}
            <span style="font-size: 0.85rem; font-weight: 500; color: #64748b;">· {{ filteredList.length }} bản ghi</span>
          </h1>
        </div>
      </div>

       <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <!-- ➕ Nút Thêm Cột Mới chuẩn Lark Base -->
        <Button
          v-if="authStore.isAdmin"
          icon="pi pi-plus"
          label="Thêm cột mới"
          severity="success"
          size="small"
          @click="openAddColumnDialog"
          title="Tạo thêm cột dữ liệu mới trực tiếp trên bảng này"
          style="font-size: 0.8rem;"
        />

        <!-- ⚙️ Tùy chọn Cột hiển thị Popover -->
        <div class="header-menu-wrapper" @mouseenter="onMouseEnterFilter" @mouseleave="onMouseLeaveFilter">
          <Button
            icon="pi pi-table"
            label="Tùy chọn Cột hiển thị"
            severity="secondary"
            outlined
            size="small"
            @click="isFilterMenuOpen = !isFilterMenuOpen"
            title="Tùy chọn Cột hiển thị"
            style="font-size: 0.8rem;"
          />

          <div v-show="isFilterMenuOpen" class="header-menu-dropdown filter-panel-dropdown" style="padding: 0; overflow: hidden;">
            <div style="padding: 8px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
                <div style="font-size: 0.78rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                  <i class="pi pi-table" style="color: #7c3aed;"></i>
                  <span>Tùy chọn Cột hiển thị</span>
                </div>
                <span
                  style="font-size: 0.68rem; font-weight: 700; color: #0284c7; background: #f0f9ff; padding: 2px 8px; border-radius: 9999px; border: 1px solid #bae6fd; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                  :title="activeMetricCardIdx <= 0 ? 'Toàn bộ chuyên đề' : (activeMetricCard?.label || 'Thẻ đang chọn')"
                >
                  🎯 {{ activeMetricCardIdx <= 0 ? 'Toàn bộ' : (activeMetricCard?.label || 'Thẻ đang chọn') }}
                </span>
              </div>
              <div style="font-size: 0.7rem; color: #64748b; line-height: 1.3;">
                Đang cấu hình cột riêng cho: <strong style="color: #1e293b;">{{ activeMetricCardIdx <= 0 ? 'Toàn bộ chuyên đề' : (activeMetricCard?.label || 'Thẻ đang chọn') }}</strong>
              </div>
            </div>
            <ColumnSelector
              :inline="true"
              :key="activeMetricCardIdx"
              v-model="selectedColIds"
              :options="allAvailableColumnsList"
              @change="onColumnsChange"
              @open-col-menu="handleChildColMenuFromSelector"
            />
          </div>
        </div>

        <!-- Nút Xóa các bản ghi đã chọn (Tick chọn nhiều dòng) -->
        <Button
          v-if="selectedTrips.length > 0"
          :label="`Xóa (${selectedTrips.length} đã chọn)`"
          icon="pi pi-trash"
          severity="danger"
          size="small"
          @click="handleBulkDeleteTrips"
          style="font-size: 0.8rem;"
        />

        <!-- + Thêm Bản Ghi Mới trực tiếp vào Bảng này -->
        <Button
          icon="pi pi-plus"
          label="+ Thêm Bản Ghi Mới"
          severity="success"
          size="small"
          @click="openAddTripDialog"
          title="Thêm bản ghi mới trực tiếp vào bảng này"
          style="font-size: 0.8rem;"
        />

        <!-- Export PDF / Word -->
        <button
          type="button"
          class="btn-action-primary"
          @click="openAdvancedDocxExport"
          title="Xuất Hồ sơ (PDF / Word)"
        >
          <i class="pi pi-file-pdf"></i>
          <span>Xuất Hồ sơ (PDF / Word)</span>
        </button>
      </div>
    </div>

    <!-- Lark-Style Drill-down Records Banner -->
    <div
      v-if="hasDrillDownFilter"
      style="margin-bottom: 1rem; padding: 12px 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; color: #1e40af; box-shadow: 0 1px 3px rgba(0,0,0,0.03); flex-wrap: wrap; gap: 10px;"
    >
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <div style="width: 32px; height: 32px; border-radius: 8px; background: #dbeafe; display: flex; align-items: center; justify-content: center; color: #2563eb; flex-shrink: 0;">
          <i class="pi pi-filter-fill" style="font-size: 0.95rem;"></i>
        </div>
        <div>
          <div style="color: #64748b; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">KẾT QUẢ THỐNG KÊ CHI TIẾT</div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 2px;">
            <span style="font-weight: 700; color: #1e3a8a; font-size: 0.95rem;">{{ drillDownFilterLabel }}</span>
            <span style="font-weight: 700; color: #2563eb; background: #ffffff; padding: 2px 8px; border-radius: 12px; border: 1px solid #bfdbfe; font-size: 0.75rem;">
              {{ filteredList.length }} bản ghi
            </span>
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <button
          type="button"
          @click="clearAllDrillDownFilters"
          style="background: #ffffff; border: 1px solid #93c5fd; color: #1d4ed8; padding: 6px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s ease;"
          title="Bỏ lọc để hiển thị lại toàn bộ danh sách"
        >
          <i class="pi pi-times"></i> Xem tất cả
        </button>
        <button
          type="button"
          @click="router.push('/dashboard')"
          style="background: #2563eb; border: 1px solid #2563eb; color: #ffffff; padding: 6px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s ease;"
          title="Quay lại bảng Thống kê"
        >
          <i class="pi pi-arrow-left"></i> Quay lại Thống kê
        </button>
      </div>
    </div>

    <!-- Filter Bar Container (Tìm kiếm nhanh) -->
    <div class="app-card" style="padding: 12px 16px; margin-bottom: 1rem;">
      <div style="display: flex; gap: 10px; align-items: center;">
        <!-- Search -->
        <div class="search-input-wrapper" style="flex: 1;">
          <i class="pi pi-search search-icon-left"></i>
          <InputText
            v-model="searchQuery"
            placeholder="Tìm theo tên, CCCD, chức vụ, đơn vị, số quyết định, quốc gia..."
            style="width: 100%; font-size: 0.82rem; height: 34px;"
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
      </div>
    </div>

    <!-- Main Data Table Card (Matching PersonnelView exactly) -->
    <div class="app-card" style="padding: 0; overflow-x: auto; max-width: 100%; position: relative;">
      <DataTable
        v-model:selection="selectedTrips"
        :value="filteredList"
        dataKey="uniqueKey"
        paginator
        :rows="30"
        :rowsPerPageOptions="[15, 30, 50, 100]"
        :selectionPageOnly="true"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
        currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi"
        :loading="personnelStore.loading"
        responsiveLayout="scroll"
        stripedRows
        removableSort
        class="p-datatable-sm custom-datatable"
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

        <!-- Dynamic Visible Columns -->
        <Column
          v-for="col in visibleColumns"
          :key="col.id"
          :field="col.id"
          :headerClass="'col-left'"
          :bodyClass="'col-left'"
          :headerStyle="{ width: col.tableWidth || col.width || '160px', minWidth: col.tableWidth === 'auto' ? undefined : (col.tableWidth || col.width || '160px') }"
          :bodyStyle="{ width: col.tableWidth || col.width || '160px', minWidth: col.tableWidth === 'auto' ? undefined : (col.tableWidth || col.width || '160px') }"
        >
          <template #header>
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0;">
                <span class="table-col-header-wrap">
                  <span v-if="showColIndex && col.colIndex && !col.isVirtual" style="color: #64748b; font-weight: 600; margin-right: 4px; font-size: 0.72rem;">
                    Cột {{ col.colIndex }}:
                  </span>
                  {{ col.label }}
                </span>
                <i v-if="isNameColumn(col.id)" class="pi pi-cog" style="font-size: 0.7rem; cursor: pointer; color: #94a3b8; margin-left: 2px; flex-shrink: 0;" @click.stop="toggleNameColConfig($event)" title="Tùy chỉnh nội dung cột" />
              </div>
              <button
                type="button"
                class="btn-col-menu-trigger"
                @click.stop="openChildColMenu($event, col)"
                title="Tùy chỉnh cột này (Đổi tên, đổi kiểu, ẩn cột...)"
              >
                <i class="pi pi-chevron-down" style="font-size: 0.65rem;"></i>
              </button>
            </div>
          </template>
          <template #body="{ data }">
            <!-- 0. Cột Khóa chính (_primaryKey) -->
            <template v-if="col.id === '_primaryKey'">
              <span style="display: inline-flex; align-items: center; gap: 5px; font-family: monospace; font-size: 0.76rem; font-weight: 700; color: #475569; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">
                <i class="pi pi-key" style="font-size: 0.7rem; color: #d97706;"></i>
                {{ getCellValue(data, col.id) }}
              </span>
            </template>

            <!-- 1. Cột ảo Thông tin Cán bộ (configurable rows) -->
            <template v-else-if="isNameColumn(col.id)">
              <div style="display: flex; flex-direction: column; gap: 2px; line-height: 1.35; padding: 2px 0;">
                <!-- Tên cán bộ -->
                <div v-if="nameColFields.name">
                  <span v-if="data.isRelative || currentDashboardConfig.source === 'relatives'" style="font-size: 0.7rem; color: #64748b; font-weight: 600;">Cán bộ: </span>
                  <strong style="color: #0f172a; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                    {{ getPersonInfo(data).name }}
                  </strong>
                </div>
                <!-- CCCD Cán bộ -->
                <div v-if="nameColFields.cccdCB && getPersonInfo(data).cccdCB" style="font-size: 0.72rem; color: #475569; font-weight: 500;">
                  {{ getPersonInfo(data).cccdCB }}
                </div>
                <!-- Chức vụ -->
                <div v-if="nameColFields.position && getPersonInfo(data).position" style="font-size: 0.72rem; color: #334155;">
                  {{ getPersonInfo(data).position }}
                </div>
                <!-- Đơn vị công tác -->
                <div v-if="nameColFields.department && getPersonInfo(data).department" style="font-size: 0.72rem; color: #64748b;">
                  {{ getPersonInfo(data).department }}
                </div>
              </div>
            </template>

            <!-- 1c. Cột Họ và tên Thân nhân -->
            <template v-else-if="col.id === 'relativeName' || col.id === 'ho_va_ten_than_nhan'">
              <div style="display: flex; flex-direction: column; gap: 2px; line-height: 1.35; padding: 2px 0;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong style="color: #0f172a; font-weight: 700; font-size: 0.85rem;">
                    {{ data.relativeName || data.name || '-' }}
                  </strong>
                  <span
                    v-if="data.relationshipName || data.relationship"
                    style="font-size: 0.7rem; font-weight: 600; padding: 1px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;"
                  >
                    {{ data.relationshipName || data.relationship }}
                  </span>
                </div>
                <div v-if="data.cccdthannhan || data.cccd" style="font-size: 0.72rem; color: #64748b;">
                  CCCD TN: {{ data.cccdthannhan || data.cccd }}
                </div>
              </div>
            </template>

            <!-- 1d. Cột Mối quan hệ riêng -->
            <template v-else-if="col.id === 'relationshipName' || col.id === 'relationship'">
              <span
                v-if="data.relationshipName || data.relationship"
                style="display: inline-flex; align-items: center; font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;"
              >
                {{ data.relationshipName || data.relationship }}
              </span>
              <span v-else style="color: #94a3b8;">-</span>
            </template>

            <!-- 1b. Cột Họ và tên gốc (chỉ hiện tên thuần túy) -->
            <template v-else-if="col.id === 'personnelName' || col.id === 'name' || col.id === 'ho_va_ten' || col.id === 'hoTen'">
              <strong style="color: #0f172a; font-weight: 700;">{{ data[col.id] || data.personnelName || data.name || '-' }}</strong>
            </template>


            <!-- 2. Đơn vị công tác -->
            <template v-else-if="col.id === 'departmentName' || col.id === 'departmentId' || col.id === 'don_vi_cong_tac' || col.id === 'don_vi'">
              <span>{{ getDepartmentValue(data) !== '-' ? getDepartmentValue(data) : (getCellValue(data, col.id) !== '-' ? getCellValue(data, col.id) : '-') }}</span>
            </template>

            <!-- 3. Ngày xuất cảnh & Ngày nhập cảnh / về -->
            <template v-else-if="col.id === 'departureDate' || col.id === 'approvedDepartureDate' || col.id === 'arrivalDate' || col.id === 'approvedArrivalDate'">
              <span>{{ formatDisplayDate(data[col.id] || getCellValue(data, col.id)) }}</span>
            </template>

            <!-- 5. Số quyết định -->
            <template v-else-if="col.id === 'decisionNumber' || col.id === 'decision'">
              <span v-if="data.decisionNumber" class="code-badge-decision">
                {{ data.decisionNumber }}
              </span>
              <span v-else style="color: #94a3b8;">-</span>
            </template>

            <!-- 6. Quốc gia -->
            <template v-else-if="col.id === 'countryName' || col.id === 'country' || col.id === 'countryNameTN' || col.id === 'quoc_gia_xuat_canh'">
              <span style="font-weight: 600; color: #1e293b;">
                {{ data[col.id] || getCellValue(data, col.id) }}
              </span>
            </template>

            <!-- 7. Nguồn kinh phí -->
            <template v-else-if="col.id === 'fundingName' || col.id === 'funding' || col.id === 'nguon_kinh_phi' || col.id === 'kinh_phi'">
              <span class="badge-funding">
                {{ getFundingValue(data) }}
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

            <!-- Default value (+ Teable Inline Edit) -->
            <template v-else>
              <div
                class="inline-cell-wrapper"
                @dblclick.stop="startChildInlineEdit(data, col)"
                :title="'Nhấp đúp để chỉnh sửa nhanh ô này'"
              >
                <!-- Đang sửa inline -->
                <div v-if="editingChildCell?.uniqueKey === data.uniqueKey && editingChildCell?.colId === col.id" class="inline-edit-box" @click.stop>
                  <input
                    v-if="col.format === 'text' || !col.format"
                    v-model="editingChildCell.value"
                    class="inline-edit-input"
                    autofocus
                    @keyup.enter="saveChildInlineEdit"
                    @keyup.esc="cancelChildInlineEdit"
                    @blur="saveChildInlineEdit"
                  />
                  <input
                    v-else-if="col.format === 'number'"
                    type="number"
                    v-model="editingChildCell.value"
                    class="inline-edit-input"
                    autofocus
                    @keyup.enter="saveChildInlineEdit"
                    @keyup.esc="cancelChildInlineEdit"
                    @blur="saveChildInlineEdit"
                  />
                  <input
                    v-else-if="col.format === 'date'"
                    type="date"
                    v-model="editingChildCell.value"
                    class="inline-edit-input"
                    autofocus
                    @change="saveChildInlineEdit"
                    @keyup.esc="cancelChildInlineEdit"
                    @blur="saveChildInlineEdit"
                  />
                  <select
                    v-else-if="col.format === 'dropdown'"
                    v-model="editingChildCell.value"
                    class="inline-edit-select"
                    autofocus
                    @change="saveChildInlineEdit"
                    @blur="saveChildInlineEdit"
                  >
                    <option value="">-- Trống --</option>
                    <option v-for="opt in getChildColDropdownOptions(col)" :key="opt" :value="opt">
                      {{ opt }}
                    </option>
                  </select>
                  <input
                    v-else
                    v-model="editingChildCell.value"
                    class="inline-edit-input"
                    autofocus
                    @keyup.enter="saveChildInlineEdit"
                    @keyup.esc="cancelChildInlineEdit"
                    @blur="saveChildInlineEdit"
                  />
                </div>

                <!-- Hiển thị giá trị bình thường -->
                <div
                  v-else-if="String(getCellValue(data, col.id)).includes('\n')"
                  style="white-space: pre-line; line-height: 1.45; font-size: 0.78rem; color: #1e293b;"
                >
                  <div style="font-weight: 700; color: #0369a1;">
                    {{ String(getCellValue(data, col.id)).split('\n')[0] }}
                  </div>
                  <div style="font-size: 0.73rem; color: #475569; margin-top: 2px;">
                    {{ String(getCellValue(data, col.id)).split('\n').slice(1).join('\n') }}
                  </div>
                </div>
                <span v-else style="word-break: break-word; line-height: 1.45;">{{ getCellValue(data, col.id) }}</span>
              </div>
            </template>
          </template>
        </Column>

        <!-- Dynamic Filtered Column according to active Metric Card -->
        <Column
          v-if="activeMetricCard && (activeMetricCard.showCompareCol === true || activeMetricCard.showConditionCol === true)"
          :header="`🎯 ${activeCardColLabel}`"
          headerClass="col-active-filter-header"
          bodyClass="col-active-filter-body"
          :headerStyle="{ minWidth: '190px', color: '#b91c1c', fontWeight: '700', background: '#fef2f2' }"
          :bodyStyle="{ minWidth: '190px', background: '#fffaf0' }"
        >
          <template #body="{ data }">
            <template v-if="isActiveCardPresenceCol">
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
            <template v-else-if="activeCardSingleCol && activeCardSingleCol.format === 'checkbox_file_loop'">
              <div v-if="getCheckboxFileLoopItems(data, activeCardSingleCol.id).length > 0" style="display: flex; flex-direction: column; gap: 6px;">
                <div
                  v-for="(it, iIdx) in getCheckboxFileLoopItems(data, activeCardSingleCol.id)"
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
            <template v-else-if="activeCardSingleCol && activeCardSingleCol.format === 'text_file_loop'">
              <div v-if="getTextFileLoopItems(data, activeCardSingleCol.id).length > 0" style="display: flex; flex-direction: column; gap: 4px;">
                <div
                  v-for="(it, iIdx) in getTextFileLoopItems(data, activeCardSingleCol.id)"
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
            <template v-else-if="activeCardSingleCol && activeCardSingleCol.format === 'checkbox_file'">
              <div v-if="getCheckboxFileItem(data, activeCardSingleCol.id).hasValue" style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 0.76rem; line-height: 1.35;">
                <span v-if="getCheckboxFileItem(data, activeCardSingleCol.id).text" style="color: #1e293b; font-weight: 600;">
                  {{ getCheckboxFileItem(data, activeCardSingleCol.id).text }}
                </span>
                <a
                  v-if="getCheckboxFileItem(data, activeCardSingleCol.id).file && (getCheckboxFileItem(data, activeCardSingleCol.id).file.url || getCheckboxFileItem(data, activeCardSingleCol.id).file.id)"
                  :href="getFileUrl(getCheckboxFileItem(data, activeCardSingleCol.id).file)"
                  target="_blank"
                  style="display: inline-flex; align-items: center; gap: 3px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 1px 6px; border-radius: 4px; text-decoration: none; font-size: 0.7rem; font-weight: 500; white-space: nowrap;"
                  title="Mở xem tệp"
                >
                  <i class="pi pi-paperclip" style="font-size: 0.68rem;"></i>
                  <span>{{ getCheckboxFileItem(data, activeCardSingleCol.id).file.name || 'Tệp' }}</span>
                </a>
              </div>
              <span v-else>-</span>
            </template>
            <template v-else-if="activeCardSingleCol && activeCardSingleCol.format === 'file'">
              <div v-if="getFileColumnItems(data, activeCardSingleCol.id).length > 0" style="display: flex; flex-wrap: wrap; gap: 4px;">
                <a
                  v-for="(f, fIdx) in getFileColumnItems(data, activeCardSingleCol.id)"
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
            <template v-else>
              <div
                v-if="String(getActiveCardCellValue(data)).includes('\n')"
                style="white-space: pre-line; line-height: 1.45; font-size: 0.78rem; text-align: left;"
              >
                <div style="font-weight: 700; color: #b91c1c;">
                  {{ String(getActiveCardCellValue(data)).split('\n')[0] }}
                </div>
                <div style="font-size: 0.73rem; color: #475569; margin-top: 2px;">
                  {{ String(getActiveCardCellValue(data)).split('\n').slice(1).join('\n') }}
                </div>
              </div>
              <span v-else style="font-weight: 700; color: #b91c1c; font-size: 0.8rem;">
                {{ getActiveCardCellValue(data) }}
              </span>
            </template>
          </template>
        </Column>

        <!-- ➕ Nút Thêm Cột Mới chuẩn Airtable / Lark Base / Teable -->
        <Column :headerStyle="{ width: '48px', minWidth: '48px', padding: '0', textAlign: 'center' }" :bodyStyle="{ width: '48px', minWidth: '48px', padding: '0', textAlign: 'center', background: '#f8fafc' }">
          <template #header>
            <button
              type="button"
              class="btn-add-col-plus"
              @click.stop="openAddColumnDialog"
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

    <!-- Modal Chọn cột hiển thị -->
    <Dialog
      v-model:visible="isColumnPickerOpen"
      modal
      :header="`Chọn cột hiển thị - ${activeMetricCardIdx <= 0 ? 'Toàn bộ chuyên đề' : (activeMetricCard?.label || 'Thẻ đang chọn')} (${selectedColIds.length} / ${allAvailableColumnsList.length} cột)`"
      :style="{ width: '680px' }"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; gap: 8px; flex-wrap: wrap;">
        <span style="font-size: 0.8rem; color: #64748b;">
          Đánh dấu chọn các cột hiển thị cho <b>{{ activeMetricCardIdx <= 0 ? 'Toàn bộ chuyên đề' : (activeMetricCard?.label || 'Thẻ đang chọn') }}</b> từ toàn bộ <b>{{ allAvailableColumnsList.length }} cột</b>:
        </span>
        <div style="display: flex; gap: 6px;">
          <Button label="Chọn tất cả" size="small" text severity="primary" @click="selectedColIds = allAvailableColumnsList.map(c => c.id)" style="font-size: 0.75rem; padding: 2px 6px;" />
          <Button label="Bỏ chọn" size="small" text severity="secondary" @click="selectedColIds = []" style="font-size: 0.75rem; padding: 2px 6px;" />
          <Button label="Mặc định (10 cột)" size="small" text severity="info" @click="resetDefaultColumns" style="font-size: 0.75rem; padding: 2px 6px;" />
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-height: 420px;">
        <!-- Cột Trái: Chọn Cột -->
        <div style="display: flex; flex-direction: column; gap: 6px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; background: #f8fafc;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #475569;">1. Chọn cột hiển thị:</div>
          <InputText
            v-model="columnSearchQuery"
            placeholder="🔍 Tìm nhanh tên cột..."
            size="small"
            style="width: 100%; font-size: 0.78rem; padding: 4px 8px;"
          />
          <div style="display: flex; flex-direction: column; gap: 4px; overflow-y: auto; max-height: 320px; padding-right: 4px;">
            <label
              v-for="col in filteredPickerColumns"
              :key="col.id"
              style="display: flex; align-items: center; gap: 8px; font-size: 0.78rem; cursor: pointer; padding: 5px 8px; border-radius: 6px; border: 1px solid #e2e8f0; background: #ffffff;"
            >
              <input
                type="checkbox"
                :value="col.id"
                v-model="selectedColIds"
                style="accent-color: #1e3a8a;"
              />
              <span style="font-weight: 500; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="col.label">
                <span v-if="col.colIndex && !col.isVirtual" style="color: #64748b; font-weight: 600; margin-right: 4px; font-size: 0.72rem;">
                  Cột {{ col.colIndex }}:
                </span>
                {{ col.label }}
              </span>
            </label>
          </div>
        </div>

        <!-- Cột Phải: Sắp xếp Thứ tự Cột đã chọn -->
        <div style="display: flex; flex-direction: column; gap: 6px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; background: #ffffff;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #1e3a8a; display: flex; justify-content: space-between; align-items: center;">
            <span>2. Thứ tự hiển thị trên Bảng ({{ selectedColIds.length }} cột):</span>
          </div>
          <div style="font-size: 0.7rem; color: #64748b;">
            Bấm nút ▲ / ▼ để đổi vị trí cột từ trái sang phải:
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px; overflow-y: auto; max-height: 320px; padding-right: 4px;">
            <div
              v-for="(colId, sIdx) in selectedColIds"
              :key="colId"
              style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; border-radius: 6px; background: #f1f5f9; border: 1px solid #cbd5e1; font-size: 0.78rem;"
            >
              <span style="font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">
                {{ sIdx + 1 }}. {{ getColumnLabel(colId) }}
              </span>
              <div style="display: flex; align-items: center; gap: 2px;">
                <button
                  type="button"
                  :disabled="sIdx === 0"
                  @click="moveSelectedColUp(sIdx)"
                  title="Di chuyển lên trước"
                  style="background: transparent; border: none; color: #475569; cursor: pointer; padding: 2px 4px;"
                  :style="sIdx === 0 ? 'opacity: 0.25; cursor: not-allowed;' : ''"
                >
                  <i class="pi pi-arrow-up" style="font-size: 0.7rem;"></i>
                </button>
                <button
                  type="button"
                  :disabled="sIdx === selectedColIds.length - 1"
                  @click="moveSelectedColDown(sIdx)"
                  title="Di chuyển xuống sau"
                  style="background: transparent; border: none; color: #475569; cursor: pointer; padding: 2px 4px;"
                  :style="sIdx === selectedColIds.length - 1 ? 'opacity: 0.25; cursor: not-allowed;' : ''"
                >
                  <i class="pi pi-arrow-down" style="font-size: 0.7rem;"></i>
                </button>
                <button
                  type="button"
                  @click="removeSelectedCol(sIdx)"
                  title="Bỏ chọn cột này"
                  style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 2px 4px;"
                >
                  <i class="pi pi-times" style="font-size: 0.7rem;"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Khôi phục Mặc định" severity="secondary" text size="small" @click="resetDefaultColumns" />
        <Button label="Đóng & Áp dụng" severity="primary" size="small" @click="saveColumnSelection" />
      </template>
    </Dialog>

    <!-- Dedicated Add / Edit Trip Dialog -->
    <Dialog
      v-model:visible="isTripFormDialogOpen"
      modal
      :header="editingTripItem ? 'Chỉnh sửa Chuyến đi' : 'Thêm Chuyến đi Nước ngoài Mới'"
      :style="{ width: '680px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
        <!-- 1. Chọn đối tượng đi: Cán bộ hay Thân nhân -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
          <label style="font-size: 0.78rem; font-weight: 700; color: #475569; display: block; margin-bottom: 6px;">
            1. ĐỐI TƯỢNG ĐI NƯỚC NGOÀI:
          </label>
          <div style="display: flex; gap: 18px; align-items: center;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; font-weight: 600; color: #1e293b;">
              <input type="radio" value="personnel" v-model="tripTargetType" style="accent-color: #1e3a8a;" />
              <span>👤 Cán bộ (Cá nhân)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; font-weight: 600; color: #7c3aed;">
              <input type="radio" value="relative" v-model="tripTargetType" style="accent-color: #7c3aed;" />
              <span>👥 Thân nhân của Cán bộ</span>
            </label>
          </div>
        </div>

        <!-- 2. Chọn Cán bộ / Thân nhân cụ thể hoặc nhập CCCD -->
        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
            2. CHỌN {{ tripTargetType === 'personnel' ? 'CÁN BỘ' : 'THÂN NHÂN' }} LIÊN QUAN: <span style="color: red;">*</span>
          </label>
          <select v-if="tripTargetType === 'personnel'" v-model="selectedTargetKey" class="filter-select" style="width: 100%; font-size: 0.82rem;" @change="onTargetPersonChange">
            <option value="">-- Chọn Cán bộ từ danh sách --</option>
            <option v-for="p in personnelStore.personnelList" :key="p.id" :value="p.cccd || p.cccdparent || p.id">
              {{ p.name }} - {{ p.positionName || p.position || 'Cán bộ' }} (CCCD: {{ p.cccd || p.cccdparent || '-' }})
            </option>
          </select>

          <select v-else v-model="selectedTargetKey" class="filter-select" style="width: 100%; font-size: 0.82rem;" @change="onTargetRelativeChange">
            <option value="">-- Chọn Thân nhân từ danh sách --</option>
            <option v-for="r in personnelStore.relativesList" :key="r.id || r.code" :value="r.cccd || r.cccdthannhan || r.code || r.id">
              {{ r.relativeName || r.name }} ({{ r.relationshipName }} của {{ r.parentName || r.parentPersonnelName }}) - CCCD: {{ r.cccd || r.cccdthannhan || '-' }}
            </option>
          </select>
        </div>

        <!-- Thẻ tóm tắt thông tin đối tượng được chọn (Matching upload style) -->
        <div v-if="selectedTargetSummary" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 8px; padding: 10px 14px;">
          <div style="font-size: 0.7rem; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
            {{ tripTargetType === 'personnel' ? 'Cán bộ liên quan' : 'Thân nhân liên quan' }}
          </div>
          <div style="font-size: 0.95rem; font-weight: 700; color: #0f172a;">
            {{ selectedTargetSummary.name }}
          </div>
          <div style="font-size: 0.8rem; color: #334155; margin: 2px 0;">
            {{ selectedTargetSummary.sub }}
          </div>
          <div style="font-size: 0.74rem; color: #64748b; font-family: monospace;">
            CCCD: <strong>{{ selectedTargetSummary.cccd }}</strong>
          </div>
        </div>

        <!-- 3. Thông tin chuyến đi -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
              Quốc gia / Nơi đến: <span style="color: red;">*</span>
            </label>
            <InputText v-model="tripFormData.countryName" placeholder="VD: Nhật Bản, Hoa Kỳ, Pháp..." size="small" style="width: 100%; font-size: 0.82rem;" />
          </div>

          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
              Nguồn kinh phí:
            </label>
            <select v-model="tripFormData.fundingName" class="filter-select" style="width: 100%; font-size: 0.82rem;">
              <option value="Ngân sách nhà nước">Ngân sách nhà nước</option>
              <option value="Tài trợ">Tài trợ</option>
              <option value="Tự túc">Tự túc</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
              Ngày xuất cảnh (Ngày đi):
            </label>
            <InputText v-model="tripFormData.departureDate" placeholder="DD/MM/YYYY" size="small" style="width: 100%; font-size: 0.82rem;" />
          </div>

          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
              Ngày nhập cảnh (Ngày về thực tế / dự kiến):
            </label>
            <InputText v-model="tripFormData.arrivalDate" placeholder="DD/MM/YYYY" size="small" style="width: 100%; font-size: 0.82rem;" />
          </div>

          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
              Số quyết định duyệt:
            </label>
            <InputText v-model="tripFormData.decisionNumber" placeholder="VD: 1234/QĐ-CATP" size="small" style="width: 100%; font-size: 0.82rem;" />
          </div>

          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
              Số Hộ chiếu:
            </label>
            <InputText v-model="tripFormData.passportNumber" placeholder="VD: B1234567" size="small" style="width: 100%; font-size: 0.82rem;" />
          </div>
        </div>

        <div>
          <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
            Mục đích chuyến đi:
          </label>
          <InputText v-model="tripFormData.purpose" placeholder="VD: Công tác, Hội thảo, Du lịch, Thăm thân nhân..." size="small" style="width: 100%; font-size: 0.82rem;" />
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isTripFormDialogOpen = false" />
        <Button label="Lưu Chuyến đi" severity="success" size="small" icon="pi pi-check" @click="saveTripForm" />
      </template>
    </Dialog>

    <PersonnelDialog
      v-model="isPersonnelDialogOpen"
      :personData="activePersonData"
      :initialTab="dialogInitialTab"
      :targetRelativeCode="dialogTargetRelativeCode"
      @saved="handlePersonnelSaved"
    />

    <!-- Advanced Word / PDF Export Dialog -->
    <AdvancedDocxExportDialog
      v-model="isExportDocxDialogOpen"
      :selectedPersonnel="selectedPersonnelForExport"
      :allPersonnel="allPersonnelForExport"
    />

    <!-- Name Column Config Popover -->
    <div v-if="showNameColConfig" class="name-col-config-overlay" @click.self="showNameColConfig = false">
      <div class="name-col-config-panel" :style="nameColConfigPos">
        <div style="font-weight: 600; font-size: 0.82rem; margin-bottom: 8px; color: #1e293b;">Tùy chỉnh cột "Thông tin cán bộ"</div>
        <label v-for="opt in nameColFieldOptions" :key="opt.key" class="name-col-opt">
          <input type="checkbox" :checked="nameColFields[opt.key]" @change="toggleNameColField(opt.key)" />
          <span>{{ opt.label }}</span>
        </label>
      </div>
    </div>

    <!-- Dialog Thêm Cột Mới chuẩn Lark Base -->
    <AddColumnDialog
      v-model:visible="isAddColumnDialogOpen"
      :tableSource="currentDashboardConfig.source || 'trips'"
      @save="saveNewColumn"
    />
  </div>

    <!-- Header Cột thông minh Context Menu Popover -->
    <ColumnHeaderMenu
      v-model:visible="isChildColMenuVisible"
      :column="selectedChildMenuCol"
      :position="childColMenuPosition"
      :nameColFields="nameColFields"
      @rename-column="onChildRenameColumn"
      @change-format="onChildChangeColumnFormat"
      @change-options="onChildChangeColumnOptions"
      @change-width="onChildChangeColumnWidth"
      @change-form-width="onChildChangeColumnFormWidth"
      @change-required="onChildChangeColumnRequired"
      @change-name-col-field="toggleNameColField"
      @delete-column="onChildDeleteColumnFromTable"
      @hide-column="onChildHideColumn"
      @filter-column="onChildFilterByColumn"
    />

</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { usePersonnelStore } from '@/stores/personnel';
import { useAuthStore } from '@/stores/auth';
import { getAppSettings, saveAppSettings } from '@/api/settings';
import PersonnelDialog from '@/components/personnel/PersonnelDialog.vue';
import AdvancedDocxExportDialog from '@/components/common/AdvancedDocxExportDialog.vue';
import ColumnSelector from '@/components/common/ColumnSelector.vue';
import ColumnHeaderMenu from '@/components/common/ColumnHeaderMenu.vue';
import AddColumnDialog from '@/components/common/AddColumnDialog.vue';

import { computeColumnIndexMap, formatDate, parseDateObj, parseDateValue, computePresenceStatus, computeOverdueStatus, computeTripPresence, evaluateFormula, evaluateLookup, evaluateRollup, computeDepartBeforeDecision, formatGenericCellValue, resolvePresence, isPresenceField, resolveVirtualColumnValue, getPresenceBadge, generateSlug, formatOptions } from '@/utils/formatters';
import { buildTopicSourceList, computeMetricCardCount, isSameCard, matchCardCondition as matchSharedCardCondition, isCardAllType as isSharedCardAllType, checkConditionMatch, normalizeFieldValueToText, extractRowFieldValue } from '@/utils/dashboardMetrics';
import { getFileUrl } from '@/api/files';
import * as XLSX from 'xlsx';

const route = useRoute();
const router = useRouter();
const personnelStore = usePersonnelStore();
const authStore = useAuthStore();
const isExportDocxDialogOpen = ref(false);

// ===== Name Column Config =====
const NAME_COL_IDS = new Set(['_parentPersonnelName']);
const isNameColumn = (colId) => NAME_COL_IDS.has(colId);

const nameColFieldOptions = [
  { key: 'name', label: 'Họ và tên Cán bộ' },
  { key: 'cccdCB', label: 'CCCD Cán bộ' },
  { key: 'position', label: 'Chức vụ Cán bộ' },
  { key: 'department', label: 'Đơn vị công tác' },
];

const DEFAULT_NAME_COL_FIELDS = { name: true, cccdCB: true, position: true, department: true };
const nameColFields = ref({ ...DEFAULT_NAME_COL_FIELDS });
const showNameColConfig = ref(false);
const nameColConfigPos = ref({});

const toggleNameColConfig = (event) => {
  if (showNameColConfig.value) {
    showNameColConfig.value = false;
    return;
  }
  const rect = event.target.getBoundingClientRect();
  nameColConfigPos.value = { position: 'fixed', top: `${rect.bottom + 4}px`, left: `${rect.left}px`, zIndex: 9999 };
  showNameColConfig.value = true;
};

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

const showColIndex = ref(localStorage.getItem('app_show_col_index') !== 'false');
const onColIndexChanged = (e) => {
  showColIndex.value = Boolean(e.detail);
};

const customParentLabels = ref({});
const getParentColLabel = (defaultLabel) => {
  const custom = customParentLabels.value[topicId.value] || localStorage.getItem('parent_col_label_' + topicId.value);
  return custom || defaultLabel;
};

const loadCustomParentLabel = async () => {
  try {
    const saved = await getAppSettings('parent_col_label_' + topicId.value);
    if (saved) {
      customParentLabels.value = { ...customParentLabels.value, [topicId.value]: saved };
    }
  } catch (e) {}
};
// ===== Lark-Style Add Column State & Handlers =====
const isAddColumnDialogOpen = ref(false);
const isSavingNewCol = ref(false);
const newColForm = ref({
  label: '',
  id: '',
  format: 'text',
  tableWidth: 160,
  options: '',
  isSingleSelect: false,
  formulaType: 'presence_status',
  formulaDepartureCol: '',
  formulaArrivalCol: '',
  formulaApprovedArrivalCol: '',
  formulaCountryCol: '',
  formulaColA: '',
  formulaColB: '',
  formulaColCondition: '',
  formulaColCheck: '',
  formulaDecisionDateCol: '',
  formulaLabelWarning: '',
  formulaLabelEarly: '',
  formulaLabelLate: '',
  formulaLabelOnTime: '',
  formulaLabelDomestic: '',
  formulaLabelAbroad: '',
  formulaLabelNotReturnedYet: '',
  formulaLabelOverdue: '',
  lookupTarget: 'personnel',
  lookupField: '',
  rollupTarget: 'trips',
  rollupField: '',
  rollupFunction: 'count',
});

const availableColsForFormula = computed(() => {
  return (allAvailableColumnsList.value || []).filter(c => c.id && c.id !== 'stt' && c.format !== 'formula');
});

const availablePersonnelColsForLookup = computed(() => {
  const cols = [];
  (personnelStore.importMappingPersonnel || []).forEach(g => {
    (g.columns || []).forEach(c => {
      if (c.id && c.id !== 'stt') cols.push({ id: c.id, label: c.label || c.id });
    });
  });
  return cols;
});

const availableTripColsForRollup = computed(() => {
  const cols = [];
  (personnelStore.importMappingTrips || []).forEach(g => {
    (g.columns || []).forEach(c => {
      if (c.id && c.id !== 'stt') cols.push({ id: c.id, label: c.label || c.id });
    });
  });
  return cols;
});

const availableRelativeColsForRollup = computed(() => {
  const cols = [];
  (personnelStore.importMappingRelative || []).forEach(g => {
    (g.columns || []).forEach(c => {
      if (c.id && c.id !== 'stt') cols.push({ id: c.id, label: c.label || c.id });
    });
  });
  return cols;
});

const openAddColumnDialog = () => {
  isAddColumnDialogOpen.value = true;
};

const saveNewColumn = async (colPayload) => {
  if (!colPayload?.label?.trim()) {
    alert('Vui lòng nhập Tên cột!');
    return;
  }
  if (!colPayload?.id?.trim()) {
    alert('Vui lòng nhập Mã định danh cột (Field ID)!');
    return;
  }

  const src = currentDashboardConfig.value?.source || 'trips';
  isSavingNewCol.value = true;
  try {
    if (src === 'blank') {
      const tid = topicId.value;
      const cDash = customDashboards.value.find((d) => d.id === tid);
      if (cDash) {
        if (!Array.isArray(cDash.customColumns) || cDash.customColumns.length === 0) {
          cDash.customColumns = [
            { id: 'title', label: 'Tiêu đề / Tên', format: 'text', width: '240px' },
            { id: 'status', label: 'Trạng thái', format: 'dropdown', options: ['Mới tạo', 'Đang xử lý', 'Hoàn thành'], width: '160px' },
            { id: 'notes', label: 'Ghi chú', format: 'text', width: '260px' },
            { id: 'createdAt', label: 'Ngày tạo', format: 'date', width: '140px' },
          ];
        }
        if (cDash.customColumns.some((c) => c.id === colPayload.id.trim())) {
          alert(`Mã cột "${colPayload.id.trim()}" đã tồn tại trong bảng này! Vui lòng chọn mã khác.`);
          return;
        }
        cDash.customColumns.push(colPayload);
        try {
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
        } catch (e) {}
      }
      if (!selectedColIds.value.includes(colPayload.id)) {
        selectedColIds.value.push(colPayload.id);
      }
      await onColumnsChange(selectedColIds.value);
      isAddColumnDialogOpen.value = false;
      alert(`Đã tạo thành công cột "${colPayload.label}" trên bảng!`);
      return;
    }

    let mappingKey = 'import_mapping_trips';
    let mappingRef = personnelStore.importMappingTrips;
    if (src === 'relatives') {
      mappingKey = 'import_mapping_relative';
      mappingRef = personnelStore.importMappingRelative;
    } else if (src === 'personnel') {
      mappingKey = 'import_mapping_personnel';
      mappingRef = personnelStore.importMappingPersonnel;
    }

    // Kiểm tra trùng ID cột
    const exists = (mappingRef || []).some((g) => (g.columns || []).some((c) => c.id === colPayload.id.trim()));
    if (exists) {
      alert(`Mã cột "${colPayload.id.trim()}" đã tồn tại trong bảng này! Vui lòng chọn mã khác.`);
      return;
    }

    if (!mappingRef || mappingRef.length === 0) {
      mappingRef = [{ group: 'Thông tin bổ sung', columns: [] }];
      if (src === 'trips') personnelStore.importMappingTrips = mappingRef;
      else if (src === 'relatives') personnelStore.importMappingRelative = mappingRef;
      else personnelStore.importMappingPersonnel = mappingRef;
    }

    // Thêm cột vào nhóm đầu tiên của mapping
    mappingRef[0].columns.push(colPayload);

    // Lưu cấu hình mapping xuống DB
    await saveAppSettings(mappingKey, mappingRef);

    // Tự động kích hoạt hiển thị cột mới trên bảng hiện tại
    if (!selectedColIds.value.includes(colPayload.id)) {
      selectedColIds.value.push(colPayload.id);
    }
    await onColumnsChange(selectedColIds.value);

    isAddColumnDialogOpen.value = false;
    alert(`Đã tạo thành công cột "${colPayload.label}" trên bảng!`);
  } catch (e) {
    console.error('Lỗi khi thêm cột mới:', e);
    alert('Lỗi khi lưu cột mới: ' + (e.message || e));
  } finally {
    isSavingNewCol.value = false;
  }
};
// ===== End Lark-Style Add Column State & Handlers =====

const openAdvancedDocxExport = () => {
  isExportDocxDialogOpen.value = true;
};

const resolvePersonFromItem = (item) => {
  if (!item) return null;
  if (item.rawPerson && item.rawPerson.id) return item.rawPerson;
  if (item.personnelId) {
    const found = (personnelStore.personnelList || []).find((p) => p.id === item.personnelId);
    if (found) return found;
  }
  if (item.personnelCode) {
    const found = (personnelStore.personnelList || []).find((p) => p.code === item.personnelCode);
    if (found) return found;
  }
  const cccd = item.parentCccd || item.cccdparent || (!item.isRelative ? item.cccd : '');
  if (cccd) {
    const found = personnelStore.findPersonByCccd(cccd);
    if (found) return found;
  }
  if (item.id && !item.isRelative) {
    const found = (personnelStore.personnelList || []).find((p) => p.id === item.id);
    if (found) return found;
  }
  return null;
};

const selectedPersonnelForExport = computed(() => {
  if (selectedTrips.value && selectedTrips.value.length > 0) {
    const list = [];
    const seenIds = new Set();
    selectedTrips.value.forEach((t) => {
      const p = resolvePersonFromItem(t);
      if (p && p.id && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        list.push(p);
      }
    });
    return list;
  }
  return [];
});

const allPersonnelForExport = computed(() => {
  const rows = filteredList.value || [];
  if (rows.length > 0) {
    const list = [];
    const seenIds = new Set();
    rows.forEach((t) => {
      const p = resolvePersonFromItem(t);
      if (p && p.id && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        list.push(p);
      }
    });
    if (list.length > 0) return list;
  }
  return personnelStore.personnelList || [];
});

// Dynamic Dashboard Topic State
const getInitialCustomDashboards = () => {
  try {
    const local = localStorage.getItem('custom_dashboards_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
};
const customDashboards = ref(getInitialCustomDashboards());

const topicId = computed(() => {
  return route.params.id || (route.path === '/trips' ? 'trips' : 'trips');
});
const currentDashboardId = computed(() => topicId.value);

const currentDashboardConfig = computed(() => {
  const found = customDashboards.value.find((d) => d.id === currentDashboardId.value);
  if (found) return found;
  if (currentDashboardId.value === 'trips' || route.path === '/trips') {
    return {
      id: 'trips',
      code: 'CD-03',
      title: 'Danh sách Chuyến đi',
      source: 'trips',
      icon: 'pi-send',
      metricCards: [
        { id: 'all', label: 'Toàn bộ', condition: 'all', color: 'blue' },
        { id: 'completed', label: 'Đã về nước', condition: 'completed', color: 'green' },
        { id: 'abroad', label: 'Đang ở nước ngoài', condition: 'abroad', color: 'amber' },
        { id: 'overdue', label: 'Quá hạn chưa về', condition: 'overdue', color: 'red' },
      ],
    };
  }
  return {
    id: currentDashboardId.value,
    code: '',
    title: '',
    source: null,
    isPending: true,
    metricCards: [],
  };
});

const activeMetricCards = computed(() => {
  if (currentDashboardConfig.value.metricCards && currentDashboardConfig.value.metricCards.length > 0) {
    return currentDashboardConfig.value.metricCards;
  }
  return [
    { id: 'all', label: 'Toàn bộ', condition: 'all', color: 'blue' },
    { id: 'completed', label: 'Đã về nước', condition: 'completed', color: 'green' },
    { id: 'abroad', label: 'Đang ở nước ngoài', condition: 'abroad', color: 'amber' },
    { id: 'overdue', label: 'Quá hạn chưa về', condition: 'overdue', color: 'red' },
  ];
});

// Sử dụng resolvePresence làm chuẩn chung từ formatters.js
const getTripPresence = (t) => resolvePresence(t);

// Robust funding extractor across all database keys/aliases
const getFundingValue = (item) => {
  if (!item) return '-';
  const val = (
    item.fundingName ||
    item.funding ||
    item.nguon_kinh_phi ||
    item.kinh_phi ||
    item.nguonKinhPhi ||
    item.kinhPhi ||
    item.rawTrip?.fundingName ||
    item.rawTrip?.funding ||
    item.rawTrip?.nguon_kinh_phi ||
    item.rawTrip?.kinh_phi ||
    item.custom_data?.fundingName ||
    item.custom_data?.funding ||
    item.custom_data?.nguon_kinh_phi ||
    item.custom_data?.kinh_phi ||
    ''
  );
  return (val && String(val).trim() !== '' && String(val).trim() !== '-') ? String(val).trim() : '-';
};

const isCardHidden = (card) => {
  if (!card) return false;
  if (card.hidden === true) return true;
  if (card.widthPercent === 0 || card.widthPercent === '0') return true;
  return false;
};

const getCardWidthStyle = (card) => {
  if (isCardHidden(card)) return '0px';
  const wp = Number(card.widthPercent);
  if (!wp || isNaN(wp)) return 'auto';
  if (wp === 100) return '100%';
  if (wp === 50) return 'calc(50% - 6px)';
  if (wp === 33) return 'calc(33.333% - 8px)';
  if (wp === 25) return 'calc(25% - 9px)';
  if (wp === 20) return 'calc(20% - 10px)';
  if (wp === 16.66 || wp === 16 || Math.abs(wp - 16.66) < 1) return 'calc(16.666% - 10px)';
  return 'auto';
};

const getCardFlexStyle = (card) => {
  if (isCardHidden(card)) return '0 0 0px';
  const wp = Number(card.widthPercent);
  if (!wp || isNaN(wp)) return '1 1 auto';
  if (wp === 100) return '1 1 100%';
  if (wp === 50) return '1 1 calc(50% - 6px)';
  if (wp === 33) return '1 1 calc(33.333% - 8px)';
  if (wp === 25) return '1 1 calc(25% - 9px)';
  if (wp === 20) return '1 1 calc(20% - 10px)';
  if (wp === 16.66 || wp === 16 || Math.abs(wp - 16.66) < 1) return '1 1 calc(16.666% - 10px)';
  return '1 1 auto';
};

const getCardMinWidthStyle = (card) => {
  const wp = Number(card.widthPercent);
  if (wp === 100) return '100%';
  if (wp === 50) return '280px';
  if (wp === 33) return '220px';
  if (wp === 25) return '180px';
  if (wp === 20) return '150px';
  if (wp === 16.66 || wp === 16 || Math.abs(wp - 16.66) < 1) return '130px';
  return '160px';
};


const matchCardCondition = (item, card) => matchSharedCardCondition(item, card, personnelStore);
const isCardAllType = (card) => isSharedCardAllType(card);

// Thẻ đầu tiên đang hiển thị (bỏ qua các thẻ bị ẩn 0%)
const firstVisibleCardIdx = computed(() => {
  const cards = activeMetricCards.value || [];
  const idx = cards.findIndex((c) => !isCardHidden(c));
  return idx >= 0 ? idx : 0;
});

const firstVisibleCard = computed(() => {
  const cards = activeMetricCards.value || [];
  return cards[firstVisibleCardIdx.value] || cards[0] || null;
});

// Tập dữ liệu cơ sở của Chuyên đề (Baseline List dựa trên thẻ hiển thị đầu tiên)
const topicBaselineList = computed(() => {
  const fullList = currentSourceList.value || [];
  const firstCard = firstVisibleCard.value;
  if (firstCard && !isSharedCardAllType(firstCard)) {
    return fullList.filter((item) => matchSharedCardCondition(item, firstCard, personnelStore));
  }
  return fullList;
});

const getCardMetricValue = (card) => {
  return computeMetricCardCount(card, currentSourceList.value, firstVisibleCard.value, personnelStore);
};

const activeMetricCardIdx = ref(-1); // -1: xem toàn bộ cơ sở chuyên đề (Thẻ hiển thị đầu tiên)

const activeMetricCardId = computed({
  get: () => {
    if (activeMetricCardIdx.value === -1 || activeMetricCardIdx.value === firstVisibleCardIdx.value) return 'all';
    const c = activeMetricCards.value[activeMetricCardIdx.value];
    return c?.id && c.id !== 'all' ? c.id : `card_${activeMetricCardIdx.value}`;
  },
  set: (val) => {
    if (!val || val === 'all') {
      activeMetricCardIdx.value = -1;
      return;
    }
    const idx = activeMetricCards.value.findIndex((c, i) => (c.id === val && c.id !== 'all') || c.label === val || `card_${i}` === val || (typeof val === 'string' && (val.endsWith(`_${i}`) || val === `card_${topicId.value}_${i}`)));
    activeMetricCardIdx.value = idx >= 0 ? idx : -1;
  },
});

const isCardActive = (card, cIdx) => {
  if (!card || isCardHidden(card)) return false;
  if (activeMetricCardIdx.value <= 0) {
    return cIdx === firstVisibleCardIdx.value;
  }
  return activeMetricCardIdx.value === cIdx;
};

const clearChartFilter = () => {
  if (route.query?.country || route.query?.funding || route.query?.department || route.query?.filterField || route.query?.filterValue || route.query?.status || route.query?.year) {
    const newQuery = { ...route.query };
    delete newQuery.country;
    delete newQuery.funding;
    delete newQuery.department;
    delete newQuery.filterField;
    delete newQuery.filterValue;
    delete newQuery.status;
    delete newQuery.year;
    router.replace({ path: route.path, query: newQuery });
  }
  selectedCountry.value = '';
  selectedFunding.value = '';
  selectedDepartment.value = '';
  customFilterField.value = '';
  customFilterValue.value = '';
};

const hasDrillDownFilter = computed(() => {
  return !!(
    route.query?.card ||
    route.query?.title ||
    route.query?.country ||
    route.query?.funding ||
    route.query?.department ||
    (route.query?.filterField && route.query?.filterValue) ||
    customFilterField.value ||
    selectedCountry.value ||
    selectedFunding.value ||
    selectedDepartment.value
  );
});

const hasActiveChartFilter = hasDrillDownFilter;

const drillDownFilterLabel = computed(() => {
  if (route.query?.title) return route.query.title;
  const parts = [];
  if (route.query?.card) {
    const cardId = String(route.query.card);
    const foundCard = activeMetricCards.value?.find((c) => c.id === cardId || c.label === cardId);
    if (foundCard) parts.push(foundCard.label);
    else parts.push(cardId);
  }
  if (route.query?.country || selectedCountry.value) {
    parts.push(`Quốc gia: "${route.query?.country || selectedCountry.value}"`);
  }
  if (route.query?.funding || selectedFunding.value) {
    parts.push(`Kinh phí: "${route.query?.funding || selectedFunding.value}"`);
  }
  if (route.query?.department || selectedDepartment.value) {
    parts.push(`Đơn vị: "${route.query?.department || selectedDepartment.value}"`);
  }
  const fField = route.query?.filterField || customFilterField.value;
  const fVal = route.query?.filterValue || customFilterValue.value;
  if (fField && fVal) {
    const colName = getColumnLabel(fField) || fField;
    parts.push(`${colName}: "${fVal}"`);
  }
  return parts.join(', ') || 'Bộ lọc tùy chọn';
});

const activeChartFilterLabel = drillDownFilterLabel;

const clearAllDrillDownFilters = () => {
  clearChartFilter();
  activeMetricCardIdx.value = -1;
  activeMetricCardId.value = '';
  router.replace({ path: route.path, query: {} });
};

const toggleMetricCardFilter = (card, cIdx) => {
  // Luôn giải phóng bộ lọc biểu đồ khi bấm vào thẻ thống kê để không bị kẹt bảng
  clearChartFilter();

  // Thẻ hiển thị đầu tiên là baseline của chuyên đề: click vào sẽ đưa về trạng thái xem toàn bộ baseline (-1)
  if (cIdx === firstVisibleCardIdx.value || cIdx === 0) {
    activeMetricCardIdx.value = -1;
    statusFilter.value = 'all';
    triggerAutoSaveFilter();
    return;
  }

  // Thẻ con khác: toggle bật / tắt theo đúng vị trí của thẻ
  if (activeMetricCardIdx.value === cIdx) {
    activeMetricCardIdx.value = -1;
  } else {
    activeMetricCardIdx.value = cIdx;
  }
  triggerAutoSaveFilter();
};

const activeMetricCard = computed(() => {
  const currentIdx = (activeMetricCardIdx.value === -1 || activeMetricCardIdx.value === 0)
    ? firstVisibleCardIdx.value
    : activeMetricCardIdx.value;
  const cards = activeMetricCards.value || [];
  return cards[currentIdx] || null;
});

const activeCardColLabel = computed(() => {
  if (!activeMetricCard.value) return '';
  const card = activeMetricCard.value;
  const rawConds = Array.isArray(card.conditions) && card.conditions.length > 0
    ? card.conditions
    : (card.field ? [{ field: card.field }] : []);
  const activeConds = rawConds.filter((c) => c && c.field && String(c.field).trim() !== '');

  if (activeConds.length > 0) {
    return activeConds.map((c) => getColumnLabel(c.field) || c.field).join(' & ');
  }
  if (card.condition === 'overdue' || card.condition === 'isOverdue') {
    return 'Trạng thái Quá hạn';
  }
  if (card.condition === 'abroad' || card.condition === 'completed') {
    return 'Trạng thái Hiện diện';
  }
  return card.label || 'Giá trị lọc';
});

const isActiveCardPresenceCol = computed(() => {
  if (!activeMetricCard.value) return false;
  const card = activeMetricCard.value;
  if (card.condition === 'overdue' || card.condition === 'abroad' || card.condition === 'completed') return true;
  const rawConds = Array.isArray(card.conditions) && card.conditions.length > 0
    ? card.conditions
    : (card.field ? [{ field: card.field }] : []);
  return rawConds.some((c) => isPresenceField(c?.field));
});

const activeCardSingleCol = computed(() => {
  if (!activeMetricCard.value) return null;
  const card = activeMetricCard.value;
  const rawConds = Array.isArray(card.conditions) && card.conditions.length > 0
    ? card.conditions
    : (card.field ? [{ field: card.field }] : []);
  const activeConds = rawConds.filter((c) => c && c.field && String(c.field).trim() !== '');
  if (activeConds.length === 1) {
    const fieldId = activeConds[0].field;
    const found = (allAvailableColumnsList.value || []).find((c) => c.id === fieldId);
    if (found) return found;
    const allDefs = [
      ...(personnelStore.importMappingTrips || []),
      ...(personnelStore.importMappingPersonnel || []),
      ...(personnelStore.importMappingRelative || []),
    ].flatMap((g) => g.columns || []);
    const def = allDefs.find((c) => c && c.id === fieldId);
    return def ? { ...def, id: fieldId } : { id: fieldId };
  }
  return null;
});

const getActiveCardCellValue = (row) => {
  if (!row || !activeMetricCard.value) return '-';
  const card = activeMetricCard.value;
  const rawConds = Array.isArray(card.conditions) && card.conditions.length > 0
    ? card.conditions
    : (card.field ? [{ field: card.field }] : []);
  const activeConds = rawConds.filter((c) => c && c.field && String(c.field).trim() !== '');

  if (activeConds.length > 0) {
    const vals = activeConds.map((c) => {
      const v = getCellValue(row, c.field);
      return (v !== undefined && v !== null && v !== '') ? String(v).trim() : '-';
    });
    return vals.join(' | ');
  }
  if (card.condition === 'overdue') {
    const p = resolvePresence(row);
    return p.isOverdue ? `Quá hạn (${p.overdueDays} ngày)` : (row.overdueStatus || '-');
  }
  if (card.condition === 'abroad') {
    const p = resolvePresence(row);
    return p.isAbroad ? (p.label || 'Đang ở nước ngoài') : '-';
  }
  if (card.condition === 'completed') {
    const p = resolvePresence(row);
    return p.label || 'Đã về nước';
  }
  return '-';
};

const getPersonInfo = (data) => {
  if (!data) return { name: '-', cccdCB: '', position: '', department: '' };

  const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
  const posField = personnelStore.getPersonnelPositionField ? personnelStore.getPersonnelPositionField() : 'position';
  const deptField = personnelStore.getPersonnelDepartmentField ? personnelStore.getPersonnelDepartmentField() : 'departmentName';

  const isValidId = (val) => val && String(val).trim() !== '' && String(val).trim() !== '-' && !String(val).startsWith('p_') && !String(val).startsWith('cd_') && !String(val).startsWith('rel_') && !String(val).startsWith('trip_');

  // Lấy thông tin Cán bộ liên quan (hoặc cán bộ chính)
  const parentPerson = data.rawPerson || (data.cccdparent ? personnelStore.findPersonByCccd(data.cccdparent) : null);
  const cbName = parentPerson?.name || data.parentPersonnelName || data.parentName || (!data.isRelative ? (data.personnelName || data.name) : '') || '-';
  const cbCccd = parentPerson?.[pKeyField] || parentPerson?.cccd || parentPerson?.cccdparent || data.parentCccd || data.cccdparent || (!data.isRelative ? (data[pKeyField] || data.cccd) : '') || '';
  const cbPos = parentPerson?.[posField] || parentPerson?.positionName || parentPerson?.position || data.parentPosition || (!data.isRelative ? (data[posField] || data.positionName || data.position) : '') || '';
  const cbDept = parentPerson?.[deptField] || parentPerson?.departmentName || (parentPerson?.departmentId ? personnelStore.getDepartmentName(parentPerson.departmentId) : '') || (!data.isRelative ? (data[deptField] || data.departmentName) : '') || '';

  return {
    name: cbName,
    cccdCB: isValidId(cbCccd) ? `CCCD-CB: ${String(cbCccd).trim()}` : '',
    position: cbPos && String(cbPos).trim() !== '-' && String(cbPos).trim() !== 'Chưa phân bổ' ? String(cbPos).trim() : '',
    department: cbDept && String(cbDept).trim() !== '-' ? String(cbDept).trim() : '',
  };
};

const getCardDisplayLabel = (card) => {
  if (!card) return '';
  if (card.label && String(card.label).trim() !== '') {
    return String(card.label).trim();
  }
  // Nếu không điền gì / xóa tiêu đề -> lấy theo tên cột so sánh
  if (card.field) {
    return getColumnLabel(card.field) || card.field;
  }
  if (card.condition === 'overdue' || card.condition === 'isOverdue') return 'Quá hạn chưa về';
  if (card.condition === 'abroad') return 'Đang ở nước ngoài';
  if (card.condition === 'completed') return 'Đã về nước';
  if (card.condition === 'all') return 'Toàn bộ';
  return 'Chưa đặt tên';
};



// Filters
const searchQuery = ref('');
const statusFilter = ref('all'); // all, completed, abroad, overdue
const timeFilterYear = ref('all');
const selectedCountry = ref('');
const selectedDepartment = ref('');
const selectedFunding = ref('');
const customFilterField = ref('');
const customFilterValue = ref('');

// Selection & Sorting & Pagination
const selectedTrips = ref([]);
const selectedTripKeys = computed(() => (selectedTrips.value || []).map((t) => t.uniqueKey || t.id));
const sortKey = ref('departureDate');
const sortOrder = ref(-1); // -1: desc, 1: asc
const dtFirst = ref(0);
const currentPage = ref(1);
const pageSize = ref(30);


// ===== TEABLE / LARK BASE INTERACTIVE GRID STATE & METHODS =====
const isChildColMenuVisible = ref(false);
const selectedChildMenuCol = ref(null);
const childColMenuPosition = ref({ x: 0, y: 0 });

const openChildColMenu = (event, col) => {
  const rect = event.currentTarget.getBoundingClientRect();
  childColMenuPosition.value = {
    x: Math.min(rect.left, window.innerWidth - 300),
    y: rect.bottom + 4,
  };
  selectedChildMenuCol.value = col;
  isChildColMenuVisible.value = true;
};

const handleChildColMenuFromSelector = ({ event, col }) => {
  openChildColMenu(event, col);
};

const getTargetMappingRef = () => {
  const src = currentDashboardConfig.value?.source || 'trips';
  if (src === 'blank') {
    const tid = topicId.value;
    const cDash = customDashboards.value.find((d) => d.id === tid);
    return { key: 'custom_dashboards_config', mapping: [{ group: 'Cột bảng', columns: cDash?.customColumns || [] }], isBlank: true, cDash };
  }
  if (src === 'relatives') return { key: 'import_mapping_relative', mapping: personnelStore.importMappingRelative };
  if (src === 'personnel') return { key: 'import_mapping_personnel', mapping: personnelStore.importMappingPersonnel };
  return { key: 'import_mapping_trips', mapping: personnelStore.importMappingTrips };
};

const onChildRenameColumn = async ({ colId, newLabel }) => {
  if (colId === '_parentPersonnelName') {
    customParentLabels.value = { ...customParentLabels.value, [topicId.value]: newLabel };
    try {
      localStorage.setItem('parent_col_label_' + topicId.value, newLabel);
      await saveAppSettings('parent_col_label_' + topicId.value, newLabel);
    } catch (e) {}
    return;
  }
  const { key, mapping, isBlank, cDash } = getTargetMappingRef();
  if (isBlank && cDash) {
    const col = (cDash.customColumns || []).find((c) => c.id === colId);
    if (col) {
      col.label = newLabel;
      try {
        localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
        await saveAppSettings('custom_dashboards_config', customDashboards.value);
      } catch (e) {}
    }
    return;
  }
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
    await saveAppSettings(key, mapping);
  }
};

const onChildChangeColumnRequired = async ({ colId, required }) => {
  const { key, mapping, isBlank, cDash } = getTargetMappingRef();
  if (isBlank && cDash) {
    const col = (cDash.customColumns || []).find((c) => c.id === colId);
    if (col) {
      col.required = Boolean(required);
      try {
        localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
        await saveAppSettings('custom_dashboards_config', customDashboards.value);
      } catch (e) {}
    }
    return;
  }
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
    await saveAppSettings(key, mapping);
  }
};

const onChildChangeColumnFormat = async ({ colId, newFormat }) => {
  const { key, mapping } = getTargetMappingRef();
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
    await saveAppSettings(key, mapping);
  }
};

const onChildChangeColumnOptions = async ({ colId, options }) => {
  const { key, mapping } = getTargetMappingRef();
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
    await saveAppSettings(key, mapping);
  }
};

const onChildChangeColumnWidth = async ({ colId, width }) => {
  const { key, mapping } = getTargetMappingRef();
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
    await saveAppSettings(key, mapping);
  }
};

const onChildChangeColumnFormWidth = async ({ colId, formWidth }) => {
  const { key, mapping } = getTargetMappingRef();
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
    await saveAppSettings(key, mapping);
    alert('Đã cập nhật độ rộng form chi tiết cho cột này!');
  }
};

const onChildDeleteColumnFromTable = async (colId) => {
  const { key, mapping } = getTargetMappingRef();
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
    selectedColIds.value = selectedColIds.value.filter((id) => id !== colId);
    await onColumnsChange();
    await saveAppSettings(key, mapping);
    alert('Đã xóa cột thành công khỏi bảng!');
  }
};

const onChildHideColumn = async (colId) => {
  selectedColIds.value = selectedColIds.value.filter((id) => id !== colId);
  await onColumnsChange();
};

const onChildFilterByColumn = (col) => {
  searchQuery.value = col.label || col.id;
};

// INLINE EDITING FOR CHILD DASHBOARD
const editingChildCell = ref(null);

const startChildInlineEdit = (row, col) => {
  if (col.format === 'formula' || col.format === 'file' || col.format === 'text_file_loop' || col.format === 'checkbox_file_loop' || col.id === '_parentPersonnelName') {
    openPersonnelDetail(row);
    return;
  }
  const currentVal = row[col.id] ?? row.custom_data?.[col.id] ?? '';
  editingChildCell.value = {
    uniqueKey: row.uniqueKey,
    row: row,
    colId: col.id,
    col: col,
    value: currentVal !== '-' ? currentVal : '',
  };
};

const cancelChildInlineEdit = () => {
  editingChildCell.value = null;
};

const saveChildInlineEdit = async () => {
  if (!editingChildCell.value) return;
  const { row, colId, value } = editingChildCell.value;
  editingChildCell.value = null;

  const oldVal = row[colId] ?? row.custom_data?.[colId] ?? '';
  if (String(oldVal) === String(value)) return;

  try {
    row[colId] = value;
    if (!row.custom_data) row.custom_data = {};
    if (typeof row.custom_data === 'string') {
      try { row.custom_data = JSON.parse(row.custom_data); } catch (e) { row.custom_data = {}; }
    }
    row.custom_data[colId] = value;

    // Phân giải bản ghi cha (Cán bộ) để lưu
    const parent = row.rawPerson || (row.personnelId ? personnelStore.personnelList.find(p => p.id === row.personnelId) : null);
    if (parent) {
      // Cập nhật chuyến đi hoặc thân nhân tương ứng trong parent
      if (row.id && parent.trips) {
        const tIdx = parent.trips.findIndex(t => t.id === row.id || t.code === row.id);
        if (tIdx !== -1) {
          parent.trips[tIdx][colId] = value;
        }
      }
      await personnelStore.savePerson(parent);
    }
  } catch (err) {
    console.error('Lỗi cập nhật nhanh inline trên chuyên đề:', err);
  }
};

const getChildColDropdownOptions = (col) => {
  if (!col.options) return [];
  return String(col.options).split(',').map((s) => s.trim()).filter(Boolean);
};
// ===== END TEABLE / LARK BASE STATE & METHODS =====

const onRowClick = (event) => {
  if (currentDashboardConfig.value?.source === 'blank') {
    return;
  }
  if (event?.data) {
    openPersonnelDetail(event.data);
  }
};

// Dialogs & Menus
const isFilterMenuOpen = ref(false);
let filterMenuTimer = null;

const onMouseEnterFilter = () => {
  if (filterMenuTimer) clearTimeout(filterMenuTimer);
  isFilterMenuOpen.value = true;
};

const onMouseLeaveFilter = () => {
  filterMenuTimer = setTimeout(() => {
    isFilterMenuOpen.value = false;
  }, 250);
};

const isColumnPickerOpen = ref(false);
const columnSearchQuery = ref('');
const isPersonnelDialogOpen = ref(false);
const activePersonData = ref(null);
const dialogInitialTab = ref(0);
const dialogTargetRelativeCode = ref('');

const isTripFormDialogOpen = ref(false);
const editingTripItem = ref(null);
const tripTargetType = ref('personnel'); // 'personnel' | 'relative'
const selectedTargetKey = ref('');
const tripFormData = ref({
  countryName: '',
  departureDate: '',
  arrivalDate: '',
  decisionNumber: '',
  fundingName: 'Ngân sách nhà nước',
  purpose: '',
  passportNumber: '',
});

// Standard label mappings
const STANDARD_LABELS = {
  personnelName: 'Họ và tên',
  name: 'Họ và tên',
  ho_va_ten: 'Họ và tên',
  hoTen: 'Họ và tên',
  code: 'Mã số',
  personnelCode: 'Mã cán bộ',
  ma_can_bo: 'Mã cán bộ',
  position: 'Chức vụ',
  positionName: 'Chức vụ',
  chuc_vu: 'Chức vụ',
  chucVu: 'Chức vụ',
  departmentName: 'Đơn vị công tác',
  departmentId: 'Đơn vị công tác',
  don_vi_cong_tac: 'Đơn vị công tác',
  birthYear: 'Năm sinh',
  nam_sinh: 'Năm sinh',
  cccd: 'Số CCCD / Định danh',
  cccdparent: 'Số CCCD Cán bộ',
  countryName: 'Quốc gia / Nơi đến',
  quoc_gia_xuat_canh: 'Quốc gia / Nơi đến',
  country: 'Quốc gia',
  departureDate: 'Ngày xuất cảnh',
  ngay_xuat_canh: 'Ngày xuất cảnh',
  arrivalDate: 'Ngày nhập cảnh',
  ngay_nhap_canh: 'Ngày nhập cảnh',
  decisionNumber: 'Số quyết định',
  so_quyet_dinh: 'Số quyết định',
  decisionDate: 'Ngày quyết định',
  ngay_quyet_dinh: 'Ngày quyết định',
  fundingName: 'Nguồn kinh phí',
  nguon_kinh_phi: 'Nguồn kinh phí',
  purpose: 'Mục đích chuyến đi',
  muc_dich_xuat_canh: 'Mục đích chuyến đi',
  passportNumber: 'Số Hộ chiếu',
  so_ho_chieu: 'Số Hộ chiếu',
  presenceStatus: 'Trạng thái hiện diện',
  _presenceStatus: 'Trạng thái hiện diện',
  trang_thai_hien_dien: 'Trạng thái hiện diện',
  trangThaiHienDien: 'Trạng thái hiện diện',
  isRelative: 'Đối tượng',
  _doiTuong: 'Đối tượng',
  doi_tuong: 'Đối tượng',
  isOverdue: 'Quá hạn chưa về',
  relativeName: 'Họ tên Thân nhân',
  ho_ten_than_nhan: 'Họ tên Thân nhân',
  relationshipName: 'Quan hệ thân nhân',
  quan_he: 'Quan hệ thân nhân',
  parentName: 'Cán bộ liên quan',
  ho_ten_can_bo: 'Cán bộ liên quan',
  _parentPersonnelName: 'Thông tin cán bộ',
  _parentPersonnelCode: 'Mã cán bộ',
  _parentPosition: 'Chức vụ',
  _parentDepartment: 'Đơn vị công tác',
  _relativeName: 'Họ tên thân nhân',
  _relationshipName: 'Mối quan hệ',
};

const getColumnLabel = (colId) => {
  if (!colId) return '';

  // 1. Search in configured import mappings (User customizations from Cài đặt Cột - TOP PRIORITY)
  const allMaps = [
    ...(personnelStore.importMappingTrips || []),
    ...(personnelStore.importMappingPersonnel || []),
    ...(personnelStore.importMappingRelative || []),
  ];
  for (const g of allMaps) {
    for (const c of (g.columns || [])) {
      if (c.id === colId && c.label && String(c.label).trim() !== '' && c.label !== colId) {
        return c.label;
      }
    }
  }

  // 2. Fallback to standard hardcoded labels
  if (STANDARD_LABELS[colId]) return STANDARD_LABELS[colId];

  // 3. Default formatting
  return colId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const allAvailableColumnsList = computed(() => {
  const src = currentDashboardConfig.value?.source || 'trips';
  const seen = new Set();
  const rawList = [];

  if (src === 'blank') {
    const rawCustomCols = currentDashboardConfig.value?.customColumns || [];
    const defaultStarterCols = [
      { id: 'title', label: 'Tiêu đề / Tên', format: 'text', width: '240px' },
      { id: 'status', label: 'Trạng thái', format: 'dropdown', options: ['Mới tạo', 'Đang xử lý', 'Hoàn thành'], width: '160px' },
      { id: 'notes', label: 'Ghi chú', format: 'text', width: '260px' },
      { id: 'createdAt', label: 'Ngày tạo', format: 'date', width: '140px' },
    ];
    const effectiveCols = rawCustomCols.length > 0 ? rawCustomCols : defaultStarterCols;
    effectiveCols.forEach((c, idx) => {
      rawList.push({
        id: c.id,
        label: c.label || c.id,
        colIndex: idx + 1,
        width: c.width || '160px',
        tableWidth: c.tableWidth || null,
        format: c.format || 'text',
        options: c.options || [],
        isVirtual: false,
      });
    });
    return rawList;
  }

  if (src === 'trips') {
    const colMap = computeColumnIndexMap(personnelStore.importMappingTrips || []);
    (personnelStore.importMappingTrips || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
          seen.add(c.id);
          const rawIdx = colMap[c.id];
          const idxText = rawIdx ? rawIdx.replace(/^Cột\s+/, '') : null;
          rawList.push({
            id: c.id,
            label: c.label || c.id,
            colIndex: idxText,
            width: c.width || '150px',
            tableWidth: c.tableWidth || null,
            format: c.format,
            isVirtual: false,
          });
        }
      });
    });

    // Các cột ảo: Mã cán bộ, Thông tin cán bộ, Trạng thái hiện diện
    const virtualTripCols = [
      { id: '_parentPersonnelCode', label: 'Mã cán bộ', width: '130px' },
      { id: '_parentPersonnelName', label: getParentColLabel('Thông tin cán bộ'), width: '180px' },
      { id: '_presenceStatus', label: 'Trạng thái hiện diện', width: '170px' },
    ];

    virtualTripCols.forEach((vc) => {
      if (!seen.has(vc.id)) {
        seen.add(vc.id);
        rawList.unshift({
          ...vc,
          colIndex: null,
          isVirtual: true,
          tableWidth: null,
        });
      }
    });
  } else if (src === 'relatives') {
    const colMap = computeColumnIndexMap(personnelStore.importMappingRelative || []);
    (personnelStore.importMappingRelative || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
          seen.add(c.id);
          const rawIdx = colMap[c.id];
          const idxText = rawIdx ? rawIdx.replace(/^Cột\s+/, '') : null;
          rawList.push({
            id: c.id,
            label: c.label || c.id,
            colIndex: idxText,
            width: c.width || '150px',
            tableWidth: c.tableWidth || null,
            format: c.format,
            isVirtual: false,
          });
        }
      });
    });

    // Các cột ảo bổ trợ: Cán bộ liên quan, Trạng thái hiện diện, Mã cán bộ
    const virtualRelativeCols = [
      { id: '_parentPersonnelName', label: getParentColLabel('Cán bộ liên quan'), width: '180px' },
      { id: '_presenceStatus', label: 'Trạng thái hiện diện', width: '170px' },
      { id: '_parentPersonnelCode', label: 'Mã cán bộ', width: '130px' },
    ];

    virtualRelativeCols.forEach((vc) => {
      if (!seen.has(vc.id)) {
        seen.add(vc.id);
        rawList.push({
          ...vc,
          colIndex: null,
          isVirtual: true,
          tableWidth: null,
        });
      }
    });

    // Ưu tiên thứ tự cột hiển thị chuẩn cho thân nhân (theo đúng mã cột trong cấu hình Cài đặt)
    const prioritizedRelCols = [
      '_parentPersonnelName',
      'relativeName',
      'relationshipName',
      '_presenceStatus',
      'countryNameTN',
      'cccdthannhan',
      'birthYearTN',
      'currentAddress',
      'occupation',
      '_parentPersonnelCode',
    ];
    rawList.sort((a, b) => {
      const idxA = prioritizedRelCols.indexOf(a.id);
      const idxB = prioritizedRelCols.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  } else {
    // personnel
    const colMap = computeColumnIndexMap(personnelStore.importMappingPersonnel || []);
    (personnelStore.importMappingPersonnel || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
          seen.add(c.id);
          const rawIdx = colMap[c.id];
          const idxText = rawIdx ? rawIdx.replace(/^Cột\s+/, '') : null;
          rawList.push({
            id: c.id,
            label: c.label || c.id,
            colIndex: idxText,
            width: c.width || '150px',
            tableWidth: c.tableWidth || null,
            format: c.format,
            isVirtual: false,
          });
        }
      });
    });

    // Các cột ảo: Mã cán bộ, Thông tin cán bộ, Trạng thái hiện diện
    const virtualPersonnelCols = [
      { id: '_parentPersonnelCode', label: 'Mã cán bộ', width: '130px' },
      { id: '_parentPersonnelName', label: getParentColLabel('Thông tin cán bộ'), width: '180px' },
      { id: '_presenceStatus', label: 'Trạng thái hiện diện', width: '170px' },
    ];

    virtualPersonnelCols.forEach((vc) => {
      if (!seen.has(vc.id)) {
        seen.add(vc.id);
        rawList.unshift({
          ...vc,
          colIndex: null,
          isVirtual: true,
          tableWidth: null,
        });
      }
    });
  }

  // Cột Khóa chính (Unique Key / ID): Luôn đứng đầu tiên
  if (!seen.has('_primaryKey')) {
    seen.add('_primaryKey');
    rawList.unshift({
      id: '_primaryKey',
      label: '🔑 Mã định danh (Khóa chính)',
      width: '160px',
      tableWidth: '160px',
      colIndex: null,
      isVirtual: true,
      isPrimaryKey: true,
    });
  }

  return rawList;
});

const allColumns = computed(() => allAvailableColumnsList.value);
const getInitialSelectedCols = () => {
  try {
    const tid = route.params.id || (route.path === '/trips' ? 'trips' : 'trips');
    const localKey = `child_dashboard_cols_${tid || 'default'}`;
    const local = localStorage.getItem(localKey) || (tid === 'trips' ? localStorage.getItem('trips_dashboard_columns') : null);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((id) => id !== 'status' && id !== 'tripStatus');
      }
    }
  } catch (e) {}
  return [];
};
const selectedColIds = ref(getInitialSelectedCols());

const getCurrentCardColKey = () => {
  const tid = topicId.value || 'default';
  if (activeMetricCardIdx.value <= 0) {
    return `child_dashboard_cols_${tid}`;
  }
  const targetCard = activeMetricCards.value?.[activeMetricCardIdx.value];
  const cid = (targetCard && targetCard.id) ? targetCard.id : `card_${activeMetricCardIdx.value}`;
  return `child_dashboard_cols_${tid}_${cid}`;
};

const onColumnsChange = async (newCols) => {
  const cols = Array.isArray(newCols) ? newCols : selectedColIds.value;
  selectedColIds.value = [...cols];
  const currentKey = getCurrentCardColKey();
  const isBaseline = activeMetricCardIdx.value <= 0;

  try {
    localStorage.setItem(currentKey, JSON.stringify(selectedColIds.value));
    if (isBaseline && topicId.value === 'trips') {
      localStorage.setItem('trips_dashboard_columns', JSON.stringify(selectedColIds.value));
    }
    await saveAppSettings(currentKey, selectedColIds.value);
    if (isBaseline && topicId.value === 'trips') {
      await saveAppSettings('trips_dashboard_columns', selectedColIds.value);
    }
  } catch (e) {}

  const idx = customDashboards.value.findIndex((d) => d.id === topicId.value);
  if (idx !== -1) {
    if (isBaseline) {
      customDashboards.value[idx].columns = [...selectedColIds.value];
    } else {
      if (!customDashboards.value[idx].metricCards) {
        customDashboards.value[idx].metricCards = [];
      }
      if (customDashboards.value[idx].metricCards[activeMetricCardIdx.value]) {
        customDashboards.value[idx].metricCards[activeMetricCardIdx.value].columns = [...selectedColIds.value];
      }
    }
    try {
      localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
      await saveAppSettings('custom_dashboards_config', customDashboards.value);
    } catch (e) {}
  }
};

const visibleColumns = computed(() => {
  const colMap = new Map();
  allAvailableColumnsList.value.forEach((c) => {
    if (c.id !== 'status' && c.id !== 'tripStatus') {
      colMap.set(c.id, {
        ...c,
        label: c.label || getColumnLabel(c.id) || c.id,
      });
    }
  });
  return selectedColIds.value
    .filter((id) => id !== 'status' && id !== 'tripStatus' && colMap.has(id))
    .map((id) => colMap.get(id));
});

// Build unified list of trips from both Cán bộ and Thân nhân profiles
const unifiedTripsList = computed(() => {
  const list = [];
  const pList = personnelStore.personnelList || [];
  const now = new Date();
  const processedTripKeys = new Set();
  const isInternalId = (val) => !val || String(val).startsWith('cd_') || String(val).startsWith('trip_') || String(val).startsWith('rel_') || String(val).startsWith('p_');
  const pKeyField = personnelStore.getPersonnelKeyField();
  const tKeyField = personnelStore.getTripKeyField();
  const rKeyField = personnelStore.getRelativeKeyField();

  pList.forEach((p) => {
    // 1. Chuyến đi của Cán bộ (p.trips)
    (p.trips || []).forEach((t, tIdx) => {
      let custom = {};
      if (t.custom_data) {
        try {
          custom = typeof t.custom_data === 'string' ? JSON.parse(t.custom_data) : t.custom_data;
        } catch (e) {}
      }

      const cName = t.countryName || custom.countryName || t.country || custom.quoc_gia_xuat_canh || '';
      const depDate = t.departureDate || custom.departureDate || t.approvedDepartureDate || t.ngay_xuat_canh || custom.ngay_xuat_canh || t.ngayDi || custom.ngayDi || '';
      const arrDate = t.arrivalDate || custom.arrivalDate || t.ngay_nhap_canh || custom.ngay_nhap_canh || t.ngayVe || custom.ngayVe || '';
      const appArrDate = t.approvedArrivalDate || custom.approvedArrivalDate || t.thoi_gian_duyet_ve || custom.thoi_gian_duyet_ve || t.thoiGianDuyetVe || '';
      const extDate = t.approvedExtensionDate || custom.approvedExtensionDate || t.gia_han_den_ngay || custom.gia_han_den_ngay || '';
      const dNum = t.decisionNumber || custom.decisionNumber || t.decision || '';
      const fName = t.fundingName || t.funding || t.nguon_kinh_phi || t.kinh_phi || t.nguonKinhPhi || t.kinhPhi || custom.fundingName || custom.funding || custom.nguon_kinh_phi || custom.kinh_phi || '';
      const purpose = t.purpose || custom.purpose || '';

      // Skip empty/dummy placeholder trip objects that have no real data
      if (!cName && !depDate && !arrDate && !dNum && !purpose) {
        return;
      }

      const isRel = Boolean(
        t.isRelative === true ||
        t.isRelative === 'true' ||
        (t.relativeName && String(t.relativeName).trim() !== '' && String(t.relativeName).trim() !== '-' && String(t.relativeName).trim() !== 'Chưa rõ') ||
        (t.cccdthannhan && String(t.cccdthannhan).trim() !== '' && String(t.cccdthannhan).trim() !== '-' && !String(t.cccdthannhan).startsWith('cd_'))
      );
      const presence = getTripPresence({
        departureDate: depDate,
        arrivalDate: arrDate,
        approvedArrivalDate: appArrDate,
        approvedExtensionDate: extDate,
        custom_data: custom,
      });

      const uniqueKey = t.id || `trip_${p.id}_${tIdx}`;
      if (processedTripKeys.has(uniqueKey)) return;
      processedTripKeys.add(uniqueKey);

      const canBoCccd = String(p[pKeyField] ?? p.custom_data?.[pKeyField] ?? '').trim();
      const relCccd = String(t[rKeyField] ?? (isRel && !isInternalId(t.cccd) ? t.cccd : '')).trim();
      const relName = t.relativeName || (isRel ? 'Thân nhân' : p.name);
      const relShip = t.relationshipName || (isRel ? 'Thân nhân' : '');
      const directTripCccd = t[tKeyField] ?? t.cccdchuyendi;
      const travelerCccd = !isInternalId(directTripCccd) ? directTripCccd : (isRel ? relCccd : canBoCccd);

      list.push({
        ...custom,
        ...t,
        _recordType: 'trip',
        uniqueKey,
        isRelative: isRel,
        personnelId: p.id,
        personnelCode: p.code || '',
        personnelName: isRel ? relName : p.name,
        name: isRel ? relName : p.name,
        relativeName: isRel ? relName : '',
        relationshipName: relShip,
        parentName: p.name,
        parentPersonnelName: p.name,
        parentCccd: canBoCccd,
        cccdthannhan: relCccd,
        cccdparent: canBoCccd,
        cccdchuyendi: travelerCccd,
        cccd: travelerCccd || canBoCccd,
        position: isRel ? `${relShip || 'Thân nhân'} của: ${p.name}` : (p.position || p.positionName || p.chuc_vu || p.chucVu || custom.position || custom.chuc_vu || ''),
        positionName: isRel ? `${relShip || 'Thân nhân'} của: ${p.name}` : (p.position || p.positionName || p.chuc_vu || p.chucVu || custom.position || custom.chuc_vu || ''),
        chuc_vu: isRel ? `${relShip || 'Thân nhân'} của: ${p.name}` : (p.position || p.positionName || p.chuc_vu || p.chucVu || custom.position || custom.chuc_vu || ''),
        chucVu: isRel ? `${relShip || 'Thân nhân'} của: ${p.name}` : (p.position || p.positionName || p.chuc_vu || p.chucVu || custom.position || custom.chuc_vu || ''),
        departmentName: personnelStore.getDepartmentName(p.departmentId) || p.departmentName || '',
        countryName: cName,
        departureDate: depDate,
        arrivalDate: arrDate,
        approvedDepartureDate: t.approvedDepartureDate || custom.approvedDepartureDate || depDate,
        approvedArrivalDate: appArrDate,
        approvedExtensionDate: extDate,
        decisionNumber: dNum,
        fundingName: fName,
        purpose,
        passportNumber: t.passportNumber || custom.passportNumber || '',
        isAbroad: presence.isAbroad,
        isOverdue: presence.isOverdue,
        overdueDays: presence.overdueDays,
        presenceStatus: presence.label || presence.shortLabel,
        presenceLabel: presence.label,
        _presenceStatus: presence.shortLabel || presence.label,
        rawTrip: t,
        rawPerson: p,
        custom_data: custom,
      });
    });

    // 2. Chuyến đi của Thân nhân (p.relatives[].trips)
    (p.relatives || []).forEach((r, rIdx) => {
      (r.trips || []).forEach((rt, rtIdx) => {
        let custom = {};
        if (rt.custom_data) {
          try {
            custom = typeof rt.custom_data === 'string' ? JSON.parse(rt.custom_data) : rt.custom_data;
          } catch (e) {}
        }

        const cName = rt.countryName || custom.countryName || rt.country || r.countryName || '';
        const depDate = rt.departureDate || custom.departureDate || rt.ngay_xuat_canh || custom.ngay_xuat_canh || rt.ngayDi || custom.ngayDi || '';
        const arrDate = rt.arrivalDate || custom.arrivalDate || rt.ngay_nhap_canh || custom.ngay_nhap_canh || rt.ngayVe || custom.ngayVe || '';
        const appArrDate = rt.approvedArrivalDate || custom.approvedArrivalDate || rt.thoi_gian_duyet_ve || custom.thoi_gian_duyet_ve || rt.thoiGianDuyetVe || '';
        const extDate = rt.approvedExtensionDate || custom.approvedExtensionDate || rt.gia_han_den_ngay || custom.gia_han_den_ngay || '';
        const dNum = rt.decisionNumber || custom.decisionNumber || '';
        const fName = rt.fundingName || rt.funding || rt.nguon_kinh_phi || rt.kinh_phi || rt.nguonKinhPhi || rt.kinhPhi || custom.fundingName || custom.funding || custom.nguon_kinh_phi || custom.kinh_phi || '';
        const purpose = rt.purpose || custom.purpose || '';

        // Skip empty/dummy placeholder trip objects
        if (!cName && !depDate && !arrDate && !dNum && !purpose) {
          return;
        }

        const presence = getTripPresence({
          departureDate: depDate,
          arrivalDate: arrDate,
          approvedArrivalDate: appArrDate,
          approvedExtensionDate: extDate,
          custom_data: custom,
        });

        const uniqueKey = rt.id || `rel_trip_${p.id}_${rIdx}_${rtIdx}`;
        if (processedTripKeys.has(uniqueKey)) return;
        processedTripKeys.add(uniqueKey);

        const rCccd = !isInternalId(r[rKeyField] ?? r.cccdthannhan) ? String(r[rKeyField] ?? r.cccdthannhan).trim() : '';
        const canBoCccd = String(p[pKeyField] ?? p.custom_data?.[pKeyField] ?? '').trim();
        const tripCccd = !isInternalId(rt[tKeyField] ?? rt.cccdchuyendi) ? String(rt[tKeyField] ?? rt.cccdchuyendi).trim() : rCccd;
        const relName = r.relativeName || r.name || custom.relativeName || 'Thân nhân';
        const relShip = r.relationshipName || r.relationship || custom.relationshipName || 'Thân nhân';
        const travelerCccd = tripCccd || rCccd;

        list.push({
          ...custom,
          ...rt,
          _recordType: 'trip',
          uniqueKey,
          isRelative: true,
          personnelId: p.id,
          personnelCode: p.code || '',
          personnelName: relName,
          name: relName,
          relativeName: relName,
          relationshipName: relShip,
          parentName: p.name,
          parentPersonnelName: p.name,
          parentCccd: canBoCccd,
          cccdthannhan: travelerCccd,
          cccdparent: canBoCccd,
          cccdchuyendi: travelerCccd,
          cccd: travelerCccd || canBoCccd,
          position: `${relShip} của: ${p.name}`,
          positionName: `${relShip} của: ${p.name}`,
          chuc_vu: `${relShip} của: ${p.name}`,
          chucVu: `${relShip} của: ${p.name}`,
          departmentName: personnelStore.getDepartmentName(p.departmentId) || p.departmentName || '',
          countryName: cName,
          departureDate: depDate,
          arrivalDate: arrDate,
          approvedDepartureDate: rt.approvedDepartureDate || depDate,
          approvedArrivalDate: appArrDate,
          approvedExtensionDate: extDate,
          decisionNumber: dNum,
          fundingName: fName,
          purpose: rt.purpose || custom.purpose || '',
          passportNumber: rt.passportNumber || custom.passportNumber || '',
          isAbroad: presence.isAbroad,
          isOverdue: presence.isOverdue,
          overdueDays: presence.overdueDays,
          presenceStatus: presence.label || presence.shortLabel,
          presenceLabel: presence.label,
          _presenceStatus: presence.shortLabel || presence.label,
          rawTrip: rt,
          rawRelative: r,
          rawPerson: p,
          custom_data: custom,
        });
      });
    });
  });

  return list;
});

// Custom Table Rows for blank/independent custom tables
const customTableRows = ref([]);

const loadCustomTableRows = async () => {
  const tid = topicId.value;
  if (!tid || tid === 'trips' || currentDashboardConfig.value?.source !== 'blank') {
    customTableRows.value = [];
    return;
  }
  try {
    const local = localStorage.getItem(`custom_table_rows_${tid}`);
    if (local) {
      customTableRows.value = JSON.parse(local).map((r) => ({ ...r, uniqueKey: r.uniqueKey || r.id }));
    }
    const db = await getAppSettings(`custom_table_rows_${tid}`, null);
    if (db && Array.isArray(db)) {
      customTableRows.value = db.map((r) => ({ ...r, uniqueKey: r.uniqueKey || r.id }));
      localStorage.setItem(`custom_table_rows_${tid}`, JSON.stringify(customTableRows.value));
    }
  } catch (e) {
    console.error('Error loading custom table rows:', e);
  }
};

const addCustomRow = async () => {
  const tid = topicId.value;
  const rowId = 'row_' + Date.now();
  const newRow = {
    id: rowId,
    uniqueKey: rowId,
    title: 'Bản ghi mới',
    status: 'Mới tạo',
    notes: '',
    createdAt: new Date().toISOString().slice(0, 10),
  };
  const list = [...(customTableRows.value || []), newRow];
  customTableRows.value = list;
  try {
    localStorage.setItem(`custom_table_rows_${tid}`, JSON.stringify(list));
    await saveAppSettings(`custom_table_rows_${tid}`, list);
  } catch (e) {}
};

// Dynamic Data List based on configured source
const currentSourceList = computed(() => {
  if (currentDashboardConfig.value?.isPending) return [];
  const src = currentDashboardConfig.value?.source || 'trips';
  if (src === 'blank') {
    return customTableRows.value || [];
  }
  return buildTopicSourceList(src, personnelStore);
});

// Aggregated Quick Stats
const tripStats = computed(() => {
  const list = currentSourceList.value;
  let completed = 0;
  let abroad = 0;
  let overdue = 0;

  list.forEach((t) => {
    if (t.isOverdue) overdue++;
    else if (t.isAbroad) abroad++;
    else completed++;
  });

  return {
    total: list.length,
    completed,
    abroad,
    overdue,
  };
});

// Dropdown filter options
const availableYears = computed(() => {
  const set = new Set();
  currentSourceList.value.forEach((t) => {
    const d = parseDateObj(t.departureDate);
    if (d) set.add(d.getFullYear());
  });
  return Array.from(set).sort((a, b) => b - a);
});

const availableCountries = computed(() => {
  const set = new Set();
  currentSourceList.value.forEach((t) => {
    if (t.countryName && t.countryName !== '-') set.add(t.countryName);
  });
  return Array.from(set).sort();
});

const availableDepartments = computed(() => {
  const set = new Set();
  currentSourceList.value.forEach((t) => {
    if (t.departmentName) set.add(t.departmentName);
  });
  return Array.from(set).sort();
});

const availableFundings = computed(() => {
  const set = new Set();
  currentSourceList.value.forEach((t) => {
    if (t.fundingName && t.fundingName !== '-') set.add(t.fundingName);
  });
  return Array.from(set).sort();
});

// Filtered List
const filteredList = computed(() => {
  // 1. Xác định thẻ mục tiêu lọc (từ route query hoặc state)
  let targetCard = null;
  const qCard = route.query?.card || activeMetricCardId.value;
  if (qCard) {
    targetCard = activeMetricCards.value?.find((c) => (c.id && c.id === qCard) || c.label === qCard);
  }
  if (!targetCard) {
    const currentIdx = (activeMetricCardIdx.value === -1 || activeMetricCardIdx.value === 0)
      ? firstVisibleCardIdx.value
      : activeMetricCardIdx.value;
    targetCard = activeMetricCards.value?.[currentIdx];
  }

  const baselineCard = firstVisibleCard.value;
  const isTargetBaseline = !targetCard || targetCard === baselineCard || isSameCard(targetCard, baselineCard);
  const shouldInheritBaseline = !isTargetBaseline && targetCard?.inheritBaseline !== false;

  let list = [];
  if (isTargetBaseline) {
    list = [...topicBaselineList.value];
  } else {
    const baseSource = shouldInheritBaseline ? topicBaselineList.value : currentSourceList.value;
    list = isSharedCardAllType(targetCard) ? [...baseSource] : baseSource.filter((t) => matchSharedCardCondition(t, targetCard, personnelStore));
  }

  // 2. Đếm / Hiển thị Unique (kế thừa tính unique từ thẻ baseline nếu có ràng buộc)
  const isUniqueCount = targetCard?.isUnique || (shouldInheritBaseline && !!baselineCard?.isUnique) || (targetCard === baselineCard && !!baselineCard?.isUnique);
  if (isUniqueCount) {
    const pKeyField = personnelStore?.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
    const seenKeys = new Set();
    list = list.filter((item) => {
      const keyVal = item[pKeyField] ?? item.cccdparent ?? item.parentCccd ?? item.rawPerson?.[pKeyField] ?? item.rawPerson?.custom_data?.[pKeyField] ?? item.personnelId ?? item.id;
      if (keyVal && String(keyVal).trim() !== '' && String(keyVal).trim() !== '-') {
        const strKey = String(keyVal).trim();
        if (seenKeys.has(strKey)) return false;
        seenKeys.add(strKey);
        return true;
      }
      return true;
    });
  }

  // 3. Lọc theo Drill-down trường động (filterField & filterValue)
  const fField = route.query?.filterField || customFilterField.value;
  const fVal = route.query?.filterValue || customFilterValue.value;
  if (fField && fVal) {
    const targetStr = String(fVal).trim().toLowerCase();
    list = list.filter((row) => {
      const cellVal = extractRowFieldValue(row, fField, personnelStore);
      const strVal = String(cellVal || '').trim().toLowerCase();
      return strVal === targetStr || strVal.includes(targetStr);
    });
  }

  // 4. Lọc theo Quốc gia (country / countryName / quoc_gia_xuat_canh)
  const targetCountry = route.query?.country || selectedCountry.value;
  if (targetCountry) {
    const tC = String(targetCountry).trim().toLowerCase();
    list = list.filter((row) => {
      const c1 = String(row.countryName || '').trim().toLowerCase();
      const c2 = String(extractRowFieldValue(row, 'countryName', personnelStore) || '').trim().toLowerCase();
      const c3 = String(extractRowFieldValue(row, 'quoc_gia_xuat_canh', personnelStore) || '').trim().toLowerCase();
      return c1 === tC || c2 === tC || c3 === tC || c1.includes(tC) || c2.includes(tC) || c3.includes(tC);
    });
  }

  // 5. Lọc theo Kinh phí
  const targetFunding = route.query?.funding || selectedFunding.value;
  if (targetFunding) {
    const tF = String(targetFunding).trim().toLowerCase();
    list = list.filter((row) => {
      const f1 = String(row.fundingName || '').trim().toLowerCase();
      const f2 = String(extractRowFieldValue(row, 'fundingName', personnelStore) || '').trim().toLowerCase();
      const f3 = String(extractRowFieldValue(row, 'nguon_kinh_phi', personnelStore) || '').trim().toLowerCase();
      return f1 === tF || f2 === tF || f3 === tF || f1.includes(tF) || f2.includes(tF) || f3.includes(tF);
    });
  }

  // 6. Lọc theo Đơn vị
  const targetDept = route.query?.department || selectedDepartment.value;
  if (targetDept) {
    const tD = String(targetDept).trim().toLowerCase();
    list = list.filter((row) => {
      const d1 = String(row.departmentName || '').trim().toLowerCase();
      const d2 = String(extractRowFieldValue(row, 'departmentName', personnelStore) || '').trim().toLowerCase();
      return d1 === tD || d2 === tD || d1.includes(tD) || d2.includes(tD);
    });
  }

  // 7. Lọc theo ô tìm kiếm nhanh (searchQuery)
  const q = String(searchQuery.value || '').trim().toLowerCase();
  if (q) {
    list = list.filter((item) => {
      const name = String(item.personnelName || item.name || item.relativeName || '').toLowerCase();
      const code = String(item.personnelCode || item.code || '').toLowerCase();
      const pKeyField = personnelStore?.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
      const cccd = String(item[pKeyField] ?? item.cccd ?? item.cccdparent ?? item.cccdthannhan ?? '').toLowerCase();
      const dept = String(item.departmentName || '').toLowerCase();
      const pos = String(item.position || item.positionName || '').toLowerCase();
      const country = String(item.countryName || item.quoc_gia_xuat_canh || '').toLowerCase();
      const dec = String(item.decisionNumber || item.so_quyet_dinh || '').toLowerCase();
      return name.includes(q) || code.includes(q) || cccd.includes(q) || dept.includes(q) || pos.includes(q) || country.includes(q) || dec.includes(q);
    });
  }

  return list;
});

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filteredList.value.length / pageSize.value) || 1;
});

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

// Helpers
const formatDisplayDate = (dStr) => {
  if (!dStr) return '-';
  return formatDate(dStr) || dStr;
};

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

  const colDef = allAvailableColumnsList.value?.find((c) => c.id === colId);
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

const getCellValue = (trip, colId) => {
  if (!trip || !colId) return '-';

  // 0. Phân giải Cột ảo (Trạng thái hiện diện, Đối tượng, Thông tin Cán bộ liên quan...)
  const vVal = resolveVirtualColumnValue(trip, colId);
  if (vVal !== undefined) {
    return vVal || '-';
  }

  // Cột CCCD / Định danh người đi
  const isInternalId = (val) => !val || String(val).startsWith('cd_') || String(val).startsWith('trip_') || String(val).startsWith('rel_') || String(val).startsWith('p_');
  const pKeyField = personnelStore.getPersonnelKeyField();
  const tKeyField = personnelStore.getTripKeyField();
  const rKeyField = personnelStore.getRelativeKeyField();

  if (colId === tKeyField || colId === 'cccdchuyendi' || colId === 'cccd_chuyen_di' || colId === 'cccd_nguoi_di') {
    const directVal = trip[tKeyField] ?? trip.cccdchuyendi ?? trip.rawTrip?.[tKeyField] ?? trip.rawTrip?.cccdchuyendi ?? trip[colId];
    if (!isInternalId(directVal)) return String(directVal).trim();
    if (trip.isRelative) {
      const rCccd = trip[rKeyField] ?? trip.cccdthannhan ?? trip.rawRelative?.[rKeyField] ?? trip.rawRelative?.cccdthannhan;
      if (!isInternalId(rCccd)) return String(rCccd).trim();
    }
    const canBoCccd = trip.rawPerson?.[pKeyField] ?? trip.rawPerson?.custom_data?.[pKeyField] ?? trip.parentCccd ?? trip.cccdparent;
    if (!isInternalId(canBoCccd)) return String(canBoCccd).trim();
    return '-';
  }
  if (colId === pKeyField || colId === 'cccdparent' || colId === 'cccd_can_bo') {
    const canBoCccd = trip.parentCccd ?? trip.cccdparent ?? trip.rawPerson?.[pKeyField] ?? trip.rawPerson?.custom_data?.[pKeyField];
    if (!isInternalId(canBoCccd)) return String(canBoCccd).trim();
    return '-';
  }
  if (colId === rKeyField || colId === 'cccdthannhan' || colId === 'cccd_than_nhan') {
    const rCccd = trip[rKeyField] ?? trip.cccdthannhan ?? trip.rawRelative?.[rKeyField] ?? trip.rawRelative?.cccdthannhan;
    if (!isInternalId(rCccd)) return String(rCccd).trim();
    return '-';
  }

  // 1. Check if col is Formula column in any mapping
  const allMap = {};
  (personnelStore.importMappingTrips || []).forEach((g) => {
    (g.columns || []).forEach((c) => { if (c.id) allMap[c.id] = c; });
  });
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => { if (c.id) allMap[c.id] = c; });
  });
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => { if (c.id) allMap[c.id] = c; });
  });
  (currentDashboardConfig.value?.customColumns || []).forEach((c) => {
    if (c.id) allMap[c.id] = c;
  });

  const colDef = allMap[colId];
  if (colDef && colDef.format === 'formula') {
    const result = evaluateFormula(trip, colDef);
    return result?.label || result?.shortLabel || '-';
  }
  if (colDef && colDef.format === 'lookup') {
    return evaluateLookup(trip, colDef, personnelStore);
  }
  if (colDef && colDef.format === 'rollup') {
    return evaluateRollup(trip, colDef, personnelStore);
  }

  // 2. Identify column origin strictly from import mappings
  const tripColIds = (personnelStore.importMappingTrips || []).flatMap((g) => (g.columns || []).map((c) => c.id));
  const relColIds = (personnelStore.importMappingRelative || []).flatMap((g) => (g.columns || []).map((c) => c.id));
  const perColIds = (personnelStore.importMappingPersonnel || []).flatMap((g) => (g.columns || []).map((c) => c.id));

  let rawVal = undefined;

  if (tripColIds.includes(colId)) {
    // Cột thuộc Bảng Chuyến đi
    if (trip.isRelative || currentDashboardConfig.value?.source === 'relatives') {
      // Đối tượng là Thân nhân -> đọc từ chuyến đi mới nhất theo departureDate
      const trips = Array.isArray(trip.trips) ? trip.trips : [];
      let latestTrip = null;
      let latestDep = -Infinity;
      for (const t of trips) {
        const tCustom = typeof t.custom_data === 'string' ? JSON.parse(t.custom_data || '{}') : (t.custom_data || {});
        const depRaw = t.departureDate || tCustom.departureDate || t.ngay_xuat_canh || tCustom.ngay_xuat_canh || '';
        const dep = parseDateValue(depRaw);
        const time = dep ? dep.getTime() : 0;
        if (time >= latestDep) {
          latestDep = time;
          latestTrip = { ...tCustom, ...t };
        }
      }
      if (latestTrip) {
        rawVal = latestTrip[colId];
      }
    } else if (currentDashboardConfig.value?.source === 'personnel') {
      // Đối tượng là Cán bộ -> chỉ đọc trong danh sách chuyến đi thực tế (trip.trips)
      const trips = Array.isArray(trip.trips) ? trip.trips : [];
      for (const t of trips) {
        const tCustom = typeof t.custom_data === 'string' ? JSON.parse(t.custom_data || '{}') : (t.custom_data || {});
        const v = t[colId] !== undefined ? t[colId] : tCustom[colId];
        if (v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '-') {
          rawVal = v;
          break;
        }
      }
    } else {
      // Đối tượng là Bản ghi Chuyến đi
      const tcd = typeof trip.custom_data === 'string' ? JSON.parse(trip.custom_data || '{}') : (trip.custom_data || {});
      const rtcd = typeof trip.rawTrip?.custom_data === 'string' ? JSON.parse(trip.rawTrip.custom_data || '{}') : (trip.rawTrip?.custom_data || {});
      rawVal = trip[colId] !== undefined ? trip[colId] : (tcd[colId] ?? trip.rawTrip?.[colId] ?? rtcd[colId]);
    }
  } else if (relColIds.includes(colId)) {
    // Cột thuộc Bảng Thân nhân
    const tcd = typeof trip.custom_data === 'string' ? JSON.parse(trip.custom_data || '{}') : (trip.custom_data || {});
    const rrcd = typeof trip.rawRelative?.custom_data === 'string' ? JSON.parse(trip.rawRelative.custom_data || '{}') : (trip.rawRelative?.custom_data || {});
    if (trip.isRelative || currentDashboardConfig.value?.source === 'relatives') {
      rawVal = trip[colId] !== undefined ? trip[colId] : (tcd[colId] ?? trip.rawRelative?.[colId] ?? rrcd[colId]);
    } else if (trip.rawRelative) {
      rawVal = trip.rawRelative[colId] !== undefined ? trip.rawRelative[colId] : (rrcd[colId]);
    }
  } else if (perColIds.includes(colId)) {
    // Cột thuộc Bảng Cán bộ
    const p = trip.rawPerson || trip;
    const pcd = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data || '{}') : (p.custom_data || {});
    const tcd = typeof trip.custom_data === 'string' ? JSON.parse(trip.custom_data || '{}') : (trip.custom_data || {});
    rawVal = p[colId] !== undefined ? p[colId] : (pcd[colId] ?? trip[colId] ?? tcd[colId]);
  } else {
    // Cột thông thường / fallback trực tiếp
    const tcd = typeof trip.custom_data === 'string' ? JSON.parse(trip.custom_data || '{}') : (trip.custom_data || {});
    const rtcd = typeof trip.rawTrip?.custom_data === 'string' ? JSON.parse(trip.rawTrip.custom_data || '{}') : (trip.rawTrip?.custom_data || {});
    const rrcd = typeof trip.rawRelative?.custom_data === 'string' ? JSON.parse(trip.rawRelative.custom_data || '{}') : (trip.rawRelative?.custom_data || {});
    const p = trip.rawPerson;
    const pcd = typeof p?.custom_data === 'string' ? JSON.parse(p.custom_data || '{}') : (p?.custom_data || {});
    rawVal = trip[colId] !== undefined ? trip[colId] : (tcd[colId] ?? trip.rawTrip?.[colId] ?? rtcd[colId] ?? trip.rawRelative?.[colId] ?? rrcd[colId] ?? p?.[colId] ?? pcd[colId]);
  }

  return formatGenericCellValue(rawVal, colDef || { id: colId });
};

const getDepartmentValue = (trip) => {
  if (!trip) return '-';
  const candidates = [
    trip.departmentName,
    trip.department,
    trip.rawPerson?.departmentName,
    trip.rawPerson?.department,
    trip.custom_data?.departmentName,
    trip.custom_data?.don_vi_cong_tac,
    trip.custom_data?.don_vi,
    trip.custom_data?.phong_ban,
    trip.rawPerson?.custom_data?.departmentName,
    trip.rawPerson?.custom_data?.don_vi_cong_tac,
    trip.rawPerson?.custom_data?.don_vi,
    trip.rawPerson?.custom_data?.phong_ban,
    trip.departmentId ? personnelStore.getDepartmentName(trip.departmentId) : '',
    trip.rawPerson?.departmentId ? personnelStore.getDepartmentName(trip.rawPerson.departmentId) : '',
  ];

  for (const c of candidates) {
    if (c !== undefined && c !== null && String(c).trim() !== '' && String(c).trim() !== '-' && String(c).trim() !== 'Chưa rõ' && String(c).trim() !== 'Chưa phân bổ') {
      return String(c).trim();
    }
  }

  // Scan custom_data object
  const searchInObj = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    let target = obj;
    if (typeof obj === 'string') {
      try { target = JSON.parse(obj); } catch (e) { return null; }
    }
    if (!target || typeof target !== 'object') return null;
    for (const [k, v] of Object.entries(target)) {
      const cleanK = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        (cleanK.includes('donvi') || cleanK.includes('phongban') || cleanK.includes('coquan') || cleanK.includes('department')) &&
        v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '-' && String(v).trim() !== 'Chưa phân bổ'
      ) {
        return String(v).trim();
      }
    }
    return null;
  };

  const found = (
    searchInObj(trip) ??
    searchInObj(trip.custom_data) ??
    searchInObj(trip.rawPerson?.custom_data) ??
    searchInObj(trip.rawTrip?.custom_data)
  );

  if (found) return String(found).trim();

  return '-';
};

const getStatusBadgeClass = (trip) => {
  if (!trip) return 'status-pill status-completed';
  if (trip.isOverdue) return 'status-pill status-overdue';
  if (trip.isAbroad) return 'status-pill status-abroad';
  return 'status-pill status-completed';
};

const getStatusLabel = (trip) => {
  if (!trip) return 'Đã về nước';
  if (trip.presenceLabel) return trip.presenceLabel;
  if (trip.isOverdue) return `Quá hạn (${trip.overdueDays} ngày)`;
  if (trip.isAbroad) return 'Đang ở nước ngoài';
  return 'Đã về nước';
};

const getColumnHeaderStyle = (col) => {
  return {
    width: col.width || 'auto',
    textAlign: col.align || 'left',
  };
};

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value * -1;
  } else {
    sortKey.value = key;
    sortOrder.value = 1;
  }
};

const isSelected = (trip) => {
  const k = typeof trip === 'string' ? trip : trip?.uniqueKey;
  return selectedTripKeys.value.includes(k);
};

const isAllSelected = computed(() => {
  return (
    paginatedList.value.length > 0 &&
    paginatedList.value.every((t) => selectedTripKeys.value.includes(t.uniqueKey))
  );
});

const isIndeterminate = computed(() => {
  const pageKeys = paginatedList.value.map((t) => t.uniqueKey);
  const selectedOnPage = pageKeys.filter((k) => selectedTripKeys.value.includes(k));
  return selectedOnPage.length > 0 && selectedOnPage.length < pageKeys.length;
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    const pageKeys = new Set(paginatedList.value.map((t) => t.uniqueKey));
    selectedTripKeys.value = selectedTripKeys.value.filter((k) => !pageKeys.has(k));
  } else {
    paginatedList.value.forEach((t) => {
      if (!selectedTripKeys.value.includes(t.uniqueKey)) {
        selectedTripKeys.value.push(t.uniqueKey);
      }
    });
  }
};

const toggleSelectTrip = (trip) => {
  const k = typeof trip === 'string' ? trip : trip?.uniqueKey;
  if (!k) return;
  const idx = selectedTripKeys.value.indexOf(k);
  if (idx !== -1) {
    selectedTripKeys.value.splice(idx, 1);
  } else {
    selectedTripKeys.value.push(k);
  }
};

// Resolve exact target Personnel record safely without false code-matching
const resolveTargetPersonnel = (trip) => {
  if (!trip) return null;
  const pList = personnelStore.personnelList || [];

  // 1. By direct personnelId (matching as string to handle number/string differences)
  if (trip.personnelId !== undefined && trip.personnelId !== null) {
    const found = pList.find((p) => String(p.id) === String(trip.personnelId));
    if (found) return found;
  }

  // 2. By non-empty personnelCode
  if (trip.personnelCode && String(trip.personnelCode).trim() !== '') {
    const targetCode = String(trip.personnelCode).trim();
    const found = pList.find((p) => p.code && String(p.code).trim() === targetCode);
    if (found) return found;
  }

  // 3. By rawPerson.id
  if (trip.rawPerson?.id !== undefined && trip.rawPerson?.id !== null) {
    const found = pList.find((p) => String(p.id) === String(trip.rawPerson.id));
    if (found) return found;
  }

  // 4. By CCCD
  const cccd = trip.cccdchuyendi || trip.cccd || trip.cccdparent || trip.custom_data?.cccd;
  if (cccd && String(cccd).trim() !== '') {
    const found = personnelStore.findPersonByCccd(String(cccd).trim());
    if (found) return found;
  }

  // 5. By personnelName (for cán bộ)
  const pName = trip.personnelName || trip.name;
  if (pName && String(pName).trim() !== '' && !trip.isRelative) {
    const targetName = String(pName).trim().toLowerCase();
    const found = pList.find((p) => p.name && String(p.name).trim().toLowerCase() === targetName);
    if (found) return found;
  }

  // 6. If trip.rawPerson exists
  if (trip.rawPerson) {
    return trip.rawPerson;
  }

  return null;
};

const hasActiveFilters = computed(() => {
  return (
    statusFilter.value !== 'all' ||
    timeFilterYear.value !== 'all' ||
    selectedCountry.value !== '' ||
    selectedDepartment.value !== '' ||
    selectedFunding.value !== '' ||
    searchQuery.value.trim() !== ''
  );
});

const resetFilters = () => {
  activeMetricCardIdx.value = -1;
  statusFilter.value = 'all';
  timeFilterYear.value = 'all';
  selectedCountry.value = '';
  selectedDepartment.value = '';
  selectedFunding.value = '';
  customFilterField.value = '';
  customFilterValue.value = '';
  searchQuery.value = '';
  currentPage.value = 1;
  triggerAutoSaveFilter();
};

// Column Picker
const resetDefaultColumns = () => {
  if (activeMetricCardIdx.value > 0) {
    const card = activeMetricCards.value?.[activeMetricCardIdx.value];
    if (card?.columns && card.columns.length > 0) {
      selectedColIds.value = [...card.columns];
      return;
    }
  }
  if (currentDashboardConfig.value.columns && currentDashboardConfig.value.columns.length > 0) {
    selectedColIds.value = [...currentDashboardConfig.value.columns];
  } else {
    selectedColIds.value = allAvailableColumnsList.value.map((c) => c.id);
  }
};

const moveSelectedColUp = (idx) => {
  if (idx <= 0) return;
  const temp = selectedColIds.value[idx];
  selectedColIds.value[idx] = selectedColIds.value[idx - 1];
  selectedColIds.value[idx - 1] = temp;
};

const moveSelectedColDown = (idx) => {
  if (idx >= selectedColIds.value.length - 1) return;
  const temp = selectedColIds.value[idx];
  selectedColIds.value[idx] = selectedColIds.value[idx + 1];
  selectedColIds.value[idx + 1] = temp;
};

const removeSelectedCol = (idx) => {
  selectedColIds.value.splice(idx, 1);
};

const saveColumnSelection = async () => {
  await onColumnsChange(selectedColIds.value);
  isColumnPickerOpen.value = false;
};

// Actions
const openPersonnelDetail = (trip) => {
  const targetPerson = resolveTargetPersonnel(trip);
  if (targetPerson) {
    activePersonData.value = targetPerson;
    if (trip.isRelative) {
      dialogInitialTab.value = 1;
      dialogTargetRelativeCode.value = trip.relativeCode || trip.code || '';
    } else {
      dialogInitialTab.value = 0;
      dialogTargetRelativeCode.value = '';
    }
    isPersonnelDialogOpen.value = true;
  } else {
    alert('Không tìm thấy hồ sơ chi tiết của cán bộ tương ứng!');
  }
};

const isSameTripItem = (t, trip) => {
  if (!t || !trip) return false;
  if (t === trip || t === trip.rawTrip) return true;
  if (t.id && trip.id && String(t.id) === String(trip.id)) return true;
  if (t.id && trip.uniqueKey && String(t.id) === String(trip.uniqueKey)) return true;
  if (t.uniqueKey && trip.uniqueKey && String(t.uniqueKey) === String(trip.uniqueKey)) return true;

  const dep1 = String(t.ngay_xuat_canh || t.departureDate || t.approvedDepartureDate || '').trim();
  const dep2 = String(trip.ngay_xuat_canh || trip.departureDate || trip.approvedDepartureDate || '').trim();

  const c1 = String(t.quoc_gia_xuat_canh || t.countryName || t.country || '').trim().toLowerCase();
  const c2 = String(trip.quoc_gia_xuat_canh || trip.countryName || trip.country || '').trim().toLowerCase();

  const dec1 = String(t.so_quyet_dinh || t.decisionNumber || '').trim();
  const dec2 = String(trip.so_quyet_dinh || trip.decisionNumber || '').trim();

  if (dep1 && dep2 && dep1 === dep2 && c1 && c2 && c1 === c2) {
    if (dec1 || dec2) return dec1 === dec2;
    return true;
  }
  return false;
};

const handleDeleteItem = async (item) => {
  const src = currentDashboardConfig.value?.source || '';
  if (src === 'blank') {
    const title = item.title || item.name || 'bản ghi này';
    if (!confirm(`Bạn có chắc chắn muốn xóa bản ghi "${title}" không?`)) return;
    const tid = topicId.value;
    const list = (customTableRows.value || []).filter((r) => r.id !== item.id);
    customTableRows.value = list;
    try {
      localStorage.setItem(`custom_table_rows_${tid}`, JSON.stringify(list));
      await saveAppSettings(`custom_table_rows_${tid}`, list);
    } catch (e) {}
    return;
  }
  const isRelative = src === 'relatives' || src === 'relative' || Boolean(item.relativeName || item.cccdthannhan || item.relationshipName || item.birthYearTN || item.currentAddress || item.relationship);
  const isPersonnel = src === 'personnel' || (Boolean(item.positionName || item.position || item.departmentName) && !item.departureDate && !item.ngay_xuat_canh && !isRelative);

  if (isRelative) {
    const relName = item.relativeName || item.name || 'Thân nhân';
    const parentName = item.parentName || item.parentPersonnelName || 'Cán bộ';
    if (!confirm(`Bạn có chắc chắn muốn xóa thân nhân "${relName}" (thuộc cán bộ ${parentName})?`)) return;

    try {
      await personnelStore.deleteRelative(item);
      alert('Đã xóa thân nhân thành công!');
    } catch (e) {
      alert('Lỗi xóa thân nhân: ' + (e.message || e));
    }
  } else if (isPersonnel) {
    const pName = item.name || 'Cán bộ';
    if (!confirm(`Bạn có chắc chắn muốn xóa hồ sơ cán bộ "${pName}"?`)) return;

    try {
      await personnelStore.deletePerson(item);
      alert('Đã xóa hồ sơ cán bộ thành công!');
    } catch (e) {
      alert('Lỗi xóa cán bộ: ' + (e.message || e));
    }
  } else {
    await handleDeleteTrip(item);
  }
};

const handleDeleteTrip = async (trip) => {
  const name = trip.personnelName || trip.name || 'Cán bộ';
  const cName = trip.countryName || trip.quoc_gia_xuat_canh || trip.country || 'chuyến đi';
  if (!confirm(`Bạn có chắc chắn muốn xóa chuyến đi "${cName}" của ${name}?`)) return;

  const targetPerson = resolveTargetPersonnel(trip);
  if (!targetPerson) {
    alert('Không tìm thấy hồ sơ cán bộ tương ứng để xóa chuyến đi!');
    return;
  }

  // Clone to safely update
  const updatedPerson = JSON.parse(JSON.stringify(targetPerson));

  // 1. Remove from updatedPerson.trips
  if (Array.isArray(updatedPerson.trips)) {
    updatedPerson.trips = updatedPerson.trips.filter((t) => !isSameTripItem(t, trip));
  }

  // 2. Remove from updatedPerson.relatives[].trips
  if (Array.isArray(updatedPerson.relatives)) {
    updatedPerson.relatives.forEach((r) => {
      if (Array.isArray(r.trips)) {
        r.trips = r.trips.filter((t) => !isSameTripItem(t, trip));
      }
    });
  }

  // 3. Remove from custom_data if present
  let custom = {};
  if (updatedPerson.custom_data) {
    try {
      custom = typeof updatedPerson.custom_data === 'string' ? JSON.parse(updatedPerson.custom_data) : updatedPerson.custom_data;
    } catch (e) {}
  }
  if (Array.isArray(custom.trips)) {
    custom.trips = custom.trips.filter((t) => !isSameTripItem(t, trip));
  }
  delete custom['Khối B: Chuyến đi nước ngoài'];
  if (Array.isArray(custom.relatives)) {
    custom.relatives.forEach((r) => {
      if (Array.isArray(r.trips)) {
        r.trips = r.trips.filter((t) => !isSameTripItem(t, trip));
      }
    });
  }
  updatedPerson.custom_data = custom;

  try {
    await personnelStore.savePerson(updatedPerson);
    alert('Đã xóa chuyến đi thành công!');
  } catch (e) {
    alert('Lỗi xóa chuyến đi: ' + (e.message || e));
  }
};

const handleBulkDeleteTrips = async () => {
  const count = selectedTrips.value.length;
  if (!count) return;
  if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn ${count} bản ghi đã chọn không?`)) return;

  const src = currentDashboardConfig.value?.source || '';
  if (src === 'blank') {
    const tid = topicId.value;
    const selectedIds = new Set(selectedTrips.value.map((x) => x.id));
    const list = (customTableRows.value || []).filter((r) => !selectedIds.has(r.id));
    customTableRows.value = list;
    try {
      localStorage.setItem(`custom_table_rows_${tid}`, JSON.stringify(list));
      await saveAppSettings(`custom_table_rows_${tid}`, list);
    } catch (e) {}
    selectedTrips.value = [];
    return;
  }

  try {
    for (const item of selectedTrips.value) {
      const src = currentDashboardConfig.value?.source || '';
      const isRelative = src === 'relatives' || src === 'relative' || Boolean(item.relativeName || item.cccdthannhan);
      const isPersonnel = src === 'personnel' || (Boolean(item.positionName || item.position || item.departmentName) && !item.departureDate && !item.ngay_xuat_canh && !isRelative);

      if (isRelative) {
        await personnelStore.deleteRelative(item);
      } else if (isPersonnel) {
        await personnelStore.deletePerson(item);
      } else {
        // trip
        const targetPerson = resolveTargetPersonnel(item);
        if (targetPerson) {
          const updatedPerson = JSON.parse(JSON.stringify(targetPerson));
          if (Array.isArray(updatedPerson.trips)) {
            updatedPerson.trips = updatedPerson.trips.filter((t) => !isSameTripItem(t, item));
          }
          if (Array.isArray(updatedPerson.relatives)) {
            updatedPerson.relatives.forEach((r) => {
              if (Array.isArray(r.trips)) {
                r.trips = r.trips.filter((t) => !isSameTripItem(t, item));
              }
            });
          }
          let custom = {};
          if (updatedPerson.custom_data) {
            try {
              custom = typeof updatedPerson.custom_data === 'string' ? JSON.parse(updatedPerson.custom_data) : updatedPerson.custom_data;
            } catch (e) {}
          }
          if (Array.isArray(custom.trips)) {
            custom.trips = custom.trips.filter((t) => !isSameTripItem(t, item));
          }
          delete custom['Khối B: Chuyến đi nước ngoài'];
          if (Array.isArray(custom.relatives)) {
            custom.relatives.forEach((r) => {
              if (Array.isArray(r.trips)) {
                r.trips = r.trips.filter((t) => !isSameTripItem(t, item));
              }
            });
          }
          updatedPerson.custom_data = custom;
          await personnelStore.savePerson(updatedPerson);
        }
      }
    }
    selectedTrips.value = [];
    await personnelStore.fetchPersonnel();
    alert(`Đã xóa thành công ${count} bản ghi!`);
  } catch (e) {
    console.error('Bulk delete error in ChildDashboardView:', e);
    alert('Có lỗi xảy ra khi xóa: ' + (e.message || e));
  }
};

const selectedTargetSummary = computed(() => {
  if (!selectedTargetKey.value) return null;
  if (tripTargetType.value === 'personnel') {
    const p = personnelStore.findPersonByCccd(selectedTargetKey.value);
    if (!p) return null;
    return {
      name: p.name || 'Cán bộ',
      sub: `${p.positionName || p.position || 'Cán bộ'}${p.departmentName ? ' · ' + p.departmentName : ''}`,
      cccd: p.cccd || p.cccdparent || selectedTargetKey.value,
      raw: p,
    };
  } else {
    const r = personnelStore.findRelativeByCccd(selectedTargetKey.value);
    if (!r) return null;
    return {
      name: r.relativeName || r.name || 'Thân nhân',
      sub: `${r.relationshipName || 'Thân nhân'} của ${r.parentName || r.parentPersonnelName || 'Cán bộ'}`,
      cccd: r.cccd || r.cccdthannhan || selectedTargetKey.value,
      raw: r,
    };
  }
});

const onTargetPersonChange = () => {};
const onTargetRelativeChange = () => {};

const openAddTripDialog = () => {
  if (currentDashboardConfig.value?.source === 'blank') {
    addCustomRow();
    return;
  }
  editingTripItem.value = null;
  selectedTargetKey.value = (personnelStore.personnelList[0]?.cccd || personnelStore.personnelList[0]?.id) || '';
  tripTargetType.value = 'personnel';
  tripFormData.value = {
    countryName: '',
    departureDate: '',
    arrivalDate: '',
    decisionNumber: '',
    fundingName: 'Ngân sách nhà nước',
    purpose: '',
    passportNumber: '',
  };
  isTripFormDialogOpen.value = true;
};

const saveTripForm = async () => {
  if (!selectedTargetSummary.value) {
    alert('Vui lòng chọn Cán bộ hoặc Thân nhân liên quan!');
    return;
  }
  if (!tripFormData.value.countryName || !tripFormData.value.countryName.trim()) {
    alert('Vui lòng nhập Quốc gia / Nơi đến của chuyến đi!');
    return;
  }

  try {
    const newTrip = {
      ...tripFormData.value,
      id: 'trip_' + Date.now(),
    };

    if (tripTargetType.value === 'personnel') {
      const targetPerson = selectedTargetSummary.value.raw;
      const updatedPerson = JSON.parse(JSON.stringify(targetPerson));
      if (!Array.isArray(updatedPerson.trips)) updatedPerson.trips = [];
      updatedPerson.trips.push(newTrip);
      await personnelStore.savePerson(updatedPerson);
    } else {
      const targetRel = selectedTargetSummary.value.raw;
      // Tìm cán bộ cha của thân nhân này
      const parentCccd = targetRel.cccdparent || targetRel.parentCccd || targetRel.parentPersonnelCccd;
      const parentPerson = personnelStore.findPersonByCccd(parentCccd) || (personnelStore.personnelList || []).find((p) => p.id === targetRel.personnelId);
      
      if (parentPerson) {
        const updatedParent = JSON.parse(JSON.stringify(parentPerson));
        if (!Array.isArray(updatedParent.relatives)) updatedParent.relatives = [];
        const relIdx = updatedParent.relatives.findIndex((r) => {
          const rCccd = r.cccd || r.cccdthannhan || r.code || r.id;
          return rCccd === selectedTargetKey.value || r.id === targetRel.id;
        });
        if (relIdx !== -1) {
          if (!Array.isArray(updatedParent.relatives[relIdx].trips)) {
            updatedParent.relatives[relIdx].trips = [];
          }
          updatedParent.relatives[relIdx].trips.push(newTrip);
          await personnelStore.savePerson(updatedParent);
        } else {
          alert('Không tìm thấy thân nhân trong hồ sơ cán bộ tương ứng!');
          return;
        }
      } else {
        alert('Không tìm thấy cán bộ quản lý thân nhân này!');
        return;
      }
    }

    await personnelStore.fetchPersonnel();
    isTripFormDialogOpen.value = false;
    alert('Đã lưu chuyến đi thành công!');
  } catch (err) {
    alert('Lỗi lưu chuyến đi: ' + (err.message || err));
  }
};

const handlePersonnelSaved = async () => {
  await personnelStore.fetchPersonnel();
};

const isSeedingData = ref(false);
const handleSeedTrips = async () => {
  if (!confirm('Hệ thống sẽ tạo 20 bản ghi chuyến đi mẫu (10 cho Cán bộ & 10 cho Thân nhân) với đầy đủ thông tin chuẩn hóa. Tiếp tục?')) return;
  isSeedingData.value = true;
  try {
    await personnelStore.seedSampleTripsData();
    alert('Đã tạo thành công 20 dữ liệu chuyến đi mẫu cho 10 cán bộ và 10 thân nhân!');
  } catch (e) {
    alert('Lỗi tạo dữ liệu mẫu: ' + (e.message || e));
  } finally {
    isSeedingData.value = false;
  }
};

// Excel Export
const exportExcel = () => {
  const exportData = filteredList.value.map((t, idx) => {
    const row = {
      'STT': idx + 1,
      'Họ và tên': t.personnelName,
      'Đối tượng': t.isRelative ? 'Thân nhân' : 'Cán bộ',
      'Chức vụ': t.position,
      'Đơn vị công tác': t.departmentName,
      'Quốc gia': t.countryName,
      'Ngày xuất cảnh': formatDisplayDate(t.departureDate),
      'Ngày nhập cảnh': formatDisplayDate(t.arrivalDate),
      'Số quyết định': t.decisionNumber,
      'Nguồn kinh phí': t.fundingName,
      'Mục đích': t.purpose,
      'Trạng thái': getStatusLabel(t),
    };
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách Chuyến đi');
  XLSX.writeFile(wb, `Danh_sach_chuyen_di_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const loadCustomDashboards = async () => {
  try {
    const local = localStorage.getItem('custom_dashboards_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        customDashboards.value = parsed;
      }
    }
    const saved = await getAppSettings('custom_dashboards_config', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      customDashboards.value = saved;
      try {
        localStorage.setItem('custom_dashboards_config', JSON.stringify(saved));
      } catch (e) {}
    }
    // Sanitize card IDs: đảm bảo các thẻ con không bị trùng id: 'all' với thẻ gốc
    customDashboards.value.forEach((dash) => {
      (dash.metricCards || []).forEach((c, idx) => {
        if (idx > 0 && (!c.id || c.id === 'all')) {
          c.id = 'card_' + (dash.id || 'dash') + '_' + idx;
        }
      });
    });
  } catch (e) {
    console.error('Error loading custom dashboards in ChildDashboardView:', e);
  }
};

const initTopicColumns = async () => {
  const currentKey = `child_dashboard_cols_${topicId.value || 'default'}`;

  const finalizeColumns = () => {
    // Đảm bảo cho bảng Thân nhân mặc định: có thông tin cán bộ, họ tên thân nhân, mối quan hệ, trạng thái hiện diện và quốc gia
    if (currentDashboardConfig.value?.source === 'relatives') {
      selectedColIds.value = selectedColIds.value.map((id) => (id === 'countryName' ? 'countryNameTN' : id));
      const essential = ['_parentPersonnelName', 'relativeName', 'relationshipName', '_presenceStatus', 'countryNameTN'];
      const missing = essential.filter((c) => !selectedColIds.value.includes(c));
      if (missing.length > 0) {
        selectedColIds.value = [...missing, ...selectedColIds.value];
      }
    }
  };

  const sanitizeRelCols = (cols) => {
    if (currentDashboardConfig.value?.source === 'relatives' && Array.isArray(cols)) {
      return cols.map((id) => (id === 'countryName' ? 'countryNameTN' : id));
    }
    return cols;
  };

  // 1. Kiểm tra cấu hình riêng đã lưu trong DB TRƯỚC TIÊN (Ưu tiên tuyệt đối DB hệ thống)
  try {
    const dbCols = (await getAppSettings(currentKey, null)) || (topicId.value === 'trips' ? await getAppSettings('trips_dashboard_columns', null) : null);
    if (dbCols && Array.isArray(dbCols) && dbCols.length > 0) {
      const valid = sanitizeRelCols(dbCols.filter((id) => id !== 'status' && id !== 'tripStatus'));
      if (valid.length > 0) {
        selectedColIds.value = valid;
        finalizeColumns();
        try {
          localStorage.setItem(currentKey, JSON.stringify(valid));
        } catch (e) {}
        return;
      }
    }
  } catch (e) {}

  // 2. Kiểm tra cache local nếu DB chưa kịp trả về
  try {
    const localCols = localStorage.getItem(currentKey) || (topicId.value === 'trips' ? localStorage.getItem('trips_dashboard_columns') : null);
    if (localCols) {
      const parsed = JSON.parse(localCols);
      if (Array.isArray(parsed) && parsed.length > 0) {
        selectedColIds.value = sanitizeRelCols(parsed.filter((id) => id !== 'status' && id !== 'tripStatus'));
        finalizeColumns();
        return;
      }
    }
  } catch (e) {}

  // 3. Nếu trong customDashboards có cấu hình columns riêng của chuyên đề này
  if (currentDashboardConfig.value?.columns && currentDashboardConfig.value.columns.length > 0) {
    const validCfg = sanitizeRelCols(currentDashboardConfig.value.columns.filter((id) => id !== 'status' && id !== 'tripStatus'));
    if (validCfg.length > 0) {
      selectedColIds.value = validCfg;
      finalizeColumns();
      return;
    }
  }

  // 4. Mặc định: Hiển thị TOÀN BỘ các cột có trong chuyên đề (cột _primaryKey mặc định ẩn nhưng có trong danh sách chọn)
  const allIds = allAvailableColumnsList.value
    .map((c) => c.id)
    .filter((id) => id !== '_primaryKey' && id !== 'status' && id !== 'tripStatus');
  if (allIds.length > 0) {
    selectedColIds.value = sanitizeRelCols(allIds);
    finalizeColumns();
  }
};

const loadColumnsForCurrentCard = async () => {
  const isBaseline = activeMetricCardIdx.value <= 0;
  const currentKey = getCurrentCardColKey();

  const sanitizeRelCols = (cols) => {
    if (currentDashboardConfig.value?.source === 'relatives' && Array.isArray(cols)) {
      return cols.map((id) => (id === 'countryName' ? 'countryNameTN' : id));
    }
    return cols;
  };

  if (!isBaseline) {
    const card = activeMetricCards.value?.[activeMetricCardIdx.value];
    // 1. Kiểm tra columns riêng của thẻ trong cấu hình chuyên đề (customDashboards)
    if (card?.columns && Array.isArray(card.columns) && card.columns.length > 0) {
      const valid = sanitizeRelCols(card.columns.filter((id) => id !== 'status' && id !== 'tripStatus'));
      if (valid.length > 0) {
        selectedColIds.value = valid;
        return;
      }
    }

    // 2. Kiểm tra cache localStorage riêng của thẻ
    try {
      const local = localStorage.getItem(currentKey);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = sanitizeRelCols(parsed.filter((id) => id !== 'status' && id !== 'tripStatus'));
          if (valid.length > 0) {
            selectedColIds.value = valid;
            return;
          }
        }
      }
    } catch (e) {}

    // 3. Kiểm tra Directus DB settings riêng của thẻ
    try {
      const dbCols = await getAppSettings(currentKey, null);
      if (dbCols && Array.isArray(dbCols) && dbCols.length > 0) {
        const valid = sanitizeRelCols(dbCols.filter((id) => id !== 'status' && id !== 'tripStatus'));
        if (valid.length > 0) {
          selectedColIds.value = valid;
          try {
            localStorage.setItem(currentKey, JSON.stringify(valid));
          } catch (e) {}
          return;
        }
      }
    } catch (e) {}

    // 4. Nếu thẻ này chưa từng tùy biến cột riêng -> kế thừa bộ cột cơ sở của chuyên đề
  }

  // Nạp cấu hình cột cơ sở của toàn bộ chuyên đề
  await initTopicColumns();
};

// ==================== LƯU VÀ TẢI BỘ LỌC VÀO DATABASE ====================
let filterSaveDebounceTimer = null;
const saveTopicFilterState = async () => {
  const tid = topicId.value;
  if (!tid) return;
  const filterKey = `child_dashboard_filter_${tid}`;
  const filterData = {
    searchQuery: searchQuery.value,
  };
  try {
    localStorage.setItem(filterKey, JSON.stringify(filterData));
    await saveAppSettings(filterKey, filterData);
  } catch (e) {
    console.warn('Lỗi khi lưu bộ lọc chuyên đề vào DB:', e);
  }
};

const triggerAutoSaveFilter = () => {
  if (filterSaveDebounceTimer) clearTimeout(filterSaveDebounceTimer);
  filterSaveDebounceTimer = setTimeout(() => {
    saveTopicFilterState();
  }, 400);
};

const loadTopicFilterState = async () => {
  const tid = topicId.value;
  if (!tid) return;
  // Mặc định luôn hiện thống kê đầu tiên (Tổng cộng / Baseline) và dọn sạch các bộ lọc cũ
  activeMetricCardIdx.value = -1;
  statusFilter.value = 'all';
  timeFilterYear.value = 'all';
  selectedCountry.value = '';
  selectedDepartment.value = '';
  selectedFunding.value = '';
  customFilterField.value = '';
  customFilterValue.value = '';
};

watch(
  [searchQuery],
  () => {
    triggerAutoSaveFilter();
  }
);

// Đồng bộ chuyển đổi cột khi người dùng bấm chọn thẻ thống kê KPI khác nhau
watch(
  () => activeMetricCardIdx.value,
  async (newVal, oldVal) => {
    if (newVal === oldVal) return;
    await loadColumnsForCurrentCard();
  }
);

const handleRouteQueryChange = () => {
  if (route.query?.card) {
    activeMetricCardId.value = String(route.query.card);
  }
  if (route.query?.country) {
    selectedCountry.value = String(route.query.country);
  }
  if (route.query?.funding) {
    selectedFunding.value = String(route.query.funding);
  }
  if (route.query?.department) {
    selectedDepartment.value = String(route.query.department);
  }
  if (route.query?.search) {
    searchQuery.value = String(route.query.search);
  }
  if (route.query?.filterField && route.query?.filterValue) {
    customFilterField.value = String(route.query.filterField);
    customFilterValue.value = String(route.query.filterValue);
  }
};

watch(
  () => topicId.value,
  async () => {
    // Chuyển chuyên đề: luôn mặc định hiện thống kê đầu tiên (Tổng cộng)
    activeMetricCardIdx.value = -1;
    dtFirst.value = 0;
    currentPage.value = 1;
    searchQuery.value = '';
    statusFilter.value = 'all';
    timeFilterYear.value = 'all';
    selectedCountry.value = '';
    selectedDepartment.value = '';
    selectedFunding.value = '';
    customFilterField.value = '';
    customFilterValue.value = '';
    await loadCustomTableRows();
    await loadTopicFilterState();
    await loadColumnsForCurrentCard();
    currentPage.value = 1;
    handleRouteQueryChange();
  }
);

watch(
  () => route.query,
  () => {
    handleRouteQueryChange();
  },
  { deep: true }
);

watch(
  () => allAvailableColumnsList.value.length,
  (newLen, oldLen) => {
    if (newLen > (oldLen || 0) && selectedColIds.value.length <= 2) {
      loadColumnsForCurrentCard();
    }
  }
);

const currentRowHeightLimit = ref(localStorage.getItem('app_table_row_clamp') || '1');
const onRowHeightChanged = (e) => {
  currentRowHeightLimit.value = String(e.detail || '1');
};

onMounted(async () => {
  await Promise.all([
    (!personnelStore.importMappingTrips || personnelStore.importMappingTrips.length === 0)
      ? personnelStore.loadSettings()
      : Promise.resolve(),
    loadCustomDashboards(),
  ]);
  await loadCustomTableRows();
  await loadTopicFilterState();
  await loadColumnsForCurrentCard();
  handleRouteQueryChange();
  loadNameColConfig();
  loadCustomParentLabel();
  window.addEventListener('table-row-height-changed', onRowHeightChanged);
  window.addEventListener('table-show-col-index-changed', onColIndexChanged);
});

onUnmounted(() => {
  window.removeEventListener('table-row-height-changed', onRowHeightChanged);
  window.removeEventListener('table-show-col-index-changed', onColIndexChanged);
});
</script>

<style scoped>
.badge-code-cd {
  background: #1e3a8a;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 6px;
}

.btn-action-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-action-outline:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.btn-detail-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #1e3a8a;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-detail-action:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.15);
}

/* Quick Stat Cards */
.quick-stat-card {
  flex: 1;
  min-width: 170px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}
.quick-stat-card:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}
.quick-stat-card.stat-active {
  border-color: #1e3a8a;
  background: #eff6ff;
  box-shadow: 0 1px 3px rgba(30, 58, 138, 0.12);
}

.dot-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot-blue { background: #2563eb; }
.dot-green { background: #16a34a; }
.dot-amber { background: #d97706; }
.dot-red { background: #dc2626; }

.stat-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
}
.stat-number {
  font-size: 1.15rem;
  font-weight: 700;
}
.num-blue { color: #1e3a8a; }
.num-green { color: #15803d; }
.num-amber { color: #b45309; }
.num-red { color: #b91c1c; }

/* Filter Selects */
.filter-select {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  font-size: 0.82rem;
  color: #334155;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
}
.filter-select:focus {
  border-color: #1e3a8a;
}

/* Trips Table */
.trips-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.trips-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}
.sortable-header {
  cursor: pointer;
  user-select: none;
}
.sortable-header:hover {
  background: #f1f5f9;
}
.trips-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}
.trips-table tr:hover {
  background: #f8fafc;
}
.trips-table tr.row-selected {
  background: #f0fdf4;
}

/* Status Pills */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-completed {
  background: #dcfce7;
  color: #15803d;
}
.status-completed .status-dot {
  background: #16a34a;
}
.status-abroad {
  background: #fef3c7;
  color: #b45309;
}
.status-abroad .status-dot {
  background: #d97706;
}
.status-overdue {
  background: #fee2e2;
  color: #b91c1c;
}
.status-overdue .status-dot {
  background: #dc2626;
}

.badge-role-tn {
  background: #f3e8ff;
  color: #7c3aed;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}
.code-badge-decision {
  background: #f1f5f9;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}
.badge-funding {
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.btn-action-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #dc2626;
  color: #ffffff;
  border: 1px solid #dc2626;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-action-primary:hover {
  background: #b91c1c;
  border-color: #b91c1c;
}

.btn-action-danger-solid {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #dc2626;
  color: #ffffff;
  border: 1px solid #dc2626;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-action-danger-solid:hover {
  background: #b91c1c;
  border-color: #b91c1c;
}

.btn-action-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-action-outline:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.btn-table-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-table-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}
.btn-table-info:hover {
  background: #dbeafe;
  border-color: #3b82f6;
}
.btn-table-danger {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}
.btn-table-danger:hover {
  background: #fee2e2;
  border-color: #ef4444;
}

.btn-pagination-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-pagination-nav:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}
.btn-pagination-nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Header Menu Dropdown & Filter Panel */
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
  padding: 10px;
  margin-top: 4px;
}

.header-menu-dropdown::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 0;
  right: 0;
  height: 12px;
  background: transparent;
}

.filter-panel-dropdown {
  width: 320px;
  max-width: 90vw;
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

/* DataTable Global Class Alignment (Matching PersonnelView) */
.table-actions {
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
}

:deep(.col-center) {
  text-align: center !important;
  justify-content: center !important;
}

:deep(.col-left) {
  text-align: left !important;
}

.badge-code {
  background: #f1f5f9;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  font-family: monospace;
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-green {
  background: #dcfce7;
  color: #15803d;
}

.badge-red {
  background: #fee2e2;
  color: #b91c1c;
}

.match-reasons-wrapper {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.match-reason-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #ffedd5;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
}

.table-col-header-wrap {
  display: block;
  width: 100%;
  white-space: normal !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  line-height: 1.35 !important;
}
:deep(.p-datatable .p-datatable-thead > tr > th .p-column-title),
:deep(.p-datatable .p-datatable-thead > tr > th .p-column-header-content) {
  white-space: normal !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  line-height: 1.35 !important;
  max-width: 100%;
}

.name-col-config-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 9998;
}
.name-col-config-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.name-col-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #334155;
  cursor: pointer;
  padding: 3px 0;
}
.name-col-opt input[type="checkbox"] {
  accent-color: #3b82f6;
  width: 15px;
  height: 15px;
}

.settings-select {
  width: 100%;
  height: 36px;
  padding: 6px 30px 6px 10px;
  font-size: 0.82rem;
  font-weight: 500;
  color: #1e293b;
  background-color: #ffffff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 14px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  cursor: pointer;
}
.settings-select:hover {
  border-color: #94a3b8;
}
.settings-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
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

