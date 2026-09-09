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
        <!-- Biểu tượng Bảng với màu sắc tùy chỉnh -->
        <button
          v-if="authStore.isAdmin"
          type="button"
          class="table-icon-badge-btn"
          :style="{
            color: getTableIconColor(currentDashboardId),
            borderColor: getTableIconColor(currentDashboardId) + '40',
            background: getTableIconColor(currentDashboardId) + '15'
          }"
          @click="openIconColorDialog(currentDashboardId, currentDashboardConfig.title || 'Bảng dữ liệu')"
          title="Nhấn để đổi biểu tượng (Icon) & màu sắc bảng"
        >
          <i :class="['pi', getTableIcon(currentDashboardId)]" style="font-size: 1.25rem;"></i>
        </button>
        <span
          v-else
          class="table-icon-badge"
          :style="{
            color: getTableIconColor(currentDashboardId),
            borderColor: getTableIconColor(currentDashboardId) + '40',
            background: getTableIconColor(currentDashboardId) + '15'
          }"
        >
          <i :class="['pi', getTableIcon(currentDashboardId)]" style="font-size: 1.25rem;"></i>
        </span>
        <div>
          <h1 style="font-size: 1.35rem; font-weight: 700; color: #0f172a; margin: 0; display: inline-flex; align-items: center; gap: 8px;">
            {{ currentDashboardConfig.title || 'Danh sách chuyến đi' }}
            <span style="font-size: 0.85rem; font-weight: 500; color: #64748b;">· {{ filteredList.length }} kết quả</span>
          </h1>
        </div>
      </div>

       <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <!-- Ô Tìm kiếm nhanh trực tiếp trên thanh công cụ -->
        <div class="search-input-wrapper">
          <i class="pi pi-search search-icon-left"></i>
          <InputText
            v-model="searchQuery"
            placeholder="Tìm theo tên, CCCD, chức vụ, đơn vị, số QĐ, quốc gia..."
            size="small"
            style="width: 260px; font-size: 0.8rem; height: 32px;"
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
            <div style="padding: 8px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
                <div style="font-size: 0.78rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                  <i class="pi pi-sliders-h" style="color: #7c3aed;"></i>
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
              :widthMode="colWidthMode"
              :widthPx="colWidthPx"
              :hasCustomDraggedWidths="hasCustomDraggedWidths"
              @change="onColumnsChange"
              @open-col-menu="handleChildColMenuFromSelector"
              @change-width-setting="onColWidthSettingChange"
              @reset-dragged-widths="onResetDraggedWidths"
            />
          </div>
        </div>

        <!-- 📥 Menu Xuất / Nhập Dropdown chuẩn dùng chung ExportImportMenu -->
        <ExportImportMenu
          :tableTitle="currentDashboardConfig?.title || 'Chuyến đi'"
          :selectedCount="selectedTrips.length"
          @import="openImportWizard()"
          @export-pdf="openAdvancedDocxExport()"
          @export-excel="exportExcel"
        />

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

        <!-- Thêm Bản Ghi Mới trực tiếp vào Bảng này -->
        <Button
          icon="pi pi-plus"
          :label="getAddButtonLabel()"
          severity="success"
          size="small"
          @click="openAddTripDialog"
          :title="`Thêm mới trực tiếp vào bảng ${currentDashboardConfig.title || ''}`"
          style="font-size: 0.8rem;"
        />
      </div>
    </div>

    <!-- Lark Base View Tabs & Quick Filters Bar -->
    <div v-if="currentDashboardConfig.displayMode !== 'appendix'" class="lark-base-view-tabs-container">
      <div class="lark-base-view-tabs-strip">
        <template v-for="(card, cIdx) in activeMetricCards" :key="card.id || cIdx">
          <div
            v-if="!isCardHidden(card)"
            class="lark-tab-item-wrapper"
            :class="{ 'tab-active': isCardActive(card, cIdx), 'menu-open': activeTabMenuKey === `card_${cIdx}` }"
          >
            <button
              type="button"
              class="lark-base-tab-item"
              :class="{ 'tab-active': isCardActive(card, cIdx) }"
              @click="toggleMetricCardFilter(card, cIdx)"
            >
              <i class="pi pi-table" style="font-size: 0.82rem; color: #0284c7;"></i>
              <span style="font-weight: 700;">{{ getCardDisplayLabel(card) }}</span>
              <span :class="['lark-tab-count-pill', `pill-${card.color || 'blue'}`]">
                {{ getCardMetricValue(card) }}
              </span>
            </button>

            <!-- Menu nút thao tác View: Setup (Dời trái, Dời phải, Sửa, Xóa) -->
            <div v-if="authStore.isAdmin" class="lark-tab-actions">
              <button
                type="button"
                class="btn-tab-action btn-tab-setup"
                :class="{ active: activeTabMenuKey === `card_${cIdx}` }"
                @click.stop.prevent="toggleTabMenu('card', cIdx)"
                @mousedown.stop
                title="Tùy chọn Chế độ xem"
              >
                <i class="pi pi-ellipsis-v"></i>
              </button>
              <div v-if="activeTabMenuKey === `card_${cIdx}`" class="lark-tab-dropdown-menu" @click.stop @mousedown.stop>
                <button type="button" class="lark-tab-menu-item" @click.stop="openEditViewDialog(card, cIdx); closeTabMenu()">
                  <i class="pi pi-pencil"></i>
                  <span>Sửa tên & Điều kiện lọc</span>
                </button>
                <button v-if="cIdx > 0" type="button" class="lark-tab-menu-item" @click.stop="moveView(cIdx, -1); closeTabMenu()">
                  <i class="pi pi-arrow-left"></i>
                  <span>Dời sang trái</span>
                </button>
                <button v-if="cIdx < activeMetricCards.length - 1" type="button" class="lark-tab-menu-item" @click.stop="moveView(cIdx, 1); closeTabMenu()">
                  <i class="pi pi-arrow-right"></i>
                  <span>Dời sang phải</span>
                </button>
                <div v-if="cIdx > 0" class="lark-tab-menu-divider"></div>
                <button v-if="cIdx > 0" type="button" class="lark-tab-menu-item item-danger" @click.stop="deleteView(card, cIdx); closeTabMenu()">
                  <i class="pi pi-trash"></i>
                  <span>Xóa Chế độ xem</span>
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Nút Thêm Chế độ xem / Thẻ lọc mới chuẩn Lark Base (+ Add View) -->
        <button
          v-if="authStore.isAdmin"
          type="button"
          class="lark-base-tab-add"
          @click="openAddViewDialog"
          title="+ Thêm Chế độ xem (View) mới cho bảng này"
        >
          <i class="pi pi-plus" style="font-size: 0.72rem;"></i>
          <span>Thêm View</span>
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
              {{ filteredList.length }} kết quả
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
        currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} kết quả"
        :loading="personnelStore.loading"
        responsiveLayout="scroll"
        stripedRows
        removableSort
        :resizableColumns="true"
        columnResizeMode="expand"
        class="p-datatable-sm custom-datatable"
        :tableStyle="{ minWidth: 'max-content', width: '100%' }"
        @column-resize-end="onColumnResizeEnd"
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
          :pt="{ headerCell: { 'data-column-id': col.id } }"
          :headerStyle="getColWidthStyle(col)"
          :bodyStyle="getColWidthStyle(col)"
        >
          <template #header>
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0;">
                <span class="table-col-header-wrap">
                  {{ col.label }}
                </span>
              </div>
              <button
                type="button"
                class="btn-col-menu-trigger"
                @click.stop="openChildColMenu($event, col)"
                title="Tùy chỉnh cột này (Đổi tên, đổi kiểu, ẩn cột...)"
              >
                <i class="pi pi-cog" style="font-size: 0.72rem;"></i>
              </button>
            </div>
          </template>
          <template #body="{ data }">
            <!-- 1. Cột Họ và tên (Cán bộ, Thân nhân... - chỉ hiện tên thuần túy) -->
            <template v-if="col.id === 'personnelName' || col.id === 'name' || col.id === 'ho_va_ten' || col.id === 'hoTen' || col.id === 'relativeName' || col.id === 'ho_va_ten_than_nhan'">
              <div
                class="inline-cell-wrapper"
                @dblclick.stop="startChildInlineEdit(data, col)"
                :title="'Nhấp đúp để chỉnh sửa nhanh ô này'"
              >
                <div v-if="editingChildCell?.uniqueKey === data.uniqueKey && editingChildCell?.colId === col.id" class="inline-edit-box" @click.stop>
                  <input
                    v-model="editingChildCell.value"
                    class="inline-edit-input"
                    autofocus
                    @keyup.enter="saveChildInlineEdit"
                    @keyup.esc="cancelChildInlineEdit"
                    @blur="saveChildInlineEdit"
                  />
                </div>
                <strong v-else style="color: #0f172a; font-weight: 700;">{{ getCellValue(data, col.id) || data[col.id] || '-' }}</strong>
              </div>
            </template>


            <!-- 2. Cột ngày tháng định dạng chuẩn (bất kể mã cột) -->
            <template v-else-if="col.format === 'date' || col.id === 'departureDate' || col.id === 'approvedDepartureDate' || col.id === 'arrivalDate' || col.id === 'approvedArrivalDate'">
              <span>{{ formatDisplayDate(getCellValue(data, col.id)) }}</span>
            </template>

            <!-- 3. Số quyết định -->
            <template v-else-if="col.id === 'decisionNumber' || col.id === 'decision'">
              <span v-if="getCellValue(data, col.id) && getCellValue(data, col.id) !== '-'" class="code-badge-decision">
                {{ getCellValue(data, col.id) }}
              </span>
              <span v-else style="color: #94a3b8;">-</span>
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
              <div v-if="getCheckboxFileItem(data, col.id).hasValue" style="display: flex; flex-direction: column; gap: 3px; font-size: 0.76rem; line-height: 1.35;">
                <div v-if="getCheckboxFileItem(data, col.id).file && (getCheckboxFileItem(data, col.id).file.url || getCheckboxFileItem(data, col.id).file.id)" style="display: flex; align-items: center; gap: 6px;">
                  <a
                    :href="getFileUrl(getCheckboxFileItem(data, col.id).file)"
                    target="_blank"
                    style="display: inline-flex; align-items: center; gap: 3px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 1px 6px; border-radius: 4px; text-decoration: none; font-size: 0.7rem; font-weight: 500; white-space: nowrap;"
                    title="Mở xem tệp"
                  >
                    <i class="pi pi-paperclip" style="font-size: 0.68rem;"></i>
                    <span>{{ getCheckboxFileItem(data, col.id).file.name || 'Tệp' }}</span>
                  </a>
                </div>
                <div v-if="getCheckboxFileItem(data, col.id).text" style="color: #1e293b; font-weight: 600; word-break: break-word; line-height: 1.35;">
                  {{ getCheckboxFileItem(data, col.id).text }}
                </div>
              </div>
              <span v-else>-</span>
            </template>

            <!-- Checkbox + File Loop column -->
            <template v-else-if="col.format === 'checkbox_file_loop'">
              <div v-if="getCheckboxFileLoopItems(data, col.id).length > 0" style="display: flex; flex-direction: column; gap: 6px;">
                <div
                  v-for="(it, iIdx) in getCheckboxFileLoopItems(data, col.id)"
                  :key="iIdx"
                  style="display: flex; flex-direction: column; gap: 2px; font-size: 0.76rem; line-height: 1.4;"
                >
                  <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                    <i
                      :class="it.checked ? 'pi pi-check-circle' : 'pi pi-circle'"
                      :style="{ fontSize: '0.75rem', color: it.checked ? '#16a34a' : '#94a3b8', flexShrink: 0 }"
                    ></i>
                    <span
                      v-if="it.selectedOptions && it.selectedOptions.length"
                      style="background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; white-space: nowrap; line-height: 1.3;"
                    >
                      {{ Array.isArray(it.selectedOptions) ? it.selectedOptions.join(', ') : it.selectedOptions }}
                    </span>
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
                  <div
                    v-if="it.text || (!it.selectedOptions || !it.selectedOptions.length)"
                    style="padding-left: 18px; word-break: break-word; line-height: 1.35; color: #1e293b;"
                  >
                    {{ it.text || '(Chưa nhập tên)' }}
                  </div>
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
                  style="display: flex; flex-direction: column; gap: 2px; font-size: 0.76rem; line-height: 1.4;"
                >
                  <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                    <i
                      :class="it.checked ? 'pi pi-check-circle' : 'pi pi-circle'"
                      :style="{ fontSize: '0.75rem', color: it.checked ? '#16a34a' : '#94a3b8', flexShrink: 0 }"
                    ></i>
                    <span
                      v-if="it.selectedOptions && it.selectedOptions.length"
                      style="background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; white-space: nowrap; line-height: 1.3;"
                    >
                      {{ Array.isArray(it.selectedOptions) ? it.selectedOptions.join(', ') : it.selectedOptions }}
                    </span>
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
                  <div
                    v-if="it.text || (!it.selectedOptions || !it.selectedOptions.length)"
                    style="padding-left: 18px; word-break: break-word; line-height: 1.35; color: #1e293b;"
                  >
                    {{ it.text || '(Chưa nhập tên)' }}
                  </div>
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
              <div v-if="getCheckboxFileItem(data, activeCardSingleCol.id).hasValue" style="display: flex; flex-direction: column; gap: 3px; font-size: 0.76rem; line-height: 1.35;">
                <div v-if="getCheckboxFileItem(data, activeCardSingleCol.id).file && (getCheckboxFileItem(data, activeCardSingleCol.id).file.url || getCheckboxFileItem(data, activeCardSingleCol.id).file.id)" style="display: flex; align-items: center; gap: 6px;">
                  <a
                    :href="getFileUrl(getCheckboxFileItem(data, activeCardSingleCol.id).file)"
                    target="_blank"
                    style="display: inline-flex; align-items: center; gap: 3px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 1px 6px; border-radius: 4px; text-decoration: none; font-size: 0.7rem; font-weight: 500; white-space: nowrap;"
                    title="Mở xem tệp"
                  >
                    <i class="pi pi-paperclip" style="font-size: 0.68rem;"></i>
                    <span>{{ getCheckboxFileItem(data, activeCardSingleCol.id).file.name || 'Tệp' }}</span>
                  </a>
                </div>
                <div v-if="getCheckboxFileItem(data, activeCardSingleCol.id).text" style="color: #1e293b; font-weight: 600; word-break: break-word; line-height: 1.35;">
                  {{ getCheckboxFileItem(data, activeCardSingleCol.id).text }}
                </div>
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

        <!-- Cột Thao tác: Xem trực tiếp PDF (Frozen Right) -->
        <Column
          header="Thao tác"
          headerClass="col-center"
          bodyClass="col-center"
          frozen
          alignFrozen="right"
          :headerStyle="{ width: '110px', minWidth: '110px', background: '#f8fafc', fontWeight: '700', zIndex: 10 }"
          :bodyStyle="{ width: '110px', minWidth: '110px', background: '#f8fafc', zIndex: 10 }"
        >
          <template #body="{ data }">
            <Button
              icon="pi pi-eye"
              label="Xem PDF"
              severity="danger"
              size="small"
              outlined
              :loading="rowPreviewingKey === (data.uniqueKey || data.id)"
              @click.stop="previewPdfForRow(data)"
              style="font-size: 0.72rem; padding: 3px 8px;"
              title="Xem trực tiếp PDF hồ sơ cán bộ này"
            />
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
      :columns="allAvailableColumnsList"
      @saved="handlePersonnelSaved"
      @deleted="handlePersonnelSaved"
    />

    <!-- Dialog Quản lý Chế độ xem (View) đa hình (Thêm / Sửa / Xóa / Bộ lọc điều kiện dùng chung) -->
    <TableViewManagerDialog
      v-model="isViewManagerOpen"
      :mode="viewManagerMode"
      :viewData="selectedViewForEdit"
      :canDelete="selectedViewIdx > 0"
      :columns="allAvailableColumnsList"
      :tableTitle="currentDashboardConfig.title || 'Bảng dữ liệu'"
      @save="handleSaveView"
      @delete="deleteView(selectedViewForEdit, selectedViewIdx)"
    />

    <!-- Advanced Word / PDF Export Dialog -->
    <AdvancedDocxExportDialog
      v-model="isExportDocxDialogOpen"
      :selectedPersonnel="selectedPersonnelForExport"
      :allPersonnel="allPersonnelForExport"
    />

    <!-- PDF Preview Dialog (Direct browser preview & print/download) -->
    <PdfPreviewDialog
      v-model="showRowPdfPreview"
      :pdfBlob="rowPreviewPdfBlob"
      :title="rowPreviewTitle"
      :fileName="rowPreviewFileName"
    />

    <!-- Excel Import Wizard (4 Steps) -->
    <ExcelImportWizard
      v-model:visible="isWizardOpen"
      :defaultTarget="wizardTarget"
      @imported="onWizardImported"
    />

    <!-- Name Column Config Popover -->
    <div v-if="showNameColConfig" class="name-col-config-overlay" @click.self="showNameColConfig = false">
      <div class="name-col-config-panel" :style="nameColConfigPos">
        <div style="font-weight: 700; font-size: 0.82rem; margin-bottom: 4px; color: #1e293b;">
          Tùy chỉnh trường hiển thị ({{ getParentColPrefix() }})
        </div>
        <div style="font-size: 0.68rem; color: #64748b; margin-bottom: 8px;">
          Tick chọn các cột từ hồ sơ chính để hiển thị gộp vào cột này:
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; max-height: 220px; overflow-y: auto; padding-right: 4px;">
          <label
            v-for="opt in availableParentFields"
            :key="opt.key"
            class="name-col-opt"
            style="display: flex; align-items: center; gap: 6px; font-size: 0.76rem; color: #334155; cursor: pointer; padding: 2px 4px;"
            :style="nameColFields[opt.key] ? 'background: #eff6ff; font-weight: 600; color: #1d4ed8;' : ''"
          >
            <input type="checkbox" :checked="Boolean(nameColFields[opt.key])" @change="toggleNameColField(opt.key)" style="accent-color: #2563eb; cursor: pointer;" />
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ opt.label }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Dialog Thêm Cột Mới chuẩn Lark Base -->
    <AddColumnDialog
      v-model:visible="isAddColumnDialogOpen"
      :tableSource="currentDashboardConfig.source || 'trips'"
      :targetIndex="addChildColTargetIndex"
      @save="saveNewColumn"
    />
  </div>

    <!-- Header Cột thông minh Context Menu Popover -->
    <ColumnHeaderMenu
      v-model:visible="isChildColMenuVisible"
      :column="selectedChildMenuCol"
      :tableSource="currentDashboardConfig.source || 'trips'"
      :position="childColMenuPosition"
      :nameColFields="nameColFields"
      :availableParentFields="availableParentFields"
      @rename-column="onChildRenameColumn"
      @change-format="onChildChangeColumnFormat"
      @change-formula-type="onChildChangeFormulaType"
      @change-options="onChildChangeColumnOptions"
      @change-form-width="onChildChangeColumnFormWidth"
      @change-required="onChildChangeColumnRequired"
      @change-include-export="onChildChangeColumnIncludeExport"
      @change-show-in-detail="onChildChangeColumnShowInDetail"
      @change-lookup="onChildChangeColumnLookup"
      @change-name-col-field="toggleNameColField"
      @delete-column="onChildDeleteColumnFromTable"
      @hide-column="onChildHideColumn"
      @filter-column="onChildFilterByColumn"
      @insert-left="onInsertChildColLeft"
      @insert-right="onInsertChildColRight"
      @duplicate-column="onDuplicateChildCol"
      @open-key-config="isKeyLinkDialogOpen = true"
    />

    <!-- Dialog Cấu hình Khóa Định danh & Khóa Liên Kết giữa các Bảng -->
    <TableKeyLinkDialog
      v-model:visible="isKeyLinkDialogOpen"
      :activeSource="currentDashboardConfig.source || 'trips'"
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
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { usePersonnelStore } from '@/stores/personnel';
import { useAuthStore } from '@/stores/auth';
import { getAppSettings, saveAppSettings } from '@/api/settings';
import { syncCollectionFields, createDirectusField } from '@/api/fields';
import PersonnelDialog from '@/components/personnel/PersonnelDialog.vue';
import AdvancedDocxExportDialog from '@/components/common/AdvancedDocxExportDialog.vue';
import ColumnSelector from '@/components/common/ColumnSelector.vue';
import ColumnHeaderMenu from '@/components/common/ColumnHeaderMenu.vue';
import AddColumnDialog from '@/components/common/AddColumnDialog.vue';
import TableKeyLinkDialog from '@/components/common/TableKeyLinkDialog.vue';
import TableIconColorDialog from '@/components/common/TableIconColorDialog.vue';
import TableViewManagerDialog from '@/components/common/TableViewManagerDialog.vue';
import PdfPreviewDialog from '@/components/common/PdfPreviewDialog.vue';
import ExcelImportWizard from '@/components/common/ExcelImportWizard.vue';
import ExportImportMenu from '@/components/common/ExportImportMenu.vue';
import { ensureStandardDashboards } from '@/utils/tableRegistry';
import { getEffectiveExportTemplateBuffer, generateSinglePersonnelPdfBlob } from '@/utils/docxExport';

import { computeColumnIndexMap, formatDate, parseDateObj, parseDateValue, computePresenceStatus, computeOverdueStatus, computeTripPresence, evaluateFormula, evaluateLookup, evaluateRollup, computeDepartBeforeDecision, formatGenericCellValue, resolvePresence, isPresenceField, resolveVirtualColumnValue, getPresenceBadge, generateSlug, formatOptions } from '@/utils/formatters';
import { buildTopicSourceList, computeMetricCardCount, isSameCard, matchCardCondition as matchSharedCardCondition, isCardAllType as isSharedCardAllType, checkConditionMatch, normalizeFieldValueToText, extractRowFieldValue } from '@/utils/dashboardMetrics';
import { getFileUrl } from '@/api/files';
import * as XLSX from 'xlsx';

const route = useRoute();
const router = useRouter();
const personnelStore = usePersonnelStore();
const authStore = useAuthStore();
const isExportDocxDialogOpen = ref(false);

// PDF Row Preview
const showRowPdfPreview = ref(false);
const rowPreviewPdfBlob = ref(null);
const rowPreviewTitle = ref('');
const rowPreviewFileName = ref('');
const rowPreviewingKey = ref(null);

const previewPdfForRow = async (row) => {
  if (!row) return;
  const rowKey = row.uniqueKey || row.id;
  rowPreviewingKey.value = rowKey;

  try {
    const p = resolvePersonFromItem(row) || row.rawPerson || (row.name ? row : null);
    if (!p) {
      alert('Không tìm thấy hồ sơ cán bộ tương ứng để xuất PDF!');
      return;
    }

    const exportOpts = {
      includeRelatives: true,
      includeTrips: true,
      showColumnNumbers: false,
    };
    const tplBuffer = await getEffectiveExportTemplateBuffer(exportOpts, personnelStore);
    const blob = await generateSinglePersonnelPdfBlob(tplBuffer, p, personnelStore, authStore.currentUser, exportOpts);

    rowPreviewPdfBlob.value = blob;
    rowPreviewTitle.value = `Hồ sơ: ${p.name || p.ho_ten || 'Cán bộ'}`;
    rowPreviewFileName.value = `Ho_so_${(p.name || p.ho_ten || 'Can_bo').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}.pdf`;
    showRowPdfPreview.value = true;
  } catch (err) {
    console.error('Lỗi khi xem PDF:', err);
    alert('Không thể tạo bản xem trước PDF: ' + (err.message || err));
  } finally {
    rowPreviewingKey.value = null;
  }
};

// Excel Import Wizard
const isWizardOpen = ref(false);
const wizardTarget = ref('trips');

const openImportWizard = (target = null) => {
  if (target) {
    wizardTarget.value = target;
  } else {
    const src = currentDashboardConfig.value?.source;
    if (src === 'relatives') wizardTarget.value = 'relative';
    else if (src === 'personnel') wizardTarget.value = 'personnel';
    else wizardTarget.value = 'trips';
  }
  isWizardOpen.value = true;
};

const onWizardImported = async () => {
  await personnelStore.fetchPersonnel();
};

// Lark Tab Setup Menu
const activeTabMenuKey = ref(null);
const toggleTabMenu = (type, idx) => {
  const key = `${type}_${idx}`;
  activeTabMenuKey.value = activeTabMenuKey.value === key ? null : key;
};
const closeTabMenu = () => {
  activeTabMenuKey.value = null;
};
const handleGlobalTabMenuClick = (e) => {
  if (e?.target && (e.target.closest('.lark-tab-actions') || e.target.closest('.btn-tab-setup') || e.target.closest('.lark-tab-dropdown-menu'))) {
    return;
  }
  closeTabMenu();
};

// ===== Name Column Config (Linh hoạt cho mọi mô hình: Cán bộ, Học sinh, Nhân sự...) =====
const NAME_COL_IDS = new Set(['_parentPersonnelName']);
const isNameColumn = (colId) => NAME_COL_IDS.has(colId);

const isChildPrimaryKey = (colId) => {
  if (!colId) return false;
  const src = currentDashboardConfig.value?.source;
  if (src === 'relatives') return personnelStore.getRelativeKeyField() === colId;
  if (src === 'trips') return personnelStore.getTripKeyField() === colId;
  return personnelStore.getPersonnelKeyField() === colId;
};

const availableParentFields = computed(() => {
  const list = [];
  const seen = new Set();

  // 1. Cột Họ và tên (luôn là trường định danh chính)
  list.push({ key: 'name', label: 'Họ và tên' });
  seen.add('name');

  // 2. Toàn bộ các cột từ Bảng Cán bộ / Hồ sơ chính (theo cấu hình cài đặt)
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

  // 3. Các trường cơ bản dự phòng nếu bảng chưa khai báo
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

const getParentColPrefix = () => {
  const custom = customParentLabels.value[topicId.value] || localStorage.getItem('parent_col_label_' + topicId.value);
  if (custom) return custom;
  return 'Cán bộ';
};

const getPersonFieldValue = (data, fieldKey) => {
  if (!data) return '';
  const parentPerson = data.rawPerson || (data.cccdparent ? personnelStore.findPersonByCccd(data.cccdparent) : null) || (!data.isRelative ? data : null);
  if (!parentPerson) {
    if (fieldKey === 'name') return data.parentPersonnelName || data.parentName || data.name || '-';
    return '';
  }

  const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
  const posField = personnelStore.getPersonnelPositionField ? personnelStore.getPersonnelPositionField() : 'position';
  const deptField = personnelStore.getPersonnelDepartmentField ? personnelStore.getPersonnelDepartmentField() : 'departmentName';

  // 1. Tên
  if (fieldKey === 'name') {
    return parentPerson.name || parentPerson.fullName || data.parentPersonnelName || data.parentName || data.name || '-';
  }

  // 2. CCCD / Mã định danh
  if (fieldKey === 'cccdCB' || fieldKey === pKeyField || fieldKey === 'cccd' || fieldKey === 'cccdparent') {
    const cVal = parentPerson[pKeyField] || parentPerson.cccd || parentPerson.cccdparent || data.parentCccd || data.cccdparent || '';
    if (cVal && String(cVal).trim() !== '' && String(cVal).trim() !== '-' && !String(cVal).startsWith('p_') && !String(cVal).startsWith('cd_') && !String(cVal).startsWith('rel_') && !String(cVal).startsWith('trip_')) {
      return String(cVal).trim();
    }
    return '';
  }

  // 3. Chức vụ / Vị trí
  if (fieldKey === 'position' || fieldKey === posField || fieldKey === 'positionName' || fieldKey === 'chuc_vu') {
    const pVal = parentPerson[posField] || parentPerson.positionName || parentPerson.position || data.parentPosition || '';
    if (pVal && String(pVal).trim() !== '' && String(pVal).trim() !== '-') return String(pVal).trim();
    return '';
  }

  // 4. Đơn vị công tác / Lớp / Khối / Phòng ban
  if (fieldKey === 'department' || fieldKey === deptField || fieldKey === 'departmentName' || fieldKey === 'departmentId' || fieldKey === 'don_vi') {
    const dVal = parentPerson[deptField] || parentPerson.departmentName || (parentPerson.departmentId ? personnelStore.getDepartmentName(parentPerson.departmentId) : '') || data.parentDepartment || '';
    if (dVal && String(dVal).trim() !== '' && String(dVal).trim() !== '-') return String(dVal).trim();
    return '';
  }

  // 5. Mọi trường tùy biến động khác (Học sinh: Lớp, Trường, GVCN, Khối, Điểm... hoặc Nhân sự: SĐT, Email...)
  let custom = parentPerson.custom_data;
  if (typeof custom === 'string') {
    try { custom = JSON.parse(custom); } catch (e) { custom = {}; }
  }
  const val = parentPerson[fieldKey] ?? custom?.[fieldKey];
  if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '-') {
    return String(val).trim();
  }

  return '';
};
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
  addChildColTargetIndex.value = -1;
  isAddColumnDialogOpen.value = true;
};

// ===== Lark Base: Đồng bộ Cấu hình Cột xuống Mọi Khóa DB & Directus =====
const persistTableMapping = async (src, mappingData) => {
  if (src === 'blank') {
    try {
      localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
      await saveAppSettings('custom_dashboards_config', customDashboards.value);
    } catch (e) {}
    return;
  }
  let keys = ['mapping_config_trips', 'import_mapping_trips', 'importMappingTrips'];
  if (src === 'relatives') {
    keys = ['mapping_config_relative', 'import_mapping_relative', 'importMappingRelative'];
    personnelStore.importMappingRelative = mappingData;
  } else if (src === 'personnel') {
    keys = ['mapping_config_personnel', 'import_mapping_personnel', 'importMappingPersonnel'];
    personnelStore.importMappingPersonnel = mappingData;
  } else {
    personnelStore.importMappingTrips = mappingData;
  }
  try {
    await Promise.all(keys.map((k) => {
      try { localStorage.setItem(k, JSON.stringify(mappingData)); } catch (e) {}
      return saveAppSettings(k, mappingData);
    }));
  } catch (err) {
    console.error('persistTableMapping error:', err);
  }
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
        if (typeof colPayload.targetIndex === 'number' && colPayload.targetIndex >= 0) {
          cDash.customColumns.splice(colPayload.targetIndex, 0, colPayload);
        } else {
          cDash.customColumns.push(colPayload);
        }
        try {
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
        } catch (e) {}
      }
      if (!selectedColIds.value.includes(colPayload.id)) {
        if (typeof colPayload.targetIndex === 'number' && colPayload.targetIndex >= 0) {
          selectedColIds.value.splice(colPayload.targetIndex, 0, colPayload.id);
        } else {
          selectedColIds.value.push(colPayload.id);
        }
      }
      await onColumnsChange(selectedColIds.value);
      isAddColumnDialogOpen.value = false;
      alert(`Đã tạo thành công cột "${colPayload.label}" trên bảng!`);
      return;
    }

    let mappingRef = personnelStore.importMappingTrips;
    if (src === 'relatives') {
      mappingRef = personnelStore.importMappingRelative;
    } else if (src === 'personnel') {
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
    if (typeof colPayload.targetIndex === 'number' && colPayload.targetIndex >= 0) {
      mappingRef[0].columns.splice(colPayload.targetIndex, 0, colPayload);
    } else {
      mappingRef[0].columns.push(colPayload);
    }

    // Lưu đồng bộ toàn diện vào TẤT CẢ các khóa cấu hình (mapping_config_* & import_mapping_*)
    await persistTableMapping(src, mappingRef);

    // Đồng bộ tạo cột vật lý trên Directus ngay lập tức
    try {
      createDirectusField('personnels', colPayload).catch(() => {});
    } catch (e) {}

    // Tự động kích hoạt hiển thị cột mới trên bảng hiện tại
    if (!selectedColIds.value.includes(colPayload.id)) {
      if (typeof colPayload.targetIndex === 'number' && colPayload.targetIndex >= 0) {
        selectedColIds.value.splice(colPayload.targetIndex, 0, colPayload.id);
      } else {
        selectedColIds.value.push(colPayload.id);
      }
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
const systemBranding = ref({});
const loadSystemBranding = async () => {
  try {
    const local = localStorage.getItem('system_branding_config');
    if (local) {
      systemBranding.value = JSON.parse(local);
    }
    const saved = await getAppSettings('system_branding_config', null);
    if (saved) {
      systemBranding.value = saved;
      try { localStorage.setItem('system_branding_config', JSON.stringify(saved)); } catch (e) {}
    }
  } catch (e) {}
};

const getInitialCustomDashboards = () => {
  let list = [];
  try {
    const local = localStorage.getItem('custom_dashboards_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
    }
  } catch (e) {}
  return ensureStandardDashboards(list);
};
const customDashboards = ref(getInitialCustomDashboards());

const topicId = computed(() => {
  if (route.path === '/personnel') return 'personnel';
  if (route.path === '/relatives') return 'relatives';
  if (route.path === '/trips') return 'trips';
  return route.params.id || 'trips';
});
const currentDashboardId = computed(() => topicId.value);

const currentDashboardConfig = computed(() => {
  const allConfigs = ensureStandardDashboards(customDashboards.value);
  const found = allConfigs.find((d) => d.id === currentDashboardId.value);
  if (found) {
    let title = found.title;
    if (found.id === 'personnel') title = found.title || systemBranding.value?.menuLabelPersonnel || 'Cán bộ';
    else if (found.id === 'relatives') title = found.title || systemBranding.value?.menuLabelRelatives || 'Thân nhân';
    else if (found.id === 'trips') title = found.title || systemBranding.value?.menuLabelTrips || 'Chuyến đi';
    return {
      ...found,
      title,
    };
  }
  return {
    id: currentDashboardId.value,
    code: '',
    title: 'Bảng dữ liệu',
    source: 'trips',
    isPending: false,
    metricCards: [
      { id: 'all', label: 'Toàn bộ', condition: 'all', color: 'blue' },
    ],
  };
});

// Tùy chỉnh Biểu tượng & Màu sắc Bảng
const isIconColorDialogOpen = ref(false);
const iconDialogTableId = ref('trips');
const iconDialogTableTitle = ref('Danh sách chuyến đi');
const iconDialogCurrentIcon = ref('pi-send');
const iconDialogCurrentColor = ref('#10b981');

const getTableIcon = (tableId) => {
  const cfg = (customDashboards.value || []).find((d) => d.id === tableId);
  if (cfg && cfg.icon) return cfg.icon;
  if (tableId === 'trips') return 'pi-send';
  if (tableId === 'personnel') return 'pi-users';
  if (tableId === 'relatives') return 'pi-heart';
  return 'pi-table';
};

const getTableIconColor = (tableId) => {
  const cfg = (customDashboards.value || []).find((d) => d.id === tableId);
  if (cfg && cfg.iconColor) return cfg.iconColor;
  if (tableId === 'trips') return '#10b981';
  if (tableId === 'personnel') return '#0284c7';
  if (tableId === 'relatives') return '#a855f7';
  return '#0284c7';
};

const openIconColorDialog = (tableId, defaultTitle) => {
  const id = tableId || currentDashboardId.value || 'trips';
  iconDialogTableId.value = id;
  iconDialogTableTitle.value = defaultTitle || currentDashboardConfig.value?.title || 'Bảng dữ liệu';
  iconDialogCurrentIcon.value = getTableIcon(id);
  iconDialogCurrentColor.value = getTableIconColor(id);
  isIconColorDialogOpen.value = true;
};

const onIconColorSaved = ({ tableId, icon, iconColor }) => {
  const idx = (customDashboards.value || []).findIndex((d) => d.id === tableId);
  if (idx !== -1) {
    customDashboards.value[idx].icon = icon;
    customDashboards.value[idx].iconColor = iconColor;
  }
};

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
    (route.query?.filterField && route.query?.filterValue) ||
    customFilterField.value
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
const isKeyLinkDialogOpen = ref(false);
const addChildColTargetIndex = ref(-1);

const openChildColMenu = (event, col) => {
  const thElem = event.currentTarget.closest('th') || event.currentTarget.closest('.table-col-header-wrap') || event.currentTarget;
  const thRect = thElem.getBoundingClientRect();
  const menuWidth = 360;
  const menuHeight = 520;
  const x = Math.max(10, Math.min(thRect.left, window.innerWidth - menuWidth - 20));
  let y = thRect.bottom + 4;
  if (y + menuHeight > window.innerHeight) {
    y = Math.max(10, window.innerHeight - menuHeight - 10);
  }
  childColMenuPosition.value = { x, y };
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
    return { key: 'custom_dashboards_config', mapping: [{ group: 'Cột bảng', columns: cDash?.customColumns || [] }], isBlank: true, cDash, src };
  }
  if (src === 'relatives') return { key: 'import_mapping_relative', mapping: personnelStore.importMappingRelative, src };
  if (src === 'personnel') return { key: 'import_mapping_personnel', mapping: personnelStore.importMappingPersonnel, src };
  return { key: 'import_mapping_trips', mapping: personnelStore.importMappingTrips, src };
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
  const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
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
    await persistTableMapping(src, mapping);
  }
};

const onChildChangeColumnRequired = async ({ colId, required }) => {
  const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
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
    await persistTableMapping(src, mapping);
  }
};

const onChildChangeColumnIncludeExport = async ({ colId, includeInExport }) => {
  const { mapping, isBlank, cDash, src } = getTargetMappingRef();
  if (isBlank && cDash) {
    const col = (cDash.customColumns || []).find((c) => c.id === colId);
    if (col) {
      col.includeInExport = Boolean(includeInExport);
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
        c.includeInExport = Boolean(includeInExport);
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) {
    await persistTableMapping(src, mapping);
  }
};

const onChildChangeColumnShowInDetail = async ({ colId, showInDetail }) => {
  const { mapping, isBlank, cDash, src } = getTargetMappingRef();
  if (isBlank && cDash) {
    const col = (cDash.customColumns || []).find((c) => c.id === colId);
    if (col) {
      col.showInDetail = Boolean(showInDetail);
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
        c.showInDetail = Boolean(showInDetail);
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) {
    await persistTableMapping(src, mapping);
  }
};

const onChildChangeColumnFormat = async ({ colId, newFormat }) => {
  const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
  if (isBlank && cDash) {
    const col = (cDash.customColumns || []).find((c) => c.id === colId);
    if (col) {
      col.format = newFormat;
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
        c.format = newFormat;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) {
    await persistTableMapping(src, mapping);
  }
};

const onChildChangeColumnLookup = async (payload) => {
  const { colId, lookupTarget, lookupLinkCol, lookupField, lookupConditions, lookupLogicOp, lookupDisplay, lookupJoinSeparator, lookupFormat } = payload;
  const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
  if (isBlank && cDash) {
    const c = (cDash.customColumns || []).find((col) => col.id === colId);
    if (c) {
      c.format = 'lookup';
      c.lookupTarget = lookupTarget;
      c.lookupLinkCol = lookupLinkCol;
      c.lookupField = lookupField;
      if (lookupConditions !== undefined) c.lookupConditions = lookupConditions;
      if (lookupLogicOp !== undefined) c.lookupLogicOp = lookupLogicOp;
      if (lookupDisplay !== undefined) c.lookupDisplay = lookupDisplay;
      if (lookupJoinSeparator !== undefined) c.lookupJoinSeparator = lookupJoinSeparator;
      if (lookupFormat !== undefined) c.lookupFormat = lookupFormat;
      await persistTableMapping('blank', customDashboards.value);
    }
    return;
  }
  let found = false;
  for (const g of (mapping || [])) {
    for (const c of (g.columns || [])) {
      if (c.id === colId) {
        c.format = 'lookup';
        c.lookupTarget = lookupTarget;
        c.lookupLinkCol = lookupLinkCol;
        c.lookupField = lookupField;
        if (lookupConditions !== undefined) c.lookupConditions = lookupConditions;
        if (lookupLogicOp !== undefined) c.lookupLogicOp = lookupLogicOp;
        if (lookupDisplay !== undefined) c.lookupDisplay = lookupDisplay;
        if (lookupJoinSeparator !== undefined) c.lookupJoinSeparator = lookupJoinSeparator;
        if (lookupFormat !== undefined) c.lookupFormat = lookupFormat;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) {
    await saveAppSettings(key, mapping);
  }
  if (!found && currentDashboardConfig.value?.customColumns) {
    const c = currentDashboardConfig.value.customColumns.find((col) => col.id === colId);
    if (c) {
      c.format = 'lookup';
      c.lookupTarget = lookupTarget;
      c.lookupLinkCol = lookupLinkCol;
      c.lookupField = lookupField;
      if (lookupConditions !== undefined) c.lookupConditions = lookupConditions;
      if (lookupLogicOp !== undefined) c.lookupLogicOp = lookupLogicOp;
      if (lookupDisplay !== undefined) c.lookupDisplay = lookupDisplay;
      if (lookupJoinSeparator !== undefined) c.lookupJoinSeparator = lookupJoinSeparator;
      if (lookupFormat !== undefined) c.lookupFormat = lookupFormat;
      await saveAppSettings('custom_dashboards_config', personnelStore.customDashboards);
    }
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

// ===== ĐỘNG CƠ ĐỘ RỘNG CỘT 2 TẦNG CHUẨN LARK BASE (COLUMN WIDTH ENGINE) =====
// Tầng 1: Tự kéo rê mép cột trên header bảng (Direct Drag Resizing)
// Tầng 2: Tùy chọn cột (Auto vs Nhập px cố định toàn bộ - Ưu tiên cao nhất)
// Đã loại bỏ hoàn toàn Tầng 3 (cấu hình px riêng lẻ từng cột)

const colWidthMode = ref('auto'); // 'auto' | 'fixed'
const colWidthPx = ref(160); // Mặc định 160px
const resizedColWidths = ref({}); // Map { [colId]: number } chứa độ rộng các cột đã kéo tay

const hasCustomDraggedWidths = computed(() => {
  return Object.keys(resizedColWidths.value || {}).length > 0;
});

const getColWidthStorageKey = () => {
  const tid = topicId.value || currentDashboardConfig.value?.id || (route.path.replace('/', '') || 'default');
  return `table_col_widths_v2_${tid}`;
};

const loadColWidthSettings = () => {
  try {
    const key = getColWidthStorageKey();
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      colWidthMode.value = parsed.mode === 'fixed' ? 'fixed' : 'auto';
      colWidthPx.value = Number(parsed.px) || 160;
      resizedColWidths.value = (parsed.resized && typeof parsed.resized === 'object') ? parsed.resized : {};
      return;
    }
  } catch (e) {}
  colWidthMode.value = 'auto';
  colWidthPx.value = 160;
  resizedColWidths.value = {};
};

const saveColWidthSettings = async () => {
  try {
    const key = getColWidthStorageKey();
    const payload = {
      mode: colWidthMode.value,
      px: colWidthPx.value,
      resized: resizedColWidths.value,
    };
    localStorage.setItem(key, JSON.stringify(payload));
    await saveAppSettings(key, payload);
  } catch (e) {}
};

const onColWidthSettingChange = async ({ mode, px }) => {
  if (mode) colWidthMode.value = mode;
  if (px) colWidthPx.value = Number(px) || 160;
  await saveColWidthSettings();
};

const onResetDraggedWidths = async () => {
  resizedColWidths.value = {};
  await saveColWidthSettings();
};

// Bắt sự kiện khi người dùng kéo chuột điều chỉnh độ rộng cột ở Header bảng (Tầng 1)
const onColumnResizeEnd = async (event) => {
  try {
    const thEl = event.element;
    if (!thEl) return;

    // Phân giải colId qua attribute data-column-id hoặc vị trí cột trong header
    let colId = thEl.getAttribute('data-column-id');
    if (!colId) {
      const parent = thEl.parentElement;
      if (parent) {
        const thIndex = Array.from(parent.children).indexOf(thEl);
        // Trừ 2 cột cố định đầu (selection + STT)
        const targetCol = visibleColumns.value[thIndex - 2];
        if (targetCol) colId = targetCol.id;
      }
    }

    if (!colId) return;

    const newWidth = Math.round(thEl.getBoundingClientRect?.().width || thEl.offsetWidth);
    if (newWidth > 40) {
      resizedColWidths.value = {
        ...resizedColWidths.value,
        [colId]: newWidth,
      };
      // Nếu đang ở mode fixed mà người dùng kéo tay ở Tầng 1,
      // tự động chuyển sang auto để tôn trọng độ rộng cột vừa kéo
      colWidthMode.value = 'auto';
      await saveColWidthSettings();
    }
  } catch (e) {
    console.error('Error onColumnResizeEnd:', e);
  }
};

// Động cơ tính toán Style độ rộng cột theo phân cấp ưu tiên
const getColWidthStyle = (col) => {
  if (!col) return {};

  // Ưu tiên 1 (Cao nhất): Nhập px cố định toàn bộ cột từ Tùy chọn cột
  if (colWidthMode.value === 'fixed') {
    const px = Math.max(60, Number(colWidthPx.value) || 160);
    return {
      width: `${px}px`,
      minWidth: `${px}px`,
      maxWidth: `${px}px`,
    };
  }

  // Ưu tiên 2 (Khi Tùy chọn cột để Auto):
  // 2a. Nếu cột này đã từng được người dùng kéo tay bằng chuột (Tầng 1)
  const draggedWidth = resizedColWidths.value?.[col.id];
  if (draggedWidth && Number(draggedWidth) > 40) {
    const px = Math.round(Number(draggedWidth));
    return {
      width: `${px}px`,
      minWidth: `${px}px`,
    };
  }

  // 2b. Nếu chưa kéo tay: Tự động co giãn (auto theo nội dung) với min-width tối ưu
  if (col.format === 'checkbox_file_loop' || col.format === 'checkbox_file') {
    return {
      minWidth: '240px',
      width: 'auto',
    };
  }

  return {
    minWidth: '150px',
    width: 'auto',
  };
};

const onChildChangeColumnFormWidth = async ({ colId, formWidth }) => {
  const { key, mapping, src } = getTargetMappingRef();
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
    await persistTableMapping(src, mapping);
    alert('Đã cập nhật độ rộng form chi tiết cho cột này!');
  }
};

const onChildDeleteColumnFromTable = async (colId) => {
  const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
  let found = false;

  if (isBlank && cDash) {
    if (Array.isArray(cDash.customColumns)) {
      const initLen = cDash.customColumns.length;
      cDash.customColumns = cDash.customColumns.filter((c) => c.id !== colId);
      if (cDash.customColumns.length < initLen) found = true;
    }
    if (Array.isArray(cDash.columns)) {
      const initLen = cDash.columns.length;
      cDash.columns = cDash.columns.filter((c) => c.id !== colId);
      if (cDash.columns.length < initLen) found = true;
    }
    if (found) {
      selectedColIds.value = selectedColIds.value.filter((id) => id !== colId);
      await onColumnsChange();
      try {
        localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
        await saveAppSettings('custom_dashboards_config', customDashboards.value);
        window.dispatchEvent(new CustomEvent('custom-dashboards-updated'));
      } catch (e) {}
      alert('Đã xóa cột thành công khỏi bảng!');
    }
    return;
  }

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
    await persistTableMapping(src, mapping);
    window.dispatchEvent(new CustomEvent('custom-dashboards-updated'));
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

const onInsertChildColLeft = (col) => {
  const { isBlank, cDash, mapping } = getTargetMappingRef();
  if (isBlank && cDash) {
    const idx = (cDash.customColumns || []).findIndex((c) => c.id === col.id);
    addChildColTargetIndex.value = idx !== -1 ? Math.max(1, idx) : -1;
  } else {
    for (const g of (mapping || [])) {
      const found = (g.columns || []).findIndex((c) => c.id === col.id);
      if (found !== -1) {
        addChildColTargetIndex.value = Math.max(1, found);
        break;
      }
    }
  }
  isAddColumnDialogOpen.value = true;
};

const onInsertChildColRight = (col) => {
  const { isBlank, cDash, mapping } = getTargetMappingRef();
  if (isBlank && cDash) {
    const idx = (cDash.customColumns || []).findIndex((c) => c.id === col.id);
    addChildColTargetIndex.value = idx !== -1 ? idx + 1 : -1;
  } else {
    for (const g of (mapping || [])) {
      const found = (g.columns || []).findIndex((c) => c.id === col.id);
      if (found !== -1) {
        addChildColTargetIndex.value = found + 1;
        break;
      }
    }
  }
  isAddColumnDialogOpen.value = true;
};

const onDuplicateChildCol = async (col) => {
  const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
  const copyId = col.id + '_copy_' + Math.random().toString(36).substring(2, 6);
  const copyCol = {
    ...col,
    id: copyId,
    label: (col.label || col.id) + ' (Bản sao)',
  };
  delete copyCol.isVirtual;
  delete copyCol.isPrimaryField;

  if (isBlank && cDash) {
    const idx = (cDash.customColumns || []).findIndex((c) => c.id === col.id);
    if (idx !== -1) {
      cDash.customColumns.splice(idx + 1, 0, copyCol);
    } else {
      cDash.customColumns.push(copyCol);
    }
    try {
      localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
      await saveAppSettings('custom_dashboards_config', customDashboards.value);
    } catch (e) {}
  } else {
    let inserted = false;
    for (const g of (mapping || [])) {
      const idx = (g.columns || []).findIndex((c) => c.id === col.id);
      if (idx !== -1) {
        g.columns.splice(idx + 1, 0, copyCol);
        inserted = true;
        break;
      }
    }
    if (!inserted && mapping && mapping[0]) {
      mapping[0].columns.push(copyCol);
    }
    await persistTableMapping(src, mapping);
  }

  const curIdx = selectedColIds.value.indexOf(col.id);
  if (curIdx !== -1) {
    selectedColIds.value.splice(curIdx + 1, 0, copyId);
  } else {
    selectedColIds.value.push(copyId);
  }
  await onColumnsChange(selectedColIds.value);
  alert(`Đã nhân bản cột thành công: "${copyCol.label}"!`);
};

const onChildChangeFormulaType = async ({ colId, formulaType, formulaExpression }) => {
  const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
  if (isBlank && cDash) {
    const col = (cDash.customColumns || []).find((c) => c.id === colId);
    if (col) {
      col.formulaType = formulaType;
      if (formulaExpression !== undefined) col.formulaExpression = formulaExpression;
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
        c.formulaType = formulaType;
        if (formulaExpression !== undefined) c.formulaExpression = formulaExpression;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) {
    await persistTableMapping(src, mapping);
  }
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
      if (row.id && parent.relatives) {
        const rIdx = parent.relatives.findIndex(r => r.id === row.id || r.code === row.id);
        if (rIdx !== -1) {
          parent.relatives[rIdx][colId] = value;
        }
      }
      if (parent.id === row.id) {
        parent[colId] = value;
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

const isDataMenuOpen = ref(false);
let dataMenuTimer = null;

const onMouseEnterData = () => {
  if (dataMenuTimer) clearTimeout(dataMenuTimer);
  isDataMenuOpen.value = true;
};

const onMouseLeaveData = () => {
  dataMenuTimer = setTimeout(() => {
    isDataMenuOpen.value = false;
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
        ...c,
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
            ...c,
            id: c.id,
            label: c.label || c.id,
            colIndex: idxText,
            width: c.tableWidth ? (c.tableWidth + 'px') : (c.width || (c.format === 'checkbox_file_loop' || c.format === 'checkbox_file' ? '250px' : '150px')),
            tableWidth: c.tableWidth || null,
            format: c.format,
            isVirtual: false,
          });
        }
      });
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
            ...c,
            id: c.id,
            label: c.label || c.id,
            colIndex: idxText,
            width: c.tableWidth ? (c.tableWidth + 'px') : (c.width || (c.format === 'checkbox_file_loop' || c.format === 'checkbox_file' ? '250px' : '150px')),
            tableWidth: c.tableWidth || null,
            format: c.format,
            isVirtual: false,
          });
        }
      });
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
            ...c,
            id: c.id,
            label: c.label || c.id,
            colIndex: idxText,
            width: c.tableWidth ? (c.tableWidth + 'px') : (c.width || (c.format === 'checkbox_file_loop' || c.format === 'checkbox_file' ? '250px' : '150px')),
            tableWidth: c.tableWidth || null,
            format: c.format,
            isVirtual: false,
          });
        }
      });
    });
  }

  return rawList;
});

const allColumns = computed(() => allAvailableColumnsList.value);
const getInitialSelectedCols = () => {
  try {
    const tid = route.path === '/personnel' ? 'personnel' : (route.path === '/relatives' ? 'relatives' : (route.path === '/trips' ? 'trips' : (route.params.id || 'trips')));
    const localKey = `child_dashboard_cols_${tid || 'default'}`;
    let fallbackLocal = null;
    if (tid === 'trips') fallbackLocal = localStorage.getItem('trips_dashboard_columns');
    else if (tid === 'personnel') fallbackLocal = localStorage.getItem('personnel_active_columns');
    else if (tid === 'relatives') fallbackLocal = localStorage.getItem('relative_active_columns');

    const local = localStorage.getItem(localKey) || fallbackLocal;
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
    if (isBaseline) {
      if (topicId.value === 'trips') {
        localStorage.setItem('trips_dashboard_columns', JSON.stringify(selectedColIds.value));
        await saveAppSettings('trips_dashboard_columns', selectedColIds.value);
      } else if (topicId.value === 'personnel') {
        localStorage.setItem('personnel_active_columns', JSON.stringify(selectedColIds.value));
        await saveAppSettings('personnel_active_columns', selectedColIds.value);
      } else if (topicId.value === 'relatives') {
        localStorage.setItem('relative_active_columns', JSON.stringify(selectedColIds.value));
        await saveAppSettings('relative_active_columns', selectedColIds.value);
      }
    }
    await saveAppSettings(currentKey, selectedColIds.value);
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

// ===== Lark Base View Tabs: Quản lý Chế độ xem (Thêm / Sửa / Xóa / Di chuyển) =====
const isViewManagerOpen = ref(false);
const viewManagerMode = ref('create'); // 'create' | 'edit'
const selectedViewForEdit = ref(null);
const selectedViewIdx = ref(-1);

const openAddViewDialog = () => {
  viewManagerMode.value = 'create';
  selectedViewForEdit.value = null;
  selectedViewIdx.value = -1;
  isViewManagerOpen.value = true;
};

const openEditViewDialog = (card, cIdx) => {
  viewManagerMode.value = 'edit';
  selectedViewForEdit.value = { ...card };
  selectedViewIdx.value = cIdx;
  isViewManagerOpen.value = true;
};

const handleSaveView = async (savedData) => {
  const tableId = currentDashboardId.value;
  let dashboards = customDashboards.value ? [...customDashboards.value] : [];
  let idx = dashboards.findIndex((d) => String(d.id) === String(tableId));

  if (idx === -1) {
    dashboards = ensureStandardDashboards(dashboards);
    idx = dashboards.findIndex((d) => String(d.id) === String(tableId));
  }

  if (idx === -1) return;

  const currentDash = { ...dashboards[idx] };
  const defaultCards = [
    { id: 'all', label: 'Toàn bộ', condition: 'all', color: 'blue' },
    { id: 'completed', label: 'Đã về nước', condition: 'completed', color: 'green' },
    { id: 'abroad', label: 'Đang ở nước ngoài', condition: 'abroad', color: 'amber' },
    { id: 'overdue', label: 'Quá hạn chưa về', condition: 'overdue', color: 'red' },
  ];
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
      columns: [...selectedColIds.value],
    };
    cards.push(newCard);
    activeMetricCardIdx.value = cards.length - 1;
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

const deleteView = async (card, cIdx) => {
  if (cIdx <= 0) {
    alert('Không thể xóa Chế độ xem mặc định (Toàn bộ)');
    return;
  }
  const label = card?.label || 'này';
  if (!confirm(`Bạn có chắc muốn xóa Chế độ xem "${label}"?`)) return;

  const tableId = currentDashboardId.value;
  let dashboards = customDashboards.value ? [...customDashboards.value] : [];
  let idx = dashboards.findIndex((d) => String(d.id) === String(tableId));

  if (idx === -1) {
    dashboards = ensureStandardDashboards(dashboards);
    idx = dashboards.findIndex((d) => String(d.id) === String(tableId));
  }
  if (idx === -1) return;

  const currentDash = { ...dashboards[idx] };
  const cards = currentDash.metricCards ? [...currentDash.metricCards] : [];
  if (cIdx < cards.length) {
    cards.splice(cIdx, 1);
    currentDash.metricCards = cards;
    dashboards[idx] = currentDash;
    customDashboards.value = dashboards;

    if (activeMetricCardIdx.value >= cards.length) {
      activeMetricCardIdx.value = Math.max(0, cards.length - 1);
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

const moveView = async (cIdx, direction) => {
  const targetIdx = cIdx + direction;
  const tableId = currentDashboardId.value;
  let dashboards = customDashboards.value ? [...customDashboards.value] : [];
  let idx = dashboards.findIndex((d) => String(d.id) === String(tableId));

  if (idx === -1) {
    dashboards = ensureStandardDashboards(dashboards);
    idx = dashboards.findIndex((d) => String(d.id) === String(tableId));
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

  if (activeMetricCardIdx.value === cIdx) {
    activeMetricCardIdx.value = targetIdx;
  } else if (activeMetricCardIdx.value === targetIdx) {
    activeMetricCardIdx.value = cIdx;
  }

  try {
    localStorage.setItem('custom_dashboards_config', JSON.stringify(dashboards));
    await saveAppSettings('custom_dashboards_config', dashboards);
  } catch (e) {
    console.error('Error reordering views:', e);
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
  const filteredIds = selectedColIds.value
    .filter((id) => id !== 'status' && id !== 'tripStatus' && colMap.has(id));
  return filteredIds.map((id) => ({
    ...colMap.get(id),
  }));
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

  // 4. Lọc theo ô tìm kiếm nhanh (searchQuery) - 100% ĐỘNG THEO TẤT CẢ CỘT ĐANG HIỂN THỊ
  const q = String(searchQuery.value || '').trim().toLowerCase();
  if (q) {
    const cols = visibleColumns.value || [];
    list = list.filter((item) => {
      if (cols.length > 0) {
        return cols.some((col) => {
          const val = getCellValue(item, col);
          return val !== undefined && val !== null && val !== '' && val !== '-' && String(val).toLowerCase().includes(q);
        });
      }
      // Fallback nếu danh sách cột chưa sẵn sàng
      const allVals = [
        ...Object.values(item),
        ...(item.custom_data && typeof item.custom_data === 'object' ? Object.values(item.custom_data) : []),
      ];
      return allVals.some((v) => (typeof v === 'string' || typeof v === 'number') && String(v).toLowerCase().includes(q));
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

const getCellValue = (trip, colId, depth = 0) => {
  if (!trip || !colId || depth > 5) return '-';

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
    const directVal = trip[tKeyField] ?? trip.cccdchuyendi ?? trip[colId];
    if (!isInternalId(directVal)) return String(directVal).trim();
    return '-';
  }
  if (colId === pKeyField || colId === 'cccdparent' || colId === 'cccd_can_bo') {
    const canBoCccd = trip[pKeyField] ?? trip.cccdparent ?? trip[colId];
    if (!isInternalId(canBoCccd)) return String(canBoCccd).trim();
    return '-';
  }
  if (colId === rKeyField || colId === 'cccdthannhan' || colId === 'cccd_than_nhan') {
    const rCccd = trip[rKeyField] ?? trip.cccdthannhan ?? trip[colId];
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
    const configWithResolver = {
      ...colDef,
      columns: allAvailableColumnsList.value || [],
      cellResolver: (targetColId) => {
        if (!targetColId || targetColId === colId) return '';
        const cell = getCellValue(trip, targetColId, depth + 1);
        return cell !== '-' ? cell : '';
      },
    };
    const result = evaluateFormula(trip, configWithResolver);
    return result?.label || result?.shortLabel || '-';
  }
  if (colDef && colDef.format === 'lookup') {
    return evaluateLookup(trip, colDef, personnelStore);
  }
  if (colDef && colDef.format === 'rollup') {
    return evaluateRollup(trip, colDef, personnelStore);
  }

  // 2. Direct property or in custom_data (KHÔNG fallback ngầm sang rawPerson)
  const tcd = typeof trip.custom_data === 'string' ? JSON.parse(trip.custom_data || '{}') : (trip.custom_data || {});
  const rawVal = trip[colId] !== undefined ? trip[colId] : tcd[colId];
  return formatGenericCellValue(rawVal, colDef || { id: colId });
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

  // 0. Direct personnel record or rawPerson
  if (trip._recordType === 'personnel' || trip.rawPerson) {
    if (trip.rawPerson) return trip.rawPerson;
    const found = pList.find((p) => String(p.id) === String(trip.id));
    if (found) return found;
    return trip;
  }

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
    searchQuery.value.trim() !== '' ||
    !!customFilterField.value
  );
});

const resetFilters = () => {
  activeMetricCardIdx.value = -1;
  customFilterField.value = '';
  customFilterValue.value = '';
  searchQuery.value = '';
  currentPage.value = 1;
  dtFirst.value = 0;
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
    return;
  }
  const allIds = allAvailableColumnsList.value
    .map((c) => c.id)
    .filter((id) => id !== '_primaryKey' && id !== 'status' && id !== 'tripStatus');
  selectedColIds.value = allIds;
};

const selectAllColumns = () => {
  selectedColIds.value = allAvailableColumnsList.value.map((c) => c.id);
};

const deselectAllColumns = () => {
  selectedColIds.value = [];
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
const openPersonnelDetail = (record) => {
  if (!record) return;
  activePersonData.value = record;
  isPersonnelDialogOpen.value = true;
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
    const title = item.title || item.name || 'mục này';
    if (!confirm(`Bạn có chắc chắn muốn xóa "${title}" không?`)) return;
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
  if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn ${count} kết quả đã chọn không?`)) return;

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
    alert(`Đã xóa thành công ${count} kết quả!`);
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

const getAddButtonLabel = () => {
  const src = currentDashboardConfig.value?.source || '';
  if (src === 'personnel') return `Thêm ${currentDashboardConfig.value?.title || 'Cán bộ'}`;
  if (src === 'relatives') return `Thêm ${currentDashboardConfig.value?.title || 'Thân nhân'}`;
  if (src === 'trips') return `Thêm ${currentDashboardConfig.value?.title || 'Chuyến đi'}`;
  return 'Thêm Bản Ghi Mới';
};

const openAddTripDialog = () => {
  const src = currentDashboardConfig.value?.source || '';
  if (src === 'blank') {
    addCustomRow();
    return;
  }
  const newRec = {
    _recordType: src === 'relatives' ? 'relative' : (src === 'trips' ? 'trip' : 'personnel'),
    custom_data: {},
  };
  activePersonData.value = newRec;
  isPersonnelDialogOpen.value = true;
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

// Excel Export (Dynamic 100% theo các cột đang hiển thị trên bảng)
const exportExcel = () => {
  const list = filteredList.value || [];
  const cols = visibleColumns.value || [];
  const rows = list.map((item, idx) => {
    const obj = { 'STT': dtFirst.value + idx + 1 };
    cols.forEach((col) => {
      const val = getCellValue(item, col.id);
      obj[col.label || col.id] = (val !== null && val !== undefined) ? String(val).replace(/\n/g, ' ') : '-';
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  const sheetTitle = (currentDashboardConfig.value?.title || 'Dữ liệu').slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
  const fileName = `Danh_sach_${(currentDashboardConfig.value?.title || 'Du_lieu').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
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
      const essential = ['relativeName', 'relationshipName', '_presenceStatus', 'countryNameTN'];
      const missing = essential.filter((c) => !selectedColIds.value.includes(c));
      if (missing.length > 0) {
        selectedColIds.value = [...selectedColIds.value, ...missing];
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
    let fallbackDb = null;
    if (topicId.value === 'trips') fallbackDb = await getAppSettings('trips_dashboard_columns', null);
    else if (topicId.value === 'personnel') fallbackDb = await getAppSettings('personnel_active_columns', null);
    else if (topicId.value === 'relatives') fallbackDb = await getAppSettings('relative_active_columns', null);

    const dbCols = (await getAppSettings(currentKey, null)) || fallbackDb;
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
    let fallbackLocal = null;
    if (topicId.value === 'trips') fallbackLocal = localStorage.getItem('trips_dashboard_columns');
    else if (topicId.value === 'personnel') fallbackLocal = localStorage.getItem('personnel_active_columns');
    else if (topicId.value === 'relatives') fallbackLocal = localStorage.getItem('relative_active_columns');

    const localCols = localStorage.getItem(currentKey) || fallbackLocal;
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
  if (route.query?.action === 'new_record' || route.query?.action === 'new_trip') {
    openAddTripDialog();
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
    loadColWidthSettings();
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

const onCustomDashboardsUpdated = (e) => {
  if (e && e.detail && Array.isArray(e.detail)) {
    customDashboards.value = e.detail;
  } else {
    loadCustomDashboards();
  }
};

onMounted(async () => {
  await Promise.all([
    (!personnelStore.importMappingTrips || personnelStore.importMappingTrips.length === 0)
      ? personnelStore.loadSettings()
      : Promise.resolve(),
    loadCustomDashboards(),
    loadSystemBranding(),
  ]);
  await loadCustomTableRows();
  await loadTopicFilterState();
  await loadColumnsForCurrentCard();
  loadColWidthSettings();
  handleRouteQueryChange();
  loadNameColConfig();
  loadCustomParentLabel();
  window.addEventListener('table-show-col-index-changed', onColIndexChanged);
  window.addEventListener('custom-dashboards-updated', onCustomDashboardsUpdated);
  window.addEventListener('click', handleGlobalTabMenuClick);
});

onUnmounted(() => {
  window.removeEventListener('table-show-col-index-changed', onColIndexChanged);
  window.removeEventListener('custom-dashboards-updated', onCustomDashboardsUpdated);
  window.removeEventListener('click', handleGlobalTabMenuClick);
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
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
}

.menu-action-sub {
  font-size: 0.68rem;
  color: #64748b;
}

</style>

