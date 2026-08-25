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
        @click="toggleMetricCardFilter(card, cIdx)"
        style="cursor: pointer;"
      >
        <div style="display: flex; align-items: center; gap: 8px;">
          <span :class="['dot-indicator', `dot-${card.color || 'blue'}`]"></span>
          <span class="stat-name">{{ card.label }}</span>
        </div>
        <span :class="['stat-number', `num-${card.color || 'blue'}`]">{{ getCardMetricValue(card) }}</span>
      </div>
    </div>

    <!-- Filter Bar Container -->
    <div class="app-card" style="padding: 12px 16px; margin-bottom: 1rem;">
      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <!-- Search -->
        <div style="position: relative; flex: 1; min-width: 240px;">
          <i class="pi pi-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.85rem;"></i>
          <InputText
            v-model="searchQuery"
            placeholder="Tìm trong danh sách: họ tên, đơn vị, số quyết định, quốc gia..."
            style="width: 100%; padding-left: 30px; font-size: 0.82rem; height: 34px;"
          />
        </div>

        <!-- Year / Time Filter -->
        <div style="min-width: 150px;">
          <select v-model="timeFilterYear" class="filter-select">
            <option value="all">Khoảng thời gian: Tất cả</option>
            <option v-for="y in availableYears" :key="y" :value="y">Năm {{ y }}</option>
          </select>
        </div>

        <!-- Country Filter -->
        <div style="min-width: 140px;">
          <select v-model="selectedCountry" class="filter-select">
            <option value="">Quốc gia: Tất cả</option>
            <option v-for="c in availableCountries" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <!-- Department Filter -->
        <div style="min-width: 150px;">
          <select v-model="selectedDepartment" class="filter-select">
            <option value="">Đơn vị: Tất cả</option>
            <option v-for="d in availableDepartments" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>

        <!-- Funding Filter -->
        <div style="min-width: 140px;">
          <select v-model="selectedFunding" class="filter-select">
            <option value="">Nguồn kinh phí: Tất cả</option>
            <option v-for="f in availableFundings" :key="f" :value="f">{{ f }}</option>
          </select>
        </div>

        <!-- Reset Button -->
        <Button
          v-if="hasActiveFilters"
          label="Xóa bộ lọc"
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          size="small"
          @click="resetAllFilters"
          style="font-size: 0.78rem; padding: 4px 8px;"
        />
      </div>
    </div>

    <!-- Main Data Table Card (Matching PersonnelView exactly) -->
    <div class="app-card" style="padding: 0; overflow: hidden;">
      <DataTable
        v-model:selection="selectedTrips"
        :value="filteredList"
        dataKey="uniqueKey"
        paginator
        :rows="15"
        :rowsPerPageOptions="[15, 30, 50, 100]"
        :selectionPageOnly="true"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
        currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi"
        :loading="personnelStore.loading"
        responsiveLayout="scroll"
        stripedRows
        removableSort
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

        <!-- Dynamic Visible Columns -->
        <Column
          v-for="col in visibleColumns"
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
            <!-- 1. Họ và tên người đi -->
            <template v-if="col.id === 'personnelName' || col.id === 'name'">
              <div style="display: flex; align-items: center; gap: 6px;">
                <div>
                  <strong style="color: #1f2937; cursor: pointer; display: block;">
                    {{ data.personnelName || data.name }}
                  </strong>
                  <span v-if="data.personnelCode || data.code" class="badge-code" style="font-size: 0.7rem;">
                    {{ data.personnelCode || data.code }}
                  </span>
                </div>
                <span v-if="data.isRelative" class="badge-role-tn">
                  Thân nhân
                </span>
              </div>
            </template>

            <!-- 2. Ngày nhập cảnh / Trạng thái -->
            <template v-else-if="col.id === 'arrivalDate'">
              <span v-if="data.arrivalDate" style="color: #0f172a; font-weight: 600;">
                {{ formatDisplayDate(data.arrivalDate) }}
              </span>
              <span v-else-if="data.isOverdue" class="status-pill status-overdue">
                Quá hạn {{ data.overdueDays }} ngày
              </span>
              <span v-else-if="data.isAbroad" class="status-pill status-abroad">
                Đang ở nước ngoài
              </span>
              <span v-else style="color: #94a3b8;">-</span>
            </template>

            <!-- 3. Ngày xuất cảnh -->
            <template v-else-if="col.id === 'departureDate' || col.id === 'approvedDepartureDate'">
              <span>{{ formatDisplayDate(data[col.id] || data.departureDate) }}</span>
            </template>

            <!-- 4. Số quyết định -->
            <template v-else-if="col.id === 'decisionNumber' || col.id === 'decision'">
              <span v-if="data.decisionNumber" class="code-badge-decision">
                {{ data.decisionNumber }}
              </span>
              <span v-else style="color: #94a3b8;">-</span>
            </template>

            <!-- 5. Quốc gia -->
            <template v-else-if="col.id === 'countryName' || col.id === 'country'">
              <span style="font-weight: 600; color: #1e293b;">
                {{ data.countryName || data.country || '-' }}
              </span>
            </template>

            <!-- 6. Nguồn kinh phí -->
            <template v-else-if="col.id === 'fundingName' || col.id === 'funding' || col.id === 'nguon_kinh_phi' || col.id === 'kinh_phi'">
              <span class="badge-funding">
                {{ getFundingValue(data) }}
              </span>
            </template>

            <!-- 7. Đơn vị công tác -->
            <template v-else-if="col.id === 'departmentName' || col.id === 'departmentId'">
              <span v-if="data.departmentName" style="font-weight: 500; color: #374151;">
                {{ data.departmentName }}
              </span>
              <span v-else class="badge-pill badge-green">
                Chưa phân bổ
              </span>
            </template>

            <!-- Default value -->
            <template v-else>
              <span>{{ getCellValue(data, col.id) }}</span>
            </template>
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
                @click.stop="handleDeleteTrip(data)"
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
      :selectedCount="selectedPersonnelForExport.length"
      :customPersonnelList="selectedPersonnelForExport"
    />
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
import { formatDate, parseDateObj, computePresenceStatus } from '@/utils/formatters';
import * as XLSX from 'xlsx';

const route = useRoute();
const personnelStore = usePersonnelStore();
const authStore = useAuthStore();
const isExportDocxDialogOpen = ref(false);

const openAdvancedDocxExport = () => {
  isExportDocxDialogOpen.value = true;
};

const selectedPersonnelForExport = computed(() => {
  if (selectedTripKeys.value.length > 0) {
    const selectedKeysSet = new Set(selectedTripKeys.value);
    const matchedPIds = new Set();
    unifiedTripsList.value.forEach((t) => {
      if (selectedKeysSet.has(t.uniqueKey) && t.personnelId) {
        matchedPIds.add(t.personnelId);
      }
    });
    return (personnelStore.personnelList || []).filter((p) => matchedPIds.has(p.id));
  }
  // Otherwise export all filtered personnel
  const currentPIds = new Set(filteredList.value.map((t) => t.personnelId).filter(Boolean));
  return (personnelStore.personnelList || []).filter((p) => currentPIds.has(p.id));
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

// Single Unified Presence Status Calculator
const getTripPresence = (t) => {
  if (!t) return { status: 'domestic', isAbroad: false, isOverdue: false, label: 'Trong nước', overdueDays: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const depRaw = t.departureDate || t.approvedDepartureDate || t.custom_data?.departureDate;
  const arrRaw = t.arrivalDate || t.custom_data?.arrivalDate;
  const appArrRaw = t.approvedExtensionDate || t.approvedArrivalDate || t.custom_data?.approvedArrivalDate;

  const depDate = parseDateObj(depRaw);
  const arrDate = parseDateObj(arrRaw);
  const appArrDate = parseDateObj(appArrRaw);

  // No trip dates at all
  if (!depDate && !arrDate) {
    return { status: 'domestic', isAbroad: false, isOverdue: false, label: 'Trong nước', overdueDays: 0 };
  }

  // If departure is in the future
  if (depDate) {
    const depNorm = new Date(depDate);
    depNorm.setHours(0, 0, 0, 0);
    if (today < depNorm) {
      return { status: 'upcoming', isAbroad: false, isOverdue: false, label: 'Chưa khởi hành', overdueDays: 0 };
    }
  }

  // If arrival date exists and has already passed (today > arrivalDate)
  if (arrDate) {
    const arrNorm = new Date(arrDate);
    arrNorm.setHours(23, 59, 59, 999);
    if (today > arrNorm) {
      let isOverdue = false;
      let overdueDays = 0;
      if (appArrDate) {
        const appArrNorm = new Date(appArrDate);
        appArrNorm.setHours(23, 59, 59, 999);
        if (arrNorm > appArrNorm) {
          isOverdue = true;
          overdueDays = Math.max(1, Math.floor((arrNorm - appArrNorm) / (1000 * 60 * 60 * 24)));
        }
      }
      return {
        status: isOverdue ? 'overdue' : 'completed',
        isAbroad: false,
        isOverdue,
        label: isOverdue ? `Quá hạn (${overdueDays} ngày)` : 'Đã về nước',
        overdueDays,
      };
    }
  }

  // Departure is in the past/today, and either no arrival date OR arrival date is in the future: Currently abroad!
  let isOverdue = false;
  let overdueDays = 0;
  if (appArrDate) {
    const appArrNorm = new Date(appArrDate);
    appArrNorm.setHours(23, 59, 59, 999);
    if (today > appArrNorm) {
      isOverdue = true;
      overdueDays = Math.max(1, Math.floor((today - appArrNorm) / (1000 * 60 * 60 * 24)));
    }
  }

  return {
    status: isOverdue ? 'overdue' : 'abroad',
    isAbroad: true,
    isOverdue,
    label: isOverdue ? `Quá hạn (${overdueDays} ngày)` : 'Đang ở nước ngoài',
    overdueDays,
  };
};

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

const matchCardCondition = (item, card) => {
  if (!card) return true;

  // 1. Dynamic Field Condition (Top priority - if field is configured)
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
    if (op === 'equals') {
      return fieldVal.toLowerCase() === String(card.value || '').trim().toLowerCase();
    }
    if (op === 'contains') {
      return fieldVal.toLowerCase().includes(String(card.value || '').trim().toLowerCase());
    }
    return true;
  }

  // 2. Preset Condition (when no field is selected)
  const cond = card.condition || card.id || 'all';
  if (cond === 'all' || card.label === 'Toàn bộ' || card.label === 'Tất cả') {
    return true;
  }

  const presence = getTripPresence(item);
  if (cond === 'completed' || card.label === 'Đã về nước') {
    return presence.status === 'completed';
  }
  if (cond === 'abroad' || card.label === 'Đang ở nước ngoài') {
    return presence.status === 'abroad';
  }
  if (cond === 'overdue' || card.label === 'Quá hạn chưa về') {
    return presence.status === 'overdue';
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
  statusFilter.value = 'all';
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
  arrivalDate: 'Ngày nhập cảnh / Trạng thái',
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
};

const getColumnLabel = (colId) => {
  if (!colId) return '';
  if (STANDARD_LABELS[colId]) return STANDARD_LABELS[colId];

  // Search in all import mappings
  const allMaps = [
    ...(personnelStore.importMappingTrips || []),
    ...(personnelStore.importMappingPersonnel || []),
    ...(personnelStore.importMappingRelative || []),
  ];
  for (const g of allMaps) {
    for (const c of (g.columns || [])) {
      if (c.id === colId && c.label && c.label !== colId) {
        return c.label;
      }
    }
  }

  const foundInP = (personnelStore.allAvailableColumns || []).find((c) => c.id === colId);
  if (foundInP && foundInP.label && foundInP.label !== colId) {
    return foundInP.label;
  }
  const foundInR = (personnelStore.allAvailableRelativeColumns || []).find((c) => c.id === colId);
  if (foundInR && foundInR.label && foundInR.label !== colId) {
    return foundInR.label;
  }

  return colId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

// Default columns definition
const DEFAULT_TRIP_COLUMNS = [
  { id: 'personnelName', label: 'Họ và tên', width: '180px' },
  { id: 'position', label: 'Chức vụ', width: '150px' },
  { id: 'departmentName', label: 'Đơn vị công tác', width: '180px' },
  { id: 'countryName', label: 'Quốc gia', width: '140px' },
  { id: 'departureDate', label: 'Ngày xuất cảnh', width: '120px' },
  { id: 'arrivalDate', label: 'Ngày nhập cảnh / Trạng thái', width: '160px' },
  { id: 'decisionNumber', label: 'Số quyết định', width: '130px' },
  { id: 'fundingName', label: 'Nguồn kinh phí', width: '140px' },
  { id: 'purpose', label: 'Mục đích chuyến đi', width: '160px' },
];

const allAvailableColumnsList = computed(() => {
  const src = currentDashboardConfig.value?.source || 'trips';
  const seen = new Set();
  const rawList = [];

  if (src === 'trips') {
    DEFAULT_TRIP_COLUMNS.forEach((c) => {
      seen.add(c.id);
      rawList.push({ ...c, label: getColumnLabel(c.id) || c.label });
    });
    (personnelStore.importMappingTrips || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
          seen.add(c.id);
          rawList.push({ id: c.id, label: getColumnLabel(c.id) || c.label || c.id, width: '150px', format: c.format });
        }
      });
    });
  } else if (src === 'relatives') {
    [
      { id: 'parentName', label: 'Cán bộ liên quan' },
      { id: 'relationshipName', label: 'Mối quan hệ' },
      { id: 'relativeName', label: 'Họ tên Thân nhân' },
      { id: 'birthYear', label: 'Năm sinh' },
      { id: 'countryName', label: 'Quốc gia cư trú' },
    ].forEach((c) => {
      seen.add(c.id);
      rawList.push({ ...c, label: getColumnLabel(c.id) || c.label, width: '150px' });
    });
    (personnelStore.importMappingRelative || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
          seen.add(c.id);
          rawList.push({ id: c.id, label: getColumnLabel(c.id) || c.label || c.id, width: '150px' });
        }
      });
    });
  } else {
    // personnel
    [
      { id: 'code', label: 'Mã cán bộ' },
      { id: 'name', label: 'Họ và tên' },
      { id: 'birthYear', label: 'Năm sinh' },
      { id: 'position', label: 'Chức vụ' },
      { id: 'departmentName', label: 'Đơn vị công tác' },
      { id: 'cccd', label: 'Số CCCD / Định danh' },
    ].forEach((c) => {
      seen.add(c.id);
      rawList.push({ ...c, label: getColumnLabel(c.id) || c.label, width: '150px' });
    });
    (personnelStore.importMappingPersonnel || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
          seen.add(c.id);
          rawList.push({ id: c.id, label: getColumnLabel(c.id) || c.label || c.id, width: '150px' });
        }
      });
    });
  }

  return rawList;
});

const allColumns = computed(() => allAvailableColumnsList.value);
const selectedColIds = ref(DEFAULT_TRIP_COLUMNS.map((c) => c.id));

const onColumnsChange = async (newCols) => {
  selectedColIds.value = [...newCols];
  const currentKey = `child_dashboard_cols_${topicId.value || 'default'}`;
  localStorage.setItem(currentKey, JSON.stringify(selectedColIds.value));
  localStorage.setItem('trips_dashboard_columns', JSON.stringify(selectedColIds.value));

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
      colMap.set(c.id, c);
    }
  });
  return selectedColIds.value
    .filter((id) => id !== 'status' && id !== 'tripStatus')
    .map((id) => colMap.get(id) || { id, label: getColumnLabel(id), width: '150px' });
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
      const depDate = t.departureDate || custom.departureDate || t.approvedDepartureDate || '';
      const arrDate = t.arrivalDate || custom.arrivalDate || '';
      const appArrDate = t.approvedArrivalDate || custom.approvedArrivalDate || '';
      const extDate = t.approvedExtensionDate || custom.approvedExtensionDate || '';
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

      list.push({
        ...custom,
        ...t,
        uniqueKey,
        isRelative: isRel,
        personnelId: p.id,
        personnelCode: p.code || '',
        personnelName: isRel ? (t.relativeName || 'Thân nhân') : p.name,
        position: isRel ? `TN (${t.relationshipName || 'Thân nhân'}) của: ${p.name}` : (p.positionName || p.position || ''),
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
        const depDate = rt.departureDate || custom.departureDate || '';
        const arrDate = rt.arrivalDate || custom.arrivalDate || '';
        const appArrDate = rt.approvedArrivalDate || custom.approvedArrivalDate || '';
        const extDate = rt.approvedExtensionDate || custom.approvedExtensionDate || '';
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

        list.push({
          ...custom,
          ...rt,
          uniqueKey,
          isRelative: true,
          personnelId: p.id,
          personnelCode: p.code || '',
          personnelName: r.relativeName || r.name || 'Thân nhân',
          position: `TN (${r.relationshipName || 'Thân nhân'}) của: ${p.name}`,
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
    return (personnelStore.relativesList || []).map((r, idx) => ({
      ...r,
      uniqueKey: r.id || `rel_${idx}`,
      personnelName: r.relativeName || r.name || 'Thân nhân',
      personnelCode: r.code || `TN-${String(idx + 1).padStart(5, '0')}`,
      rawPerson: r.parentPersonnel || (r.cccdparent ? personnelStore.findPersonByCccd(r.cccdparent) : null) || r,
      rawRelative: r,
    }));
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

  // 1. Status Computed
  if (colId === 'status' || colId === 'tripStatus' || colId === 'presenceStatus') {
    return getStatusLabel(trip);
  }

  // 2. Personnel Info Aliases
  if (colId === 'personnelName' || colId === 'name' || colId === 'ho_va_ten' || colId === 'hoTen') {
    return trip.personnelName || trip.name || trip.rawPerson?.name || '-';
  }
  if (colId === 'personnelCode' || colId === 'code' || colId === 'ma_can_bo' || colId === 'maCb') {
    return trip.personnelCode || trip.code || trip.rawPerson?.code || '-';
  }
  if (colId === 'position' || colId === 'positionName' || colId === 'chuc_vu' || colId === 'chucVu') {
    return trip.position || trip.positionName || trip.rawPerson?.positionName || trip.rawPerson?.position || '-';
  }
  if (colId === 'departmentName' || colId === 'don_vi_cong_tac' || colId === 'donVi') {
    return trip.departmentName || trip.rawPerson?.departmentName || (trip.rawPerson?.departmentId ? personnelStore.getDepartmentName(trip.rawPerson.departmentId) : '') || '-';
  }

  // 3. Country Aliases
  if (colId === 'countryName' || colId === 'country' || colId === 'quoc_gia_xuat_canh' || colId === 'quocGia') {
    return trip.countryName || trip.country || trip.quoc_gia_xuat_canh || trip.custom_data?.countryName || trip.custom_data?.quoc_gia_xuat_canh || trip.rawTrip?.countryName || '-';
  }

  // 4. Departure Date Aliases
  if (colId === 'departureDate' || colId === 'ngay_xuat_canh' || colId === 'ngayDi' || colId === 'approvedDepartureDate') {
    const val = trip.departureDate || trip.ngay_xuat_canh || trip.approvedDepartureDate || trip.custom_data?.departureDate || trip.rawTrip?.departureDate;
    return formatDisplayDate(val);
  }

  // 5. Arrival Date Aliases
  if (colId === 'arrivalDate' || colId === 'ngay_nhap_canh' || colId === 'ngayVe' || colId === 'approvedArrivalDate') {
    const val = trip.arrivalDate || trip.ngay_nhap_canh || trip.custom_data?.arrivalDate || trip.rawTrip?.arrivalDate;
    if (val && String(val).trim() !== '' && String(val).trim() !== '-') {
      return formatDisplayDate(val);
    }
    return getStatusLabel(trip);
  }

  // 6. Decision Number Aliases
  if (colId === 'decisionNumber' || colId === 'decision' || colId === 'so_quyet_dinh' || colId === 'so_qd_di' || colId === 'soQd') {
    return trip.decisionNumber || trip.decision || trip.so_quyet_dinh || trip.so_qd_di || trip.custom_data?.decisionNumber || trip.rawTrip?.decisionNumber || '-';
  }

  // 7. Funding Aliases
  if (colId === 'fundingName' || colId === 'funding' || colId === 'nguon_kinh_phi' || colId === 'kinh_phi' || colId === 'nguonKinhPhi' || colId === 'kinhPhi') {
    return getFundingValue(trip);
  }

  // 8. Purpose Aliases
  if (colId === 'purpose' || colId === 'muc_dich' || colId === 'muc_dich_xuat_canh' || colId === 'mucDich') {
    return trip.purpose || trip.muc_dich || trip.muc_dich_xuat_canh || trip.custom_data?.purpose || trip.rawTrip?.purpose || '-';
  }

  // 9. Passport Aliases
  if (colId === 'passportNumber' || colId === 'so_ho_chieu' || colId === 'hoChieu' || colId === 'hcCaNhan') {
    return trip.passportNumber || trip.so_ho_chieu || trip.hcCaNhan || trip.custom_data?.passportNumber || trip.rawTrip?.passportNumber || '-';
  }

  // 10. Check if col is Formula column in Trips mapping
  const allMap = {};
  (personnelStore.importMappingTrips || []).forEach((g) => {
    (g.columns || []).forEach((c) => { if (c.id) allMap[c.id] = c; });
  });
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => { if (c.id) allMap[c.id] = c; });
  });

  const colDef = allMap[colId];
  if (colDef && colDef.format === 'formula') {
    const status = computePresenceStatus(trip, {
      departureCol: colDef.formulaDepartureCol,
      arrivalCol: colDef.formulaArrivalCol,
      countryCol: colDef.formulaCountryCol,
      labelDomestic: colDef.formulaLabelDomestic,
      labelAbroad: colDef.formulaLabelAbroad,
    });
    return status.label;
  }

  // 11. Format dates if colDef.format === 'date'
  if (colDef?.format === 'date') {
    const raw = trip[colId] || trip.rawTrip?.[colId] || trip.rawPerson?.[colId] || trip.custom_data?.[colId] || trip.rawTrip?.custom_data?.[colId];
    return formatDisplayDate(raw);
  }

  // 12. Direct lookups across all objects
  const lookups = [
    trip[colId],
    trip.rawTrip?.[colId],
    trip.rawPerson?.[colId],
    trip.custom_data?.[colId],
    trip.rawTrip?.custom_data?.[colId],
    trip.rawPerson?.custom_data?.[colId],
  ];

  for (const v of lookups) {
    if (v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '-') {
      if (typeof v === 'object') {
        if (Array.isArray(v)) {
          return v.map((x) => (typeof x === 'object' && x !== null ? (x.name || x.label || x.col1 || x.value || JSON.stringify(x)) : x)).filter(Boolean).join(', ');
        }
        return v.name || v.label || v.col1 || v.value || JSON.stringify(v);
      }
      return String(v).trim();
    }
  }

  // 13. Case-insensitive key match across custom_data objects
  const targetKeyClean = String(colId).toLowerCase().replace(/[^a-z0-9]/g, '');
  const searchInObj = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    let targetObj = obj;
    if (typeof obj === 'string') {
      try { targetObj = JSON.parse(obj); } catch (e) { return null; }
    }
    if (!targetObj || typeof targetObj !== 'object') return null;
    for (const [k, v] of Object.entries(targetObj)) {
      const cleanK = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanK === targetKeyClean && v !== undefined && v !== null && String(v).trim() !== '') {
        return v;
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

  if (found !== null && found !== undefined && String(found).trim() !== '') {
    if (typeof found === 'object') {
      if (Array.isArray(found)) {
        return found.map((x) => (typeof x === 'object' && x !== null ? (x.name || x.label || x.col1 || x.value || JSON.stringify(x)) : x)).filter(Boolean).join(', ');
      }
      return found.name || found.label || found.col1 || found.value || JSON.stringify(found);
    }
    return String(found).trim();
  }

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
  localStorage.setItem(currentKey, JSON.stringify(selectedColIds.value));
  localStorage.setItem('trips_dashboard_columns', JSON.stringify(selectedColIds.value));

  // Also persist into customDashboards in DB
  const idx = customDashboards.value.findIndex((d) => d.id === topicId.value);
  if (idx !== -1) {
    customDashboards.value[idx].columns = [...selectedColIds.value];
    try {
      await saveAppSettings('custom_dashboards_config', customDashboards.value);
    } catch (e) {}
  }
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

const handleDeleteTrip = async (trip) => {
  const name = trip.personnelName || trip.name || 'Cán bộ';
  const cName = trip.countryName || trip.country || 'chuyến đi';
  if (!confirm(`Bạn có chắc chắn muốn xóa chuyến đi "${cName}" của ${name}?`)) return;

  const targetPerson = resolveTargetPersonnel(trip);
  if (!targetPerson) {
    alert('Không tìm thấy hồ sơ cán bộ tương ứng để xóa chuyến đi!');
    return;
  }

  // Remove from targetPerson.trips
  if (Array.isArray(targetPerson.trips)) {
    targetPerson.trips = targetPerson.trips.filter(
      (t) => (t.id && t.id !== trip.id) || (t.departureDate !== trip.departureDate || t.countryName !== trip.countryName)
    );
  }

  // Remove from targetPerson.relatives[].trips
  if (Array.isArray(targetPerson.relatives)) {
    targetPerson.relatives.forEach((r) => {
      if (Array.isArray(r.trips)) {
        r.trips = r.trips.filter(
          (t) => (t.id && t.id !== trip.id) || (t.departureDate !== trip.departureDate || t.countryName !== trip.countryName)
        );
      }
    });
  }

  try {
    await personnelStore.savePerson(targetPerson);
    await personnelStore.fetchPersonnel();
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
      localStorage.setItem('custom_dashboards_config', JSON.stringify(saved));
    } else {
      const local = localStorage.getItem('custom_dashboards_config');
      if (local) customDashboards.value = JSON.parse(local);
    }
  } catch (e) {
    console.error('Error loading custom dashboards in ChildDashboardView:', e);
  }
};

const initTopicColumns = async () => {
  // 1. Try loading specific column setup from DB
  const currentKey = `child_dashboard_cols_${topicId.value || 'default'}`;
  try {
    const dbCols = await getAppSettings(currentKey, null);
    if (dbCols && Array.isArray(dbCols) && dbCols.length > 0) {
      selectedColIds.value = dbCols.filter((id) => id !== 'status' && id !== 'tripStatus');
      localStorage.setItem(currentKey, JSON.stringify(selectedColIds.value));
      return;
    }
  } catch (e) {}

  // 2. Prioritize columns configured in DB for this dashboard
  if (currentDashboardConfig.value?.columns && currentDashboardConfig.value.columns.length > 0) {
    selectedColIds.value = currentDashboardConfig.value.columns.filter((id) => id !== 'status' && id !== 'tripStatus');
    return;
  }
  // 3. Fallback to localStorage
  const savedCols = localStorage.getItem(currentKey);
  if (savedCols) {
    try {
      selectedColIds.value = JSON.parse(savedCols).filter((id) => id !== 'status' && id !== 'tripStatus');
      return;
    } catch (e) {}
  }
  const defaultSaved = localStorage.getItem('trips_dashboard_columns');
  if (defaultSaved) {
    try {
      selectedColIds.value = JSON.parse(defaultSaved).filter((id) => id !== 'status' && id !== 'tripStatus');
      return;
    } catch (e) {}
  }
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
</style>
