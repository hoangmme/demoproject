<template>
  <div class="app-content">
    <!-- Breadcrumb & Top Bar -->
    <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
      <span>Tra cứu</span>
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
        <!-- Bulk Delete Button (Same as PersonnelView) -->
        <button
          v-if="authStore.isAdmin && selectedTripKeys.length > 0"
          type="button"
          class="btn-action-danger-solid"
          @click="handleBulkDeleteTrips"
          title="Xóa tất cả các bản ghi đã chọn"
        >
          <i class="pi pi-trash"></i>
          <span>Xóa đã chọn ({{ selectedTripKeys.length }})</span>
        </button>

        <!-- ⚙️ Cài đặt Cột & Bộ Lọc Thông Minh Popover (Đồng bộ module với Hồ sơ cán bộ) -->
        <div class="header-menu-wrapper" @mouseenter="onMouseEnterFilter" @mouseleave="onMouseLeaveFilter">
          <Button
            icon="pi pi-sliders-h"
            :label="hasActiveFilters ? 'Đang lọc (Bật)' : 'Lọc & Cột'"
            :severity="hasActiveFilters ? 'primary' : 'secondary'"
            outlined
            size="small"
            @click="isFilterMenuOpen = !isFilterMenuOpen"
            title="Tùy biến cột hiển thị và Bộ lọc dữ liệu thông minh"
            style="font-size: 0.8rem;"
          />

          <div v-show="isFilterMenuOpen" class="header-menu-dropdown filter-panel-dropdown">
            <!-- Phần 1: Bộ lọc nhanh thông minh -->
            <div class="filter-section">
              <div class="filter-section-title">
                <i class="pi pi-filter" style="color: #2563eb;"></i>
                <span>Bộ lọc dữ liệu thông minh</span>
              </div>
              <div class="smart-chips-grid">
                <button
                  type="button"
                  class="smart-chip"
                  :class="{ 'chip-active': statusFilter === 'all' && activeMetricCardId === 'all' }"
                  @click="statusFilter = 'all'; activeMetricCardId = 'all'"
                >
                  Tất cả ({{ currentSourceList.length }})
                </button>
                <button
                  type="button"
                  class="smart-chip"
                  :class="{ 'chip-active': statusFilter === 'completed' }"
                  @click="statusFilter = 'completed'; activeMetricCardId = 'all'"
                >
                  <i class="pi pi-check-circle" style="color: #16a34a;"></i> Đã về nước
                </button>
                <button
                  type="button"
                  class="smart-chip"
                  :class="{ 'chip-active': statusFilter === 'abroad' }"
                  @click="statusFilter = 'abroad'; activeMetricCardId = 'all'"
                >
                  <i class="pi pi-globe" style="color: #d97706;"></i> Đang ở nước ngoài
                </button>
                <button
                  type="button"
                  class="smart-chip"
                  :class="{ 'chip-active': statusFilter === 'overdue' }"
                  @click="statusFilter = 'overdue'; activeMetricCardId = 'all'"
                >
                  <i class="pi pi-exclamation-triangle" style="color: #dc2626;"></i> Quá hạn chưa về
                </button>
              </div>
            </div>

            <!-- Phần 2: Tùy chọn Ẩn/Hiện Cột -->
            <div class="filter-section" style="border-top: 1px solid #e2e8f0; margin-top: 10px; padding-top: 10px;">
              <div class="filter-section-title" style="margin-bottom: 8px;">
                <i class="pi pi-table" style="color: #7c3aed;"></i>
                <span>Tùy chọn Cột hiển thị</span>
              </div>
              <ColumnSelector
                v-model="selectedColIds"
                :options="allAvailableColumnsList"
                @change="onColumnsChange"
              />
            </div>
          </div>
        </div>

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

    <!-- Quick Metric Pill Cards (Top Row) -->
    <div style="display: flex; gap: 12px; margin-bottom: 1.25rem; flex-wrap: wrap;">
      <div
        v-for="(card, cIdx) in activeMetricCards"
        :key="card.id || cIdx"
        class="quick-stat-card"
        :class="{ 'stat-active': isCardActive(card, cIdx) }"
        :style="{
          width: getCardWidthStyle(card),
          flex: getCardFlexStyle(card),
          minWidth: getCardMinWidthStyle(card)
        }"
        @click="toggleMetricCardFilter(card, cIdx)"
        style="cursor: pointer;"
      >
        <div style="display: flex; align-items: center; gap: 8px;">
          <span :class="['dot-indicator', `dot-${card.color || 'blue'}`]"></span>
          <span class="stat-name">{{ getCardDisplayLabel(card) }}</span>
        </div>
        <span :class="['stat-number', `num-${card.color || 'blue'}`]">{{ getCardMetricValue(card) }}</span>
      </div>
    </div>

    <!-- Filter Bar Container (Chỉ giữ lại ô tìm kiếm) -->
    <div class="app-card" style="padding: 12px 16px; margin-bottom: 1rem;">
      <div style="display: flex; gap: 10px; align-items: center;">
        <!-- Search -->
        <div style="position: relative; flex: 1;">
          <i class="pi pi-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.85rem;"></i>
          <InputText
            v-model="searchQuery"
            placeholder="Tìm trong danh sách: họ tên, đơn vị, số quyết định, quốc gia..."
            style="width: 100%; padding-left: 30px; font-size: 0.82rem; height: 34px;"
          />
          <button
            v-if="searchQuery"
            type="button"
            @click="searchQuery = ''"
            style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; padding: 2px 6px; font-size: 0.8rem;"
            title="Xóa tìm kiếm"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Data Table Card (Matching PersonnelView exactly) -->
    <div class="app-card" style="padding: 0; overflow: hidden; position: relative;">
      <!-- Loading Overlay -->
      <div v-if="personnelStore.loading" class="table-loading-overlay">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #2563eb;"></i>
      </div>

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
        tableStyle="min-width: 60rem; table-layout: fixed;"
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
          sortable
          :headerClass="'col-left'"
          :bodyClass="'col-left'"
          :headerStyle="{ width: col.tableWidth || col.width || '160px', minWidth: col.tableWidth === 'auto' ? undefined : (col.tableWidth || col.width || '160px') }"
          :bodyStyle="{ width: col.tableWidth || col.width || '160px', minWidth: col.tableWidth === 'auto' ? undefined : (col.tableWidth || col.width || '160px') }"
        >
          <template #header>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span class="table-col-header-ellipsis" :title="col.label">{{ col.label }}</span>
              <i v-if="isNameColumn(col.id)" class="pi pi-cog" style="font-size: 0.7rem; cursor: pointer; color: #94a3b8; margin-left: 2px;" @click.stop="toggleNameColConfig($event)" title="Tùy chỉnh nội dung cột" />
            </div>
          </template>
          <template #body="{ data }">
            <!-- 1. Họ và tên Cán bộ (configurable rows) -->
            <template v-if="isNameColumn(col.id)">
              <div style="display: flex; flex-direction: column; gap: 2px; line-height: 1.35; padding: 2px 0;">
                <!-- Tên cán bộ -->
                <div v-if="nameColFields.name">
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

            <!-- 2. Đơn vị công tác -->
            <template v-else-if="col.id === 'departmentName' || col.id === 'departmentId' || col.id === 'don_vi_cong_tac' || col.id === 'don_vi'">
              <span>{{ getDepartmentValue(data) !== '-' ? getDepartmentValue(data) : (getCellValue(data, col.id) !== '-' ? getCellValue(data, col.id) : '-') }}</span>
            </template>

            <!-- 3. Ngày xuất cảnh -->
            <template v-else-if="col.id === 'departureDate' || col.id === 'approvedDepartureDate'">
              <span>{{ formatDisplayDate(data[col.id] || data.departureDate) }}</span>
            </template>

            <!-- 5. Số quyết định -->
            <template v-else-if="col.id === 'decisionNumber' || col.id === 'decision'">
              <span v-if="data.decisionNumber" class="code-badge-decision">
                {{ data.decisionNumber }}
              </span>
              <span v-else style="color: #94a3b8;">-</span>
            </template>

            <!-- 6. Quốc gia -->
            <template v-else-if="col.id === 'countryName' || col.id === 'country'">
              <span style="font-weight: 600; color: #1e293b;">
                {{ data.countryName || data.country || '-' }}
              </span>
            </template>

            <!-- 7. Nguồn kinh phí -->
            <template v-else-if="col.id === 'fundingName' || col.id === 'funding' || col.id === 'nguon_kinh_phi' || col.id === 'kinh_phi'">
              <span class="badge-funding">
                {{ getFundingValue(data) }}
              </span>
            </template>

            <!-- Default value -->
            <template v-else>
              <span>{{ getCellValue(data, col.id) }}</span>
            </template>
          </template>
        </Column>

        <!-- Dynamic Filtered Column according to active Metric Card -->
        <Column
          v-if="activeMetricCard"
          :header="`🎯 ${activeCardColLabel}`"
          headerClass="col-active-filter-header"
          bodyClass="col-active-filter-body"
          :headerStyle="{ minWidth: '190px', color: '#b91c1c', fontWeight: '700', background: '#fef2f2' }"
          :bodyStyle="{ minWidth: '190px', background: '#fffaf0' }"
        >
          <template #body="{ data }">
            <span style="font-weight: 700; color: #b91c1c; font-size: 0.8rem;">
              {{ getActiveCardCellValue(data) }}
            </span>
          </template>
        </Column>

        <!-- Actions Column (Centered) -->
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
                @click.stop="openPersonnelDetail(data)"
              />
              <Button
                v-if="authStore.isAdmin"
                label="Xóa"
                size="small"
                outlined
                severity="danger"
                @click.stop="handleDeleteItem(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Modal Chọn cột hiển thị -->
    <Dialog
      v-model:visible="isColumnPickerOpen"
      modal
      :header="`Chọn cột hiển thị (${selectedColIds.length} / ${allAvailableColumnsList.length} cột)`"
      :style="{ width: '680px' }"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; gap: 8px; flex-wrap: wrap;">
        <span style="font-size: 0.8rem; color: #64748b;">
          Đánh dấu chọn các cột thông tin từ toàn bộ <b>{{ allAvailableColumnsList.length }} cột</b> để xuất hiện trên bảng dữ liệu:
        </span>
        <div style="display: flex; gap: 6px;">
          <Button label="Chọn tất cả" size="small" text severity="primary" @click="selectedColIds = allAvailableColumnsList.map(c => c.id)" style="font-size: 0.75rem; padding: 2px 6px;" />
          <Button label="Bỏ chọn" size="small" text severity="secondary" @click="selectedColIds = []" style="font-size: 0.75rem; padding: 2px 6px;" />
          <Button label="Mặc định (10 cột)" size="small" text severity="info" @click="resetDefaultColumns" style="font-size: 0.75rem; padding: 2px 6px;" />
        </div>
      </div>

      <div style="margin-bottom: 8px;">
        <InputText
          v-model="columnSearchQuery"
          placeholder="🔍 Tìm nhanh tên cột..."
          size="small"
          style="width: 100%; font-size: 0.8rem;"
        />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 380px; overflow-y: auto; padding: 4px; border: 1px solid #f1f5f9; border-radius: 8px; background: #f8fafc;">
        <label
          v-for="col in filteredPickerColumns"
          :key="col.id"
          style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; cursor: pointer; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0; background: #ffffff;"
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

    <!-- Personnel Edit / Add Dialog -->
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
        <div style="font-weight: 600; font-size: 0.82rem; margin-bottom: 8px; color: #1e293b;">Tùy chỉnh cột "Họ và tên"</div>
        <label v-for="opt in nameColFieldOptions" :key="opt.key" class="name-col-opt">
          <input type="checkbox" :checked="nameColFields[opt.key]" @change="toggleNameColField(opt.key)" />
          <span>{{ opt.label }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
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
import { formatDate, parseDateObj, computePresenceStatus, computeOverdueStatus, computeTripPresence, evaluateFormula, computeDepartBeforeDecision } from '@/utils/formatters';
import * as XLSX from 'xlsx';

const route = useRoute();
const personnelStore = usePersonnelStore();
const authStore = useAuthStore();
const isExportDocxDialogOpen = ref(false);

// ===== Name Column Config =====
const NAME_COL_IDS = new Set(['personnelName', 'name', '_parentPersonnelName', 'ho_va_ten', 'hoTen']);
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
// ===== End Name Column Config =====

const openAdvancedDocxExport = () => {
  isExportDocxDialogOpen.value = true;
};

const selectedPersonnelForExport = computed(() => {
  if (selectedTrips.value && selectedTrips.value.length > 0) {
    const matchedPIds = new Set();
    selectedTrips.value.forEach((t) => {
      if (t.personnelId) matchedPIds.add(t.personnelId);
      else if (t.rawPerson?.id) matchedPIds.add(t.rawPerson.id);
    });
    return (personnelStore.personnelList || []).filter((p) => matchedPIds.has(p.id));
  }
  return [];
});

const allPersonnelForExport = computed(() => {
  const currentPIds = new Set((filteredList.value || []).map((t) => t.personnelId || t.rawPerson?.id).filter(Boolean));
  if (currentPIds.size > 0) {
    return (personnelStore.personnelList || []).filter((p) => currentPIds.has(p.id));
  }
  return personnelStore.personnelList || [];
});

// Dynamic Dashboard Topic State
const customDashboards = ref([]);

const topicId = computed(() => {
  return route.params.id || (route.path === '/trips' ? 'trips' : 'trips');
});
const currentDashboardId = computed(() => topicId.value);

const currentDashboardConfig = computed(() => {
  const found = customDashboards.value.find((d) => d.id === currentDashboardId.value);
  if (found) return found;
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

// Sử dụng computeTripPresence từ formatters.js (module dùng chung)
const getTripPresence = (t) => computeTripPresence(t);

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

const getCardWidthStyle = (card) => {
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

const matchCardCondition = (item, card) => {
  if (!card) return true;
  const lbl = String(card.label || card.cardLabel || '').trim().toLowerCase();
  const cond = card.condition || card.id || '';

  // 1. "Toàn bộ" / "Tất cả"
  if ((cond === 'all' && (!card.field || card.field === 'personnelName' || card.field === 'cccdparent')) || lbl === 'toàn bộ' || lbl === 'tất cả' || lbl.startsWith('tổng số')) {
    return true;
  }

  // 2. Preset Presence Checks
  if (cond === 'completed' || lbl === 'đã về nước') {
    const presence = getTripPresence(item);
    return presence.status === 'completed' && !presence.isOverdue;
  }
  if (cond === 'abroad' || lbl === 'đang ở nước ngoài') {
    const presence = getTripPresence(item);
    return presence.status === 'abroad';
  }
  if (cond === 'overdue' || lbl === 'quá hạn chưa về') {
    const presence = getTripPresence(item);
    return presence.status === 'overdue' || (presence.status === 'completed' && presence.isOverdue);
  }

  // 3. Special Formula Fields
  if (card.field === 'di_truoc_khi_co_quyet_dinh' || lbl === 'đi trước khi có quyết định') {
    const res = computeDepartBeforeDecision(item, { formulaColDep: 'ngay_xuat_canh', formulaColDecDate: 'ngay_ban_hanh' });
    return res.isWarning;
  }
  if (card.field === 'trang_thai_hien_dien') {
    const presence = getTripPresence(item);
    const target = String(card.value || '').toLowerCase().trim();
    if (target.includes('đã về nước')) return presence.status === 'completed' && !presence.isOverdue;
    if (target.includes('đang ở nước ngoài')) return presence.status === 'abroad';
    if (target.includes('quá hạn')) return presence.status === 'overdue' || (presence.status === 'completed' && presence.isOverdue);
  }
  if (card.field === 'qua_han_chua_ve') {
    const presence = getTripPresence(item);
    return presence.status === 'overdue' || (presence.status === 'completed' && presence.isOverdue);
  }

  // 4. Dynamic Field Condition
  if (card.field && String(card.field).trim() !== '') {
    const rawVal = getCellValue(item, card.field);
    const fieldVal = (rawVal !== undefined && rawVal !== null && rawVal !== '-')
      ? String(rawVal).trim()
      : '';

    const op = card.operator || 'has_value';
    if (op === 'has_value') {
      return !!fieldVal && fieldVal !== 'Chưa rõ' && fieldVal !== '-';
    }
    if (op === 'empty') {
      return !fieldVal || fieldVal === 'Chưa rõ' || fieldVal === '-';
    }

    const strVal = fieldVal.toLowerCase();
    const strTarget = String(card.value || '').trim().toLowerCase();

    if (op === 'equals') return strVal === strTarget;
    if (op === 'contains') return strVal.includes(strTarget);
    if (op === 'not_contains') return !strVal.includes(strTarget);

    if (op === 'before' || op === 'after') {
      const dVal = new Date(rawVal).getTime();
      const dTarget = new Date(card.value).getTime();
      if (isNaN(dVal) || isNaN(dTarget)) return false;
      return op === 'before' ? dVal < dTarget : dVal > dTarget;
    }

    if (op === 'gte' || op === 'lte') {
      const numVal = parseFloat(strVal.replace(/[^0-9.-]+/g, ''));
      const numTarget = parseFloat(strTarget.replace(/[^0-9.-]+/g, ''));
      if (isNaN(numVal) || isNaN(numTarget)) return false;
      return op === 'gte' ? numVal >= numTarget : numVal <= numTarget;
    }

    return true;
  }

  return true;
};

const getCardMetricValue = (card) => {
  if (!card) return 0;
  return currentSourceList.value.filter((item) => matchCardCondition(item, card)).length;
};

const activeMetricCardId = ref('all');

const isCardAllType = (card) => {
  if (!card) return false;
  if (card.field && card.field !== 'personnelName' && String(card.field).trim() !== '') return false;
  if (card.id === 'all' || card.label === 'Toàn bộ' || card.label === 'Tất cả') return true;
  return false;
};

const isCardActive = (card, cIdx) => {
  if (!card) return false;
  const cardKey = card.id || card.label || `card_${cIdx}`;
  const isAll = isCardAllType(card);
  if (activeMetricCardId.value === 'all') {
    return isAll;
  }
  return activeMetricCardId.value === cardKey;
};

const toggleMetricCardFilter = (card, cIdx) => {
  const cardKey = card.id || card.label || `card_${cIdx}`;
  const isAll = isCardAllType(card);

  if (isAll) {
    activeMetricCardId.value = 'all';
    statusFilter.value = 'all';
    return;
  }

  if (activeMetricCardId.value === cardKey) {
    activeMetricCardId.value = 'all';
  } else {
    activeMetricCardId.value = cardKey;
  }
};

const activeMetricCard = computed(() => {
  if (!activeMetricCardId.value || activeMetricCardId.value === 'all') return null;
  const cards = activeMetricCards.value || [];
  return cards.find((c, idx) => {
    const cardKey = c.id || c.label || `card_${idx}`;
    return cardKey === activeMetricCardId.value;
  }) || null;
});

const activeCardColLabel = computed(() => {
  if (!activeMetricCard.value) return '';
  const card = activeMetricCard.value;
  if (card.field) {
    return getColumnLabel(card.field) || card.field;
  }
  if (card.condition === 'overdue' || card.condition === 'isOverdue') {
    return 'Trạng thái Quá hạn';
  }
  if (card.condition === 'abroad' || card.condition === 'completed') {
    return 'Trạng thái Hiện diện';
  }
  return card.label || 'Giá trị lọc';
});

const getActiveCardCellValue = (row) => {
  if (!row || !activeMetricCard.value) return '-';
  const card = activeMetricCard.value;
  if (card.field) {
    return getCellValue(row, card.field);
  }
  if (card.condition === 'overdue') {
    return row.isOverdue ? `Quá hạn (${row.overdueDays} ngày)` : (row.overdueStatus || '-');
  }
  if (card.condition === 'abroad') {
    return row.isAbroad ? (row.presenceLabel || 'Đang ở nước ngoài') : '-';
  }
  if (card.condition === 'completed') {
    return row.presenceLabel || 'Đã về nước';
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

// Selection & Sorting & Pagination
const selectedTrips = ref([]);
const selectedTripKeys = computed(() => (selectedTrips.value || []).map((t) => t.uniqueKey || t.id));
const sortKey = ref('departureDate');
const sortOrder = ref(-1); // -1: desc, 1: asc
const dtFirst = ref(0);
const currentPage = ref(1);
const pageSize = ref(30);

const onRowClick = (event) => {
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
  trang_thai_hien_dien: 'Trạng thái hiện diện',
  isOverdue: 'Quá hạn chưa về',
  relativeName: 'Họ tên Thân nhân',
  ho_ten_than_nhan: 'Họ tên Thân nhân',
  relationshipName: 'Quan hệ thân nhân',
  quan_he: 'Quan hệ thân nhân',
  parentName: 'Cán bộ liên quan',
  ho_ten_can_bo: 'Cán bộ liên quan',
  _parentPersonnelName: 'Họ và tên',
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
  let colIdx = 0;

  if (src === 'trips') {
    (personnelStore.importMappingTrips || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
          seen.add(c.id);
          colIdx++;
          rawList.push({
            id: c.id,
            label: c.label || c.id,
            colIndex: colIdx,
            width: c.width || '150px',
            tableWidth: c.tableWidth || null,
            format: c.format,
          });
        }
      });
    });

    // Các cột ánh xạ thông tin Cán bộ / Thân nhân
    const virtualTripCols = [
      { id: '_parentPersonnelName', label: 'Họ và tên', width: '180px' },
      { id: '_parentPersonnelCode', label: 'Mã cán bộ', width: '130px' },
      { id: '_parentPosition', label: 'Chức vụ', width: '150px' },
      { id: '_parentDepartment', label: 'Đơn vị công tác', width: '180px' },
      { id: '_relativeName', label: 'Họ tên thân nhân', width: '180px' },
      { id: '_relationshipName', label: 'Mối quan hệ', width: '140px' },
    ];

    virtualTripCols.forEach((vc) => {
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
  } else if (src === 'relatives') {
    (personnelStore.importMappingRelative || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
          seen.add(c.id);
          colIdx++;
          rawList.push({
            id: c.id,
            label: c.label || c.id,
            colIndex: colIdx,
            width: c.width || '150px',
            tableWidth: c.tableWidth || null,
            format: c.format,
          });
        }
      });
    });

    // Các cột ảo ánh xạ thông tin Cán bộ / Thân nhân (giống Trips)
    const virtualRelativeCols = [
      { id: '_parentPersonnelName', label: 'Họ và tên', width: '180px' },
      { id: '_parentPersonnelCode', label: 'Mã cán bộ', width: '130px' },
      { id: '_parentPosition', label: 'Chức vụ', width: '150px' },
      { id: '_parentDepartment', label: 'Đơn vị công tác', width: '180px' },
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
  } else {
    // personnel
    (personnelStore.importMappingPersonnel || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
          seen.add(c.id);
          colIdx++;
          rawList.push({
            id: c.id,
            label: c.label || c.id,
            colIndex: colIdx,
            width: c.width || '150px',
            tableWidth: c.tableWidth || null,
            format: c.format,
          });
        }
      });
    });
  }

  return rawList;
});

const allColumns = computed(() => allAvailableColumnsList.value);
const selectedColIds = ref([]);

const onColumnsChange = async (newCols) => {
  selectedColIds.value = [...newCols];
  const currentKey = `child_dashboard_cols_${topicId.value || 'default'}`;

  try {
    await saveAppSettings(currentKey, selectedColIds.value);
    await saveAppSettings('trips_dashboard_columns', selectedColIds.value);
  } catch (e) {}

  const idx = customDashboards.value.findIndex((d) => d.id === topicId.value);
  if (idx !== -1) {
    customDashboards.value[idx].columns = [...selectedColIds.value];
    try {
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

      const isRel = Boolean(t.isRelative || t.relativeName || t.cccdthannhan);
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

      const isInternalId = (val) => !val || String(val).startsWith('cd_') || String(val).startsWith('trip_') || String(val).startsWith('rel_') || String(val).startsWith('p_');
      const pCccd = p.cccd || p.cccdparent || '';
      const relCccd = t.cccdthannhan || (!isInternalId(t.cccd) && isRel ? t.cccd : '');
      const relName = t.relativeName || (isRel ? 'Thân nhân' : p.name);
      const relShip = t.relationshipName || (isRel ? 'Thân nhân' : '');

      list.push({
        ...custom,
        ...t,
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
        parentCccd: pCccd,
        cccdthannhan: relCccd,
        cccdparent: pCccd,
        position: isRel ? `${relShip || 'Thân nhân'} của: ${p.name}` : (p.positionName || p.position || ''),
        departmentName: personnelStore.getDepartmentName(p.departmentId) || p.departmentName || '',
        cccd: isRel ? (relCccd || pCccd) : pCccd,
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
        presenceStatus: presence.status,
        presenceLabel: presence.label,
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

        const isInternalId = (val) => !val || String(val).startsWith('cd_') || String(val).startsWith('trip_') || String(val).startsWith('rel_') || String(val).startsWith('p_');
        const rCccd = !isInternalId(r.cccdthannhan) ? r.cccdthannhan : (!isInternalId(r.cccd) ? r.cccd : '');
        const pCccd = p.cccd || p.cccdparent || '';
        const tripCccd = !isInternalId(rt.cccdchuyendi) ? rt.cccdchuyendi : (!isInternalId(rt.cccdthannhan) ? rt.cccdthannhan : (!isInternalId(rt.cccd) ? rt.cccd : rCccd));
        const relName = r.relativeName || r.name || custom.relativeName || 'Thân nhân';
        const relShip = r.relationshipName || r.relationship || custom.relationshipName || 'Thân nhân';

        list.push({
          ...custom,
          ...rt,
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
          parentCccd: pCccd,
          cccdthannhan: tripCccd || rCccd,
          cccdparent: pCccd,
          position: `${relShip} của: ${p.name}`,
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
          presenceStatus: presence.status,
          presenceLabel: presence.label,
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

// Dynamic Data List based on configured source
const currentSourceList = computed(() => {
  const src = currentDashboardConfig.value?.source || 'trips';
  if (src === 'personnel') {
    return (personnelStore.personnelList || []).map((p) => ({
      ...p,
      uniqueKey: p.id || p.code,
      personnelName: p.name,
      personnelCode: p.code,
      departmentName: personnelStore.getDepartmentName(p.departmentId) || p.departmentName || '',
      position: p.positionName || p.position || '',
      rawPerson: p,
    }));
  }
  if (src === 'relatives') {
    return (personnelStore.relativesList || []).map((r, idx) => {
      const parentPerson = r.parentPersonnel || (r.cccdparent ? personnelStore.findPersonByCccd(r.cccdparent) : null) || null;
      return {
        ...r,
        uniqueKey: r.id || `rel_${idx}`,
        isRelative: true,
        personnelName: r.relativeName || r.name || 'Thân nhân',
        personnelCode: r.code || `TN-${String(idx + 1).padStart(5, '0')}`,
        relativeName: r.relativeName || r.name || 'Thân nhân',
        relationshipName: r.relationshipName || r.relationship || '',
        parentName: parentPerson?.name || '',
        parentPersonnelName: parentPerson?.name || '',
        parentPosition: parentPerson?.positionName || parentPerson?.position || '',
        cccdparent: r.cccdparent || parentPerson?.cccd || parentPerson?.cccdparent || '',
        cccdthannhan: r.cccdthannhan || r.cccd || '',
        departmentName: parentPerson?.departmentName || (parentPerson?.departmentId ? personnelStore.getDepartmentName(parentPerson.departmentId) : '') || '',
        rawPerson: parentPerson || r,
        rawRelative: r,
      };
    });
  }
  return unifiedTripsList.value;
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
  let list = [...currentSourceList.value];

  // 0. Active Metric Card Filter (Top KPI Pill)
  if (activeMetricCardId.value && activeMetricCardId.value !== 'all') {
    const targetCard = activeMetricCards.value.find((c, idx) => (c.id || c.label || `card_${idx}`) === activeMetricCardId.value);
    if (targetCard && !isCardAllType(targetCard)) {
      list = list.filter((t) => matchCardCondition(t, targetCard));
    }
  }

  // 1. Status Filter (for trips)
  if (statusFilter.value === 'completed') {
    list = list.filter((t) => !t.isAbroad && !t.isOverdue);
  } else if (statusFilter.value === 'abroad') {
    list = list.filter((t) => t.isAbroad && !t.isOverdue);
  } else if (statusFilter.value === 'overdue') {
    list = list.filter((t) => t.isOverdue);
  }

  // 2. Year Filter (for trips)
  if (timeFilterYear.value !== 'all') {
    const targetY = Number(timeFilterYear.value);
    list = list.filter((t) => {
      const d = parseDateObj(t.departureDate);
      return d && d.getFullYear() === targetY;
    });
  }

  // 3. Country Filter
  if (selectedCountry.value) {
    list = list.filter((t) => (t.countryName || t.country || '') === selectedCountry.value);
  }

  // 4. Department Filter
  if (selectedDepartment.value) {
    list = list.filter((t) => t.departmentName === selectedDepartment.value);
  }

  // 5. Funding Filter
  if (selectedFunding.value) {
    list = list.filter((t) => (t.fundingName || t.funding || '') === selectedFunding.value);
  }

  // 6. Search Query
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((t) => {
      const name = String(t.personnelName || t.name || t.relativeName || '').toLowerCase();
      const code = String(t.personnelCode || t.code || '').toLowerCase();
      const dept = String(t.departmentName || '').toLowerCase();
      const pos = String(t.position || t.positionName || '').toLowerCase();
      const country = String(t.countryName || t.country || '').toLowerCase();
      const cccd = String(t.cccd || t.cccdparent || t.cccdthannhan || t.cccdchuyendi || '').toLowerCase();
      const dec = String(t.decisionNumber || '').toLowerCase();
      const pur = String(t.purpose || '').toLowerCase();

      return (
        name.includes(q) ||
        code.includes(q) ||
        dept.includes(q) ||
        pos.includes(q) ||
        country.includes(q) ||
        cccd.includes(q) ||
        dec.includes(q) ||
        pur.includes(q)
      );
    });
  }

  // 7. Sort
  list.sort((a, b) => {
    let valA = a[sortKey.value] || '';
    let valB = b[sortKey.value] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return -1 * sortOrder.value;
    if (valA > valB) return 1 * sortOrder.value;
    return 0;
  });

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

const getCellValue = (trip, colId) => {
  if (!trip || !colId) return '-';

  // Cột ảo: Ánh xạ thông tin Cán bộ / Thân nhân
  if (colId === '_parentPersonnelName') {
    return trip.rawPerson?.name || trip.personnelName || '-';
  }
  if (colId === '_parentPersonnelCode') {
    return trip.rawPerson?.code || trip.personnelCode || '-';
  }
  if (colId === '_parentPosition') {
    return trip.rawPerson?.positionName || trip.rawPerson?.position || trip.position || '-';
  }
  if (colId === '_parentDepartment') {
    return trip.rawPerson?.departmentName || (trip.rawPerson?.departmentId ? personnelStore.getDepartmentName(trip.rawPerson.departmentId) : '') || trip.departmentName || '-';
  }
  if (colId === '_relativeName') {
    return trip.isRelative ? (trip.relativeName || trip.name || '-') : '-';
  }
  if (colId === '_relationshipName') {
    return trip.isRelative ? (trip.relationshipName || '-') : '-';
  }

  // 1. Check if col is Formula column in Trips/Personnel mapping
  const allMap = {};
  (personnelStore.importMappingTrips || []).forEach((g) => {
    (g.columns || []).forEach((c) => { if (c.id) allMap[c.id] = c; });
  });
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => { if (c.id) allMap[c.id] = c; });
  });

  const colDef = allMap[colId];
  if (colDef && colDef.format === 'formula') {
    const result = evaluateFormula(trip, colDef);
    return result?.label || result?.shortLabel || '-';
  }

  // 2. Direct lookup by exact column ID
  let rawVal = trip[colId];
  if (rawVal === undefined || rawVal === null || rawVal === '') {
    rawVal = trip.custom_data?.[colId] ?? trip.rawTrip?.[colId] ?? trip.rawPerson?.[colId] ?? trip.rawTrip?.custom_data?.[colId];
  }

  // Fallback for core personnel fields if not found on trip
  if ((rawVal === undefined || rawVal === null || rawVal === '') && (colId === 'personnelName' || colId === 'name')) {
    rawVal = trip.personnelName || trip.name || trip.rawPerson?.name;
  }
  if ((rawVal === undefined || rawVal === null || rawVal === '') && (colId === 'personnelCode' || colId === 'code')) {
    rawVal = trip.personnelCode || trip.code || trip.rawPerson?.code;
  }

  if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '' || String(rawVal).trim() === '-') {
    return '-';
  }

  // Format date if configured as date format
  if (colDef?.format === 'date' || colId.toLowerCase().includes('date') || colId.toLowerCase().includes('ngay')) {
    return formatDisplayDate(rawVal);
  }

  if (typeof rawVal === 'object') {
    if (Array.isArray(rawVal)) return rawVal.join(', ');
    return JSON.stringify(rawVal);
  }

  return String(rawVal);
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

const handleBulkDeleteTrips = async () => {
  if (selectedTripKeys.value.length === 0) return;
  if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedTripKeys.value.length} bản ghi đã chọn?`)) return;

  const selectedKeySet = new Set(selectedTripKeys.value);
  const selectedItems = filteredList.value.filter((t) => selectedKeySet.has(t.uniqueKey) || selectedKeySet.has(t.id));
  const affectedPersonnelMap = new Map();

  selectedItems.forEach((trip) => {
    const person = resolveTargetPersonnel(trip);
    if (person && !affectedPersonnelMap.has(person.id)) {
      affectedPersonnelMap.set(person.id, JSON.parse(JSON.stringify(person)));
    }
  });

  affectedPersonnelMap.forEach((person) => {
    if (Array.isArray(person.trips)) {
      person.trips = person.trips.filter((t) => !selectedKeySet.has(t.id) && !selectedKeySet.has(t.uniqueKey));
    }
    if (Array.isArray(person.relatives)) {
      person.relatives.forEach((r) => {
        if (Array.isArray(r.trips)) {
          r.trips = r.trips.filter((t) => !selectedKeySet.has(t.id) && !selectedKeySet.has(t.uniqueKey));
        }
      });
    }
  });

  try {
    for (const [_, person] of affectedPersonnelMap) {
      await personnelStore.savePerson(person);
    }
    await personnelStore.fetchPersonnel();
    selectedTripKeys.value = [];
    alert('Đã xóa thành công các bản ghi đã chọn!');
  } catch (e) {
    alert('Lỗi khi xóa hàng loạt: ' + (e.message || e));
  }
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
  statusFilter.value = 'all';
  timeFilterYear.value = 'all';
  selectedCountry.value = '';
  selectedDepartment.value = '';
  selectedFunding.value = '';
  searchQuery.value = '';
  currentPage.value = 1;
};

// Column Picker
const resetDefaultColumns = () => {
  if (currentDashboardConfig.value.columns && currentDashboardConfig.value.columns.length > 0) {
    selectedColIds.value = [...currentDashboardConfig.value.columns];
  } else {
    selectedColIds.value = allAvailableColumnsList.value.map((c) => c.id);
  }
};

const saveColumnSelection = async () => {
  const currentKey = `child_dashboard_cols_${topicId.value || 'default'}`;

  // Also persist into customDashboards in DB
  const idx = customDashboards.value.findIndex((d) => d.id === topicId.value);
  if (idx !== -1) {
    customDashboards.value[idx].columns = [...selectedColIds.value];
    try {
      await saveAppSettings('custom_dashboards_config', customDashboards.value);
    } catch (e) {}
  }

  try {
    await saveAppSettings(currentKey, selectedColIds.value);
    await saveAppSettings('trips_dashboard_columns', selectedColIds.value);
  } catch (e) {}
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
    const saved = await getAppSettings('custom_dashboards_config', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      customDashboards.value = saved;
    }
  } catch (e) {
    console.error('Error loading custom dashboards in ChildDashboardView:', e);
  }
};

const initTopicColumns = async () => {
  const validIds = new Set(allAvailableColumnsList.value.map((c) => c.id));
  const currentKey = `child_dashboard_cols_${topicId.value || 'default'}`;

  // 1. Try loading specific column setup from DB
  try {
    const dbCols = await getAppSettings(currentKey, null);
    if (dbCols && Array.isArray(dbCols) && dbCols.length > 0) {
      const validDb = dbCols.filter((id) => id !== 'status' && id !== 'tripStatus' && validIds.has(id));
      if (validDb.length > 0) {
        selectedColIds.value = validDb;
        return;
      }
    }
  } catch (e) {}

  // 2. Prioritize columns configured in DB for this dashboard
  if (currentDashboardConfig.value?.columns && currentDashboardConfig.value.columns.length > 0) {
    const validCfg = currentDashboardConfig.value.columns.filter((id) => id !== 'status' && id !== 'tripStatus' && validIds.has(id));
    if (validCfg.length > 0) {
      selectedColIds.value = validCfg;
      return;
    }
  }

  // 3. Default: all available columns for this topic
  selectedColIds.value = allAvailableColumnsList.value.map((c) => c.id).filter((id) => id !== 'status' && id !== 'tripStatus');
};

const handleRouteQueryChange = () => {
  if (route.query?.card) {
    activeMetricCardId.value = String(route.query.card);
  }
};

watch(
  () => topicId.value,
  () => {
    initTopicColumns();
    activeMetricCardId.value = 'all';
    statusFilter.value = 'all';
    searchQuery.value = '';
    timeFilterYear.value = 'all';
    selectedCountry.value = '';
    selectedDepartment.value = '';
    selectedFunding.value = '';
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

onMounted(async () => {
  await loadCustomDashboards();
  initTopicColumns();
  handleRouteQueryChange();
  loadNameColConfig();
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

.table-col-header-ellipsis {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
:deep(.p-datatable .p-datatable-thead > tr > th .p-column-title),
:deep(.p-datatable .p-datatable-thead > tr > th .p-column-header-content) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
</style>

